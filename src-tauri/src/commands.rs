use crate::database::{Database, models::*};
use crate::validation::{CableValidator, ValidationSummary, ValidationResult};
use crate::calculations::{ElectricalCalculator, VoltageDropCalculation, VoltageDropResult, ConductorMaterial};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// Application state
pub struct AppState {
    pub db: Option<Database>,
    pub current_project_id: Option<i64>,
    pub current_file_path: Option<PathBuf>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db: None,
            current_project_id: None,
            current_file_path: None,
        }
    }
}

// Error type for Tauri commands
#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("ZIP error: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("No database connection")]
    NoDatabase,
    #[error("No active project")]
    NoProject,
    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Project commands
#[tauri::command]
pub async fn create_project(
    name: String,
    description: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Project, CommandError> {
    let mut app_state = state.lock().unwrap();
    
    // Create in-memory database for new project
    let db = Database::in_memory()?;
    let mut project = Project {
        id: None,
        name,
        description,
        client: None,
        engineer: None,
        major_revision: "Draft".to_string(),
        minor_revision: 0,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    project = db.insert_project(&project)?;
    
    app_state.db = Some(db);
    app_state.current_project_id = project.id;
    app_state.current_file_path = None;
    
    Ok(project)
}

#[tauri::command]
pub async fn open_project(
    file_path: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<Project, CommandError> {
    let mut app_state = state.lock().unwrap();
    
    let path = PathBuf::from(file_path.clone());
    let db = Database::new(&path)?;
    let projects = db.get_projects()?;
    
    if projects.is_empty() {
        return Err(CommandError::Custom("No project found in file".to_string()));
    }
    
    let project = projects[0].clone();
    
    app_state.db = Some(db);
    app_state.current_project_id = project.id;
    app_state.current_file_path = Some(path);
    
    Ok(project)
}

#[tauri::command]
pub async fn save_project(
    file_path: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<String, CommandError> {
    let mut app_state = state.lock().unwrap();
    
    let current_db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    // Determine save path
    let save_path = if let Some(path) = file_path {
        PathBuf::from(path)
    } else if let Some(path) = &app_state.current_file_path {
        path.clone()
    } else {
        return Err(CommandError::Custom("No file path specified".to_string()));
    };

    // If we're working with in-memory database, save it to disk
    if app_state.current_file_path.is_none() {
        // Copy in-memory database to file
        let file_db = Database::new(&save_path)?;
        
        // Copy data from current in-memory DB to file DB
        let projects = current_db.get_projects()?;
        if let Some(project) = projects.first() {
            let file_project = file_db.insert_project(project)?;
            let project_id = file_project.id.unwrap();
            
            // Copy cables
            let cables = current_db.get_cables(project.id.unwrap())?;
            for cable in cables {
                let new_cable_data = NewCable {
                    tag: cable.tag,
                    description: cable.description,
                    function: cable.function,
                    voltage: cable.voltage,
                    current: cable.current,
                    cable_type: cable.cable_type,
                    size: cable.size,
                    cores: cable.cores,
                    segregation_class: cable.segregation_class,
                    from_location: cable.from_location,
                    from_equipment: cable.from_equipment,
                    to_location: cable.to_location,
                    to_equipment: cable.to_equipment,
                    length: cable.length,
                    spare_percentage: cable.spare_percentage,
                    route: cable.route,
                    manufacturer: cable.manufacturer,
                    part_number: cable.part_number,
                    outer_diameter: cable.outer_diameter,
                    tray_id: cable.tray_id,
                    conduit_id: cable.conduit_id,
                    notes: cable.notes,
                };
                file_db.insert_cable(project_id, &new_cable_data)?;
            }
        }
        
        // Replace in-memory DB with file DB
        app_state.db = Some(file_db);
    }
    
    // Update file path
    app_state.current_file_path = Some(save_path.clone());
    
    Ok(save_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn save_project_as(
    file_path: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<String, CommandError> {
    save_project(Some(file_path), state).await
}

#[tauri::command]
pub async fn new_project(
    name: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Project, CommandError> {
    let mut app_state = state.lock().unwrap();
    
    // Create new in-memory database
    let db = Database::in_memory()?;
    let project_name = name.unwrap_or_else(|| "New CableForge Project".to_string());
    
    let mut project = Project {
        id: None,
        name: project_name,
        description: Some("Created with CableForge".to_string()),
        client: None,
        engineer: None,
        major_revision: "Draft".to_string(),
        minor_revision: 0,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    project = db.insert_project(&project)?;
    
    // Update app state
    app_state.db = Some(db);
    app_state.current_project_id = project.id;
    app_state.current_file_path = None; // New project has no file path yet
    
    Ok(project)
}

#[tauri::command]
pub async fn get_current_project_info(
    state: State<'_, Mutex<AppState>>,
) -> Result<Option<(Project, Option<String>)>, CommandError> {
    let app_state = state.lock().unwrap();
    
    if let Some(db) = &app_state.db {
        let projects = db.get_projects()?;
        if let Some(project) = projects.first() {
            let file_path = app_state.current_file_path.as_ref()
                .map(|p| p.to_string_lossy().to_string());
            return Ok(Some((project.clone(), file_path)));
        }
    }
    
    Ok(None)
}

#[tauri::command]
pub async fn get_projects(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Project>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    Ok(db.get_projects()?)
}

// Cable commands
#[tauri::command]
pub async fn create_cable(
    cable_data: NewCable,
    state: State<'_, Mutex<AppState>>,
) -> Result<Cable, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.insert_cable(project_id, &cable_data)?)
}

#[tauri::command]
pub async fn get_cables(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Cable>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_cables(project_id)?)
}

#[tauri::command]
pub async fn update_cable(
    id: i64,
    updates: UpdateCable,
    state: State<'_, Mutex<AppState>>,
) -> Result<Cable, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    Ok(db.update_cable(id, &updates)?)
}

#[tauri::command]
pub async fn delete_cable(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_cable(id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_next_cable_tag(
    prefix: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<String, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let prefix = prefix.unwrap_or_else(|| "C".to_string());
    Ok(db.get_next_cable_tag(project_id, &prefix)?)
}

// File dialog commands
#[tauri::command]
pub async fn show_open_dialog() -> Result<Option<String>, CommandError> {
    // Temporary: always return a path for testing
    use dirs;
    let documents_dir = dirs::document_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("C:\\Users\\Documents"));
    let default_path = documents_dir.join("test-project.cfp");
    Ok(Some(default_path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn show_save_dialog(default_name: Option<String>) -> Result<Option<String>, CommandError> {
    // Temporary: always return a valid path for testing
    use dirs;
    let documents_dir = dirs::document_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("C:\\Users\\Documents"));
    let name = default_name.unwrap_or_else(|| "new-project.cfp".to_string());
    let save_path = documents_dir.join(name);
    Ok(Some(save_path.to_string_lossy().to_string()))
}

// Validation commands
#[tauri::command]
pub async fn validate_all_cables(
    state: State<'_, Mutex<AppState>>,
) -> Result<ValidationSummary, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let cables = db.get_cables(project_id)?;
    let validator = CableValidator::new();
    let summary = validator.validate_all_cables(&cables);
    
    Ok(summary)
}

#[tauri::command]
pub async fn validate_cable(
    cable_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<ValidationResult>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let cables = db.get_cables(project_id)?;
    let target_cable = cables.iter()
        .find(|c| c.id == Some(cable_id))
        .ok_or_else(|| CommandError::Custom("Cable not found".to_string()))?;
    
    let validator = CableValidator::new();
    let results = validator.validate_cable(target_cable, &cables);
    
    Ok(results)
}

#[tauri::command]
pub async fn check_duplicate_tag(
    tag: String,
    exclude_id: Option<i64>,
    state: State<'_, Mutex<AppState>>,
) -> Result<bool, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let cables = db.get_cables(project_id)?;
    
    let has_duplicate = cables.iter().any(|cable| {
        cable.tag.eq_ignore_ascii_case(&tag) && 
        cable.id != exclude_id
    });
    
    Ok(has_duplicate)
}

#[tauri::command]
pub async fn get_validation_summary(
    state: State<'_, Mutex<AppState>>,
) -> Result<(usize, usize, usize), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let cables = db.get_cables(project_id)?;
    let validator = CableValidator::new();
    let summary = validator.validate_all_cables(&cables);
    
    Ok((summary.error_count, summary.warning_count, summary.info_count))
}

// Initialize default project on startup
#[tauri::command]
pub async fn initialize_app(
    state: State<'_, Mutex<AppState>>,
) -> Result<Project, CommandError> {
    let mut app_state = state.lock().unwrap();
    
    if app_state.db.is_none() {
        let db = Database::in_memory()?;
        let project = db.create_default_project()?;
        
        app_state.db = Some(db);
        app_state.current_project_id = project.id;
        
        return Ok(project);
    }
    
    // Return existing project
    let db = app_state.db.as_ref().unwrap();
    let projects = db.get_projects()?;
    Ok(projects.into_iter().next().unwrap())
}

// Workflow recording commands
#[tauri::command]
pub async fn take_screenshot(filename: String) -> Result<String, CommandError> {
    use screenshots::Screen;
    
    // Get user's documents directory or temp directory as fallback
    let base_dir = dirs::document_dir()
        .or_else(|| std::env::temp_dir().into())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    
    let screenshots_dir = base_dir.join("CableForge").join("workflow-recordings").join("screenshots");
    
    // Create screenshots directory if it doesn't exist
    std::fs::create_dir_all(&screenshots_dir)?;
    
    let screenshot_path = screenshots_dir.join(&filename);
    
    // Take actual screenshot
    match Screen::all() {
        Ok(screens) => {
            if let Some(screen) = screens.first() {
                match screen.capture() {
                    Ok(image) => {
                        // Save image directly as PNG
                        image.save(&screenshot_path)
                            .map_err(|e| CommandError::Custom(format!("Failed to save screenshot: {}", e)))?;
                        
                        println!("Screenshot saved: {}", screenshot_path.display());
                        Ok(screenshot_path.to_string_lossy().to_string())
                    }
                    Err(e) => {
                        println!("Failed to capture screenshot: {}, falling back to placeholder", e);
                        // Fallback to placeholder file
                        let placeholder_content = format!(
                            "Screenshot failed: {}\nTimestamp: {}\nPath: {}",
                            e,
                            chrono::Utc::now().to_rfc3339(),
                            screenshot_path.display()
                        );
                        
                        std::fs::write(&screenshot_path, placeholder_content)?;
                        Ok(screenshot_path.to_string_lossy().to_string())
                    }
                }
            } else {
                Err(CommandError::Custom("No screens found".to_string()))
            }
        }
        Err(e) => {
            Err(CommandError::Custom(format!("Failed to get screens: {}", e)))
        }
    }
}

#[tauri::command]
pub async fn save_workflow_data(filename: String, data: String) -> Result<String, CommandError> {
    // Get user's documents directory or temp directory as fallback
    let base_dir = dirs::document_dir()
        .or_else(|| std::env::temp_dir().into())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    
    let workflow_dir = base_dir.join("CableForge").join("workflow-recordings");
    
    // Create workflow directory if it doesn't exist
    std::fs::create_dir_all(&workflow_dir)?;
    
    let workflow_path = workflow_dir.join(&filename);
    
    std::fs::write(&workflow_path, data)?;
    
    println!("Workflow data saved: {}", workflow_path.display());
    Ok(workflow_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn save_workflow_json(session_id: String, workflow_data: String) -> Result<String, CommandError> {
    let filename = format!("{}.json", session_id);
    save_workflow_data(filename, workflow_data).await
}

#[tauri::command]
pub async fn get_recordings_directory() -> Result<String, CommandError> {
    let base_dir = dirs::document_dir()
        .or_else(|| std::env::temp_dir().into())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    
    let recordings_dir = base_dir.join("CableForge").join("workflow-recordings");
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&recordings_dir)?;
    
    Ok(recordings_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_workflow_zip(
    session_id: String, 
    workflow_data: String, 
    screenshot_paths: Vec<String>
) -> Result<String, CommandError> {
    use std::io::Write;
    use zip::write::FileOptions;
    
    let base_dir = dirs::document_dir()
        .or_else(|| std::env::temp_dir().into())
        .unwrap_or_else(|| std::path::PathBuf::from("."));
    
    let workflow_dir = base_dir.join("CableForge").join("workflow-recordings");
    std::fs::create_dir_all(&workflow_dir)?;
    
    let zip_path = workflow_dir.join(format!("{}-export.zip", session_id));
    let zip_file = std::fs::File::create(&zip_path)?;
    let mut zip = zip::ZipWriter::new(zip_file);
    
    // Add workflow JSON data
    zip.start_file(format!("{}-data.json", session_id), FileOptions::default())?;
    zip.write_all(workflow_data.as_bytes())?;
    
    // Add screenshot files
    for screenshot_path in screenshot_paths {
        let path = std::path::Path::new(&screenshot_path);
        if path.exists() {
            let filename = path.file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("screenshot.png");
            
            zip.start_file(format!("screenshots/{}", filename), FileOptions::default())?;
            let screenshot_data = std::fs::read(path)?;
            zip.write_all(&screenshot_data)?;
        }
    }
    
    zip.finish()?;
    
    println!("Workflow ZIP exported: {}", zip_path.display());
    Ok(zip_path.to_string_lossy().to_string())
}

// Electrical calculation commands

#[tauri::command]
pub async fn calculate_voltage_drop(
    voltage: f64,
    current: f64,
    distance: f64,
    conductor_size: String,
    material: String,
    power_factor: Option<f64>,
) -> Result<VoltageDropResult, CommandError> {
    let calculator = ElectricalCalculator::new();
    
    let conductor_material = match material.to_lowercase().as_str() {
        "copper" | "cu" => ConductorMaterial::Copper,
        "aluminum" | "al" => ConductorMaterial::Aluminum,
        _ => ConductorMaterial::Copper, // Default to copper
    };
    
    let calculation = VoltageDropCalculation {
        voltage,
        current,
        distance,
        conductor_size,
        material: conductor_material,
        power_factor: power_factor.unwrap_or(0.85),
        number_of_conductors: 2, // Assume single-phase for now
    };
    
    calculator.calculate_voltage_drop(&calculation)
        .map_err(|e| CommandError::Custom(e))
}

#[tauri::command]
pub async fn calculate_minimum_conductor_size(
    voltage: f64,
    current: f64,
    distance: f64,
    material: String,
    max_voltage_drop_percent: f64,
    power_factor: Option<f64>,
) -> Result<String, CommandError> {
    let calculator = ElectricalCalculator::new();
    
    let conductor_material = match material.to_lowercase().as_str() {
        "copper" | "cu" => ConductorMaterial::Copper,
        "aluminum" | "al" => ConductorMaterial::Aluminum,
        _ => ConductorMaterial::Copper, // Default to copper
    };
    
    calculator.calculate_minimum_conductor_size(
        voltage,
        current,
        distance,
        &conductor_material,
        max_voltage_drop_percent,
        power_factor.unwrap_or(0.85),
    ).map_err(|e| CommandError::Custom(e))
}

#[tauri::command]
pub async fn calculate_current_from_power(
    power_watts: f64,
    voltage: f64,
    power_factor: Option<f64>,
    phases: Option<i32>,
) -> Result<f64, CommandError> {
    let current = ElectricalCalculator::calculate_current_from_power(
        power_watts,
        voltage,
        power_factor.unwrap_or(0.85),
        phases.unwrap_or(1),
    );
    
    Ok(current)
}

#[tauri::command]
pub async fn update_cable_voltage_drop(
    cable_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<Option<f64>, CommandError> {
    let mut app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    // Get cable details
    let cable = db.get_cable_by_id(cable_id)?;
    
    // Only calculate if we have sufficient data
    if let (Some(voltage), Some(length), Some(size)) = (&cable.voltage, &cable.length, &cable.size) {
        // Estimate current based on cable function and size (simplified)
        let estimated_current = estimate_cable_current(&cable.function, size);
        
        if estimated_current > 0.0 {
            let calculator = ElectricalCalculator::new();
            
            let calculation = VoltageDropCalculation {
                voltage: *voltage,
                current: estimated_current,
                distance: *length,
                conductor_size: size.to_string(),
                material: ConductorMaterial::Copper, // Default assumption
                power_factor: 0.85,
                number_of_conductors: 2,
            };
            
            match calculator.calculate_voltage_drop(&calculation) {
                Ok(result) => {
                    // Update cable with calculated voltage drop
                    let update_cable = UpdateCable {
                        tag: None,
                        description: None,
                        function: None,
                        voltage: None,
                        current: None,
                        cable_type: None,
                        size: None,
                        cores: None,
                        segregation_class: None,
                        from_location: None,
                        from_equipment: None,
                        to_location: None,
                        to_equipment: None,
                        length: None,
                        spare_percentage: None,
                        route: None,
                        manufacturer: None,
                        part_number: None,
                        outer_diameter: None,
                        voltage_drop_percentage: Some(result.voltage_drop_percentage),
                        segregation_warning: None,
                        tray_id: None,
                        conduit_id: None,
                        notes: None,
                    };
                    
                    db.update_cable(cable_id, &update_cable)?;
                    Ok(Some(result.voltage_drop_percentage))
                }
                Err(_) => Ok(None)
            }
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

// Helper function to estimate current based on cable function and size
fn estimate_cable_current(function: &Option<String>, size: &str) -> f64 {
    match function.as_ref().map(|s| s.as_str()) {
        Some("Power") | Some("Lighting") => {
            // Rough estimates based on conductor size for power cables
            match size.to_uppercase().as_str() {
                s if s.contains("18") => 10.0,
                s if s.contains("16") => 13.0,
                s if s.contains("14") => 15.0,
                s if s.contains("12") => 20.0,
                s if s.contains("10") => 30.0,
                s if s.contains("8") => 40.0,
                s if s.contains("6") => 55.0,
                s if s.contains("4") => 70.0,
                s if s.contains("2") => 95.0,
                _ => 20.0, // Default assumption
            }
        }
        Some("Signal") | Some("Control") | Some("Communication") => {
            // Signal cables typically carry much less current
            match size.to_uppercase().as_str() {
                s if s.contains("18") | s.contains("20") | s.contains("22") => 0.1,
                s if s.contains("16") => 0.2,
                s if s.contains("14") => 0.5,
                _ => 0.1, // Very low current for signals
            }
        }
        _ => 0.0, // Unknown function, can't estimate
    }
}

// I/O Point commands
#[tauri::command]
pub async fn create_io_point(
    io_point_data: NewIOPoint,
    state: State<'_, Mutex<AppState>>,
) -> Result<IOPoint, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.insert_io_point(project_id, &io_point_data)?)
}

#[tauri::command]
pub async fn get_io_points(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<IOPoint>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_io_points(project_id)?)
}

#[tauri::command]
pub async fn update_io_point(
    id: i64,
    updates: UpdateIOPoint,
    state: State<'_, Mutex<AppState>>,
) -> Result<IOPoint, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    Ok(db.update_io_point(id, &updates)?)
}

#[tauri::command]
pub async fn delete_io_point(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_io_point(id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_io_points_by_plc(
    plc_name: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<IOPoint>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_io_points_by_plc(project_id, &plc_name)?)
}

#[tauri::command]
pub async fn check_io_address_conflict(
    plc_name: String,
    rack: i32,
    slot: i32,
    channel: i32,
    exclude_id: Option<i64>,
    state: State<'_, Mutex<AppState>>,
) -> Result<bool, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.check_io_address_conflict(project_id, &plc_name, rack, slot, channel, exclude_id)?)
}

// Load commands
#[tauri::command]
pub async fn create_load(
    load_data: NewLoad,
    state: State<'_, Mutex<AppState>>,
) -> Result<Load, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.insert_load(project_id, &load_data)?)
}

#[tauri::command]
pub async fn get_loads(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Load>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_loads(project_id)?)
}

#[tauri::command]
pub async fn update_load(
    id: i64,
    updates: UpdateLoad,
    state: State<'_, Mutex<AppState>>,
) -> Result<Load, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    Ok(db.update_load(id, &updates)?)
}

#[tauri::command]
pub async fn delete_load(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_load(id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_load_summary(
    state: State<'_, Mutex<AppState>>,
) -> Result<(f64, f64, i32), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_load_summary(project_id)?)
}

// Conduit commands
#[tauri::command]
pub async fn create_conduit(
    conduit_data: NewConduit,
    state: State<'_, Mutex<AppState>>,
) -> Result<Conduit, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.insert_conduit(project_id, &conduit_data)?)
}

#[tauri::command]
pub async fn get_conduits(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Conduit>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_conduits(project_id)?)
}

