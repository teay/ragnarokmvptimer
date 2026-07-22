use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use chrono::{Datelike, Timelike, TimeZone};
use eframe::egui::{self, Color32, Frame, Margin, CornerRadius, Stroke, RichText, Context, TextureHandle};
use image::codecs::gif::GifDecoder;
use image::codecs::png::PngDecoder;
use image::AnimationDecoder;

use crate::core::rehydrate::rehydrate_mvps;
use crate::core::sort::sort_mvps_by_respawn_time;
use crate::core::timer::{format_time, get_respawn_eta, has_respawned, get_mvp_respawn_window};
use crate::data::mvp::Mvp;
use crate::data::settings::{Settings, SERVERS, DEFAULT_SERVER};
use crate::firebase::client::FirebaseClient;
use crate::firebase::sync::FirebaseSync;

#[derive(Clone, Copy, PartialEq)]
enum ActiveTab {
    Active,
    Wait,
    All,
}

struct AnimatedSprite {
    frame_keys: Vec<String>,
    delays_ms: Vec<u32>,
    current: usize,
    last_switch_ms: i64,
}

pub struct MvpTimerApp {
    original_all_mvps: Vec<Mvp>,
    active_mvps: Vec<Mvp>,
    all_mvps: Vec<Mvp>,
    settings: Settings,
    server_data_cache: HashMap<String, Vec<Mvp>>,
    firebase_sync: Option<FirebaseSync>,
    firebase_log: Vec<String>,
    show_settings: bool,
    show_profile: bool,
    tab: ActiveTab,
    search_query: String,
    now_ms: i64,
    nickname_input: String,
    party_input: String,
    edit_mvp_index: Option<usize>,
    textures: HashMap<String, TextureHandle>,
    animations: HashMap<String, AnimatedSprite>,
    asset_dir: PathBuf,
    icon_max_size: (f32, f32),
    map_max_size: (f32, f32),
    icon_pixel_sizes: HashMap<u32, (f32, f32)>,
    profile_focus_requested: bool,
    notified_respawns: HashSet<String>,
    marker_mode_mvp: Option<(usize, String, f64, f64)>,
    sse_poll_data: Arc<Mutex<Option<Vec<Mvp>>>>,
    sse_started: bool,
}

impl Default for MvpTimerApp {
    fn default() -> Self {
        let settings = Settings::default();
        let asset_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));
        let mut app = Self {
            original_all_mvps: vec![],
            active_mvps: vec![],
            all_mvps: vec![],
            settings,
            server_data_cache: HashMap::new(),
            firebase_sync: None,
            firebase_log: vec![],
            show_settings: false,
            show_profile: false,
            tab: ActiveTab::Active,
            search_query: String::new(),
            now_ms: 0,
            nickname_input: String::new(),
            party_input: String::new(),
            edit_mvp_index: None,
            textures: HashMap::new(),
            animations: HashMap::new(),
            asset_dir: asset_dir.clone(),
            icon_max_size: (80.0, 80.0),
            map_max_size: (200.0, 100.0),
            icon_pixel_sizes: HashMap::new(),
            profile_focus_requested: false,
            notified_respawns: HashSet::new(),
            marker_mode_mvp: None,
            sse_poll_data: Arc::new(Mutex::new(None)),
            sse_started: false,
        };
        app.compute_max_image_sizes(&asset_dir);
        app.load_server_data();
        app
    }
}

impl MvpTimerApp {
    fn exe_dir(&self) -> &PathBuf {
        &self.asset_dir
    }

