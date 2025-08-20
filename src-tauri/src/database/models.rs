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
pub struct Revision {
    pub id: Option<i64>,
    pub project_id: i64,
    pub major_revision: String,
    pub minor_revision: i32,
    pub description: Option<String>,
    pub is_checkpoint: bool,
    pub created_at: DateTime<Utc>,
}