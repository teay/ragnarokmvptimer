use std::fs;
use std::path::PathBuf;

use crate::data::mvp::Mvp;
use crate::data::settings::Settings;

fn get_data_dir() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("ragnarok-mvp-gui")
}

fn ensure_data_dir() -> PathBuf {
    let dir = get_data_dir();
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn get_save_path(server: &str) -> PathBuf {
    ensure_data_dir().join(format!("{}.json", server))
}

pub fn get_settings_path() -> PathBuf {
    ensure_data_dir().join("settings.json")
}

pub fn load_mvps(server: &str) -> Vec<Mvp> {
    let path = get_save_path(server);
    match fs::read_to_string(&path) {
        Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

pub fn save_mvps(server: &str, mvps: &[Mvp]) {
    let path = get_save_path(server);
    if let Ok(json) = serde_json::to_string_pretty(mvps) {
        let _ = fs::write(path, json);
    }
}

pub fn load_settings() -> Settings {
    let path = get_settings_path();
    match fs::read_to_string(&path) {
        Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
        Err(_) => Settings::default(),
    }
}

pub fn save_settings(settings: &Settings) {
    let path = get_settings_path();
    if let Ok(json) = serde_json::to_string_pretty(settings) {
        let _ = fs::write(path, json);
    }
}
