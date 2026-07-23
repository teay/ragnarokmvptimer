use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::data::mvp::{Mvp, MapMark};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirebaseMvp {
    pub id: u32,
    #[serde(default)]
    #[serde(rename = "deathTime")]
    pub death_time: Option<String>,
    #[serde(default)]
    #[serde(rename = "deathMap")]
    pub death_map: Option<String>,
    #[serde(default)]
    #[serde(rename = "deathPosition")]
    pub death_position: Option<MapMark>,
    #[serde(default)]
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
    #[serde(default)]
    #[serde(rename = "updatedBy")]
    pub updated_by: Option<String>,
    #[serde(default)]
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<i64>,
}

pub struct FirebaseClient {
    pub database_url: String,
    client: reqwest::Client,
}

impl FirebaseClient {
    pub fn new(database_url: &str) -> Self {
        Self {
            database_url: database_url.trim_end_matches('/').to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn url_for(&self, path: &str) -> String {
        format!("{}{}.json", self.database_url, path)
    }

    fn mvp_key(mvp: &Mvp) -> String {
        let map = mvp.death_map.as_deref().unwrap_or("unknown");
        format!("{}-{}", mvp.id, map)
    }

    fn mvp_key_from(id: u32, death_map: Option<&str>) -> String {
        format!("{}-{}", id, death_map.unwrap_or("unknown"))
    }

    pub async fn read_all(&self, path: &str) -> Result<Vec<FirebaseMvp>, String> {
        let url = self.url_for(path);
        let resp = self.client.get(&url).send().await
            .map_err(|e| format!("Firebase GET failed: {}", e))?;
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        parse_firebase_body(&body, status)
    }

    pub async fn write_mvp(&self, path: &str, mvp: &Mvp, nickname: &str) -> Result<(), String> {
        let key = Self::mvp_key(mvp);
        let url = format!("{}/{}/{}.json", self.database_url, path.trim_end_matches('/'), key);
        let fb = to_firebase(mvp, nickname);
        self.client.put(&url).json(&fb).send().await
            .map_err(|e| format!("Firebase PUT failed: {}", e))?;
        Ok(())
    }

    pub async fn patch_mvps(&self, path: &str, mvps: &[Mvp], nickname: &str) -> Result<(), String> {
        let url = self.url_for(path);
        let mut updates: HashMap<String, FirebaseMvp> = HashMap::new();
        for mvp in mvps {
            let key = Self::mvp_key(mvp);
            updates.insert(key, to_firebase(mvp, nickname));
        }
        self.client.patch(&url).json(&updates).send().await
            .map_err(|e| format!("Firebase PATCH failed: {}", e))?;
        Ok(())
    }

    pub async fn delete_mvp(&self, path: &str, id: u32, death_map: Option<&str>) -> Result<(), String> {
        let key = Self::mvp_key_from(id, death_map);
        let url = format!("{}/{}/{}.json", self.database_url, path.trim_end_matches('/'), key);
        self.client.delete(&url).send().await
            .map_err(|e| format!("Firebase DELETE failed: {}", e))?;
        Ok(())
    }

    pub async fn delete_all(&self, path: &str) -> Result<(), String> {
        let url = self.url_for(path);
        self.client.delete(&url).send().await
            .map_err(|e| format!("Firebase DELETE failed: {}", e))?;
        Ok(())
    }

    fn read_all_blocking_inner(&self, path: &str) -> Result<Vec<FirebaseMvp>, String> {
        let url = self.url_for(path);
        let client = reqwest::blocking::Client::new();
        let resp = client.get(&url).send()
            .map_err(|e| format!("Firebase GET (blocking) failed: {}", e))?;
        let status = resp.status();
        let body = resp.text().unwrap_or_default();
        parse_firebase_body(&body, status)
    }

    pub fn read_all_blocking(&self, path: &str) -> Result<Vec<FirebaseMvp>, String> {
        self.read_all_blocking_inner(path)
    }

    fn patch_mvps_blocking_inner(&self, path: &str, mvps: &[Mvp], nickname: &str) -> Result<(), String> {
        let url = self.url_for(path);
        let mut updates: HashMap<String, FirebaseMvp> = HashMap::new();
        for mvp in mvps {
            let key = Self::mvp_key(mvp);
            updates.insert(key, to_firebase(mvp, nickname));
        }
        let client = reqwest::blocking::Client::new();
        client.patch(&url).json(&updates).send()
            .map_err(|e| format!("Firebase PATCH (blocking) failed: {}", e))?;
        Ok(())
    }

    pub fn write_mvp_blocking(&self, path: &str, mvp: &Mvp, nickname: &str) -> Result<(), String> {
        let key = Self::mvp_key(mvp);
        let url = format!("{}/{}/{}.json", self.database_url, path.trim_end_matches('/'), key);
        let fb = to_firebase(mvp, nickname);
        let client = reqwest::blocking::Client::new();
        client.put(&url).json(&fb).send()
            .map_err(|e| format!("Firebase PUT (blocking) failed: {}", e))?;
        Ok(())
    }

    fn delete_mvp_blocking_inner(&self, path: &str, id: u32, death_map: Option<&str>) -> Result<(), String> {
        let key = Self::mvp_key_from(id, death_map);
        let url = format!("{}/{}/{}.json", self.database_url, path.trim_end_matches('/'), key);
        let client = reqwest::blocking::Client::new();
        client.delete(&url).send()
            .map_err(|e| format!("Firebase DELETE (blocking) failed: {}", e))?;
        Ok(())
    }

    pub async fn open_stream(&self, path: &str) -> Result<reqwest::Response, String> {
        let url = self.url_for(path);
        let resp = self.client.get(&url)
            .header("Accept", "text/event-stream")
            .send()
            .await
            .map_err(|e| format!("Firebase SSE failed: {}", e))?;
        if !resp.status().is_success() {
            let s = resp.status();
            let b = resp.text().await.unwrap_or_default();
            return Err(format!("Firebase SSE status={} body={}", s, b));
        }
        Ok(resp)
    }
}

fn parse_firebase_body(body: &str, status: reqwest::StatusCode) -> Result<Vec<FirebaseMvp>, String> {
    if body.is_empty() || body == "null" {
        return Ok(vec![]);
    }
    if let Ok(map) = serde_json::from_str::<HashMap<String, FirebaseMvp>>(body) {
        return Ok(map.into_values().collect());
    }
    if let Ok(arr) = serde_json::from_str::<Vec<FirebaseMvp>>(body) {
        return Ok(arr);
    }
    if let Ok(single) = serde_json::from_str::<FirebaseMvp>(body) {
        return Ok(vec![single]);
    }
    Err(format!("Firebase parse failed (status {})", status))
}

pub fn to_firebase(mvp: &Mvp, nickname: &str) -> FirebaseMvp {
    FirebaseMvp {
        id: mvp.id,
        death_time: mvp.death_time.map(|ms| {
            chrono::DateTime::from_timestamp_millis(ms)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default()
        }),
        death_map: mvp.death_map.clone(),
        death_position: mvp.death_position.clone(),
        is_pinned: mvp.is_pinned,
        updated_by: Some(if nickname.is_empty() { "Anon".to_string() } else { nickname.to_string() }),
        updated_at: Some(chrono::Utc::now().timestamp_millis()),
    }
}

pub fn from_firebase(fb: &FirebaseMvp) -> Mvp {
    let death_time = fb.death_time.as_deref().and_then(|s| {
        chrono::DateTime::parse_from_rfc3339(s)
            .ok()
            .map(|dt| dt.timestamp_millis())
    });
    Mvp {
        id: fb.id,
        dbname: None,
        name: String::new(),
        spawn: vec![],
        stats: crate::data::mvp::Stats {
            level: 0,
            health: 0,
            base_experience: 0,
            job_experience: 0,
        },
        death_time,
        death_map: fb.death_map.clone(),
        death_position: fb.death_position.clone(),
        is_pinned: fb.is_pinned,
        updated_at: fb.updated_at,
    }
}

pub fn get_firebase_path(nickname: &str, server: &str, party_room: Option<&str>) -> String {
    match party_room {
        Some(room) if !room.is_empty() => {
            format!("/hunting/party/{}/members/{}/{}/mvps", room, nickname, server)
        }
        _ => {
            format!("/hunting/solo/{}/{}/mvps", nickname, server)
        }
    }
}

pub fn merge_firebase_into_mvp(fb: &FirebaseMvp, base: &Mvp) -> Mvp {
    let remote_ts = fb.updated_at.unwrap_or(0);
    let death_time = fb.death_time.as_deref().and_then(|s| {
        chrono::DateTime::parse_from_rfc3339(s)
            .ok()
            .map(|dt| dt.timestamp_millis())
    });
    Mvp {
        id: base.id,
        dbname: base.dbname.clone(),
        name: base.name.clone(),
        spawn: base.spawn.clone(),
        stats: base.stats.clone(),
        death_time,
        death_map: fb.death_map.clone(),
        death_position: fb.death_position.clone(),
        is_pinned: fb.is_pinned,
        updated_at: Some(remote_ts.max(base.updated_at.unwrap_or(0))),
    }
}