    fn compute_max_image_sizes(&mut self, asset_dir: &PathBuf) {
        let icon_dir = asset_dir.join("assets/icons");
        let map_dir = asset_dir.join("assets/maps");
        let mut max_icon_w = 80.0_f32;
        let mut max_icon_h = 80.0_f32;
        let mut max_map_w = 200.0_f32;
        let mut max_map_h = 100.0_f32;
        if let Ok(entries) = std::fs::read_dir(&icon_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.extension().and_then(|e| e.to_str()) != Some("png") { continue; }
                let fname = p.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                if let Ok(id) = fname.parse::<u32>() {
                    if let Ok(data) = std::fs::read(&p) {
                        if let Ok(img) = image::load_from_memory(&data) {
                            let (w, h) = (img.width() as f32, img.height() as f32);
                            self.icon_pixel_sizes.entry(id).or_insert((w, h));
                            max_icon_w = max_icon_w.max(w);
                            max_icon_h = max_icon_h.max(h);
                        }
                    }
                }
            }
        }
        if let Ok(entries) = std::fs::read_dir(&map_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.extension().and_then(|e| e.to_str()) != Some("png") { continue; }
                if p.to_string_lossy().contains("_raw") { continue; }
                if let Ok(data) = std::fs::read(&p) {
                    if let Ok(img) = image::load_from_memory(&data) {
                        max_map_w = max_map_w.max(img.width() as f32);
                        max_map_h = max_map_h.max(img.height() as f32);
                    }
                }
            }
        }
        log::warn!("Max image sizes — icon: {}x{}, map: {}x{} ({} icons scanned)", max_icon_w, max_icon_h, max_map_w, max_map_h, self.icon_pixel_sizes.len());
        self.icon_max_size = (max_icon_w, max_icon_h);
        self.map_max_size = (max_map_w, max_map_h);
    }

    fn load_texture(&mut self, ctx: &Context, key: &str, path: &PathBuf) -> Option<TextureHandle> {
        if let Some(t) = self.textures.get(key) {
            return Some(t.clone());
        }
        let data = match std::fs::read(path) {
            Ok(d) => d,
            Err(e) => {
                log::warn!("Failed to read texture file: {:?} error: {}", path, e);
                return None;
            }
        };
        match image::load_from_memory(&data) {
            Ok(img) => {
                let rgba = img.to_rgba8();
                let (w, h) = rgba.dimensions();
                let color_image = egui::ColorImage::from_rgba_unmultiplied([w as _, h as _], &rgba);
                let handle = ctx.load_texture(key, color_image, egui::TextureOptions::LINEAR);
                self.textures.insert(key.to_string(), handle.clone());
                log::warn!("Loaded texture: {:?} ({}x{})", path, w, h);
                Some(handle)
            }
            Err(e) => {
                log::warn!("Failed to decode image: {:?} error: {}", path, e);
                None
            }
        }
    }

    fn load_icon_texture(&mut self, ctx: &Context, mvp_id: u32) -> Option<TextureHandle> {
        let key = format!("icon/{}", mvp_id);
        if let Some(t) = self.textures.get(&key) {
            return Some(t.clone());
        }
        let icon_dir = self.exe_dir().join("assets/icons");
        let path = icon_dir.join(format!("{}.png", mvp_id));
        self.load_texture(ctx, &key, &path)
    }

    fn load_animated_icon(&mut self, ctx: &Context, mvp_id: u32) -> Option<TextureHandle> {
        let anim_key = format!("anim/{}", mvp_id);
        if let Some(anim) = self.animations.get(&anim_key) {
            return self.textures.get(&anim.frame_keys[anim.current]).cloned();
        }
        let icons_dir = self.exe_dir().join("assets/icons");

        let apng_path = icons_dir.join("anim").join(format!("{}.png", mvp_id));
        if apng_path.exists() {
            log::warn!("APNG file exists: {:?}", apng_path);
            match self.try_load_apng(ctx, &anim_key, &apng_path) {
                Some(anim) => {
                    log::warn!("APNG loaded OK: {} frames", anim.frame_keys.len());
                    self.animations.insert(anim_key, anim);
                    return self.load_animated_icon(ctx, mvp_id);
                }
                None => log::warn!("APNG load FAILED for {:?}", apng_path),
            }
        }
        let gif_path = icons_dir.join(format!("{}.gif", mvp_id));
        if gif_path.exists() {
            log::warn!("GIF file exists: {:?}", gif_path);
            if let Some(anim) = self.try_load_gif(ctx, &anim_key, &gif_path) {
                log::warn!("GIF loaded OK: {} frames", anim.frame_keys.len());
                self.animations.insert(anim_key, anim);
                return self.load_animated_icon(ctx, mvp_id);
            }
        }
        log::warn!("No animation for MVP {}, using static PNG", mvp_id);
        self.load_icon_texture(ctx, mvp_id)
    }

    fn try_load_gif(&mut self, ctx: &Context, anim_key: &str, path: &PathBuf) -> Option<AnimatedSprite> {
        let file = std::fs::File::open(path).ok()?;
        let decoder = GifDecoder::new(std::io::BufReader::new(file)).ok()?;
        let frames = decoder.into_frames().collect_frames().ok()?;
        if frames.is_empty() { return None; }
        Some(self.decode_frames_to_anim(ctx, anim_key, &frames))
    }

    fn try_load_apng(&mut self, ctx: &Context, anim_key: &str, path: &PathBuf) -> Option<AnimatedSprite> {
        let file = std::fs::File::open(path).ok()?;
        let decoder = PngDecoder::new(std::io::BufReader::new(file)).ok()?;
        let apng = decoder.apng().ok()?;
        let frames = apng.into_frames().collect_frames().ok()?;
        if frames.is_empty() { return None; }
        Some(self.decode_frames_to_anim(ctx, anim_key, &frames))
    }

    fn decode_frames_to_anim(&mut self, ctx: &Context, anim_key: &str, frames: &[image::Frame]) -> AnimatedSprite {
        let mut anim = AnimatedSprite {
            frame_keys: Vec::with_capacity(frames.len()),
            delays_ms: Vec::with_capacity(frames.len()),
            current: 0,
            last_switch_ms: self.now_ms,
        };
        for (i, frame) in frames.iter().enumerate() {
            let (num, den) = frame.delay().numer_denom_ms();
            let delay_ms = if den > 0 { (num / den).max(1) } else { 100 };
            anim.delays_ms.push(delay_ms);
            let tex_key = format!("{}/{}", anim_key, i);
            anim.frame_keys.push(tex_key.clone());
            let buffer = frame.buffer();
            let rgba = buffer.as_raw();
            let (w, h) = buffer.dimensions();
            let color_image = egui::ColorImage::from_rgba_unmultiplied([w as _, h as _], rgba);
            let handle = ctx.load_texture(&tex_key, color_image, egui::TextureOptions::LINEAR);
            self.textures.insert(tex_key, handle);
        }
        anim
    }

    fn load_map_texture(&mut self, ctx: &Context, mapname: &str) -> Option<TextureHandle> {
        let key = format!("map/{}", mapname);
        if let Some(t) = self.textures.get(&key) {
            return Some(t.clone());
        }
        let map_dir = self.exe_dir().join("assets/maps");
        let path = map_dir.join(format!("{}.png", mapname));
        self.load_texture(ctx, &key, &path)
    }

    fn load_server_data(&mut self) {
        let server = if self.settings.server.is_empty() {
            DEFAULT_SERVER
        } else {
            &self.settings.server
        };
        if !self.server_data_cache.contains_key(server) {
            let path = self.exe_dir().join("data").join(format!("{}.json", server));
            if let Ok(data) = std::fs::read_to_string(&path) {
                if let Ok(mvps) = serde_json::from_str::<Vec<Mvp>>(&data) {
                    self.server_data_cache.insert(server.to_string(), mvps);
                }
            }
        }
        if let Some(mvps) = self.server_data_cache.get(server) {
            self.original_all_mvps = mvps.clone();
            self.rebuild_all_mvps();
        }
    }

    fn rebuild_all_mvps(&mut self) {
        let active_ids: Vec<(u32, Option<String>)> = self.active_mvps
            .iter()
            .map(|m| (m.id, m.death_map.clone()))
            .collect();
        self.all_mvps = self.original_all_mvps
            .iter()
            .filter(|m| !active_ids.contains(&(m.id, None)))
            .cloned()
            .collect();
    }

    fn push_to_firebase(&self) {
        if let Some(ref sync) = self.firebase_sync {
            let mvps = self.active_mvps.clone();
            let nickname = sync.nickname.clone();
            let path = sync.path.clone();
            let client = FirebaseClient::new(&sync.client.database_url);
            tokio::spawn(async move {
                let updates: HashMap<String, crate::firebase::client::FirebaseMvp> = mvps
                    .iter()
                    .map(|m| {
                        let key = format!("{}-{}", m.id, m.death_map.as_deref().unwrap_or("unknown"));
                        (key, crate::firebase::client::to_firebase(m, &nickname))
                    })
                    .collect();
                let url = format!("{}{}.json", client.database_url, path);
                let _ = reqwest::Client::new()
                    .patch(&url)
                    .json(&updates)
                    .send()
                    .await;
            });
        }
    }

    fn clear_data(&self) {
        if let Some(ref sync) = self.firebase_sync {
            let url = format!("{}{}.json", sync.client.database_url, sync.path.trim_end_matches('/'));
            tokio::spawn(async move {
                let _ = reqwest::Client::new()
                    .delete(&url)
                    .send()
                    .await;
            });
        }
    }

    fn delete_from_firebase(&self, id: u32, death_map: Option<&str>) {
        if let Some(ref sync) = self.firebase_sync {
            let path = sync.path.clone();
            let key = format!("{}-{}", id, death_map.unwrap_or("unknown"));
            let url = format!("{}{}/{}.json", sync.client.database_url, path.trim_end_matches('/'), key);
            tokio::spawn(async move {
                let _ = reqwest::Client::new()
                    .delete(&url)
                    .send()
                    .await;
            });
        }
    }

    fn kill_mvp(&mut self, id: u32, death_map: Option<&str>, death_time: i64) {
        if let Some(idx) = self.active_mvps.iter().position(|m| m.id == id && m.death_map.as_deref() == death_map) {
            self.clear_notification(id, death_map);
            self.active_mvps[idx].death_time = Some(death_time);
            self.active_mvps[idx].is_pinned = false;
        } else if let Some(idx) = self.original_all_mvps.iter().position(|m| m.id == id) {
            let mut mvp = self.original_all_mvps[idx].clone();
            mvp.death_time = Some(death_time);
            mvp.death_map = death_map.map(|s| s.to_string());
            self.active_mvps.push(mvp);
        }
        sort_mvps_by_respawn_time(&mut self.active_mvps);
        self.rebuild_all_mvps();
        self.push_to_firebase();
    }

    fn clear_notification(&mut self, id: u32, death_map: Option<&str>) {
        self.notified_respawns.remove(&format!("{}-{}", id, death_map.unwrap_or("unknown")));
    }

    fn edit_mvp_time(&mut self, index: usize, death_time: i64) {
        if index < self.active_mvps.len() {
            self.active_mvps[index].death_time = Some(death_time);
            sort_mvps_by_respawn_time(&mut self.active_mvps);
            self.push_to_firebase();
        }
    }

    fn remove_mvp(&mut self, index: usize) {
        if index < self.active_mvps.len() {
            let id = self.active_mvps[index].id;
            let map = self.active_mvps[index].death_map.as_deref().map(|s| s.to_string());
            self.clear_notification(id, map.as_deref());
            self.delete_from_firebase(id, map.as_deref());
            self.active_mvps.remove(index);
            self.rebuild_all_mvps();
        }
    }

    fn add_to_wait(&mut self, mvp: &Mvp) {
        let mut wait_mvp = mvp.clone();
        wait_mvp.death_time = None;
        wait_mvp.is_pinned = true;
        self.active_mvps.push(wait_mvp);
        self.rebuild_all_mvps();
        self.push_to_firebase();
    }

    fn remove_from_wait(&mut self, index: usize) {
        if index < self.active_mvps.len() {
            let id = self.active_mvps[index].id;
            let map = self.active_mvps[index].death_map.as_deref().map(|s| s.to_string());
            self.clear_notification(id, map.as_deref());
            self.delete_from_firebase(id, map.as_deref());
            self.active_mvps.remove(index);
            self.rebuild_all_mvps();
        }
    }

    fn move_to_wait(&mut self, index: usize) {
        if index < self.active_mvps.len() {
            self.active_mvps[index].death_time = None;
            self.active_mvps[index].is_pinned = true;
            self.push_to_firebase();
        }
    }

    fn set_nickname(&mut self, nickname: &str) {
        let nickname = sanitize_nickname(nickname);
        if nickname.is_empty() {
            self.firebase_sync = None;
            return;
        }
        self.settings.nickname = nickname;
        self.init_firebase();
    }

    fn set_party_room(&mut self, room: &str) {
        let room = sanitize_nickname(room);
        self.settings.party_room = if room.is_empty() { None } else { Some(room) };
        self.init_firebase();
    }

    fn init_firebase(&mut self) {
        if self.settings.nickname.is_empty() { return; }
        let db_url = std::env::var("VITE_FIREBASE_DATABASE_URL")
            .unwrap_or_else(|_| "https://ragnarokmvptimer-default-rtdb.firebaseio.com".to_string());
        let server = if self.settings.server.is_empty() { DEFAULT_SERVER.to_string() } else { self.settings.server.clone() };
        let nick = self.settings.nickname.clone();
        let party = self.settings.party_room.clone();
        self.firebase_sync = Some(FirebaseSync::new(
            &db_url,
            &nick,
            &server,
            party.as_deref(),
        ));
        self.pull_from_firebase();

        // ── Spawn SSE subscribe ──
        if !self.sse_started {
            self.sse_started = true;
            let poll_data = self.sse_poll_data.clone();
            let path = crate::firebase::client::get_firebase_path(&nick, &server, party.as_deref());
            let url = db_url.clone();
            tokio::spawn(async move {
                let client = crate::firebase::client::FirebaseClient::new(&url);
                let sse_sync = crate::firebase::sync::FirebaseSync {
                    client,
                    path,
                    nickname: String::new(),
                };
                sse_sync.subscribe(poll_data, |msg| {
                    log::warn!("SSE: {}", msg);
                }).await;
            });
        }
    }

    fn pull_from_firebase(&mut self) {
        if let Some(ref sync) = self.firebase_sync {
            match sync.pull_blocking() {
                Ok(remote) => {
                    let rehydrated = rehydrate_mvps(&remote, &self.original_all_mvps);
                    self.active_mvps = rehydrated;
                    sort_mvps_by_respawn_time(&mut self.active_mvps);
                    self.rebuild_all_mvps();
                    self.firebase_log.push(format!("Pulled {} MVPs from Firebase", remote.len()));
                }
                Err(e) => {
                    self.firebase_log.push(format!("Pull failed: {}", e));
                }
            }
        }
    }

    fn render_card(&mut self, ui: &mut egui::Ui, ctx: &Context, orig_idx: usize, mvp: &Mvp) {
        let mvp_id = mvp.id;
        let death_map = mvp.death_map.clone();
        let name = mvp.name.clone();
        let eta = get_respawn_eta(mvp);
        let has_resp = has_respawned(mvp, self.now_ms);
        let resp_window = get_mvp_respawn_window(mvp);
        let icon = if self.settings.animated_sprites {
            self.load_animated_icon(ctx, mvp_id)
        } else {
            self.load_icon_texture(ctx, mvp_id)
        };
        let map_label = death_map.as_deref()
            .map(|m| m.to_string())
            .or_else(|| {
                let maps: Vec<&str> = mvp.spawn.iter().map(|s| s.mapname.as_str()).collect();
                if maps.is_empty() { None } else { Some(maps.join(", ")) }
            });
        let first_map = death_map.as_deref()
            .or_else(|| mvp.spawn.first().map(|s| s.mapname.as_str()));
        let map_tx = if self.settings.show_mvp_map {
            first_map.and_then(|m| self.load_map_texture(ctx, m))
        } else {
            None
        };

        let in_active = matches!(self.tab, ActiveTab::Active);
        let in_wait = matches!(self.tab, ActiveTab::Wait);

        let card_frame = Frame::NONE
            .fill(Color32::from_rgb(30, 30, 40))
            .stroke(Stroke::new(1.0_f32, Color32::from_rgb(60, 60, 80)))
            .corner_radius(CornerRadius::same(8))
            .inner_margin(Margin::same(10));

        card_frame.show(ui, |ui| {
            let cw = ui.available_width();

            // 1. Header (18px fixed)
            ui.allocate_ui_with_layout(
                egui::vec2(cw, 18.0),
                egui::Layout::left_to_right(egui::Align::Center),
                |ui| {
                    ui.label(RichText::new(format!("(({}))", mvp_id)).size(11.0).color(Color32::from_rgb(140, 140, 160)));
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        if in_active {
                            if let Some(dt) = mvp.death_time {
                                let formatted = chrono::DateTime::from_timestamp_millis(dt)
                                    .map(|d| d.format("%d/%m %H:%M").to_string())
                                    .unwrap_or_default();
                                ui.label(RichText::new(formatted).size(10.0).color(Color32::GRAY));
                            }
                        }
                    });
                },
            );

            // 2. Name (24px fixed)
            ui.allocate_ui_with_layout(
                egui::vec2(cw, 24.0),
                egui::Layout::top_down(egui::Align::Center),
                |ui| {
                    ui.label(RichText::new(&name).size(16.0).strong().color(Color32::from_rgb(230, 230, 240)));
                },
            );

            // 3. Sprite (webapp-style: fixed height = 100px, width auto-proportional)
            let sprite_h = 100.0;
            let sprite_display = self.icon_pixel_sizes.get(&mvp_id).map(|(pw, ph)| {
                let w = (pw / ph) * sprite_h;
                (w, sprite_h)
            });
            ui.allocate_ui_with_layout(
                egui::vec2(cw, sprite_h),
                egui::Layout::top_down(egui::Align::Center),
                |ui| {
                    if let Some(tx) = &icon {
                        if let Some((sw, sh)) = sprite_display {
                            ui.add(egui::Image::from_texture(tx).fit_to_exact_size(egui::vec2(sw, sh)));
                        } else {
                            ui.add(egui::Image::from_texture(tx).max_size(egui::vec2(cw, sprite_h)));
                        }
                    }
                },
            );

            // 4. Timer / Pinned (22px fixed, always allocated)
            ui.allocate_ui_with_layout(
                egui::vec2(cw, 22.0),
                egui::Layout::top_down(egui::Align::Center),
                |ui| {
                    if in_active {
                        if let Some(eta_val) = eta {
                            let remaining = eta_val - self.now_ms;
                            if remaining > 0 {
                                ui.label(RichText::new(format!("⏳ {}", format_time(remaining))).size(18.0).strong().color(Color32::from_rgb(255, 200, 100)));
                            } else if !has_resp {
                                let end = eta_val + resp_window as i64;
                                let rem = end - self.now_ms;
                                ui.label(RichText::new(format!("⚡ {}", format_time(rem))).size(16.0).strong().color(Color32::from_rgb(255, 150, 100)));
                            } else {
                                ui.label(RichText::new("✅ Respawned").size(16.0).strong().color(Color32::GREEN));
                            }
                        }
                    } else if in_wait {
                        ui.label(RichText::new("📌 Pinned").size(16.0).strong().color(Color32::from_rgb(200, 200, 100)));
                    }
                },
            );

            // 5. Map name (18px fixed)
            ui.allocate_ui_with_layout(
                egui::vec2(cw, 18.0),
                egui::Layout::top_down(egui::Align::Center),
                |ui| {
                    if let Some(ref mn) = map_label {
                        ui.label(RichText::new(format!("Map: {}", mn)).size(13.0).color(Color32::from_rgb(100, 180, 255)));
                    }
                },
            );

            // 6. Map preview (fixed max-map size, clickable for marker)
            let map_max_h = self.map_max_size.1;
            let map_h = map_max_h.min(120.0);
            ui.allocate_ui_with_layout(
                egui::vec2(cw, map_h),
                egui::Layout::top_down(egui::Align::Center),
                |ui| {
                    if let Some(mtx) = &map_tx {
                        let resp = ui.add(egui::Image::from_texture(mtx).max_size(egui::vec2(cw, map_h)).sense(egui::Sense::click()));
                        let has_marker = mvp.death_position.as_ref().map(|p| p.x >= 0.0 && p.y >= 0.0).unwrap_or(false);
                        if has_marker {
                            if let Some(pos) = &mvp.death_position {
                                ui.label(RichText::new(format!("📍 ({}, {})", pos.x as i32, pos.y as i32)).size(10.0).color(Color32::from_rgb(255, 200, 100)));
                            }
                        }
                        if resp.clicked() {
                            if let Some(ref m) = first_map {
                                self.marker_mode_mvp = Some((orig_idx, m.to_string(), 0.0, 0.0));
                            }
                        }
                    }
                },
            );

            // Push buttons to bottom then render
            let has_btns = in_active || in_wait;
            let btn_section_h: f32 = if has_btns {
                6.0 + 32.0 + 4.0 + 40.0
            } else {
                6.0 + 32.0
            };
            let remaining = ui.available_height();
            if remaining > btn_section_h {
                ui.add_space((remaining - btn_section_h) * 0.5);
            }

            ui.add_space(6.0);
            if has_btns {
                ui.with_layout(egui::Layout::top_down(egui::Align::Center), |ui| {
                    if button_colored(ui, "Killed Now", Color32::from_rgb(139, 90, 43)).clicked() {
                        self.kill_mvp(mvp_id, death_map.as_deref(), self.now_ms);
                    }
                });
                egui::Frame::group(ui.style()).inner_margin(Margin::symmetric(0, 4)).show(ui, |ui| {
                    ui.horizontal(|ui| {
                        if button_colored(ui, "Edit", Color32::from_rgb(74, 74, 74)).clicked() {
                            self.edit_mvp_index = Some(orig_idx);
                        }
                        if in_active {
                            if button_colored(ui, "RMV", Color32::from_rgb(179, 58, 58)).clicked() {
                                self.remove_mvp(orig_idx);
                            }
                            if button_colored(ui, "BACK", Color32::from_rgb(214, 90, 90)).clicked() {
                                self.move_to_wait(orig_idx);
                            }
                        } else {
                            if button_colored(ui, "RMV", Color32::from_rgb(179, 58, 58)).clicked() {
                                self.remove_from_wait(orig_idx);
                            }
                            if button_colored(ui, "CANCEL", Color32::from_rgb(214, 90, 90)).clicked() {
                                self.remove_from_wait(orig_idx);
                            }
                        }
                    });
                });
            } else {
                ui.with_layout(egui::Layout::top_down(egui::Align::Center), |ui| {
                    if button_colored(ui, "Select to kill", Color32::from_rgb(139, 90, 43)).clicked() {
                        self.add_to_wait(mvp);
                    }
                });
            }
        });
    }
}

