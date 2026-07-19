use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MapMark {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Spawn {
    pub mapname: String,
    #[serde(rename = "respawnTime")]
    pub respawn_time: u64,
    #[serde(default)]
    pub window: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Stats {
    pub level: u32,
    pub health: u64,
    #[serde(rename = "baseExperience")]
    pub base_experience: u64,
    #[serde(rename = "jobExperience")]
    pub job_experience: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Mvp {
    pub id: u32,
    #[serde(default)]
    pub dbname: Option<String>,
    pub name: String,
    pub spawn: Vec<Spawn>,
    pub stats: Stats,

    // Runtime state (not in server JSON, saved locally)
    #[serde(default)]
    #[serde(rename = "deathTime")]
    pub death_time: Option<i64>,
    #[serde(default)]
    #[serde(rename = "deathMap")]
    pub death_map: Option<String>,
    #[serde(default)]
    #[serde(rename = "deathPosition")]
    pub death_position: Option<MapMark>,
    #[serde(default)]
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MvpZone {
    Unselected,
    Wait,
    Active,
}

impl MvpZone {
    pub fn from_state(has_death_time: bool, is_pinned: bool) -> Self {
        if has_death_time {
            MvpZone::Active
        } else if is_pinned {
            MvpZone::Wait
        } else {
            MvpZone::Unselected
        }
    }
}
