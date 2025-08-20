/**
 * Cable Validation Engine
 * Implements NEC-based validation rules for cable schedule compliance
 */

use crate::database::models::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationSeverity {
    Error,   // Blocks operations
    Warning, // Allows override
    Info,    // Informational only
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationType {
    DuplicateTag,
    SegregationViolation,
    RequiredField,
    InvalidValue,
    NecCompliance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub cable_id: Option<i64>,
    pub cable_tag: String,
    pub severity: ValidationSeverity,
    pub validation_type: ValidationType,
    pub message: String,
    pub field: Option<String>,
    pub suggested_fix: Option<String>,
    pub override_allowed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationSummary {
    pub total_cables: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
    pub results: Vec<ValidationResult>,
    pub validation_time: chrono::DateTime<chrono::Utc>,
}

pub struct CableValidator;

impl CableValidator {
    pub fn new() -> Self {
        Self
    }

    /// Validate a single cable against all rules
    pub fn validate_cable(&self, cable: &Cable, all_cables: &[Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Required field validation
        results.extend(self.validate_required_fields(cable));

        // Duplicate tag validation
        results.extend(self.validate_duplicate_tag(cable, all_cables));

        // Field format validation
        results.extend(self.validate_field_formats(cable));

        results
    }

    /// Validate all cables in a project
    pub fn validate_all_cables(&self, cables: &[Cable]) -> ValidationSummary {
        let mut all_results = Vec::new();

        // Validate each cable individually
        for cable in cables {
            let cable_results = self.validate_cable(cable, cables);
            all_results.extend(cable_results);
        }

        // Add project-level validations
        all_results.extend(self.validate_segregation_rules(cables));

        // Count by severity
        let error_count = all_results.iter()
            .filter(|r| matches!(r.severity, ValidationSeverity::Error))
            .count();
        let warning_count = all_results.iter()
            .filter(|r| matches!(r.severity, ValidationSeverity::Warning))
            .count();
        let info_count = all_results.iter()
            .filter(|r| matches!(r.severity, ValidationSeverity::Info))
            .count();

        ValidationSummary {
            total_cables: cables.len(),
            error_count,
            warning_count,
            info_count,
            results: all_results,
            validation_time: chrono::Utc::now(),
        }
    }

    /// Validate required fields
    fn validate_required_fields(&self, cable: &Cable) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Tag is the only required field
        if cable.tag.trim().is_empty() {
            results.push(ValidationResult {
                cable_id: cable.id,
                cable_tag: cable.tag.clone(),
                severity: ValidationSeverity::Error,
                validation_type: ValidationType::RequiredField,
                message: "Cable tag is required".to_string(),
                field: Some("tag".to_string()),
                suggested_fix: Some("Enter a unique cable tag (e.g., C-001)".to_string()),
                override_allowed: false,
            });
        }

        results
    }

    /// Validate for duplicate cable tags
    fn validate_duplicate_tag(&self, cable: &Cable, all_cables: &[Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        if cable.tag.trim().is_empty() {
            return results; // Skip if no tag
        }

        let duplicates: Vec<&Cable> = all_cables
            .iter()
            .filter(|other| {
                other.tag.eq_ignore_ascii_case(&cable.tag) && 
                other.id != cable.id // Don't compare with self
            })
            .collect();

        if !duplicates.is_empty() {
            let _duplicate_ids: Vec<String> = duplicates
                .iter()
                .filter_map(|c| c.id.map(|id| id.to_string()))
                .collect();

            results.push(ValidationResult {
                cable_id: cable.id,
                cable_tag: cable.tag.clone(),
                severity: ValidationSeverity::Error,
                validation_type: ValidationType::DuplicateTag,
                message: format!("Duplicate cable tag '{}' found", cable.tag),
                field: Some("tag".to_string()),
                suggested_fix: Some(format!("Change to unique tag or use auto-numbering")),
                override_allowed: true, // Can override with justification
            });
        }

        results
    }

    /// Validate field formats and values
    fn validate_field_formats(&self, cable: &Cable) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Validate voltage if present
        if let Some(voltage) = cable.voltage {
            if voltage < 0.0 || voltage > 35000.0 {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Warning,
                    validation_type: ValidationType::InvalidValue,
                    message: "Voltage outside typical range (0-35kV)".to_string(),
                    field: Some("voltage".to_string()),
                    suggested_fix: Some("Verify voltage rating is correct".to_string()),
                    override_allowed: true,
                });
            }
        }

        // Validate length if present
        if let Some(length) = cable.length {
            if length < 0.0 {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Error,
                    validation_type: ValidationType::InvalidValue,
                    message: "Cable length cannot be negative".to_string(),
                    field: Some("length".to_string()),
                    suggested_fix: Some("Enter a positive length value".to_string()),
                    override_allowed: false,
                });
            } else if length > 10000.0 {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Warning,
                    validation_type: ValidationType::InvalidValue,
                    message: "Cable length is unusually long (>10,000 ft)".to_string(),
                    field: Some("length".to_string()),
                    suggested_fix: Some("Verify length is correct".to_string()),
                    override_allowed: true,
                });
            }
        }

        // Validate spare percentage if present
        if let Some(spare_pct) = cable.spare_percentage {
            if spare_pct < 0.0 || spare_pct > 100.0 {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Warning,
                    validation_type: ValidationType::InvalidValue,
                    message: "Spare percentage should be between 0-100%".to_string(),
                    field: Some("spare_percentage".to_string()),
                    suggested_fix: Some("Enter percentage as 0-100 (e.g., 10 for 10%)".to_string()),
                    override_allowed: true,
                });
            }
        }

        results
    }

    /// Validate cable segregation rules
    fn validate_segregation_rules(&self, cables: &[Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Group cables by route to check segregation within same conduit/tray
        let mut route_groups: HashMap<String, Vec<&Cable>> = HashMap::new();

        for cable in cables {
            if let Some(route) = &cable.route {
                if !route.trim().is_empty() {
                    // For now, treat entire route as key (could be enhanced to split by conduit)
                    route_groups.entry(route.clone())
                        .or_insert_with(Vec::new)
                        .push(cable);
                }
            }
        }

        // Check segregation within each route
        for (route, route_cables) in route_groups {
            if route_cables.len() > 1 {
                results.extend(self.check_route_segregation(&route, &route_cables));
            }
        }

        results
    }

    /// Check segregation rules for cables in the same route
    fn check_route_segregation(&self, route: &str, cables: &[&Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Enhanced NEC-based segregation rules
        
        // 1. Check for power and signal cables in same route (basic rule)
        results.extend(self.check_power_signal_separation(route, cables));
        
        // 2. Check voltage level separation
        results.extend(self.check_voltage_level_separation(route, cables));
        
        // 3. Check segregation class conflicts
        results.extend(self.check_segregation_class_conflicts(route, cables));
        
        // 4. Check IS/Non-IS signal separation
        results.extend(self.check_intrinsic_safety_separation(route, cables));

        results
    }

    /// Check basic power/signal separation (NEC 725.136)
    fn check_power_signal_separation(&self, route: &str, cables: &[&Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        let power_cables: Vec<&Cable> = cables.iter()
            .filter(|c| c.function.as_ref()
                .map_or(false, |f| matches!(f.as_str(), "Power" | "Lighting")))
            .copied()
            .collect();

        let signal_cables: Vec<&Cable> = cables.iter()
            .filter(|c| c.function.as_ref()
                .map_or(false, |f| matches!(f.as_str(), "Signal" | "Control" | "Communication")))
            .copied()
            .collect();

        if !power_cables.is_empty() && !signal_cables.is_empty() {
            // Create violations for all affected cables
            for cable in power_cables.iter().chain(signal_cables.iter()) {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Warning,
                    validation_type: ValidationType::SegregationViolation,
                    message: format!("Power and signal cables in same route '{}' (NEC 725.136)", route),
                    field: Some("route".to_string()),
                    suggested_fix: Some("Separate power and signal cables into different conduits per NEC".to_string()),
                    override_allowed: true,
                });
            }
        }

        results
    }

    /// Check voltage level separation (NEC 300.3)
    fn check_voltage_level_separation(&self, route: &str, cables: &[&Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Group cables by voltage level
        let mut voltage_groups: HashMap<String, Vec<&Cable>> = HashMap::new();
        
        for cable in cables {
            if let Some(voltage) = cable.voltage {
                let voltage_class = if voltage <= 50.0 {
                    "Low Voltage (<50V)"
                } else if voltage <= 600.0 {
                    "Medium Voltage (50-600V)"
                } else if voltage <= 1000.0 {
                    "High Voltage (600-1000V)"
                } else {
                    "Extra High Voltage (>1000V)"
                };
                
                voltage_groups.entry(voltage_class.to_string())
                    .or_insert_with(Vec::new)
                    .push(cable);
            }
        }

        // Check for mixed voltage levels that require separation
        if voltage_groups.len() > 1 {
            let has_low = voltage_groups.contains_key("Low Voltage (<50V)");
            let has_high = voltage_groups.contains_key("High Voltage (600-1000V)") || 
                          voltage_groups.contains_key("Extra High Voltage (>1000V)");

            if has_low && has_high {
                for cable in cables {
                    results.push(ValidationResult {
                        cable_id: cable.id,
                        cable_tag: cable.tag.clone(),
                        severity: ValidationSeverity::Error,
                        validation_type: ValidationType::SegregationViolation,
                        message: format!("Low voltage and high voltage cables in same route '{}' (NEC 300.3)", route),
                        field: Some("route".to_string()),
                        suggested_fix: Some("Separate low voltage (<50V) from high voltage (>600V) cables".to_string()),
                        override_allowed: true,
                    });
                }
            }
        }

        results
    }

    /// Check segregation class conflicts (NEC-based)
    fn check_segregation_class_conflicts(&self, route: &str, cables: &[&Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        // Group by segregation class
        let mut class_groups: HashMap<String, Vec<&Cable>> = HashMap::new();
        
        for cable in cables {
            if let Some(seg_class) = &cable.segregation_class {
                class_groups.entry(seg_class.clone())
                    .or_insert_with(Vec::new)
                    .push(cable);
            }
        }

        // Define incompatible segregation class pairs
        let incompatible_pairs = [
            ("IS Signal", "Non-IS Signal"),
            ("IS Signal", "Power 120VAC"),
            ("IS Signal", "Power 240VAC"),
            ("IS Signal", "Power 480VAC"),
            ("IS Signal", "Power 600VAC"),
            ("Control Power 24VDC", "Power 480VAC"),
            ("Control Power 24VDC", "Power 600VAC"),
        ];

        for (class1, class2) in incompatible_pairs {
            if class_groups.contains_key(class1) && class_groups.contains_key(class2) {
                let affected_cables: Vec<&Cable> = class_groups[class1].iter()
                    .chain(class_groups[class2].iter())
                    .copied()
                    .collect();

                for cable in affected_cables {
                    results.push(ValidationResult {
                        cable_id: cable.id,
                        cable_tag: cable.tag.clone(),
                        severity: ValidationSeverity::Error,
                        validation_type: ValidationType::SegregationViolation,
                        message: format!("Incompatible segregation classes '{}' and '{}' in route '{}'", class1, class2, route),
                        field: Some("segregation_class".to_string()),
                        suggested_fix: Some(format!("Separate {} from {} cables", class1, class2)),
                        override_allowed: true,
                    });
                }
            }
        }

        results
    }

    /// Check intrinsic safety separation (NEC 504.30)
    fn check_intrinsic_safety_separation(&self, route: &str, cables: &[&Cable]) -> Vec<ValidationResult> {
        let mut results = Vec::new();

        let is_cables: Vec<&Cable> = cables.iter()
            .filter(|c| c.segregation_class.as_ref()
                .map_or(false, |sc| sc.contains("IS")))
            .copied()
            .collect();

        let non_is_cables: Vec<&Cable> = cables.iter()
            .filter(|c| c.segregation_class.as_ref()
                .map_or(false, |sc| !sc.contains("IS")) || 
                c.segregation_class.is_none())
            .copied()
            .collect();

        if !is_cables.is_empty() && !non_is_cables.is_empty() {
            for cable in is_cables.iter().chain(non_is_cables.iter()) {
                results.push(ValidationResult {
                    cable_id: cable.id,
                    cable_tag: cable.tag.clone(),
                    severity: ValidationSeverity::Error,
                    validation_type: ValidationType::SegregationViolation,
                    message: format!("Intrinsically safe and non-IS cables in same route '{}' (NEC 504.30)", route),
                    field: Some("segregation_class".to_string()),
                    suggested_fix: Some("IS cables must be separated from all non-IS circuits".to_string()),
                    override_allowed: false, // Critical safety rule
                });
            }
        }

        results
    }

}