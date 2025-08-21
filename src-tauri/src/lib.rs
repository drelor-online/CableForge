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
      update_cable_voltage_drop,
      create_io_point,
      get_io_points,
      update_io_point,
      delete_io_point,
      get_io_points_by_plc,
      check_io_address_conflict,
      create_load,
      get_loads,
      update_load,
      delete_load,
      get_load_summary,
      create_conduit,
      get_conduits,
      update_conduit,
      delete_conduit,
      get_conduit_summary,
      create_tray,
      get_trays,
      update_tray,
      delete_tray,
      get_tray_summary,
      recalculate_conduit_fill,
      recalculate_tray_fill,
      recalculate_all_fills,
      create_revision,
      get_revision_history,
      get_revision_by_id,
      get_revision_changes,
      get_entity_change_history,
      track_entity_change,
      create_checkpoint,
      create_auto_save_revision,
      prune_old_revisions,
      get_cable_library_items,
      create_cable_library_item,
      update_cable_library_item,
      get_cable_library_item,
      delete_cable_library_item,
      import_cable_from_library
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
