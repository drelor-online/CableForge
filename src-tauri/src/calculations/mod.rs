/**
 * Engineering Calculations Module
 * Implements NEC-based electrical calculations for cable engineering
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConductorMaterial {
    Copper,
    Aluminum,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoltageDropCalculation {
    pub voltage: f64,
    pub current: f64,
    pub distance: f64, // one-way distance in feet
    pub conductor_size: String,
    pub material: ConductorMaterial,
    pub power_factor: f64,
    pub number_of_conductors: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoltageDropResult {
    pub voltage_drop_volts: f64,
    pub voltage_drop_percentage: f64,
    pub line_to_line_voltage_drop: f64,
    pub severity: VoltageDropSeverity,
    pub compliance_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoltageDropSeverity {
    Good,    // <= 3%
    Warning, // 3-5%
    Error,   // > 5%
}

pub struct ElectricalCalculator {
    // NEC Table 8 - Conductor properties (approximate values)
    conductor_resistance: HashMap<String, (f64, f64)>, // (copper ohms/1000ft, aluminum ohms/1000ft)
}

impl ElectricalCalculator {
    pub fn new() -> Self {
        let mut conductor_resistance = HashMap::new();
        
        // Add common conductor sizes with resistance values (ohms per 1000 ft at 75°C)
        // Format: AWG/MCM -> (copper resistance, aluminum resistance)
        conductor_resistance.insert("18 AWG".to_string(), (7.77, 12.8));
        conductor_resistance.insert("16 AWG".to_string(), (4.89, 8.05));
        conductor_resistance.insert("14 AWG".to_string(), (3.07, 5.06));
        conductor_resistance.insert("12 AWG".to_string(), (1.93, 3.18));
        conductor_resistance.insert("10 AWG".to_string(), (1.21, 2.00));
        conductor_resistance.insert("8 AWG".to_string(), (0.764, 1.26));
        conductor_resistance.insert("6 AWG".to_string(), (0.491, 0.808));
        conductor_resistance.insert("4 AWG".to_string(), (0.308, 0.508));
        conductor_resistance.insert("3 AWG".to_string(), (0.245, 0.403));
        conductor_resistance.insert("2 AWG".to_string(), (0.194, 0.319));
        conductor_resistance.insert("1 AWG".to_string(), (0.154, 0.253));
        conductor_resistance.insert("1/0 AWG".to_string(), (0.122, 0.201));
        conductor_resistance.insert("2/0 AWG".to_string(), (0.0967, 0.159));
        conductor_resistance.insert("3/0 AWG".to_string(), (0.0766, 0.126));
        conductor_resistance.insert("4/0 AWG".to_string(), (0.0608, 0.100));
        conductor_resistance.insert("250 MCM".to_string(), (0.0515, 0.0847));
        conductor_resistance.insert("300 MCM".to_string(), (0.0429, 0.0707));
        conductor_resistance.insert("350 MCM".to_string(), (0.0367, 0.0605));
        conductor_resistance.insert("400 MCM".to_string(), (0.0321, 0.0529));
        conductor_resistance.insert("500 MCM".to_string(), (0.0258, 0.0424));
        conductor_resistance.insert("600 MCM".to_string(), (0.0214, 0.0353));
        conductor_resistance.insert("750 MCM".to_string(), (0.0171, 0.0282));
        conductor_resistance.insert("1000 MCM".to_string(), (0.0129, 0.0212));
        
        Self {
            conductor_resistance,
        }
    }

    /// Calculate voltage drop for a cable
    pub fn calculate_voltage_drop(&self, calc: &VoltageDropCalculation) -> Result<VoltageDropResult, String> {
        // Get conductor resistance
        let resistance = self.get_conductor_resistance(&calc.conductor_size, &calc.material)?;
        
        // Calculate voltage drop using NEC formula
        // VD = 2 × K × I × L × R (for single-phase or DC)
        // Where:
        // VD = Voltage drop (volts)
        // K = 1 for DC, ~1 for AC depending on power factor
        // I = Current (amperes)
        // L = One-way length (feet)
        // R = Resistance (ohms per 1000 feet)
        
        let distance_factor = calc.distance / 1000.0; // Convert feet to thousands of feet
        let circuit_factor = 2.0; // Round trip for single-phase, adjust for 3-phase if needed
        
        // For AC circuits, include power factor effect (simplified)
        let pf_factor = if calc.power_factor > 0.0 { calc.power_factor } else { 0.85 };
        
        let voltage_drop_volts = circuit_factor * calc.current * distance_factor * resistance * pf_factor;
        let voltage_drop_percentage = (voltage_drop_volts / calc.voltage) * 100.0;
        
        // Determine severity based on NEC recommendations
        let severity = if voltage_drop_percentage <= 3.0 {
            VoltageDropSeverity::Good
        } else if voltage_drop_percentage <= 5.0 {
            VoltageDropSeverity::Warning
        } else {
            VoltageDropSeverity::Error
        };
        
        let compliance_status = match severity {
            VoltageDropSeverity::Good => "Compliant with NEC recommendations (≤3%)".to_string(),
            VoltageDropSeverity::Warning => "Acceptable but high (3-5%, consider larger conductor)".to_string(),
            VoltageDropSeverity::Error => "Exceeds NEC recommendations (>5%, larger conductor required)".to_string(),
        };
        
        Ok(VoltageDropResult {
            voltage_drop_volts,
            voltage_drop_percentage,
            line_to_line_voltage_drop: voltage_drop_volts, // Simplified for now
            severity,
            compliance_status,
        })
    }
    
    /// Get conductor resistance for given size and material
    fn get_conductor_resistance(&self, size: &str, material: &ConductorMaterial) -> Result<f64, String> {
        let size_normalized = self.normalize_conductor_size(size);
        
        if let Some((copper_r, aluminum_r)) = self.conductor_resistance.get(&size_normalized) {
            match material {
                ConductorMaterial::Copper => Ok(*copper_r),
                ConductorMaterial::Aluminum => Ok(*aluminum_r),
            }
        } else {
            Err(format!("Unknown conductor size: {}", size))
        }
    }
    
    /// Normalize conductor size strings for lookup
    fn normalize_conductor_size(&self, size: &str) -> String {
        let size_upper = size.to_uppercase().trim().to_string();
        
        // Handle various input formats
        if size_upper.contains("AWG") {
            size_upper
        } else if size_upper.contains("MCM") {
            size_upper
        } else if size_upper.contains("#") {
            // Convert "#10" to "10 AWG"
            let num = size_upper.replace("#", "").trim().to_string();
            format!("{} AWG", num)
        } else if size_upper.parse::<i32>().is_ok() {
            // Convert "10" to "10 AWG"
            format!("{} AWG", size_upper)
        } else {
            // Try to handle other formats
            size_upper
        }
    }
    
    /// Calculate minimum conductor size for a given voltage drop limit
    pub fn calculate_minimum_conductor_size(
        &self,
        voltage: f64,
        current: f64,
        distance: f64,
        material: &ConductorMaterial,
        max_voltage_drop_percent: f64,
        power_factor: f64,
    ) -> Result<String, String> {
        let max_voltage_drop = voltage * (max_voltage_drop_percent / 100.0);
        
        // Try conductor sizes from largest to smallest
        let sizes = match material {
            ConductorMaterial::Copper => vec![
                "1000 MCM", "750 MCM", "600 MCM", "500 MCM", "400 MCM", "350 MCM", "300 MCM", "250 MCM",
                "4/0 AWG", "3/0 AWG", "2/0 AWG", "1/0 AWG", "1 AWG", "2 AWG", "3 AWG", "4 AWG",
                "6 AWG", "8 AWG", "10 AWG", "12 AWG", "14 AWG", "16 AWG", "18 AWG"
            ],
            ConductorMaterial::Aluminum => vec![
                "1000 MCM", "750 MCM", "600 MCM", "500 MCM", "400 MCM", "350 MCM", "300 MCM", "250 MCM",
                "4/0 AWG", "3/0 AWG", "2/0 AWG", "1/0 AWG", "1 AWG", "2 AWG", "3 AWG", "4 AWG",
                "6 AWG", "8 AWG", "10 AWG", "12 AWG"
            ],
        };
        
        for size in sizes {
            let calc = VoltageDropCalculation {
                voltage,
                current,
                distance,
                conductor_size: size.to_string(),
                material: material.clone(),
                power_factor,
                number_of_conductors: 2, // Assume single-phase for now
            };
            
            if let Ok(result) = self.calculate_voltage_drop(&calc) {
                if result.voltage_drop_volts <= max_voltage_drop {
                    return Ok(size.to_string());
                }
            }
        }
        
        Err("No standard conductor size meets the voltage drop requirement".to_string())
    }
    
    /// Estimate current from power and voltage (for sizing calculations)
    pub fn calculate_current_from_power(
        power_watts: f64,
        voltage: f64,
        power_factor: f64,
        phases: i32,
    ) -> f64 {
        match phases {
            1 => power_watts / (voltage * power_factor), // Single-phase
            3 => power_watts / (voltage * 1.732 * power_factor), // Three-phase
            _ => power_watts / (voltage * power_factor), // Default to single-phase
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_voltage_drop_calculation() {
        let calculator = ElectricalCalculator::new();
        
        let calc = VoltageDropCalculation {
            voltage: 120.0,
            current: 20.0,
            distance: 100.0,
            conductor_size: "12 AWG".to_string(),
            material: ConductorMaterial::Copper,
            power_factor: 0.85,
            number_of_conductors: 2,
        };
        
        let result = calculator.calculate_voltage_drop(&calc).unwrap();
        
        // Should be approximately 6.57V drop (5.5%)
        assert!(result.voltage_drop_volts > 6.0 && result.voltage_drop_volts < 7.0);
        assert!(result.voltage_drop_percentage > 5.0);
        assert!(matches!(result.severity, VoltageDropSeverity::Error));
    }
    
    #[test]
    fn test_conductor_size_recommendation() {
        let calculator = ElectricalCalculator::new();
        
        let min_size = calculator.calculate_minimum_conductor_size(
            120.0,    // 120V
            20.0,     // 20A
            100.0,    // 100 ft
            &ConductorMaterial::Copper,
            3.0,      // 3% max drop
            0.85,     // 85% power factor
        ).unwrap();
        
        // Should recommend larger than 12 AWG
        assert_ne!(min_size, "12 AWG");
        assert!(min_size.contains("AWG") || min_size.contains("MCM"));
    }
}