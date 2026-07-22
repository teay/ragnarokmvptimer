use std::sync::Arc;
use std::sync::Mutex as StdMutex;
use futures_util::StreamExt;

use crate::data::mvp::Mvp;
use super::client::{FirebaseClient, from_firebase, get_firebase_path};

pub struct FirebaseSync {
    pub client: FirebaseClient,
    pub path: String,
    pub nickname: String,
}

impl FirebaseSync {
    pub fn new(
        database_url: &str,
        nickname: &str,
        server: &str,
        party_room: Option<&str>,
    ) -> Self {
        let path = get_firebase_path(nickname, server, party_room);
        Self {
            client: FirebaseClient::new(database_url),
            path,
            nickname: nickname.to_string(),
        }
    }

    pub fn update_path(&mut self, nickname: &str, server: &str, party_room: Option<&str>) {
        self.path = get_firebase_path(nickname, server, party_room);
        self.nickname = nickname.to_string();
    }

    pub async fn pull(&self) -> Result<Vec<Mvp>, String> {
        let fb_mvps = self.client.read_all(&self.path).await?;
        Ok(fb_mvps.iter().map(from_firebase).collect())
    }

    pub async fn push_one(&self, mvp: &Mvp) -> Result<(), String> {
        self.client.write_mvp(&self.path, mvp, &self.nickname).await
    }

    pub async fn push_all(&self, mvps: &[Mvp]) -> Result<(), String> {
        self.client.patch_mvps(&self.path, mvps, &self.nickname).await
    }

    pub async fn remove_one(&self, id: u32, death_map: Option<&str>) -> Result<(), String> {
        self.client.delete_mvp(&self.path, id, death_map).await
    }

    pub async fn remove_all(&self) -> Result<(), String> {
        self.client.delete_all(&self.path).await
    }

    pub fn pull_blocking(&self) -> Result<Vec<Mvp>, String> {
        let fb_mvps = self.client.read_all_blocking(&self.path)?;
        Ok(fb_mvps.iter().map(from_firebase).collect())
    }

    pub fn push_one_blocking(&self, mvp: &Mvp) -> Result<(), String> {
        self.client.write_mvp_blocking(&self.path, mvp, &self.nickname)
    }

    pub async fn subscribe<F>(self, poll_data: Arc<StdMutex<Option<Vec<Mvp>>>>, add_log: F)
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        loop {
            add_log(format!("Firebase SSE: connecting to {}", &self.path));
            match self.client.open_stream(&self.path).await {
                Ok(response) => {
                    add_log("Firebase SSE: connected".into());
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
                                    if let Some(d) = extract_sse_data(&event_str) {
                                        if d == "null" || d.is_empty() { continue; }
                                        if let Some(m) = parse_firebase_sse_data(d) {
                                            if let Ok(mut g) = poll_data.lock() {
                                                *g = Some(m);
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
                    add_log(if saw_data {
                        "Firebase SSE: disconnected, reconnecting...".into()
                    } else {
                        "Firebase SSE: disconnected before any data".into()
                    });
                }
                Err(e) => add_log(format!("Firebase SSE: connection failed: {}", e)),
            }
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
    }
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
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(data) {
        let inner = if let Some(obj) = value.as_object() {
            if let Some(data_val) = obj.get("data") {
                data_val
            } else {
                &value
            }
        } else {
            &value
        };
        if let Ok(arr) = serde_json::from_value::<Vec<FirebaseMvp>>(inner.clone()) {
            return Some(arr.iter().map(from_firebase).collect());
        }
        if let Ok(map) = serde_json::from_value::<std::collections::HashMap<String, FirebaseMvp>>(inner.clone()) {
            return Some(map.into_values().map(|fb| from_firebase(&fb)).collect());
        }
        if let Ok(single) = serde_json::from_value::<FirebaseMvp>(inner.clone()) {
            return Some(vec![from_firebase(&single)]);
        }
    }
    None
}