#[tauri::command]
pub async fn update_conduit(
    id: i64,
    updates: UpdateConduit,
    state: State<'_, Mutex<AppState>>,
) -> Result<Conduit, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    Ok(db.update_conduit(id, &updates)?)
}

#[tauri::command]
pub async fn delete_conduit(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_conduit(id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_conduit_summary(
    state: State<'_, Mutex<AppState>>,
) -> Result<(i32, f64, i32), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_conduit_summary(project_id)?)
}

// Tray commands
#[tauri::command]
pub async fn get_trays(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Tray>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_trays(project_id)?)
}

#[tauri::command]
pub async fn create_tray(
    tray_data: NewTray,
    state: State<'_, Mutex<AppState>>,
) -> Result<Tray, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.insert_tray(&tray_data, project_id, 1)?)
}

#[tauri::command]
pub async fn update_tray(
    id: i64,
    updates: UpdateTray,
    state: State<'_, Mutex<AppState>>,
) -> Result<Tray, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    Ok(db.update_tray(id, &updates)?)
}

#[tauri::command]
pub async fn delete_tray(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_tray(id)?;
    Ok(())
}

#[tauri::command]
pub async fn get_tray_summary(
    state: State<'_, Mutex<AppState>>,
) -> Result<(i32, f64, i32), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    Ok(db.get_tray_summary(project_id)?)
}

