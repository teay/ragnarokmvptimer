use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

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
