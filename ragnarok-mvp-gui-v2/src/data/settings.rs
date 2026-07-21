use serde::{Deserialize, Serialize};

pub const SERVERS: &[&str] = &[
    "aRO", "bRO", "cRO", "fRO", "GGH", "idRO", "iRO", "iROC", "jRO", "kROM",
    "kROZ", "kROZS", "ruRO", "thROG", "twRO",
];

pub const DEFAULT_SERVER: &str = "iRO";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub server: String,
    pub nickname: String,
    pub party_room: Option<String>,
    pub use_24_hour_format: bool,
    pub show_mvp_map: bool,
    pub animated_sprites: bool,
    pub card_bg_alpha: u8,
    pub notification_sound: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            server: DEFAULT_SERVER.to_string(),
            nickname: String::new(),
            party_room: None,
            use_24_hour_format: true,
            show_mvp_map: true,
            animated_sprites: false,
            card_bg_alpha: 75,
            notification_sound: true,
        }
    }
}