// Fill calculation commands
#[tauri::command]
pub async fn recalculate_conduit_fill(
    conduit_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<f64, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let fill_percentage = db.calculate_conduit_fill_percentage(conduit_id)?;
    Ok(fill_percentage)
}

#[tauri::command]
pub async fn recalculate_tray_fill(
    tray_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<f64, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let fill_percentage = db.calculate_tray_fill_percentage(tray_id)?;
    Ok(fill_percentage)
}

#[tauri::command]
pub async fn recalculate_all_fills(
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    // Recalculate all conduit fills
    let conduits = db.get_conduits(project_id)?;
    for conduit in conduits {
        if let Some(id) = conduit.id {
            db.calculate_conduit_fill_percentage(id)?;
        }
    }
    
    // Recalculate all tray fills
    let trays = db.get_trays(project_id)?;
    for tray in trays {
        if let Some(id) = tray.id {
            db.calculate_tray_fill_percentage(id)?;
        }
    }
    
    Ok(())
}

// Revision tracking commands
#[tauri::command]
pub async fn create_revision(
    major_revision: String,
    minor_revision: i32,
    description: Option<String>,
    is_checkpoint: bool,
    user_name: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Revision, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let current_revision_id = db.get_current_revision_id(project_id).ok();
    
    let new_revision = NewRevision {
        major_revision,
        minor_revision,
        description,
        is_checkpoint,
        is_auto_save: false,
        user_name,
        parent_revision_id: current_revision_id,
    };
    
    let revision = db.create_revision(project_id, &new_revision)?;
    Ok(revision)
}

