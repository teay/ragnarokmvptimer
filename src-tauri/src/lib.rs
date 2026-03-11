use tauri::Manager;

#[tauri::command]
async fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
  app.path()
    .app_local_data_dir()
    .map(|path| path.to_string_lossy().into_owned())
    .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .setup(|_app| {
      if cfg!(debug_assertions) {
        _app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_app_data_dir])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
