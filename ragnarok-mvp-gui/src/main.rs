#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod core;
mod data;
mod firebase;
mod storage;
mod ui;

use app::MvpTimerApp;

fn main() -> eframe::Result<()> {
    // Write logs to file next to exe for debugging
    let log_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("debug.log")))
        .unwrap_or_else(|| std::path::PathBuf::from("debug.log"));
    let _ = env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn"))
        .target(env_logger::Target::Pipe(Box::new(
            std::fs::File::create(&log_path).unwrap_or_else(|_| std::fs::File::create(".").unwrap()),
        )))
        .init();

    log::warn!("=== MVP Timer started ===");
    if let Ok(exe) = std::env::current_exe() {
        log::warn!("exe={:?}", exe);
        if let Some(dir) = exe.parent() {
            log::warn!("exe_dir={:?}", dir);
            let icon_path = dir.join("assets/icons/1086.png");
            log::warn!("test icon path={:?} exists={}", icon_path, icon_path.exists());
            let map_path = dir.join("assets/maps/abbey02.png");
            log::warn!("test map path={:?} exists={}", map_path, map_path.exists());
            // Try reading
            match std::fs::read(&icon_path) {
                Ok(d) => log::warn!("icon read OK, bytes={}", d.len()),
                Err(e) => log::warn!("icon read FAILED: {}", e),
            }
            match image::load_from_memory(&std::fs::read(&icon_path).unwrap_or_default()) {
                Ok(img) => log::warn!("icon decode OK, dims={}x{}", img.width(), img.height()),
                Err(e) => log::warn!("icon decode FAILED: {}", e),
            }
        }
    }

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([900.0, 700.0])
            .with_min_inner_size([600.0, 400.0])
            .with_title("Ragnarok MVP Timer"),
        ..Default::default()
    };

    eframe::run_native(
        "Ragnarok MVP Timer",
        options,
        Box::new(|cc| {
            // Setup Thai font support
            let mut fonts = egui::FontDefinitions::default();
            fonts.font_data.insert(
                "noto_sans_thai".to_owned(),
                std::sync::Arc::new(egui::FontData::from_static(
                    include_bytes!("../assets/NotoSansThai.ttf"),
                )),
            );
            fonts
                .families
                .get_mut(&egui::FontFamily::Proportional)
                .unwrap()
                .push("noto_sans_thai".to_owned());
            cc.egui_ctx.set_fonts(fonts);

            // Dark theme
            let mut style = (*cc.egui_ctx.style()).clone();
            style.visuals.dark_mode = true;
            style.visuals.override_text_color = Some(egui::Color32::from_rgb(220, 220, 220));
            cc.egui_ctx.set_style(style);

            Ok(Box::new(MvpTimerApp::default()))
        }),
    )
}