#[tauri::command]
pub async fn get_revision_history(
    limit: Option<i32>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<RevisionSummary>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let revisions = db.get_revision_history(project_id, limit)?;
    Ok(revisions)
}

#[tauri::command]
pub async fn get_revision_by_id(
    revision_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<Revision, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let revision = db.get_revision_by_id(revision_id)?;
    Ok(revision)
}

#[tauri::command]
pub async fn get_revision_changes(
    revision_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<RevisionChange>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let changes = db.get_revision_changes(revision_id)?;
    Ok(changes)
}

#[tauri::command]
pub async fn get_entity_change_history(
    entity_type: String,
    entity_id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<RevisionChange>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let changes = db.get_entity_change_history(project_id, &entity_type, entity_id)?;
    Ok(changes)
}

#[tauri::command]
pub async fn track_entity_change(
    entity_type: String,
    entity_id: i64,
    entity_tag: Option<String>,
    change_type: String,
    field_name: Option<String>,
    old_value: Option<String>,
    new_value: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<RevisionChange, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    // Get or create current revision
    let revision_id = match db.get_current_revision_id(project_id) {
        Ok(id) => id,
        Err(_) => {
            // Create an auto-save revision
            let revision = db.create_auto_save_revision(project_id)?;
            revision.id.unwrap()
        }
    };
    
    let new_change = NewRevisionChange {
        entity_type,
        entity_id,
        entity_tag,
        change_type,
        field_name,
        old_value,
        new_value,
    };
    
    let change = db.insert_revision_change(revision_id, &new_change)?;
    Ok(change)
}

