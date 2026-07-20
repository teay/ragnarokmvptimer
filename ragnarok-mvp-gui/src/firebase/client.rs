use serde::{Deserialize, Serialize};

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
    pub updated_by: Option<String>,
}

pub struct FirebaseClient {
    pub database_url: String,
    pub api_key: String,
    pub id_token: Option<String>,
    pub client: reqwest::Client,
}

impl FirebaseClient {
    pub fn new(database_url: &str, api_key: &str) -> Self {
        Self {
            database_url: database_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
            id_token: None,
            client: reqwest::Client::new(),
        }
    }

    pub async fn sign_in_anonymously(&mut self) -> Result<(), String> {
        let url = format!(
            "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={}",
            self.api_key
        );
        let body = serde_json::json!({"returnSecureToken": true});
        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Firebase auth request failed: {}", e))?;
        let data: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Firebase auth parse failed: {}", e))?;
        if let Some(token) = data["idToken"].as_str() {
            self.id_token = Some(token.to_string());
            Ok(())
        } else {
            Err(format!("Firebase auth failed: {:?}", data))
        }
    }

    fn auth_url(&self, path: &str) -> String {
        let base = format!("{}{}.json", self.database_url, path);
        if let Some(token) = &self.id_token {
            format!("{}?auth={}", base, token)
        } else {
            base
        }
    }

    pub async fn read_mvps(&self, path: &str) -> Result<Vec<FirebaseMvp>, String> {
        let url = self.auth_url(path);
        log::warn!("Firebase GET {}", &url[..url.len().min(120)]);
        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Firebase read request failed: {}", e))?;
        let status = resp.status();
        let body_text = resp.text().await.unwrap_or_default();
        log::warn!("Firebase GET status={} body_len={} preview={:?}", status, body_text.len(), &body_text[..body_text.len().min(250)]);
        if body_text.is_empty() || body_text == "null" {
            log::warn!("Firebase GET: empty/null response");
            return Ok(vec![]);
        }
        match serde_json::from_str::<Vec<FirebaseMvp>>(&body_text) {
            Ok(data) => Ok(data),
            Err(e) => {
                log::warn!("Firebase parse error: {}. Trying single object...", e);
                match serde_json::from_str::<FirebaseMvp>(&body_text) {
                    Ok(single) => Ok(vec![single]),
                    Err(e2) => Err(format!("Firebase parse failed: {} / {}", e, e2)),
                }
            }
        }
    }

    pub async fn write_mvps(&self, path: &str, mvps: &[FirebaseMvp]) -> Result<(), String> {
        let url = self.auth_url(path);
        self.client
            .put(&url)
            .json(mvps)
            .send()
            .await
            .map_err(|e| format!("Firebase write failed: {}", e))?;
        Ok(())
    }
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
        updated_by: Some(nickname.to_string()),
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
    }
}

pub fn merge_firebase_into_mvp(fb: &FirebaseMvp, base: &Mvp) -> Mvp {
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
    }
}

pub fn get_firebase_path(nickname: &str, server: &str, party_room: Option<&str>) -> String {
    match party_room {
        Some(room) if !room.is_empty() => {
            format!("/hunting/party/{}/{}/mvps", room, server)
        }
        _ => {
            format!("/hunting/solo/{}/{}/mvps", nickname, server)
        }
    }
}
