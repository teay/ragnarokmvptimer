// Firebase REST API client - Phase 2
// Will use reqwest to interact with Firebase Realtime Database REST API

pub struct FirebaseClient {
    pub base_url: String,
    pub auth_token: Option<String>,
}

impl FirebaseClient {
    pub fn new(project_id: &str) -> Self {
        Self {
            base_url: format!(
                "https://{}.firebaseio.com",
                project_id
            ),
            auth_token: None,
        }
    }
}
