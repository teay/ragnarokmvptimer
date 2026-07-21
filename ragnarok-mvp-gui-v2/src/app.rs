use std::collections::HashMap;
use std::path::PathBuf;

use eframe::egui::{self, Color32, Frame, Margin, CornerRadius, Stroke, RichText, Context, TextureHandle};

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
    asset_dir: PathBuf,
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
            asset_dir,
        };
        app.load_server_data();
        app
    }
}

impl MvpTimerApp {
    fn exe_dir(&self) -> &PathBuf {
        &self.asset_dir
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
        let nickname = nickname.trim().to_uppercase();
        if nickname.is_empty() {
            self.firebase_sync = None;
            return;
        }
        self.settings.nickname = nickname;
        self.init_firebase();
    }

    fn set_party_room(&mut self, room: &str) {
        let room = room.trim().to_uppercase();
        self.settings.party_room = if room.is_empty() { None } else { Some(room) };
        self.init_firebase();
    }

    fn init_firebase(&mut self) {
        if self.settings.nickname.is_empty() { return; }
        let db_url = std::env::var("VITE_FIREBASE_DATABASE_URL")
            .unwrap_or_else(|_| "https://ragnarokmvptimer-default-rtdb.firebaseio.com".to_string());
        let server = if self.settings.server.is_empty() { DEFAULT_SERVER } else { &self.settings.server };
        self.firebase_sync = Some(FirebaseSync::new(
            &db_url,
            &self.settings.nickname,
            server,
            self.settings.party_room.as_deref(),
        ));
        self.pull_from_firebase();
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
        let icon = self.load_icon_texture(ctx, mvp_id);
        let mapname = death_map.as_deref()
            .or_else(|| mvp.spawn.first().map(|s| s.mapname.as_str()));
        let map_tx = if self.settings.show_mvp_map {
            mapname.and_then(|m| self.load_map_texture(ctx, m))
        } else {
            None
        };

        let in_active = matches!(self.tab, ActiveTab::Active);
        let in_wait = matches!(self.tab, ActiveTab::Wait);

        let card_frame = Frame::NONE
            .fill(Color32::from_rgb(30, 30, 40))
            .stroke(Stroke::new(1.0, Color32::from_rgb(60, 60, 80)))
            .corner_radius(CornerRadius::same(8))
            .inner_margin(Margin::same(10));

        card_frame.show(ui, |ui| {
            ui.vertical_centered(|ui| {
                // Header: ID + kill time
                ui.horizontal(|ui| {
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
                });

                // Name
                ui.label(RichText::new(&name).size(16.0).strong().color(Color32::from_rgb(230, 230, 240)));

                // Sprite
                if let Some(tx) = &icon {
                    ui.add(egui::Image::from_texture(tx).max_height(80.0).max_width(80.0));
                }

                // Timer
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
                }
                if in_wait {
                    ui.label(RichText::new("📌 Pinned").size(16.0).strong().color(Color32::from_rgb(200, 200, 100)));
                }

                // Map name
                if let Some(mn) = mapname {
                    ui.label(RichText::new(format!("Map: {}", mn)).size(13.0).color(Color32::from_rgb(100, 180, 255)));
                }

                // Map preview
                if let Some(mtx) = &map_tx {
                    ui.add_space(4.0);
                    ui.add(egui::Image::from_texture(mtx).max_height(100.0));
                }

                // Push buttons to bottom for consistent position
                let has_btns = in_active || in_wait;
                let btn_section_h: f32 = if has_btns {
                    6.0 + 32.0 + 4.0 + 40.0
                } else {
                    6.0 + 32.0
                };
                let remaining = ui.available_height();
                if remaining > btn_section_h {
                    ui.add_space(remaining - btn_section_h);
                }

                ui.add_space(6.0);
                if has_btns {
                    if button_colored(ui, "Killed Now", Color32::from_rgb(139, 90, 43)).clicked() {
                        self.kill_mvp(mvp_id, death_map.as_deref(), self.now_ms);
                    }
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
                    if button_colored(ui, "Select to kill", Color32::from_rgb(139, 90, 43)).clicked() {
                        self.add_to_wait(mvp);
                    }
                }
            });
        });
    }
}

