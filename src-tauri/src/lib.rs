mod database;
mod commands;
mod validation;
mod calculations;

use commands::*;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(Mutex::new(AppState::default()))
    .invoke_handler(tauri::generate_handler![
      initialize_app,
      create_project,
      new_project,
      open_project,
      save_project,
      save_project_as,
      get_current_project_info,
      get_projects,
      show_open_dialog,
      show_save_dialog,
      create_cable,
      get_cables,
      update_cable,
      delete_cable,
      get_next_cable_tag,
      validate_all_cables,
      validate_cable,
      check_duplicate_tag,
      get_validation_summary,
      take_screenshot,
      save_workflow_data,
      save_workflow_json,
      get_recordings_directory,
      export_workflow_zip,
      calculate_voltage_drop,
      calculate_minimum_conductor_size,
      calculate_current_from_power,
      update_cable_voltage_drop
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
