use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub client: Option<String>,
    pub engineer: Option<String>,
    pub major_revision: String,
    pub minor_revision: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cable {
    pub id: Option<i64>,
    pub project_id: i64,
    pub revision_id: i64,
    pub tag: String,
    pub description: Option<String>,
    pub function: Option<String>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub cable_type: Option<String>,
    pub size: Option<String>,
    pub cores: Option<i32>,
    pub segregation_class: Option<String>,
    pub from_location: Option<String>,
    pub from_equipment: Option<String>,
    pub to_location: Option<String>,
    pub to_equipment: Option<String>,
    pub length: Option<f64>,
    pub spare_percentage: Option<f64>,
    pub calculated_length: Option<f64>,
    pub route: Option<String>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub outer_diameter: Option<f64>,
    pub voltage_drop_percentage: Option<f64>,
    pub segregation_warning: bool,
    pub tray_id: Option<i64>,
    pub conduit_id: Option<i64>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewCable {
    pub tag: String,
    pub description: Option<String>,
    pub function: Option<String>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub cable_type: Option<String>,
    pub size: Option<String>,
    pub cores: Option<i32>,
    pub segregation_class: Option<String>,
    pub from_location: Option<String>,
    pub from_equipment: Option<String>,
    pub to_location: Option<String>,
    pub to_equipment: Option<String>,
    pub length: Option<f64>,
    pub spare_percentage: Option<f64>,
    pub route: Option<String>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub outer_diameter: Option<f64>,
    pub tray_id: Option<i64>,
    pub conduit_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCable {
    pub tag: Option<String>,
    pub description: Option<String>,
    pub function: Option<String>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub cable_type: Option<String>,
    pub size: Option<String>,
    pub cores: Option<i32>,
    pub segregation_class: Option<String>,
    pub from_location: Option<String>,
    pub from_equipment: Option<String>,
    pub to_location: Option<String>,
    pub to_equipment: Option<String>,
    pub length: Option<f64>,
    pub spare_percentage: Option<f64>,
    pub route: Option<String>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub outer_diameter: Option<f64>,
    pub voltage_drop_percentage: Option<f64>,
    pub segregation_warning: Option<bool>,
    pub tray_id: Option<i64>,
    pub conduit_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IOPoint {
    pub id: Option<i64>,
    pub project_id: i64,
    pub revision_id: i64,
    pub tag: String,
    pub description: Option<String>,
    pub signal_type: Option<String>,
    pub io_type: Option<String>,
    pub plc_name: Option<String>,
    pub rack: Option<i32>,
    pub slot: Option<i32>,
    pub channel: Option<i32>,
    pub terminal_block: Option<String>,
    pub cable_id: Option<i64>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewIOPoint {
    pub tag: String,
    pub description: Option<String>,
    pub signal_type: Option<String>,
    pub io_type: Option<String>,
    pub plc_name: Option<String>,
    pub rack: Option<i32>,
    pub slot: Option<i32>,
    pub channel: Option<i32>,
    pub terminal_block: Option<String>,
    pub cable_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateIOPoint {
    pub tag: Option<String>,
    pub description: Option<String>,
    pub signal_type: Option<String>,
    pub io_type: Option<String>,
    pub plc_name: Option<String>,
    pub rack: Option<i32>,
    pub slot: Option<i32>,
    pub channel: Option<i32>,
    pub terminal_block: Option<String>,
    pub cable_id: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conduit {
    pub id: Option<i64>,
    pub project_id: i64,
    pub revision_id: i64,
    pub tag: String,
    pub r#type: Option<String>,
    pub size: Option<String>,
    pub internal_diameter: Option<f64>,
    pub fill_percentage: f64,
    pub max_fill_percentage: f64,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewConduit {
    pub tag: String,
    pub r#type: Option<String>,
    pub size: Option<String>,
    pub internal_diameter: Option<f64>,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConduit {
    pub tag: Option<String>,
    pub r#type: Option<String>,
    pub size: Option<String>,
    pub internal_diameter: Option<f64>,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Load {
    pub id: Option<i64>,
    pub project_id: i64,
    pub revision_id: i64,
    pub tag: String,
    pub description: Option<String>,
    pub load_type: Option<String>,
    pub power_kw: Option<f64>,
    pub power_hp: Option<f64>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub power_factor: Option<f64>,
    pub efficiency: Option<f64>,
    pub demand_factor: Option<f64>,
    pub connected_load_kw: Option<f64>,
    pub demand_load_kw: Option<f64>,
    pub cable_id: Option<i64>,
    pub feeder_cable: Option<String>,
    pub starter_type: Option<String>,
    pub protection_type: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewLoad {
    pub tag: String,
    pub description: Option<String>,
    pub load_type: Option<String>,
    pub power_kw: Option<f64>,
    pub power_hp: Option<f64>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub power_factor: Option<f64>,
    pub efficiency: Option<f64>,
    pub demand_factor: Option<f64>,
    pub cable_id: Option<i64>,
    pub feeder_cable: Option<String>,
    pub starter_type: Option<String>,
    pub protection_type: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLoad {
    pub tag: Option<String>,
    pub description: Option<String>,
    pub load_type: Option<String>,
    pub power_kw: Option<f64>,
    pub power_hp: Option<f64>,
    pub voltage: Option<f64>,
    pub current: Option<f64>,
    pub power_factor: Option<f64>,
    pub efficiency: Option<f64>,
    pub demand_factor: Option<f64>,
    pub cable_id: Option<i64>,
    pub feeder_cable: Option<String>,
    pub starter_type: Option<String>,
    pub protection_type: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tray {
    pub id: Option<i64>,
    pub project_id: i64,
    pub revision_id: i64,
    pub tag: String,
    pub r#type: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub length: Option<f64>,
    pub fill_percentage: f64,
    pub max_fill_percentage: f64,
    pub material: Option<String>,
    pub finish: Option<String>,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub elevation: Option<f64>,
    pub support_spacing: Option<f64>,
    pub load_rating: Option<f64>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTray {
    pub tag: String,
    pub r#type: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub length: Option<f64>,
    pub material: Option<String>,
    pub finish: Option<String>,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub elevation: Option<f64>,
    pub support_spacing: Option<f64>,
    pub load_rating: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTray {
    pub tag: Option<String>,
    pub r#type: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub length: Option<f64>,
    pub material: Option<String>,
    pub finish: Option<String>,
    pub from_location: Option<String>,
    pub to_location: Option<String>,
    pub elevation: Option<f64>,
    pub support_spacing: Option<f64>,
    pub load_rating: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Revision {
    pub id: Option<i64>,
    pub project_id: i64,
    pub major_revision: String,
    pub minor_revision: i32,
    pub description: Option<String>,
    pub is_checkpoint: bool,
    pub is_auto_save: bool,
    pub user_name: Option<String>,
    pub change_count: i32,
    pub parent_revision_id: Option<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewRevision {
    pub major_revision: String,
    pub minor_revision: i32,
    pub description: Option<String>,
    pub is_checkpoint: bool,
    pub is_auto_save: bool,
    pub user_name: Option<String>,
    pub parent_revision_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionChange {
    pub id: Option<i64>,
    pub revision_id: i64,
    pub entity_type: String, // 'cable', 'io_point', 'load', 'conduit', 'tray'
    pub entity_id: i64,
    pub entity_tag: Option<String>,
    pub change_type: String, // 'create', 'update', 'delete'
    pub field_name: Option<String>, // null for create/delete
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewRevisionChange {
    pub entity_type: String,
    pub entity_id: i64,
    pub entity_tag: Option<String>,
    pub change_type: String,
    pub field_name: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevisionSummary {
    pub id: i64,
    pub major_revision: String,
    pub minor_revision: i32,
    pub description: Option<String>,
    pub is_checkpoint: bool,
    pub is_auto_save: bool,
    pub user_name: Option<String>,
    pub change_count: i32,
    pub created_at: DateTime<Utc>,
}

// Cable Library Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CableLibraryItem {
    pub id: Option<i64>,
    pub name: String,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub cable_type: String,
    pub size: String,
    pub cores: i32,
    pub voltage_rating: Option<f64>,
    pub current_rating: Option<f64>,
    pub outer_diameter: Option<f64>,
    pub weight_per_meter: Option<f64>,
    pub temperature_rating: Option<i32>,
    pub conductor_material: String, // 'Copper' or 'Aluminum'
    pub insulation_type: Option<String>,
    pub jacket_material: Option<String>,
    pub shielding: Option<String>,
    pub armor: Option<String>,
    pub fire_rating: Option<String>,
    pub category: String, // 'Power', 'Control', 'Instrumentation', 'Communication', 'Fiber Optic'
    pub description: Option<String>,
    pub specifications: Option<String>,
    pub datasheet_url: Option<String>,
    pub cost_per_meter: Option<f64>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewCableLibraryItem {
    pub name: String,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub cable_type: String,
    pub size: String,
    pub cores: i32,
    pub voltage_rating: Option<f64>,
    pub current_rating: Option<f64>,
    pub outer_diameter: Option<f64>,
    pub weight_per_meter: Option<f64>,
    pub temperature_rating: Option<i32>,
    pub conductor_material: String,
    pub insulation_type: Option<String>,
    pub jacket_material: Option<String>,
    pub shielding: Option<String>,
    pub armor: Option<String>,
    pub fire_rating: Option<String>,
    pub category: String,
    pub description: Option<String>,
    pub specifications: Option<String>,
    pub datasheet_url: Option<String>,
    pub cost_per_meter: Option<f64>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCableLibraryItem {
    pub name: Option<String>,
    pub manufacturer: Option<String>,
    pub part_number: Option<String>,
    pub cable_type: Option<String>,
    pub size: Option<String>,
    pub cores: Option<i32>,
    pub voltage_rating: Option<f64>,
    pub current_rating: Option<f64>,
    pub outer_diameter: Option<f64>,
    pub weight_per_meter: Option<f64>,
    pub temperature_rating: Option<i32>,
    pub conductor_material: Option<String>,
    pub insulation_type: Option<String>,
    pub jacket_material: Option<String>,
    pub shielding: Option<String>,
    pub armor: Option<String>,
    pub fire_rating: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub specifications: Option<String>,
    pub datasheet_url: Option<String>,
    pub cost_per_meter: Option<f64>,
    pub is_active: Option<bool>,
}

// Project Template Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTemplate {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub version: String,
    pub created_by: Option<String>,
    pub is_public: bool,
    pub is_builtin: bool,
    pub template_data: String, // JSON string
    pub preview_image: Option<String>,
    pub tags: Option<String>, // JSON array as string
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewProjectTemplate {
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub version: Option<String>,
    pub created_by: Option<String>,
    pub is_public: Option<bool>,
    pub is_builtin: Option<bool>,
    pub template_data: String,
    pub preview_image: Option<String>,
    pub tags: Option<String>,
}