impl eframe::App for MvpTimerApp {
    fn update(&mut self, ctx: &Context, _frame: &mut eframe::Frame) {
        self.now_ms = chrono::Utc::now().timestamp_millis();

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
                    ui.label(RichText::new(format!("[Party: {}]", party_room.unwrap_or_default())).color(Color32::GREEN));
                } else {
                    ui.label(RichText::new(format!("[Solo: {}]", nickname)).color(Color32::GREEN));
                }
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.button("⚙").clicked() { show_s = !show_s; }
                    if ui.button("👤").clicked() { show_p = !show_p; }
                });
            });
            self.show_settings = show_s;
            self.show_profile = show_p;
        });

        // ── Settings modal ──
        if self.show_settings {
            let current_server = self.settings.server.clone();
            let mut new_server = current_server.clone();
            let mut use_24h = self.settings.use_24_hour_format;
            let mut show_map = self.settings.show_mvp_map;
            let mut anim = self.settings.animated_sprites;
            let mut sound = self.settings.notification_sound;
            let mut changed = false;

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
                });

            if changed {
                self.settings.server = new_server;
                self.settings.use_24_hour_format = use_24h;
                self.settings.show_mvp_map = show_map;
                self.settings.animated_sprites = anim;
                self.settings.notification_sound = sound;
                self.load_server_data();
                self.pull_from_firebase();
            }
        }

        // ── Profile modal ──
        if self.show_profile {
            let mut nickname_val = self.nickname_input.clone();
            let mut party_val = self.party_input.clone();
            let mut do_set_nick = false;
            let mut do_set_party = false;

            egui::Window::new("Profile & Party")
                .open(&mut self.show_profile)
                .show(ctx, |ui| {
                    ui.horizontal(|ui| {
                        ui.label("Nickname:");
                        if ui.text_edit_singleline(&mut nickname_val).lost_focus() {
                            do_set_nick = true;
                        }
                    });
                    ui.horizontal(|ui| {
                        ui.label("Party Room:");
                        if ui.text_edit_singleline(&mut party_val).lost_focus() {
                            do_set_party = true;
                        }
                    });
                    if ui.button("Logout").clicked() {
                        self.settings.nickname.clear();
                        self.settings.party_room = None;
                        self.firebase_sync = None;
                        self.active_mvps.clear();
                        self.nickname_input.clear();
                        self.party_input.clear();
                    }
                });

            if do_set_nick {
                self.nickname_input = nickname_val.clone();
                self.set_nickname(&nickname_val);
            }
            if do_set_party {
                self.party_input = party_val.clone();
                self.set_party_room(&party_val);
            }
        }

        // ── Central panel ──
        let active_count = self.active_mvps.iter().filter(|m| m.death_time.is_some()).count();
        let wait_count = self.active_mvps.iter().filter(|m| m.is_pinned && m.death_time.is_none()).count();
        let all_count = self.all_mvps.len();

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.tab, ActiveTab::Active, &format!("Active ({})", active_count));
                ui.selectable_value(&mut self.tab, ActiveTab::Wait, &format!("Wait for kill ({})", wait_count));
                ui.selectable_value(&mut self.tab, ActiveTab::All, &format!("All ({})", all_count));
            });
            ui.separator();

            if self.tab == ActiveTab::All {
                ui.horizontal(|ui| {
                    ui.label("Search:");
                    ui.text_edit_singleline(&mut self.search_query);
                });
            }

            let display_mvps: Vec<(usize, Mvp)> = match self.tab {
                ActiveTab::Active => {
                    let mut list: Vec<(usize, Mvp)> = self.active_mvps.iter()
                        .enumerate()
                        .filter(|(_, m)| m.death_time.is_some())
                        .map(|(i, m)| (i, m.clone()))
                        .collect();
                    list.sort_by(|a, b| {
                        let eta_a = a.1.death_time.unwrap_or(0) + a.1.spawn.first().map(|s| s.respawn_time as i64).unwrap_or(0);
                        let eta_b = b.1.death_time.unwrap_or(0) + b.1.spawn.first().map(|s| s.respawn_time as i64).unwrap_or(0);
                        eta_a.cmp(&eta_b)
                    });
                    list
                }
                ActiveTab::Wait => {
                    self.active_mvps.iter()
                        .enumerate()
                        .filter(|(_, m)| m.is_pinned && m.death_time.is_none())
                        .map(|(i, m)| (i, m.clone()))
                        .collect()
                }
                ActiveTab::All => {
                    let mut list: Vec<(usize, Mvp)> = self.all_mvps.iter()
                        .enumerate()
                        .map(|(i, m)| (i, m.clone()))
                        .collect();
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
                let card_h = 400.0_f32;
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
                let mut open = true;
                let mut clicked = false;

                egui::Window::new(format!("Edit: {}", mvp_name))
                    .open(&mut open)
                    .show(ctx, |ui| {
                        ui.label("Death time:");
                        let dt = chrono::DateTime::from_timestamp_millis(death_time)
                            .map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string())
                            .unwrap_or_default();
                        ui.label(&dt);
                        if ui.button("Set to now").clicked() {
                            clicked = true;
                        }
                    });

                if clicked {
                    self.edit_mvp_time(idx, self.now_ms);
                    self.edit_mvp_index = None;
                }
                if !open {
                    self.edit_mvp_index = None;
                }
            } else {
                self.edit_mvp_index = None;
            }
        }

        ctx.request_repaint_after(std::time::Duration::from_millis(1000));
    }
}

fn button_colored(ui: &mut egui::Ui, text: &str, color: Color32) -> egui::Response {
    let is_primary = text == "Killed Now" || text == "Select to kill";
    let w = if is_primary { ui.available_width() } else { 60.0 };
    let h = if is_primary { 32.0 } else { 28.0 };
    let font_size = if is_primary { 14.0 } else { 11.0 };
    ui.add(
        egui::Button::new(RichText::new(text).size(font_size).color(Color32::WHITE).strong())
            .fill(color)
            .min_size(egui::vec2(w, h)),
    )
}
