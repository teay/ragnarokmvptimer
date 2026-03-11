use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      // Get the app data directory in Rust
      let path_resolver = app.path();
      let app_data_dir = path_resolver.app_local_data_dir()
          .unwrap_or_default()
          .to_string_lossy()
          .into_owned();
      
      // Escape backslashes for Windows paths
      let safe_path = app_data_dir.replace("\\", "\\\\");
      
      // Inject the path into the window object as a global variable
      let main_window = app.get_webview_window("main").unwrap();
      let script = format!("window.__APP_DATA_DIR__ = '{}';", safe_path);
      let _ = main_window.eval(&script);

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
