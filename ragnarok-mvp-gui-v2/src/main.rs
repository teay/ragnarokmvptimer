#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod core;
mod data;
mod firebase;

use app::MvpTimerApp;

fn main() -> eframe::Result<()> {
    let log_path = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("debug.log")))
        .unwrap_or_else(|| std::path::PathBuf::from("debug.log"));
    let _ = env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn"))
        .target(env_logger::Target::Pipe(Box::new(
            std::fs::File::create(&log_path).unwrap_or_else(|_| std::fs::File::create("debug.log").unwrap()),
        )))
        .init();

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([900.0, 700.0])
            .with_min_inner_size([600.0, 400.0])
            .with_title("Ragnarok MVP Timer v2"),
        ..Default::default()
    };

    eframe::run_native(
        "Ragnarok MVP Timer v2",
        options,
        Box::new(|cc| {
            let mut style = (*cc.egui_ctx.style()).clone();
            style.visuals.dark_mode = true;
            style.visuals.override_text_color = Some(egui::Color32::from_rgb(220, 220, 220));
            cc.egui_ctx.set_style(style);
            Ok(Box::new(MvpTimerApp::default()))
        }),
    )
}
