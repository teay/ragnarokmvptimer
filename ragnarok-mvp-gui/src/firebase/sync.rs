use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use tokio::sync::Mutex;
use futures_util::StreamExt;

use crate::data::mvp::Mvp;

use super::client::{FirebaseClient, to_firebase, from_firebase, get_firebase_path};

pub struct FirebaseSync {
    pub client: FirebaseClient,
    pub path: String,
    pub nickname: String,
    pub server: String,
    pub party_room: Option<String>,
}

impl FirebaseSync {
    pub fn new(
        database_url: &str,
        api_key: &str,
        nickname: &str,
        server: &str,
        party_room: Option<&str>,
    ) -> Self {
        let path = get_firebase_path(nickname, server, party_room);
        Self {
            client: FirebaseClient::new(database_url, api_key),
            path,
            nickname: nickname.to_string(),
            server: server.to_string(),
            party_room: party_room.map(|s| s.to_string()),
        }
    }

    pub async fn sign_in(&mut self) -> Result<(), String> {
        self.client.sign_in_anonymously().await
    }

    pub async fn pull(&self) -> Result<Vec<Mvp>, String> {
        let fb_mvps = self.client.read_mvps(&self.path).await?;
        Ok(fb_mvps.iter().map(from_firebase).collect())
    }

    pub async fn push(&self, mvps: &[Mvp]) -> Result<(), String> {
        let fb_mvps: Vec<_> = mvps
            .iter()
            .map(|m| to_firebase(m, &self.nickname))
            .collect();
        self.client.write_mvps(&self.path, &fb_mvps).await
    }

    /// Subscribe to real-time changes via SSE.
    /// Runs forever — reconnects on failure after re-signing in.
    /// Each received data is written into `poll_data` (shared with the UI thread).
    pub async fn subscribe<F>(mut self, poll_data: Arc<StdMutex<Option<Vec<Mvp>>>>, add_log: F)
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        loop {
            add_log(format!("Firebase SSE: connecting to {}", &self.path));
            match self.client.open_stream(&self.path).await {
                Ok(response) => {
                    add_log(format!("Firebase SSE: connected"));
                    let mut buf = String::new();
                    let mut stream = response.bytes_stream();
                    let mut saw_data = false;
                    while let Some(chunk) = stream.next().await {
                        match chunk {
                            Ok(bytes) => {
                                let text = String::from_utf8_lossy(&bytes);
                                buf.push_str(&text);
                                loop {
                                    let event_end = match buf.find("\n\n") {
                                        Some(pos) => pos,
                                        None => break,
                                    };
                                    let event_str = buf[..event_end].to_string();
                                    buf.drain(..event_end + 2);
                                    let data_val = extract_sse_data(&event_str);
                                    if let Some(d) = data_val {
                                        if d == "null" || d.is_empty() {
                                            continue;
                                        }
                                        let mvps = parse_firebase_sse_data(d);
                                        if let Some(m) = mvps {
                                            if let Ok(mut guard) = poll_data.lock() {
                                                *guard = Some(m);
                                            }
                                            saw_data = true;
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                add_log(format!("Firebase SSE: read error: {}", e));
                                break;
                            }
                        }
                    }
                    if !saw_data {
                        add_log(format!("Firebase SSE: disconnected before any data"));
                    } else {
                        add_log(format!("Firebase SSE: disconnected, reconnecting..."));
                    }
                }
                Err(e) => {
                    add_log(format!("Firebase SSE: connection failed: {}", e));
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            // Re-sign-in before reconnecting (token may have expired)
            if let Err(e) = self.sign_in().await {
                add_log(format!("Firebase SSE: re-sign-in failed: {}", e));
            }
        }
    }

    pub fn update_path(&mut self, nickname: &str, server: &str, party_room: Option<&str>) {
        self.path = get_firebase_path(nickname, server, party_room);
        self.nickname = nickname.to_string();
        self.server = server.to_string();
        self.party_room = party_room.map(|s| s.to_string());
    }
}

pub fn merge_firebase_data(
    firebase_mvps: &[Mvp],
    all_server_mvps: &[Mvp],
) -> Vec<Mvp> {
    let base_map: HashMap<u32, &Mvp> = all_server_mvps
        .iter()
        .map(|m| (m.id, m))
        .collect();

    firebase_mvps
        .iter()
        .map(|fb_mvp| {
            if let Some(base) = base_map.get(&fb_mvp.id) {
                let mut merged = (*base).clone();
                merged.death_time = fb_mvp.death_time;
                merged.death_map = fb_mvp.death_map.clone();
                merged.death_position = fb_mvp.death_position.clone();
                merged.is_pinned = fb_mvp.is_pinned;
                merged
            } else {
                fb_mvp.clone()
            }
        })
        .collect()
}

fn extract_sse_data(event_str: &str) -> Option<&str> {
    for line in event_str.lines() {
        if let Some(data) = line.strip_prefix("data:") {
            let trimmed = data.trim();
            if !trimmed.is_empty() {
                return Some(trimmed);
            }
        }
    }
    None
}

fn parse_firebase_sse_data(data: &str) -> Option<Vec<Mvp>> {
    use super::client::FirebaseMvp;
    // Try direct array parse
    if let Ok(fb_mvps) = serde_json::from_str::<Vec<FirebaseMvp>>(data) {
        return Some(fb_mvps.iter().map(from_firebase).collect());
    }
    // Try wrapped {"path":..., "data": [...]}
    if let Ok(wrapped) = serde_json::from_str::<serde_json::Value>(data) {
        if let Some(inner) = wrapped.get("data") {
            if let Some(arr) = inner.as_array() {
                let fb_mvps: Vec<FirebaseMvp> =
                    serde_json::from_value(serde_json::Value::Array(arr.clone()))
                        .unwrap_or_default();
                return Some(fb_mvps.iter().map(from_firebase).collect());
            }
        }
    }
    None
}
