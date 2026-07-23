use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub const SERVERS: &[&str] = &[
    "aRO", "bRO", "cRO", "fRO", "GGH", "idRO", "iRO", "iROC", "jRO", "kROM",
    "kROZ", "kROZS", "ruRO", "thROG", "twRO",
];

pub const DEFAULT_SERVER: &str = "iRO";

fn settings_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("ragnarok-mvp-timer").join("settings.json"))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub server: String,
    pub nickname: String,
    pub party_room: Option<String>,
    pub database_url: String,
    pub use_24_hour_format: bool,
    pub show_mvp_map: bool,
    pub animated_sprites: bool,
    pub card_bg_alpha: u8,
    pub notification_sound: bool,
    pub card_zoom: f32,
}

impl Settings {
    pub fn load() -> Self {
        settings_path()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) {
        if let Some(p) = settings_path() {
            if let Some(parent) = p.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if let Ok(s) = serde_json::to_string_pretty(self) {
                let _ = std::fs::write(p, s);
            }
        }
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            server: DEFAULT_SERVER.to_string(),
            nickname: String::new(),
            party_room: None,
            database_url: "https://ragnarokmvptimer-ace0a-default-rtdb.asia-southeast1.firebasedatabase.app".to_string(),
            use_24_hour_format: true,
            show_mvp_map: true,
            animated_sprites: true,
            card_bg_alpha: 75,
            notification_sound: true,
            card_zoom: 1.0,
        }
    }
}
