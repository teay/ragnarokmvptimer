#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      use tauri::Manager;
      
      // กำหนดค่าหน้าต่างเริ่มต้นให้มีสีพื้นหลังเป็นสีมืดตั้งแต่วินาทีแรก
      if let Some(window) = app.get_webview_window("main") {
        // ใน Tauri v2 เราสามารถตั้งค่าสีพื้นหลังผ่านโค้ด Rust ได้แบบนี้ครับ
        // หมายเหตุ: [R, G, B, A]
        let _ = window.set_background_color(Some(tauri::Color(5, 5, 5, 255)));
      }

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
