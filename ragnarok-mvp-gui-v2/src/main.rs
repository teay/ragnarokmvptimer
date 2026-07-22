#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod core;
mod data;
mod firebase;

use app::MvpTimerApp;

fn asset_dir() -> std::path::PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| std::path::PathBuf::from("."))
}

fn load_fonts(ctx: &egui::Context) {
    let base = asset_dir().join("assets");
    let font_files = [
        ("noto-thai", "NotoSansThai.ttf"),
        ("noto-jp", "NotoSansJP.ttf"),
        ("noto-kr", "NotoSansKR.ttf"),
    ];
    let mut defs = egui::FontDefinitions::default();
    for (name, filename) in &font_files {
        let path = base.join(filename);
        match std::fs::read(&path) {
            Ok(data) => {
                defs.font_data.insert(name.to_string(), std::sync::Arc::new(egui::FontData::from_owned(data)));
                for family in [egui::FontFamily::Proportional, egui::FontFamily::Monospace] {
                    defs.families.get_mut(&family).unwrap().insert(0, name.to_string());
                }
                log::warn!("Loaded font: {:?}", path);
            }
            Err(e) => log::warn!("Failed to load font {:?}: {}", path, e),
        }
    }
    ctx.set_fonts(defs);
}

#[tokio::main]
async fn main() -> eframe::Result<()> {
    let log_path = asset_dir().join("debug.log");
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
            load_fonts(&cc.egui_ctx);
            let mut style = (*cc.egui_ctx.style()).clone();
            style.visuals.dark_mode = true;
            style.visuals.override_text_color = Some(egui::Color32::from_rgb(220, 220, 220));
            cc.egui_ctx.set_style(style);
            Ok(Box::new(MvpTimerApp::default()))
        }),
    )
}