impl eframe::App for MvpTimerApp {
    fn update(&mut self, ctx: &Context, _frame: &mut eframe::Frame) {
        self.now_ms = chrono::Utc::now().timestamp_millis();

        // ── SSE real-time poll ──
        let sse_data = self.sse_poll_data.lock().ok().and_then(|mut g| g.take());
        if let Some(remote_data) = sse_data {
            let rehydrated = crate::core::rehydrate::rehydrate_mvps(&remote_data, &self.original_all_mvps);
            self.active_mvps = rehydrated;
            crate::core::sort::sort_mvps_by_respawn_time(&mut self.active_mvps);
            self.rebuild_all_mvps();
            self.firebase_log.push("SSE: received update".into());
        }

        // ── Top bar ──
        egui::TopBottomPanel::top("header").show(ctx, |ui| {
            let nickname = self.settings.nickname.clone();
            let party_room = self.settings.party_room.clone();
            let mut show_s = self.show_settings;
            let mut show_p = self.show_profile;

            ui.horizontal(|ui| {
                ui.heading("Ragnarok MVP Timer");
                ui.separator();
                if nickname.is_empty() {
                    ui.label(RichText::new("[Local]").color(Color32::YELLOW));
                } else if party_room.is_some() {
                    let party = party_room.unwrap_or_default();
                    ui.label(RichText::new(format!("[Party: {}] — {}", party, nickname)).color(Color32::GREEN));
                } else {
                    ui.label(RichText::new(format!("[Solo: {}]", nickname)).color(Color32::GREEN));
                }
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.button("⚙").clicked() { show_s = !show_s; }
                    if ui.button("👤").clicked() { show_p = !show_p; if show_p { self.profile_focus_requested = true; } }
                });
            });
            self.show_settings = show_s;
            self.show_profile = show_p;
        });

        // ── Notification check (respawned MVPs) ──
        if self.settings.notification_sound {
            for mvp in &self.active_mvps {
                if mvp.death_time.is_some() {
                    let key = format!("{}-{}", mvp.id, mvp.death_map.as_deref().unwrap_or("unknown"));
                    if !self.notified_respawns.contains(&key) && crate::core::timer::has_respawned(mvp, self.now_ms) {
                        let map = mvp.death_map.as_deref().unwrap_or("unknown");
                        notify_rust::Notification::new()
                            .summary("MVP Respawned!")
                            .body(&format!("{} has respawned on {}", mvp.name, map))
                            .appname("Ragnarok MVP Timer")
                            .timeout(notify_rust::Timeout::Milliseconds(8000))
                            .show()
                            .ok();
                        self.notified_respawns.insert(key);
                    }
                }
            }
        }

        // ── Settings modal ──
        if self.show_settings {
            let current_server = self.settings.server.clone();
            let mut new_server = current_server.clone();
            let mut use_24h = self.settings.use_24_hour_format;
            let mut show_map = self.settings.show_mvp_map;
            let mut anim = self.settings.animated_sprites;
            let mut sound = self.settings.notification_sound;
            let mut changed = false;
            let mut clear = false;

            egui::Window::new("Settings")
                .open(&mut self.show_settings)
                .show(ctx, |ui| {
                    egui::ComboBox::from_label("Server")
                        .selected_text(&new_server)
                        .show_ui(ui, |ui| {
                            for srv in SERVERS {
                                if ui.selectable_label(new_server == *srv, *srv).clicked() {
                                    new_server = srv.to_string();
                                    changed = true;
                                }
                            }
                        });
                    if ui.checkbox(&mut use_24h, "24-hour format").changed() { changed = true; }
                    if ui.checkbox(&mut show_map, "Show MVP map").changed() { changed = true; }
                    if ui.checkbox(&mut anim, "Animated sprites").changed() { changed = true; }
                    if ui.checkbox(&mut sound, "Notification sound").changed() { changed = true; }
                    ui.separator();
                    if ui.button(RichText::new("🗑 Clear Data").color(Color32::from_rgb(255, 100, 100)).strong()).clicked() {
                        clear = true;
                    }
                });

            if clear {
                self.clear_data();
                self.active_mvps.clear();
                self.rebuild_all_mvps();
            }

            if changed {
                self.settings.server = new_server;
                self.settings.use_24_hour_format = use_24h;
                self.settings.show_mvp_map = show_map;
                let anim_changed = self.settings.animated_sprites != anim;
                self.settings.animated_sprites = anim;
                self.settings.notification_sound = sound;
                if anim_changed {
                    self.animations.clear();
                }
                self.load_server_data();
                self.pull_from_firebase();
            }
        }

        // ── Profile modal ──
        if self.show_profile {
            if self.nickname_input.is_empty() { self.nickname_input = self.settings.nickname.clone(); }
            if self.party_input.is_empty() { self.party_input = self.settings.party_room.clone().unwrap_or_default(); }
            let mut nickname_val = self.nickname_input.clone();
            let mut party_val = self.party_input.clone();
            let mut do_set_nick = false;
            let mut do_set_party = false;
            let mut close_profile = false;
            let focus_nick = self.profile_focus_requested;

            egui::Window::new("Profile & Party")
                .id(egui::Id::new("profile_window"))
                .open(&mut self.show_profile)
                .show(ctx, |ui| {
                    ui.horizontal(|ui| {
                        ui.label("Nickname:");
                        let nick_resp = ui.add(egui::TextEdit::singleline(&mut nickname_val)
                            .desired_width(200.0)
                            .hint_text("Enter nickname")
                            .id_source("nickname_field"));
                        if focus_nick {
                            nick_resp.request_focus();
                        }
                    });
                    ui.horizontal(|ui| {
                        ui.label("Party Room:");
                        ui.add(egui::TextEdit::singleline(&mut party_val)
                            .desired_width(200.0)
                            .hint_text("Optional")
                            .id_source("party_field"));
                    });
                    ui.add_space(8.0);
                    ui.horizontal(|ui| {
                        if ui.button("Save").clicked() {
                            do_set_nick = true;
                            do_set_party = true;
                            close_profile = true;
                        }
                        if ui.button("Logout").clicked() {
                            self.settings.nickname.clear();
                            self.settings.party_room = None;
                            self.firebase_sync = None;
                            self.active_mvps.clear();
                            self.nickname_input.clear();
                            self.party_input.clear();
                        }
                    });
                });

            let saved_nick = sanitize_nickname(&nickname_val);
            let saved_party = sanitize_nickname(&party_val);
            self.profile_focus_requested = false;
            if close_profile { self.show_profile = false; }
            self.nickname_input = saved_nick.clone();
            self.party_input = saved_party.clone();
            if do_set_nick {
                self.set_nickname(&saved_nick);
            }
            if do_set_party {
                self.set_party_room(&saved_party);
            }
        }

        // ── Central panel ──
        let active_count = self.active_mvps.iter().filter(|m| m.death_time.is_some()).count();
        let wait_count = self.active_mvps.iter().filter(|m| m.is_pinned && m.death_time.is_none()).count();
        let all_count = {
            let active_keys: HashSet<String> = self.active_mvps.iter()
                .map(|m| format!("{}-{}", m.id, m.death_map.as_deref().unwrap_or("unknown")))
                .collect();
            self.original_all_mvps.iter()
                .flat_map(|mvp| mvp.spawn.iter().map(move |s| (mvp.id, s)))
                .filter(|(id, s)| !active_keys.contains(&format!("{}-{}", id, s.mapname)))
                .count()
        };

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.tab, ActiveTab::Active, &format!("Active ({})", active_count));
                ui.selectable_value(&mut self.tab, ActiveTab::Wait, &format!("Wait for kill ({})", wait_count));
                ui.selectable_value(&mut self.tab, ActiveTab::All, &format!("All ({})", all_count));
            });
            ui.separator();

            ui.with_layout(egui::Layout::top_down(egui::Align::Center), |ui| {
                ui.horizontal(|ui| {
                    ui.label("Search:");
                    ui.add(egui::TextEdit::singleline(&mut self.search_query).desired_width(250.0));
                });
            });

            let display_mvps: Vec<(usize, Mvp)> = match self.tab {
                ActiveTab::Active => {
                    let mut list: Vec<(usize, Mvp)> = self.active_mvps.iter()
                        .enumerate()
                        .filter(|(_, m)| m.death_time.is_some())
                        .map(|(i, m)| (i, m.clone()))
                        .collect();
                    if !self.search_query.is_empty() {
                        let q = self.search_query.to_lowercase();
                        list.retain(|(_, m)| m.name.to_lowercase().contains(&q));
                    }
                    list.sort_by(|a, b| {
                        let eta_a = a.1.death_time.unwrap_or(0) + a.1.spawn.first().map(|s| s.respawn_time as i64).unwrap_or(0);
                        let eta_b = b.1.death_time.unwrap_or(0) + b.1.spawn.first().map(|s| s.respawn_time as i64).unwrap_or(0);
                        eta_a.cmp(&eta_b)
                    });
                    list
                }
                ActiveTab::Wait => {
                    let mut list: Vec<(usize, Mvp)> = self.active_mvps.iter()
                        .enumerate()
                        .filter(|(_, m)| m.is_pinned && m.death_time.is_none())
                        .map(|(i, m)| (i, m.clone()))
                        .collect();
                    if !self.search_query.is_empty() {
                        let q = self.search_query.to_lowercase();
                        list.retain(|(_, m)| m.name.to_lowercase().contains(&q));
                    }
                    list
                }
                ActiveTab::All => {
                    let active_keys: HashSet<String> = self.active_mvps.iter()
                        .map(|m| format!("{}-{}", m.id, m.death_map.as_deref().unwrap_or("unknown")))
                        .collect();
                    let mut list: Vec<(usize, Mvp)> = Vec::new();
                    for (idx, mvp) in self.original_all_mvps.iter().enumerate() {
                        for spawn in &mvp.spawn {
                            let key = format!("{}-{}", mvp.id, spawn.mapname);
                            if active_keys.contains(&key) {
                                continue;
                            }
                            let mut clone = mvp.clone();
                            clone.spawn = vec![spawn.clone()];
                            clone.death_map = Some(spawn.mapname.clone());
                            list.push((idx, clone));
                        }
                    }
                    if !self.search_query.is_empty() {
                        let q = self.search_query.to_lowercase();
                        list.retain(|(_, m)| m.name.to_lowercase().contains(&q));
                    }
                    list.sort_by(|a, b| a.1.name.cmp(&b.1.name));
                    list
                }
            };

            egui::ScrollArea::vertical().show(ui, |ui| {
                if display_mvps.is_empty() {
                    ui.label("No MVPs to display");
                    return;
                }

                let spacing = 8.0_f32;
                let card_h = 480.0_f32;
                let card_w = 222.0_f32;
                let avail_w = ui.available_width();
                let n_cols = ((avail_w + spacing) / (card_w + spacing)).floor().max(1.0) as usize;
                let n_cols = n_cols.min(10);
                let grid_w = n_cols as f32 * card_w + (n_cols - 1) as f32 * spacing;
                log::warn!("avail_w={:.0} n_cols={} grid_w={:.0} card_h={:.0}", avail_w, n_cols, grid_w, card_h);
                ui.with_layout(egui::Layout::top_down(egui::Align::Center), |ui| {
                    for chunk in display_mvps.chunks(n_cols) {
                        let _ = ui.allocate_ui_with_layout(
                            egui::vec2(grid_w, card_h),
                            egui::Layout::left_to_right(egui::Align::TOP),
                            |ui| {
                                for (orig_idx, mvp) in chunk {
                                    let _ = ui.allocate_ui_with_layout(
                                        egui::vec2(card_w, card_h),
                                        egui::Layout::top_down(egui::Align::LEFT),
                                        |ui| {
                                            self.render_card(ui, ctx, *orig_idx, mvp);
                                        },
                                    );
                                }
                            },
                        );
                        ui.add_space(4.0);
                    }
                });
            });
        });

        // ── Edit time window ──
        if let Some(idx) = self.edit_mvp_index {
            if idx < self.active_mvps.len() {
                let mvp_name = self.active_mvps[idx].name.clone();
                let death_time = self.active_mvps[idx].death_time.unwrap_or(self.now_ms);
                let mut window_open = true;
                let mut set_now = false;
                let mut saved_ms: Option<i64> = None;

                let dt = chrono::DateTime::from_timestamp_millis(death_time)
                    .map(|d| d.with_timezone(&chrono::Local))
                    .unwrap_or_else(|| chrono::Local::now());

                let mut year = dt.year();
                let mut month = dt.month();
                let mut day = dt.day();
                let mut hour = dt.hour();
                let mut minute = dt.minute();

                egui::Window::new(format!("Edit Death Time — {}", mvp_name))
                    .id(egui::Id::new("edit_time_window"))
                    .open(&mut window_open)
                    .resizable(false)
                    .show(ctx, |ui| {
                        ui.label(RichText::new("Set death time:").size(14.0).strong());
                        ui.add_space(6.0);

                        ui.horizontal(|ui| {
                            ui.label("Date:");
                            ui.add(egui::DragValue::new(&mut year).range(2020..=2030).speed(1).prefix("Y "));
                            ui.add(egui::DragValue::new(&mut month).range(1..=12).speed(1).prefix("M "));
                            ui.add(egui::DragValue::new(&mut day).range(1..=31).speed(1).prefix("D "));
                        });
                        ui.horizontal(|ui| {
                            ui.label("Time:");
                            ui.add(egui::DragValue::new(&mut hour).range(0..=23).speed(1).prefix("H "));
                            ui.add(egui::DragValue::new(&mut minute).range(0..=59).speed(1).prefix("M "));
                        });

                        ui.add_space(4.0);
                        let preview = format!("{:04}-{:02}-{:02} {:02}:{:02}", year, month, day, hour, minute);
                        ui.label(RichText::new(&preview).size(13.0).color(Color32::from_rgb(200, 200, 100)));

                        ui.add_space(8.0);
                        ui.horizontal(|ui| {
                            if ui.button("Now").clicked() {
                                set_now = true;
                            }
                            if ui.button("Save").clicked() {
                                saved_ms = Some(
                                    chrono::Local.with_ymd_and_hms(year, month, day, hour, minute, 0)
                                        .single()
                                        .map(|d| d.timestamp_millis())
                                        .unwrap_or(self.now_ms)
                                );
                            }
                        });
                    });

                if let Some(ms) = saved_ms {
                    self.edit_mvp_time(idx, ms);
                    self.edit_mvp_index = None;
                } else if set_now {
                    self.edit_mvp_time(idx, self.now_ms);
                    self.edit_mvp_index = None;
                } else if !window_open {
                    self.edit_mvp_index = None;
                }
            } else {
                self.edit_mvp_index = None;
            }
        }

        // ── Map marker modal ──
        if let Some((mk_idx, ref mk_map, _, _)) = self.marker_mode_mvp {
            if mk_idx < self.active_mvps.len() {
                let mut open = true;
                let map_name = mk_map.clone();
                let mvp_name = self.active_mvps[mk_idx].name.clone();
                egui::Window::new(format!("Set Marker — {}", mvp_name))
                    .id(egui::Id::new("marker_window"))
                    .open(&mut open)
                    .resizable(false)
                    .show(ctx, |ui| {
                        if let Some(map_tx) = self.load_map_texture(ctx, &map_name) {
                            let img_size = egui::vec2(400.0, 400.0);
                            let resp = ui.add(egui::Image::from_texture(&map_tx).fit_to_exact_size(img_size).sense(egui::Sense::click()));
                            if let Some(pos) = resp.interact_pointer_pos() {
                                let rect = resp.rect;
                                let rel_x = ((pos.x - rect.min.x) / rect.width() * 512.0) as f64;
                                let rel_y = ((pos.y - rect.min.y) / rect.height() * 512.0) as f64;
                                self.marker_mode_mvp = Some((mk_idx, map_name.clone(), rel_x, rel_y));
                            }
                            if let Some((_, _, ref mx, ref my)) = self.marker_mode_mvp {
                                if *mx >= 0.0 && *my >= 0.0 {
                                    ui.label(RichText::new(format!("Position: ({}, {})", mx.round() as i32, my.round() as i32)).size(14.0).color(Color32::from_rgb(200, 200, 100)));
                                }
                            }
                        }
                        ui.add_space(8.0);
                        ui.horizontal(|ui| {
                            if ui.button("Save Marker").clicked() {
                                if let Some((ref _idx, _, ref mx, ref my)) = self.marker_mode_mvp {
                                    if mk_idx < self.active_mvps.len() {
                                        self.active_mvps[mk_idx].death_position = Some(crate::data::mvp::MapMark { x: *mx, y: *my });
                                        self.push_to_firebase();
                                    }
                                }
                                self.marker_mode_mvp = None;
                            }
                            if ui.button("Cancel").clicked() {
                                self.marker_mode_mvp = None;
                            }
                        });
                    });
                if !open {
                    self.marker_mode_mvp = None;
                }
            } else {
                self.marker_mode_mvp = None;
            }
        }

        if self.settings.animated_sprites {
            for anim in self.animations.values_mut() {
                if anim.frame_keys.len() > 1 {
                    let elapsed = self.now_ms - anim.last_switch_ms;
                    if elapsed >= anim.delays_ms[anim.current] as i64 {
                        anim.current = (anim.current + 1) % anim.frame_keys.len();
                        anim.last_switch_ms = self.now_ms;
                    }
                }
            }
            ctx.request_repaint_after(std::time::Duration::from_millis(50));
        } else {
            ctx.request_repaint_after(std::time::Duration::from_millis(1000));
        }
    }
}

fn sanitize_nickname(s: &str) -> String {
    s.to_uppercase().chars().filter(|c| c.is_ascii_alphanumeric()).collect()
}

fn button_colored(ui: &mut egui::Ui, text: &str, color: Color32) -> egui::Response {
    let is_primary = text == "Killed Now" || text == "Select to kill";
    let w = if is_primary { 150.0 } else { 60.0 };
    let h = if is_primary { 32.0 } else { 28.0 };
    let font_size = if is_primary { 14.0 } else { 11.0 };
    let btn = egui::Button::new(RichText::new(text).size(font_size).color(Color32::WHITE).strong())
        .fill(color)
        .min_size(egui::vec2(w, h));
    ui.add(btn)
}