#[tauri::command]
pub async fn create_checkpoint(
    description: String,
    user_name: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Revision, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let checkpoint = db.create_checkpoint(project_id, description, user_name)?;
    Ok(checkpoint)
}

#[tauri::command]
pub async fn create_auto_save_revision(
    state: State<'_, Mutex<AppState>>,
) -> Result<Revision, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let revision = db.create_auto_save_revision(project_id)?;
    Ok(revision)
}

#[tauri::command]
pub async fn prune_old_revisions(
    keep_count: i32,
    state: State<'_, Mutex<AppState>>,
) -> Result<i32, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    let deleted_count = db.prune_old_revisions(project_id, keep_count)?;
    Ok(deleted_count)
}

// Cable Library Commands

#[tauri::command]
pub async fn get_cable_library_items(
    search_term: Option<String>,
    category: Option<String>,
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<CableLibraryItem>, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let items = db.get_cable_library_items(search_term, category)?;
    Ok(items)
}

#[tauri::command]
pub async fn create_cable_library_item(
    item: NewCableLibraryItem,
    state: State<'_, Mutex<AppState>>,
) -> Result<CableLibraryItem, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let created_item = db.create_cable_library_item(&item)?;
    Ok(created_item)
}

#[tauri::command]
pub async fn update_cable_library_item(
    id: i64,
    updates: UpdateCableLibraryItem,
    state: State<'_, Mutex<AppState>>,
) -> Result<CableLibraryItem, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let updated_item = db.update_cable_library_item(id, &updates)?;
    Ok(updated_item)
}

#[tauri::command]
pub async fn get_cable_library_item(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<CableLibraryItem, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    let item = db.get_cable_library_item(id)?;
    Ok(item)
}

#[tauri::command]
pub async fn delete_cable_library_item(
    id: i64,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    
    db.delete_cable_library_item(id)?;
    Ok(())
}

#[tauri::command]
pub async fn import_cable_from_library(
    library_id: i64,
    tag: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<Cable, CommandError> {
    let app_state = state.lock().unwrap();
    let db = app_state.db.as_ref().ok_or(CommandError::NoDatabase)?;
    let project_id = app_state.current_project_id.ok_or(CommandError::NoProject)?;
    
    // Get the current revision ID (assuming we have this function)
    let revision_id = db.get_current_revision_id(project_id)
        .map_err(|_| CommandError::Custom("No current revision found".to_string()))?;
    
    let cable = db.import_cable_from_library(project_id, revision_id, library_id, tag)?;
    Ok(cable)
}