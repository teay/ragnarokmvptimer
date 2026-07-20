use std::collections::HashMap;
use std::rc::Rc;
use std::cell::RefCell;

use eframe::egui;
use egui::{Color32, RichText, TextureHandle};

use crate::core::sort::sort_mvps_by_respawn_time;
use crate::core::timer::{format_time, get_mvp_respawn_window};
use crate::data::mvp::{Mvp, Spawn, Stats, MvpZone, MapMark};
use crate::data::settings::{Settings, SERVERS};
use crate::storage::local;

use chrono::{Datelike, Timelike, NaiveDateTime};

const CARD_WIDTH: f32 = 195.0;
const CARD_HEIGHT: f32 = 520.0;
const CARD_ICON_SIZE: f32 = 80.0;
const MAP_THUMB_SIZE: f32 = 200.0;
const MAP_FULL_SIZE: f32 = 512.0;

#[derive(Clone, Debug)]
struct ExpandedMvp {
    id: u32,
    dbname: Option<String>,
    name: String,
    spawn: Spawn,
    all_spawns: Vec<Spawn>,
    stats: Stats,
    death_time: Option<i64>,
    death_map: Option<String>,
    death_position: Option<crate::data::mvp::MapMark>,
    is_pinned: bool,
}

impl ExpandedMvp {
    fn key(&self) -> String {
        self.id.to_string()
    }

    fn from_saved_mvp(mvp: &Mvp) -> Self {
        let spawn = if let Some(ref dm) = mvp.death_map {
            mvp.spawn.iter().find(|s| &s.mapname == dm).cloned()
        } else {
            mvp.spawn.first().cloned()
        };
        let spawn = spawn.unwrap_or_else(|| Spawn {
            mapname: String::new(),
            respawn_time: 0,
            window: None,
        });
        ExpandedMvp {
            id: mvp.id,
            dbname: mvp.dbname.clone(),
            name: mvp.name.clone(),
            spawn,
            all_spawns: mvp.spawn.clone(),
            stats: mvp.stats.clone(),
            death_time: mvp.death_time,
            death_map: mvp.death_map.clone(),
            death_position: mvp.death_position.clone(),
            is_pinned: mvp.is_pinned,
        }
    }

    fn from_mvp(mvp: &Mvp, spawn: &Spawn) -> Self {
        ExpandedMvp {
            id: mvp.id,
            dbname: mvp.dbname.clone(),
            name: mvp.name.clone(),
            spawn: spawn.clone(),
            all_spawns: mvp.spawn.clone(),
            stats: mvp.stats.clone(),
            death_time: None,
            death_map: Some(spawn.mapname.clone()),
            death_position: None,
            is_pinned: false,
        }
    }

    fn to_mvp(&self) -> Mvp {
        Mvp {
            id: self.id,
            dbname: self.dbname.clone(),
            name: self.name.clone(),
            spawn: self.all_spawns.clone(),
            stats: self.stats.clone(),
            death_time: self.death_time,
            death_map: self.death_map.clone(),
            death_position: self.death_position.clone(),
            is_pinned: self.is_pinned,
        }
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum SortBy {
    RespawnTime,
    Name,
    Level,
    Hp,
}

impl SortBy {
    fn label(&self) -> &str {
        match self {
            SortBy::RespawnTime => "Respawn",
            SortBy::Name => "Name",
            SortBy::Level => "Level",
            SortBy::Hp => "HP",
        }
    }
}

pub struct MvpTimerApp {
    settings: Settings,
    all_server_mvps: Vec<Mvp>,
    active_mvps: Vec<ExpandedMvp>,
    search_query: String,
    sort_by: SortBy,
    sort_reverse: bool,

    show_settings: bool,
    show_profile: bool,
    profile_nickname: String,
    profile_party: String,
    confirm_logout: bool,
    show_kill_modal: Option<ExpandedMvp>,
    show_edit_modal: Option<ExpandedMvp>,
    show_map_modal: Option<ExpandedMvp>,
    kill_modal_just_opened: bool,
    edit_modal_just_opened: bool,
    map_modal_just_opened: bool,
    edit_time_input: String,
    kill_modal_position: Option<MapMark>,
    kill_modal_selected_map: Option<String>,
    edit_modal_position: Option<MapMark>,
    edit_modal_selected_map: Option<String>,

    // DateTime picker state
    dt_day: String,
    dt_month: String,
    dt_year: String,
    dt_hour: String,
    dt_minute: String,
    dt_focused: usize,
    dt_initialized: bool,
    dt_edited: bool,

    // Welcome screen
    welcome_nickname: String,
    welcome_party: String,

    now_epoch_ms: i64,

    scroll_offset: f32,

    map_textures: HashMap<String, TextureHandle>,
    icon_textures: HashMap<String, TextureHandle>,
}

impl Default for MvpTimerApp {
    fn default() -> Self {
        let settings = local::load_settings();
        let all_server_mvps = load_server_data(&settings.server);
        let saved_mvps = local::load_mvps(&settings.server);
        let active_mvps = rehydrate_saved(&saved_mvps, &all_server_mvps);

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64;

        Self {
            settings,
            all_server_mvps,
            active_mvps,
            search_query: String::new(),
            sort_by: SortBy::RespawnTime,
            sort_reverse: false,
            show_settings: false,
            show_profile: false,
            profile_nickname: String::new(),
            profile_party: String::new(),
            confirm_logout: false,
            show_kill_modal: None,
            show_edit_modal: None,
            show_map_modal: None,
            kill_modal_just_opened: false,
            edit_modal_just_opened: false,
            map_modal_just_opened: false,
            edit_time_input: String::new(),
            kill_modal_position: None,
            kill_modal_selected_map: None,
            edit_modal_position: None,
            edit_modal_selected_map: None,
            dt_day: String::new(),
            dt_month: String::new(),
            dt_year: String::new(),
            dt_hour: String::new(),
            dt_minute: String::new(),
            dt_focused: 0,
            dt_initialized: false,
            dt_edited: false,
            welcome_nickname: String::new(),
            welcome_party: String::new(),
            now_epoch_ms: now,
            scroll_offset: 0.0,
            map_textures: HashMap::new(),
            icon_textures: HashMap::new(),
        }
    }
}

fn exe_dir() -> std::path::PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::path::PathBuf::from("."))
}

fn load_server_data(server: &str) -> Vec<Mvp> {
    let base = exe_dir();
    let paths = [
        base.join(format!("data/{}.json", server)),
        std::path::PathBuf::from(format!("data/{}.json", server)),
    ];

    for path in &paths {
        if let Ok(data) = std::fs::read_to_string(path) {
            if let Ok(mvps) = serde_json::from_str::<Vec<Mvp>>(&data) {
                return mvps;
            }
        }
    }

    Vec::new()
}

fn rehydrate_saved(saved: &[Mvp], original_all: &[Mvp]) -> Vec<ExpandedMvp> {
    if original_all.is_empty() {
        return saved.iter().map(|m| ExpandedMvp::from_saved_mvp(m)).collect();
    }

    saved
        .iter()
        .map(|active| {
            if let Some(original) = original_all.iter().find(|o| o.id == active.id) {
                let spawn = if let Some(ref dm) = active.death_map {
                    original.spawn.iter().find(|s| &s.mapname == dm).cloned()
                } else {
                    active.spawn.first().cloned()
                };
                let spawn = spawn.unwrap_or_else(|| original.spawn.first().cloned().unwrap_or(Spawn {
                    mapname: String::new(),
                    respawn_time: 0,
                    window: None,
                }));
                ExpandedMvp {
                    id: original.id,
                    dbname: original.dbname.clone(),
                    name: original.name.clone(),
                    spawn,
                    all_spawns: original.spawn.clone(),
                    stats: original.stats.clone(),
                    death_time: active.death_time,
                    death_map: active.death_map.clone(),
                    death_position: active.death_position.clone(),
                    is_pinned: active.is_pinned,
                }
            } else {
                ExpandedMvp::from_saved_mvp(active)
            }
        })
        .collect()
}

fn load_texture_cached(
    ctx: &egui::Context,
    cache: &mut HashMap<String, TextureHandle>,
    pad: bool,
    key: &str,
    path: &std::path::Path,
    size: u32,
) -> Option<TextureHandle> {
    if let Some(tex) = cache.get(key) {
        return Some(tex.clone());
    }
    let data = match std::fs::read(path) {
        Ok(d) => d,
        Err(e) => {
            log::warn!("texture read failed key={} path={:?} err={}", key, path, e);
            return None;
        }
    };
    let img = match image::load_from_memory(&data) {
        Ok(i) => i,
        Err(e) => {
            log::warn!("texture decode failed key={} path={:?} err={}", key, path, e);
            return None;
        }
    };
    let resized = if img.width() > img.height() {
        let w = size;
        let h = (size as f32 * img.height() as f32 / img.width() as f32).round() as u32;
        img.resize_exact(w, h.max(1), image::imageops::FilterType::Nearest)
    } else {
        let h = size;
        let w = (size as f32 * img.width() as f32 / img.height() as f32).round() as u32;
        img.resize_exact(w.max(1), h, image::imageops::FilterType::Nearest)
    };
    let rgba = if pad {
        let mut canvas = image::RgbaImage::from_pixel(size, size, image::Rgba([0, 0, 0, 0]));
        let x = (size as i64 - resized.width() as i64) / 2;
        let y = (size as i64 - resized.height() as i64) / 2;
        image::imageops::overlay(&mut canvas, &resized.to_rgba8(), x, y);
        canvas
    } else {
        resized.to_rgba8()
    };
    let dims = [rgba.width() as usize, rgba.height() as usize];
    let pixels = rgba.into_raw();
    let color_image = egui::ColorImage::from_rgba_unmultiplied(dims, &pixels);
    let key_owned = key.to_string();
    let key_clone = key_owned.clone();
    let tex = ctx.load_texture(&key_clone, color_image, egui::TextureOptions::default());
    cache.insert(key_owned, tex.clone());
    log::info!("texture loaded key={} {}x{}", key, dims[0], dims[1]);
    Some(tex)
}

fn format_kill_time(epoch_ms: i64) -> String {
    chrono::DateTime::from_timestamp_millis(epoch_ms)
        .map(|utc| {
            let local = utc.with_timezone(&chrono::Local);
            local.format("%d/%m %H:%M").to_string()
        })
        .unwrap_or_default()
}

fn parse_datetime_input(input: &str, _default_date: NaiveDateTime) -> Option<i64> {
    let digits: String = input.chars().filter(|c| c.is_ascii_digit()).collect();
    let now = chrono::Local::now();

    let (day, month, hour, minute) = match digits.len() {
        8 => {
            let d: u32 = digits[0..2].parse().ok()?;
            let m: u32 = digits[2..4].parse().ok()?;
            let h: u32 = digits[4..6].parse().ok()?;
            let min: u32 = digits[6..8].parse().ok()?;
            (d, m, h, min)
        }
        6 => {
            let d: u32 = digits[0..2].parse().ok()?;
            let m: u32 = digits[2..4].parse().ok()?;
            let h: u32 = digits[4..6].parse().ok()?;
            (d, m, h, 0)
        }
        4 => {
            let h: u32 = digits[0..2].parse().ok()?;
            let min: u32 = digits[2..4].parse().ok()?;
            (now.day(), now.month(), h, min)
        }
        _ => return None,
    };

    let dt = now
        .with_day(day)?
        .with_month(month)?
        .with_hour(hour)?
        .with_minute(minute)?
        .with_second(0)?
        .with_nanosecond(0)?;

    Some(dt.timestamp_millis())
}

impl eframe::App for MvpTimerApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64;

        if now - self.now_epoch_ms >= 1000 {
            self.now_epoch_ms = now;
        }
        ctx.request_repaint();

        // Welcome screen gate - block everything until nickname is set
        if self.settings.nickname.is_empty() {
            self.show_welcome_screen(ctx);
            return;
        }

        // Header
        egui::TopBottomPanel::top("header").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.heading(RichText::new("MVP Timer").size(18.0));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.small_button("⚙ Settings").clicked() {
                        self.show_settings = true;
                    }
                    if ui.small_button("👤").on_hover_text("Party Settings").clicked() {
                        self.profile_nickname = self.settings.nickname.clone();
                        self.profile_party = self.settings.party_room.clone().unwrap_or_default();
                        self.show_profile = true;
                    }
                    let dt = chrono::DateTime::from_timestamp_millis(self.now_epoch_ms)
                        .map(|utc| utc.with_timezone(&chrono::Local));
                    if let Some(dt) = dt {
                        let time_str = if self.settings.use_24_hour_format {
                            dt.format("%H:%M:%S").to_string()
                        } else {
                            dt.format("%I:%M:%S %p").to_string()
                        };
                        ui.label(RichText::new(time_str).strong().size(14.0));
                    }
                    ui.label(
                        RichText::new(&self.settings.server)
                            .color(Color32::from_rgb(100, 200, 255))
                            .strong(),
                    );
                    if let Some(ref room) = self.settings.party_room {
                        ui.label(
                            RichText::new(format!("👥 {}", room))
                                .color(Color32::from_rgb(33, 150, 243))
                                .strong(),
                        );
                    } else if !self.settings.nickname.is_empty() {
                        ui.label(
                            RichText::new(format!("👤 {}", self.settings.nickname))
                                .color(Color32::from_rgb(76, 175, 80)),
                        );
                    }
                });
            });
            ui.horizontal(|ui| {
                ui.label("🔍");
                ui.text_edit_singleline(&mut self.search_query);
            });
        });

        // Footer
        egui::TopBottomPanel::bottom("footer").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.label(
                    RichText::new("Ragnarok MVP Timer")
                        .color(Color32::from_gray(120))
                        .size(11.0),
                );
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.label(
                        RichText::new(format!("{} active", self.active_mvps.len()))
                            .color(Color32::from_gray(120))
                            .size(11.0),
                    );
                });
            });
        });

        // Modals after header/footer so button clicks take effect same frame
        if self.show_settings {
            self.show_settings_modal(ctx);
        }
        if self.show_profile {
            self.show_profile_modal(ctx);
        }

        // Main content
        egui::CentralPanel::default().show(ctx, |ui| {
            let query_lower = self.search_query.to_lowercase();

            let mut active: Vec<ExpandedMvp> = self
                .active_mvps
                .iter()
                .filter(|m| {
                    m.death_time.is_some()
                        && !has_respawned_m(m, self.now_epoch_ms)
                })
                .cloned()
                .collect();

            let mut respawned: Vec<ExpandedMvp> = self
                .active_mvps
                .iter()
                .filter(|m| {
                    m.death_time.is_some()
                        && has_respawned_m(m, self.now_epoch_ms)
                })
                .cloned()
                .collect();

            let mut pinned: Vec<ExpandedMvp> = self
                .active_mvps
                .iter()
                .filter(|m| {
                    m.is_pinned
                        && m.death_time.is_none()
                })
                .cloned()
                .collect();

            sort_expanded(&mut active, self.sort_by, self.sort_reverse);
            sort_expanded(&mut respawned, self.sort_by, self.sort_reverse);
            sort_expanded(&mut pinned, self.sort_by, self.sort_reverse);

            // Build available list: flatten spawns, exclude active by id+deathMap
            let active_keys: Vec<String> = self.active_mvps.iter().map(|m| m.key()).collect();
            let mut available: Vec<ExpandedMvp> = self
                .all_server_mvps
                .iter()
                .flat_map(|mvp| {
                    mvp.spawn
                        .iter()
                        .map(move |spawn| ExpandedMvp::from_mvp(mvp, spawn))
                })
                .filter(|em| !active_keys.contains(&em.key()))
                .filter(|m| {
                    query_lower.is_empty()
                        || m.name.to_lowercase().contains(&query_lower)
                        || m.id.to_string().contains(&self.search_query)
                })
                .collect();
            sort_expanded(&mut available, self.sort_by, self.sort_reverse);

            let cols = ((ui.available_width() + 8.0) / (CARD_WIDTH + 8.0))
                .floor()
                .max(1.0) as usize;

            // Handle PageUp/PageDown when no modal is open and no text field focused
            let no_modal = self.show_kill_modal.is_none()
                && self.show_edit_modal.is_none()
                && self.show_map_modal.is_none()
                && !self.show_settings
                && !self.show_profile;
            let page_up = no_modal && ctx.input(|i| i.key_pressed(egui::Key::PageUp));
            let page_down = no_modal && ctx.input(|i| i.key_pressed(egui::Key::PageDown));
            let scroll_page_amount = ui.available_height() - 30.0;
            if page_up {
                self.scroll_offset = (self.scroll_offset - scroll_page_amount).max(0.0);
            }
            if page_down {
                self.scroll_offset += scroll_page_amount;
            }

            let scroll_area = egui::ScrollArea::vertical()
                .vertical_scroll_offset(self.scroll_offset);
            let scroll_output = scroll_area.show(ui, |ui| {
                let mut pending: Option<CardAction> = None;

                // Active — always sort by respawn time ascending
                active.sort_by(|a, b| {
                    let ra = a.death_time.unwrap_or(0) + a.spawn.respawn_time as i64;
                    let rb = b.death_time.unwrap_or(0) + b.spawn.respawn_time as i64;
                    ra.cmp(&rb)
                });
                if !active.is_empty() {
                    ui.label(
                        RichText::new(format!("🎯 ACTIVE ({})", active.len()))
                                .color(Color32::from_rgb(255, 100, 100))
                                .strong()
                                .size(16.0),
                        );
                        ui.add_space(4.0);
                        render_card_grid(ctx, ui, &mut self.map_textures, &mut self.icon_textures, &active, cols, MvpZone::Active, self.now_epoch_ms, self.settings.show_mvp_map, self.settings.card_bg_alpha, &mut pending);
                    ui.add_space(8.0);
                }

                // Respawned — always sort by respawn time ascending
                respawned.sort_by(|a, b| {
                    let ra = a.death_time.unwrap_or(0) + a.spawn.respawn_time as i64;
                    let rb = b.death_time.unwrap_or(0) + b.spawn.respawn_time as i64;
                    ra.cmp(&rb)
                });
                if !respawned.is_empty() {
                    ui.label(
                        RichText::new(format!("✅ RESPAWNED ({})", respawned.len()))
                                .color(Color32::from_rgb(100, 255, 100))
                                .strong()
                                .size(16.0),
                        );
                        ui.add_space(4.0);
                        render_card_grid(ctx, ui, &mut self.map_textures, &mut self.icon_textures, &respawned, cols, MvpZone::Active, self.now_epoch_ms, self.settings.show_mvp_map, self.settings.card_bg_alpha, &mut pending);
                    ui.add_space(8.0);
                }

                // Pinned — always sort by name
                pinned.sort_by(|a, b| a.name.cmp(&b.name));
                if !pinned.is_empty() {
                    ui.label(
                        RichText::new(format!("📌 PINNED ({})", pinned.len()))
                                .color(Color32::from_rgb(255, 200, 50))
                                .strong()
                                .size(16.0),
                        );
                        ui.add_space(4.0);
                        render_card_grid(ctx, ui, &mut self.map_textures, &mut self.icon_textures, &pinned, cols, MvpZone::Wait, self.now_epoch_ms, self.settings.show_mvp_map, self.settings.card_bg_alpha, &mut pending);
                    ui.add_space(8.0);
                }

                // Available — user-controlled sort + search
                ui.separator();
                ui.horizontal(|ui| {
                    ui.label(RichText::new("📦 ALL").strong().size(16.0).color(Color32::from_gray(180)));
                    ui.separator();
                    ui.label(RichText::new("Sort:").size(11.0).color(Color32::from_gray(150)));
                    for sort in [SortBy::RespawnTime, SortBy::Name, SortBy::Level, SortBy::Hp] {
                        let label = sort.label();
                        let selected = self.sort_by == sort;
                        if ui
                            .selectable_label(selected, RichText::new(label).size(11.0))
                            .clicked()
                        {
                            if self.sort_by == sort {
                                self.sort_reverse = !self.sort_reverse;
                            } else {
                                self.sort_by = sort;
                                self.sort_reverse = false;
                            }
                        }
                    }
                });

                ui.add_space(4.0);
                sort_expanded(&mut available, self.sort_by, self.sort_reverse);
                render_available_grid(ctx, ui, &mut self.map_textures, &mut self.icon_textures, &available, cols, self.now_epoch_ms, self.settings.show_mvp_map, self.settings.card_bg_alpha, &mut pending);

                if let Some(action) = pending {
                    match action {
                        CardAction::Kill(mvp) => {
                            self.kill_modal_position = mvp.death_position.clone();
                            self.kill_modal_selected_map = Some(mvp.death_map.clone().unwrap_or_else(|| mvp.spawn.mapname.clone()));
                            let init_time = mvp.death_time.unwrap_or(self.now_epoch_ms);
                            self.dt_set_from_epoch(init_time);
                            self.dt_initialized = true;
                            self.show_kill_modal = Some(mvp);
                            self.kill_modal_just_opened = true;
                        }
                        CardAction::Edit(mvp) => {
                            self.edit_modal_position = mvp.death_position.clone();
                            self.edit_modal_selected_map = mvp.death_map.clone();
                            let init_time = mvp.death_time.unwrap_or(self.now_epoch_ms);
                            self.dt_set_from_epoch(init_time);
                            self.dt_initialized = true;
                            self.show_edit_modal = Some(mvp);
                            self.edit_modal_just_opened = true;
                        }
                        CardAction::Remove(key) => self.remove_entry(&key),
                        CardAction::BackToWait(key) => self.back_to_wait(&key),
                        CardAction::Pin(mvp) => {
                            let key = mvp.key();
                            if let Some(m) = self.active_mvps.iter_mut().find(|m| m.key() == key) {
                                m.is_pinned = true;
                            } else {
                                let mut pinned = mvp;
                                pinned.is_pinned = true;
                                self.active_mvps.push(pinned);
                            }
                            self.persist();
                        }
                        CardAction::ViewMap(mvp) => {
                            self.show_map_modal = Some(mvp);
                            self.map_modal_just_opened = true;
                        }
                    }
                }
            });
            self.scroll_offset = scroll_output.state.offset.y;
        });

        // Modals after CentralPanel so card actions take effect same frame
        if self.show_kill_modal.is_some() {
            let mvp = self.show_kill_modal.clone().unwrap();
            self.show_kill_modal(&ctx, &mvp);
        }
        if self.show_edit_modal.is_some() {
            let mvp = self.show_edit_modal.clone().unwrap();
            self.show_edit_modal(&ctx, &mvp);
        }
        if self.show_map_modal.is_some() {
            let mvp = self.show_map_modal.clone().unwrap();
            self.show_map_modal(&ctx, &mvp);
        }
    }
}

enum CardAction {
    Kill(ExpandedMvp),
    Remove(String),    // key
    BackToWait(String), // key
    Edit(ExpandedMvp),
    Pin(ExpandedMvp),
    ViewMap(ExpandedMvp),
}

#[derive(Default)]
struct DtPickerResponse {
    parsed: Option<chrono::NaiveDateTime>,
    enter: bool,
    escape: bool,
    tab_out: bool,
}

fn has_respawned_m(mvp: &ExpandedMvp, now_epoch_ms: i64) -> bool {
    if let Some(death_time) = mvp.death_time {
        let respawn = mvp.spawn.respawn_time as i64;
        now_epoch_ms >= death_time + respawn
    } else {
        false
    }
}

fn sort_expanded(mvps: &mut [ExpandedMvp], sort_by: SortBy, reverse: bool) {
    mvps.sort_by(|a, b| {
        let cmp = match sort_by {
            SortBy::RespawnTime => a.spawn.respawn_time.cmp(&b.spawn.respawn_time),
            SortBy::Name => a.name.cmp(&b.name),
            SortBy::Level => a.stats.level.cmp(&b.stats.level),
            SortBy::Hp => a.stats.health.cmp(&b.stats.health),
        };
        if reverse { cmp.reverse() } else { cmp }
    });
}

fn render_card_grid(
    ctx: &egui::Context,
    ui: &mut egui::Ui,
    map_textures: &mut HashMap<String, TextureHandle>,
    icon_textures: &mut HashMap<String, TextureHandle>,
    mvps: &[ExpandedMvp],
    cols: usize,
    zone: MvpZone,
    now_epoch_ms: i64,
    show_map: bool,
    card_bg_alpha: u8,
    pending: &mut Option<CardAction>,
) {
    if mvps.is_empty() {
        return;
    }
    egui::Grid::new(egui::Id::new("card_grid"))
        .spacing(egui::vec2(10.0, 10.0))
        .min_col_width(CARD_WIDTH)
        .max_col_width(CARD_WIDTH)
        .striped(false)
        .show(ui, |ui| {
            for (i, mvp) in mvps.iter().enumerate() {
                render_active_card_inner(ctx, ui, map_textures, icon_textures, mvp, zone, now_epoch_ms, show_map, card_bg_alpha, pending);
                if (i + 1) % cols == 0 {
                    ui.end_row();
                }
            }
        });
}

fn render_active_card_inner(
    ctx: &egui::Context,
    ui: &mut egui::Ui,
    map_textures: &mut HashMap<String, TextureHandle>,
    icon_textures: &mut HashMap<String, TextureHandle>,
    mvp: &ExpandedMvp,
    zone: MvpZone,
    now_epoch_ms: i64,
    show_map: bool,
    card_bg_alpha: u8,
    pending: &mut Option<CardAction>,
) {
    let has_death = mvp.death_time.is_some();
    let respawned = has_death && has_respawned_m(mvp, now_epoch_ms);

    let card_bg = Color32::from_rgba_premultiplied(38, 38, 48, card_bg_alpha);
    let card_border = Color32::from_rgb(100, 100, 120);
    let card_border = if respawned {
        Color32::from_rgb(80, 180, 80)
    } else if has_death {
        Color32::from_rgb(180, 80, 80)
    } else if zone == MvpZone::Wait {
        Color32::from_rgb(200, 180, 60)
    } else {
        Color32::from_rgb(100, 100, 120)
    };

    let card_w = CARD_WIDTH - 20.0;
    let card_resp = ui.vertical(|ui| {
                ui.set_min_height(CARD_HEIGHT);
                ui.add_space(15.0);
                // Header: ID (left) + Kill Time (right, clickable)
                ui.horizontal(|ui| {
                    ui.label(
                        RichText::new(format!("({})", mvp.id))
                            .size(11.0)
                            .color(Color32::from_gray(140)),
                    );
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        if let Some(dt) = mvp.death_time {
                            let label = ui.label(
                                RichText::new(format_kill_time(dt))
                                .size(11.0)
                                .color(Color32::from_rgb(150, 150, 150)),
                            );
                            if label.on_hover_text("Click to edit time").clicked() {
                                *pending = Some(CardAction::Edit(mvp.clone()));
                            }
                        }
                    });
                });

                // Name centered
                ui.vertical_centered(|ui| {
                    ui.label(
                        RichText::new(&mvp.name)
                            .strong()
                            .size(16.0)
                            .color(Color32::from_rgb(147, 112, 219)),
                    );
                });

                // Sprite centered
                let icon_resp = ui.vertical_centered(|ui| {
                    let key = format!("icon_{}", mvp.id);
                    let path = exe_dir().join(format!("assets/icons/{}.png", mvp.id));
                    if let Some(tex) =
                        load_texture_cached(ctx, icon_textures, true, &key, &path, CARD_ICON_SIZE as u32)
                    {
                        ui.image((tex.id(), tex.size_vec2()));
                    } else {
                        ui.label(RichText::new("⚔").size(28.0));
                    }
                });
                ui.painter().rect_stroke(icon_resp.response.rect.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, egui::Color32::RED), egui::StrokeKind::Middle);

                // Timer / Tombstone — fixed height 60px for alignment
                let timer_resp = ui.vertical_centered(|ui| {
                    ui.set_min_height(60.0);
                    if has_death && !respawned {
                        if let Some(death_time) = mvp.death_time {
                            let eta = death_time + mvp.spawn.respawn_time as i64;
                            let remaining = eta - now_epoch_ms;
                            let window = get_mvp_respawn_window(&mvp.to_mvp());
                            let window_end = death_time + mvp.spawn.respawn_time as i64 + window as i64;

                            let color = if remaining < 10 * 60 * 1000 {
                                Color32::from_rgb(255, 200, 50)
                            } else {
                                Color32::from_rgb(255, 255, 255)
                            };
                            ui.label(
                                RichText::new(format!("Respawn in"))
                                    .size(12.0)
                                    .color(Color32::from_gray(180)),
                            );
                            ui.label(
                                RichText::new(format_time(remaining))
                                    .color(color)
                                    .strong()
                                    .size(18.0),
                            );
                            if window > 0 {
                                ui.label(
                                    RichText::new(format!("~ {}", format_time(window_end - now_epoch_ms)))
                                        .size(11.0)
                                        .color(Color32::from_gray(130)),
                                );
                            }
                        }
                    } else if respawned {
                        if let Some(death_time) = mvp.death_time {
                            let elapsed = now_epoch_ms - death_time - mvp.spawn.respawn_time as i64;
                            ui.label(
                                RichText::new("Already Respawned")
                                    .color(Color32::from_rgb(255, 80, 80))
                                    .strong()
                                    .size(14.0),
                            );
                            ui.label(
                                RichText::new(format!("{} ago", format_time(elapsed)))
                                    .color(Color32::from_rgb(255, 80, 80))
                                    .size(12.0),
                            );
                        }
                    } else if zone == MvpZone::Wait {
                        ui.label(
                            RichText::new("⭐ Pinned")
                                .size(16.0)
                                .color(Color32::from_rgb(255, 200, 50))
                                .strong(),
                        );
                    }
                });
                ui.painter().rect_stroke(timer_resp.response.rect.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, egui::Color32::RED), egui::StrokeKind::Middle);

                ui.add_space(4.0);

                // Map name (always shown)
                ui.vertical_centered(|ui| {
                    ui.label(
                        RichText::new(format!("Map: {}", mvp.death_map.as_deref().unwrap_or(&mvp.spawn.mapname)))
                            .size(13.0)
                            .color(Color32::from_rgb(224, 224, 224)),
                    );
                });

                // Map thumbnail — fixed height MAP_THUMB_SIZE for alignment
                let map_resp = ui.vertical_centered(|ui| {
                    ui.set_min_height(MAP_THUMB_SIZE);
                    if show_map {
                        let map_name = mvp.death_map.as_deref().unwrap_or(&mvp.spawn.mapname);
                        let key = format!("thumb_{}_{}", mvp.id, map_name);
                        let path = exe_dir().join(format!("assets/maps/{}.png", map_name));
                        if let Some(tex) =
                            load_texture_cached(ctx, map_textures, false, &key, &path, MAP_THUMB_SIZE as u32)
                        {
                            let resp = ui.add(
                                egui::Image::new((tex.id(), tex.size_vec2()))
                                    .max_size(egui::vec2(MAP_THUMB_SIZE, MAP_THUMB_SIZE))
                                    .sense(egui::Sense::click()),
                            );
                            if let Some(ref pos) = mvp.death_position {
                                if mvp.death_map.is_some() {
                                    let rect = resp.rect;
                                    let img_w = rect.width();
                                    let img_h = rect.height();
                                    let sx = rect.left() + (pos.x as f32 / MAP_FULL_SIZE) * img_w;
                                    let sy = rect.top() + (pos.y as f32 / MAP_FULL_SIZE) * img_h;
                                    let painter = ui.painter();
                                    painter.circle_filled(egui::pos2(sx, sy), 6.0, Color32::from_rgba_premultiplied(200, 0, 0, 200));
                                    painter.text(egui::pos2(sx, sy), egui::Align2::CENTER_CENTER, "†", egui::FontId::proportional(14.0), Color32::WHITE);
                                }
                            }
                            if resp.clicked() {
                                *pending = Some(CardAction::ViewMap(mvp.clone()));
                            }
                        }
                    }
                });
                ui.painter().rect_stroke(map_resp.response.rect.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, egui::Color32::GREEN), egui::StrokeKind::Middle);

                // Primary button: "Killed Now" (brown)
                let kill_resp = ui.vertical_centered(|ui| {
                    if ui.add(
                        egui::Button::new(
                            RichText::new("💀 Killed Now").size(14.0).color(Color32::WHITE).strong()
                        )
                        .fill(Color32::from_rgb(139, 90, 43))
                        .min_size(egui::vec2(card_w, 32.0))
                        .corner_radius(4.0),
                    ).clicked() {
                        *pending = Some(CardAction::Kill(mvp.clone()));
                    }
                });
                ui.painter().rect_stroke(kill_resp.response.rect.expand(2.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, egui::Color32::MAGENTA), egui::StrokeKind::Middle);

                ui.add_space(4.0);

                // Action grid: Edit | RMV | BACK/CANCEL
                let action_resp = ui.vertical(|ui| {
                let btn_w = (card_w - 8.0) / 3.0;
                if zone == MvpZone::Wait && !has_death {
                    // Pinned: Edit | RMV | CANCEL
                    ui.horizontal(|ui| {
                        ui.spacing_mut().item_spacing.x = 4.0;
                        let total_btn = btn_w * 3.0 + 8.0;
                        ui.add_space(((ui.available_width() - total_btn).max(0.0)) / 2.0);
                        if ui.add(egui::Button::new(RichText::new("EDIT").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(100, 100, 100)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::Edit(mvp.clone()));
                        }
                        if ui.add(egui::Button::new(RichText::new("RMV").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(200, 50, 50)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::Remove(mvp.key()));
                        }
                        if ui.add(egui::Button::new(RichText::new("CANCEL").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(180, 50, 50)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::Remove(mvp.key()));
                        }
                    });
                } else {
                    // Active/Respawned: Edit | RMV | BACK
                    ui.horizontal(|ui| {
                        ui.spacing_mut().item_spacing.x = 4.0;
                        let total_btn = btn_w * 3.0 + 8.0;
                        ui.add_space(((ui.available_width() - total_btn).max(0.0)) / 2.0);
                        if ui.add(egui::Button::new(RichText::new("EDIT").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(100, 100, 100)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::Edit(mvp.clone()));
                        }
                        if ui.add(egui::Button::new(RichText::new("RMV").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(200, 50, 50)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::Remove(mvp.key()));
                        }
                        if ui.add(egui::Button::new(RichText::new("BACK").size(11.0).color(Color32::WHITE)).fill(Color32::from_rgb(50, 120, 200)).min_size(egui::vec2(btn_w, 30.0)).corner_radius(4.0)).clicked() {
                            *pending = Some(CardAction::BackToWait(mvp.key()));
                        }
                    });
                }
                });
        ui.add_space(15.0);
        });
    let card_r = card_resp.response.rect;
    ui.painter().rect_filled(card_r, egui::CornerRadius::same(2), card_bg);
    ui.painter().rect_stroke(card_r.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, card_border), egui::StrokeKind::Middle);
}



fn render_available_grid(
    ctx: &egui::Context,
    ui: &mut egui::Ui,
    map_textures: &mut HashMap<String, TextureHandle>,
    icon_textures: &mut HashMap<String, TextureHandle>,
    mvps: &[ExpandedMvp],
    cols: usize,
    now_epoch_ms: i64,
    show_map: bool,
    card_bg_alpha: u8,
    pending: &mut Option<CardAction>,
) {
    if mvps.is_empty() {
        return;
    }
    egui::Grid::new(egui::Id::new("available_grid"))
        .spacing(egui::vec2(10.0, 10.0))
        .min_col_width(CARD_WIDTH)
        .max_col_width(CARD_WIDTH)
        .striped(false)
        .show(ui, |ui| {
            for (i, mvp) in mvps.iter().enumerate() {
                render_available_card_inner(ctx, ui, map_textures, icon_textures, mvp, now_epoch_ms, show_map, card_bg_alpha, pending);
                if (i + 1) % cols == 0 {
                    ui.end_row();
                }
            }
        });
}

fn render_available_card_inner(
    ctx: &egui::Context,
    ui: &mut egui::Ui,
    map_textures: &mut HashMap<String, TextureHandle>,
    icon_textures: &mut HashMap<String, TextureHandle>,
    mvp: &ExpandedMvp,
    _now_epoch_ms: i64,
    show_map: bool,
    card_bg_alpha: u8,
    pending: &mut Option<CardAction>,
) {
    let card_bg = Color32::from_rgba_premultiplied(38, 38, 48, card_bg_alpha);
    let card_border = Color32::from_rgb(100, 100, 120);
    let card_resp = ui.vertical(|ui| {
                ui.add_space(15.0);
                // ID
                ui.label(
                    RichText::new(format!("({})", mvp.id))
                        .size(9.0)
                        .color(Color32::from_gray(100)),
                );

                // Name centered
                ui.vertical_centered(|ui| {
                    ui.label(
                        RichText::new(&mvp.name)
                            .strong()
                            .size(16.0)
                            .color(Color32::from_rgb(147, 112, 219)),
                    );
                });

                // Sprite centered
                let icon_resp = ui.vertical_centered(|ui| {
                    let key = format!("icon_{}", mvp.id);
                    let path = exe_dir().join(format!("assets/icons/{}.png", mvp.id));
                    if let Some(tex) =
                        load_texture_cached(ctx, icon_textures, true, &key, &path, CARD_ICON_SIZE as u32)
                    {
                        ui.image((tex.id(), tex.size_vec2()));
                    } else {
                        ui.label(RichText::new("⚔").size(28.0));
                    }
                });
                ui.painter().rect_stroke(icon_resp.response.rect.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, egui::Color32::RED), egui::StrokeKind::Middle);

                ui.add_space(4.0);

                // Map name
                ui.vertical_centered(|ui| {
                    ui.label(
                        RichText::new(format!("Map: {}", mvp.spawn.mapname))
                            .size(13.0)
                            .color(Color32::from_rgb(224, 224, 224)),
                    );
                });

                // Map thumbnail — fixed height MAP_THUMB_SIZE for alignment
                ui.vertical_centered(|ui| {
                    ui.set_min_height(MAP_THUMB_SIZE);
                    if show_map {
                        let map_name = &mvp.spawn.mapname;
                        let key = format!("avail_map_{}_{}", mvp.id, map_name);
                        let path = exe_dir().join(format!("assets/maps/{}.png", map_name));
                        if let Some(tex) =
                            load_texture_cached(ctx, map_textures, false, &key, &path, MAP_THUMB_SIZE as u32)
                        {
                            ui.add(
                                egui::Image::new((tex.id(), tex.size_vec2()))
                                    .max_size(egui::vec2(MAP_THUMB_SIZE, MAP_THUMB_SIZE))
                            );
                        }
                    }
                });

                ui.add_space(4.0);

                // "Select to Kill" button (brown, Star icon) — immediately pins
                ui.vertical_centered(|ui| {
                    if ui.add(
                        egui::Button::new(
                            RichText::new("⭐ Select to Kill").size(14.0).color(Color32::WHITE).strong()
                        )
                        .fill(Color32::from_rgb(139, 90, 43))
                        .min_size(egui::vec2(200.0, 32.0))
                        .rounding(4.0),
                    ).clicked() {
                        *pending = Some(CardAction::Pin(mvp.clone()));
                    }
                });
        ui.add_space(15.0);
        });
    let card_r = card_resp.response.rect;
    ui.painter().rect_filled(card_r, egui::CornerRadius::same(2), card_bg);
    ui.painter().rect_stroke(card_r.expand(1.0), egui::CornerRadius::same(2), egui::Stroke::new(1.0, card_border), egui::StrokeKind::Middle);
}

impl MvpTimerApp {
    fn show_welcome_screen(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.vertical_centered(|ui| {
                ui.add_space(ui.available_height() / 3.0);

                ui.heading(
                    RichText::new("Welcome to the Hunt!")
                        .size(28.0)
                        .color(Color32::WHITE),
                );
                ui.add_space(8.0);
                ui.label(
                    RichText::new("Please enter your nickname to get started:")
                        .size(16.0)
                        .color(Color32::from_gray(200)),
                );
                ui.add_space(24.0);

                ui.horizontal(|ui| {
                    ui.add_space(ui.available_width() / 2.0 - 130.0);
                    ui.vertical(|ui| {
                        ui.set_min_width(260.0);
                        ui.label(RichText::new("Nickname *").size(12.0).color(Color32::from_gray(180)));
                        let response = ui.add(
                            egui::TextEdit::singleline(&mut self.welcome_nickname)
                                .hint_text("Your Nickname")
                                .desired_width(260.0)
                                .font(egui::FontId::proportional(16.0))
                                .frame(true)
                                .id(egui::Id::new("welcome_nickname")),
                        );

                        // Sanitize: only alphanumeric, uppercase
                        self.welcome_nickname = self.welcome_nickname
                            .chars()
                            .filter(|c| c.is_ascii_alphanumeric())
                            .collect::<String>()
                            .to_uppercase();

                        // Auto-focus on first frame
                        if !response.has_focus() && self.welcome_nickname.is_empty() {
                            ui.memory_mut(|mem| mem.request_focus(response.id));
                        }

                        ui.add_space(12.0);
                        ui.label(RichText::new("Party Name (optional)").size(12.0).color(Color32::from_gray(180)));
                        ui.add(
                            egui::TextEdit::singleline(&mut self.welcome_party)
                                .hint_text("Party Name (optional)")
                                .desired_width(260.0)
                                .font(egui::FontId::proportional(16.0))
                                .frame(true)
                                .id(egui::Id::new("welcome_party")),
                        );
                        // Sanitize party name too
                        self.welcome_party = self.welcome_party
                            .chars()
                            .filter(|c| c.is_ascii_alphanumeric())
                            .collect::<String>()
                            .to_uppercase();

                        ui.add_space(20.0);

                        let can_submit = !self.welcome_nickname.trim().is_empty();
                        let in_party = !self.welcome_party.trim().is_empty();
                        let btn_text = if !can_submit {
                            "Enter nickname first"
                        } else if in_party {
                            "🎮 เข้า Party"
                        } else {
                            "👤 เล่นคนเดียว"
                        };
                        let btn_color = if can_submit {
                            if in_party {
                                Color32::from_rgb(33, 150, 243)
                            } else {
                                Color32::from_rgb(76, 175, 80)
                            }
                        } else {
                            Color32::from_gray(80)
                        };

                        let btn = ui.add(
                            egui::Button::new(
                                RichText::new(btn_text).size(16.0).color(Color32::WHITE).strong()
                            )
                            .fill(btn_color)
                            .min_size(egui::vec2(260.0, 40.0))
                            .rounding(8.0),
                        );

                        // Enter key also submits
                        let enter_pressed = ui.input(|i| i.key_pressed(egui::Key::Enter));
                        if (btn.clicked() || enter_pressed) && can_submit {
                            self.settings.nickname = self.welcome_nickname.trim().to_string();
                            if !self.welcome_party.trim().is_empty() {
                                self.settings.party_room = Some(self.welcome_party.trim().to_string());
                            } else {
                                self.settings.party_room = None;
                            }
                            local::save_settings(&self.settings);
                        }
                    });
                });
            });
        });
    }

    fn do_kill(&mut self, mvp: &ExpandedMvp, death_time: Option<i64>, death_map: Option<String>, death_position: Option<MapMark>) {
        let mut new_entry = mvp.clone();
        new_entry.death_time = Some(death_time.unwrap_or(self.now_epoch_ms));
        new_entry.death_map = death_map;
        new_entry.death_position = death_position;
        let key = mvp.key();
        self.active_mvps.retain(|m| m.key() != key);
        self.active_mvps.push(new_entry);
        sort_mvps_by_respawn_time_active(&mut self.active_mvps);
        self.persist();
    }

    fn remove_entry(&mut self, key: &str) {
        self.active_mvps.retain(|m| m.key() != key);
        self.persist();
    }

    fn back_to_wait(&mut self, key: &str) {
        if let Some(m) = self.active_mvps.iter_mut().find(|m| m.key() == key) {
            m.death_time = None;
            m.is_pinned = true;
        }
        self.persist();
    }

    fn persist(&self) {
        let mvps: Vec<Mvp> = self.active_mvps.iter().map(|em| em.to_mvp()).collect();
        local::save_mvps(&self.settings.server, &mvps);
    }

    fn load_icon(&mut self, ctx: &egui::Context, id: u32, size: u32) -> Option<TextureHandle> {
        let key = format!("icon_{}", id);
        let path = exe_dir().join(format!("assets/icons/{}.png", id));
        load_texture_cached(ctx, &mut self.icon_textures, true, &key, &path, size)
    }

    fn show_settings_modal(&mut self, ctx: &egui::Context) {
        let mut open = self.show_settings;
        let mut close_request = false;
        egui::Window::new("⚙ Settings")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .open(&mut open)
            .show(ctx, |ui| {
                ui.label("Server:");
                ui.horizontal_wrapped(|ui| {
                    for &server in SERVERS {
                        let is_sel = self.settings.server == server;
                        if ui.selectable_label(is_sel, RichText::new(server).size(11.0)).clicked() {
                            self.settings.server = server.to_string();
                        }
                    }
                });

                ui.add_space(8.0);
                ui.checkbox(&mut self.settings.use_24_hour_format, "24-hour format");
                ui.checkbox(&mut self.settings.show_mvp_map, "Show MVP map");
                ui.checkbox(&mut self.settings.animated_sprites, "Animated sprites");
                ui.checkbox(&mut self.settings.notification_sound, "Notification sound");

                ui.add_space(8.0);
                let a = &mut self.settings.card_bg_alpha;
                ui.label(format!("Card BG opacity: {}%", (*a as u32 * 100 / 255)));
                let mut val = *a as f32;
                if ui.add(egui::Slider::new(&mut val, 0.0..=255.0).show_value(false)).changed() {
                    *a = val.round() as u8;
                }

                ui.add_space(16.0);
                ui.horizontal(|ui| {
                    if ui.button("Save").clicked() {
                        local::save_settings(&self.settings);
                        self.all_server_mvps = load_server_data(&self.settings.server);
                        let saved = local::load_mvps(&self.settings.server);
                        self.active_mvps = rehydrate_saved(&saved, &self.all_server_mvps);
                        close_request = true;
                    }
                    if ui.button("Cancel").clicked() {
                        close_request = true;
                    }
                });

                let escape = ui.input(|i| i.key_pressed(egui::Key::Escape));
                if escape {
                    close_request = true;
                }
                let enter = ui.input(|i| i.key_pressed(egui::Key::Enter));
                if enter {
                    local::save_settings(&self.settings);
                    self.all_server_mvps = load_server_data(&self.settings.server);
                    let saved = local::load_mvps(&self.settings.server);
                    self.active_mvps = rehydrate_saved(&saved, &self.all_server_mvps);
                    close_request = true;
                }
            });
        if close_request {
            open = false;
        }
        self.show_settings = open;
    }

    fn show_profile_modal(&mut self, ctx: &egui::Context) {
        let mut open = self.show_profile;
        let mut close_request = false;
        let in_party = self.settings.party_room.is_some();
        let party_name = self.settings.party_room.clone().unwrap_or_default();

        egui::Window::new("⚙ Party Settings")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .open(&mut open)
            .show(ctx, |ui| {
                // Status banner
                if in_party {
                    ui.colored_label(Color32::from_rgb(33, 150, 243),
                        RichText::new(format!("👥 Party: {}", party_name)).strong().size(14.0));
                } else {
                    ui.colored_label(Color32::from_rgb(76, 175, 80),
                        RichText::new("👤 Solo Mode").strong().size(14.0));
                }
                ui.add_space(12.0);

                // Nickname
                ui.label("ชื่อของคุณ:");
                ui.text_edit_singleline(&mut self.profile_nickname);

                ui.add_space(8.0);

                // Party
                ui.label("ชื่อ Party:");
                ui.text_edit_singleline(&mut self.profile_party);

                ui.add_space(4.0);
                if ui.button("🎮 เข้า Party").clicked() {
                    let p = self.profile_party.trim().to_uppercase();
                    if !p.is_empty() {
                        self.settings.party_room = Some(p);
                        local::save_settings(&self.settings);
                        close_request = true;
                    }
                }

                // Leave Party (only if in party)
                if in_party {
                    ui.add_space(8.0);
                    if ui.button(RichText::new("🚪 ออกจาก Party").color(Color32::from_rgb(244, 67, 54))).clicked() {
                        self.settings.party_room = None;
                        local::save_settings(&self.settings);
                        close_request = true;
                    }
                }

                ui.add_space(16.0);
                ui.separator();
                ui.add_space(8.0);

                // Save nickname
                if ui.button("💾 บันทึกชื่อ").clicked() {
                    let nn = self.profile_nickname.trim().to_string();
                    if !nn.is_empty() {
                        self.settings.nickname = nn;
                        local::save_settings(&self.settings);
                        close_request = true;
                    }
                }

                ui.add_space(16.0);
                ui.separator();
                ui.add_space(8.0);

                // Logout
                if self.confirm_logout {
                    ui.colored_label(Color32::from_rgb(244, 67, 54), "ต้องการออกจากระบบจริงหรือ?");
                    ui.horizontal(|ui| {
                        if ui.button(RichText::new("ออกจากระบบ").color(Color32::from_rgb(244, 67, 54))).clicked() {
                            self.settings.nickname = String::new();
                            self.settings.party_room = None;
                            local::save_settings(&self.settings);
                            self.active_mvps.clear();
                            self.confirm_logout = false;
                            close_request = true;
                        }
                        if ui.button("ยกเลิก").clicked() {
                            self.confirm_logout = false;
                        }
                    });
                } else {
                    if ui.button(RichText::new("🚪 ออกจากระบบ").color(Color32::from_rgb(244, 67, 54))).clicked() {
                        self.confirm_logout = true;
                    }
                }

                let escape = ui.input(|i| i.key_pressed(egui::Key::Escape));
                if escape {
                    close_request = true;
                }
            });
        if close_request {
            open = false;
            self.confirm_logout = false;
        }
        self.show_profile = open;
    }

    fn init_dt_from_epoch(&mut self, epoch_ms: i64) {
        if !self.dt_initialized {
            let dt = chrono::DateTime::from_timestamp_millis(epoch_ms)
                .map(|utc| utc.with_timezone(&chrono::Local))
                .unwrap_or_else(chrono::Local::now);
            self.dt_day = dt.format("%d").to_string();
            self.dt_month = dt.format("%m").to_string();
            self.dt_year = dt.format("%Y").to_string();
            self.dt_hour = dt.format("%H").to_string();
            self.dt_minute = dt.format("%M").to_string();
            self.dt_focused = 0;
            self.dt_initialized = true;
        }
    }

    fn reset_dt_picker(&mut self) {
        self.dt_day = String::new();
        self.dt_month = String::new();
        self.dt_year = String::new();
        self.dt_hour = String::new();
        self.dt_minute = String::new();
        self.dt_focused = 0;
        self.dt_initialized = false;
        self.dt_edited = false;
    }

    fn dt_parse(&self) -> Option<chrono::NaiveDateTime> {
        let d: u32 = self.dt_day.parse().ok()?;
        let m: u32 = self.dt_month.parse().ok()?;
        let y: i32 = self.dt_year.parse().ok()?;
        let h: u32 = self.dt_hour.parse().ok()?;
        let min: u32 = self.dt_minute.parse().ok()?;
        chrono::NaiveDate::from_ymd_opt(y, m, d)
            .and_then(|date| date.and_hms_opt(h, min, 0))
    }

    fn dt_set_from_epoch(&mut self, epoch_ms: i64) {
        if let Some(dt) = chrono::DateTime::from_timestamp_millis(epoch_ms) {
            let local = dt.with_timezone(&chrono::Local);
            self.dt_day = local.format("%d").to_string();
            self.dt_month = local.format("%m").to_string();
            self.dt_year = local.format("%Y").to_string();
            self.dt_hour = local.format("%H").to_string();
            self.dt_minute = local.format("%M").to_string();
        }
    }

    fn show_dt_picker(&mut self, ui: &mut egui::Ui) -> DtPickerResponse {
        let mut resp = DtPickerResponse::default();
        let dt_focused = self.dt_focused;

        let sep = |ui: &mut egui::Ui, s: &str| {
            ui.label(RichText::new(s).size(16.0).color(Color32::from_gray(120)));
        };

        let field = |ui: &mut egui::Ui, val: &mut String, placeholder: &str, max_len: usize, idx: usize| -> egui::Response {
            let field_id = egui::Id::new(format!("dt_field_{}", idx));
            let width = if max_len == 4 { 48.0 } else { 30.0 };
            let mut text = val.clone();
            let response = ui.add(
                egui::TextEdit::singleline(&mut text)
                    .desired_width(width)
                    .hint_text(RichText::new(placeholder).color(Color32::from_gray(80)))
                    .font(egui::FontId::proportional(16.0))
                    .id(field_id),
            );
            *val = text;
            response
        };

        ui.horizontal(|ui| {
            field(ui, &mut self.dt_day, "DD", 2, 0);
            sep(ui, "/");
            field(ui, &mut self.dt_month, "MM", 2, 1);
            sep(ui, "/");
            field(ui, &mut self.dt_year, "YYYY", 4, 2);
            ui.add_space(12.0);
            field(ui, &mut self.dt_hour, "HH", 2, 3);
            sep(ui, ":");
            field(ui, &mut self.dt_minute, "mm", 2, 4);
        });

        // Update focus from rendered widgets
        for idx in 0..5usize {
            let field_id = egui::Id::new(format!("dt_field_{}", idx));
            if ui.memory(|mem| mem.has_focus(field_id)) {
                self.dt_focused = idx;
            }
        }

        // Handle keyboard input
        let focused = self.dt_focused;
        let input = ui.input(|i| {
            (
                i.key_pressed(egui::Key::ArrowUp),
                i.key_pressed(egui::Key::ArrowDown),
                i.key_pressed(egui::Key::Tab),
                i.modifiers.shift,
                i.key_pressed(egui::Key::Enter),
                i.key_pressed(egui::Key::Escape),
            )
        });

        resp.parsed = self.dt_parse();

        if input.5 {
            resp.escape = true;
            return resp;
        }
        if input.4 {
            resp.enter = true;
            return resp;
        }

        if input.0 || input.1 {
            let delta = if input.0 { 1 } else { -1 };
            self.dt_adjust_focused(delta);
        }

        if input.2 {
            if input.3 {
                if focused > 0 {
                    self.dt_focused = focused - 1;
                }
            } else if focused < 4 {
                self.dt_focused = focused + 1;
            } else {
                resp.tab_out = true;
            }
        }

        resp.parsed = self.dt_parse();
        resp
    }

    fn dt_adjust_focused(&mut self, delta: i32) {
        self.dt_edited = true;
        let min_year = 2020i32;
        let max_year = 2035i32;

        match self.dt_focused {
            0 => {
                // Day - clamp against actual days in month
                let mut d: i32 = self.dt_day.parse().unwrap_or(1);
                let m: u32 = self.dt_month.parse().unwrap_or(1);
                let y: i32 = self.dt_year.parse().unwrap_or(chrono::Local::now().year());
                let max_days = chrono::NaiveDate::from_ymd_opt(y, m, 1)
                    .map(|d| d.num_days_in_month() as i32)
                    .unwrap_or(31);
                d = (d + delta).clamp(1, max_days);
                self.dt_day = format!("{:02}", d);
            }
            1 => {
                // Month
                let mut m: i32 = self.dt_month.parse().unwrap_or(1);
                m = (m + delta).clamp(1, 12);
                self.dt_month = format!("{:02}", m);
            }
            2 => {
                // Year
                let mut y: i32 = self.dt_year.parse().unwrap_or(chrono::Local::now().year());
                y = (y + delta).clamp(min_year, max_year);
                self.dt_year = format!("{}", y);
            }
            3 => {
                // Hour
                let mut h: i32 = self.dt_hour.parse().unwrap_or(0);
                h = (h + delta).rem_euclid(24);
                self.dt_hour = format!("{:02}", h);
            }
            _ => {
                // Minute
                let mut m: i32 = self.dt_minute.parse().unwrap_or(0);
                m = (m + delta).rem_euclid(60);
                self.dt_minute = format!("{:02}", m);
            }
        }
    }

    fn show_kill_modal(&mut self, ctx: &egui::Context, mvp: &ExpandedMvp) {
        let mut open = self.show_kill_modal.is_some();
        let mut close_request = false;
        let mut do_confirm = false;
        let mut confirm_time: Option<i64> = None;
        let mut confirm_map: Option<String> = None;
        let mut confirm_position: Option<MapMark> = None;

        // Global Enter/Escape (like webapp's window.addEventListener)
        // Skip Enter if modal was just opened this frame (prevents button click leaking into modal confirm)
        let global_enter = if self.kill_modal_just_opened {
            false
        } else {
            ctx.input(|i| i.key_pressed(egui::Key::Enter))
        };
        self.kill_modal_just_opened = false;
        let global_escape = ctx.input(|i| i.key_pressed(egui::Key::Escape));

        if global_escape {
            self.show_kill_modal = None;
            self.kill_modal_position = None;
            self.kill_modal_selected_map = None;
            self.reset_dt_picker();
            return;
        }
        if global_enter {
            do_confirm = true;
        }

        let selected_map = self.kill_modal_selected_map.clone()
            .unwrap_or_else(|| mvp.death_map.clone().unwrap_or_else(|| mvp.spawn.mapname.clone()));

        egui::Window::new(format!("💀 Kill {}", mvp.name))
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .open(&mut open)
            .show(ctx, |ui| {
                // Name + Sprite (like webapp)
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new(&mvp.name).strong().size(16.0).color(Color32::from_rgb(147, 112, 219)));
                    let key = format!("icon_{}", mvp.id);
                    let path = exe_dir().join(format!("assets/icons/{}.png", mvp.id));
                    if let Some(tex) = load_texture_cached(ctx, &mut self.icon_textures, true, &key, &path, 80) {
                        ui.image((tex.id(), tex.size_vec2()));
                    }
                });

                ui.add_space(8.0);

                // Question: "When was killed?" (like webapp)
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new("When was it killed?").size(14.0).color(Color32::from_gray(200)));
                    ui.label(RichText::new("(optional, default: now)").size(10.0).color(Color32::from_gray(120)));
                });
                ui.add_space(4.0);

                // Date time picker (already initialized from CardAction::Kill)
                let dt_resp = self.show_dt_picker(ui);

                if dt_resp.escape {
                    close_request = true;
                    return;
                }
                if dt_resp.enter {
                    do_confirm = true;
                }

                ui.add_space(4.0);
                ui.label(
                    RichText::new("↑↓ adjust | Tab next field | Enter confirm | Esc cancel")
                        .size(9.0)
                        .color(Color32::from_gray(100)),
                );

                ui.add_space(8.0);

                // Map selection for multiple spawns
                if mvp.all_spawns.len() > 1 {
                    ui.label(RichText::new("Select map:").size(11.0).color(Color32::from_gray(180)));
                    ui.add_space(2.0);
                    ui.horizontal_wrapped(|ui| {
                        for spawn in &mvp.all_spawns {
                            let is_sel = spawn.mapname == selected_map;
                            if ui.selectable_label(is_sel, &spawn.mapname).clicked() {
                                self.kill_modal_selected_map = Some(spawn.mapname.clone());
                            }
                        }
                    });
                    ui.add_space(4.0);
                }

                // Question: "Where's the tombstone?" (like webapp)
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new("Where's the tombstone?").size(14.0).color(Color32::from_gray(200)));
                    ui.label(RichText::new("(optional: click to mark)").size(10.0).color(Color32::from_gray(120)));
                });
                ui.add_space(4.0);

                // Clickable map image (256x256)
                let map_key = format!("kill_map_{}_{}", mvp.id, selected_map);
                let map_path = exe_dir().join(format!("assets/maps/{}.png", selected_map));
                if let Some(tex) = load_texture_cached(ctx, &mut self.map_textures, false, &map_key, &map_path, 256) {
                    let resp = ui.add(
                        egui::Image::new((tex.id(), tex.size_vec2()))
                            .max_size(egui::vec2(256.0, 256.0))
                            .sense(egui::Sense::click()),
                    );

                    // Draw tombstone at death_position
                    if let Some(ref pos) = self.kill_modal_position {
                        let rect = resp.rect;
                        let img_w = rect.width();
                        let img_h = rect.height();
                        let screen_x = rect.left() + (pos.x as f32 / 512.0) * img_w;
                        let screen_y = rect.top() + (pos.y as f32 / 512.0) * img_h;
                        let painter = ui.painter();
                        painter.circle_filled(egui::pos2(screen_x, screen_y), 8.0, Color32::from_rgba_premultiplied(200, 0, 0, 200));
                        painter.text(egui::pos2(screen_x, screen_y), egui::Align2::CENTER_CENTER, "†", egui::FontId::proportional(14.0), Color32::WHITE);
                    }

                    // Click to set position
                    if resp.clicked() {
                        if let Some(pointer_pos) = resp.interact_pointer_pos() {
                            let rect = resp.rect;
                            let img_w = rect.width();
                            let img_h = rect.height();
                            let mx = ((pointer_pos.x - rect.left()) / img_w * 512.0).round() as f64;
                            let my = ((pointer_pos.y - rect.top()) / img_h * 512.0).round() as f64;
                            self.kill_modal_position = Some(MapMark { x: mx, y: my });
                        }
                    }
                }

                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    ui.label(RichText::new("ENTER confirm").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("•").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("ESC close").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("•").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("TAB loop fields").size(9.0).color(Color32::from_gray(100)));
                });

                ui.add_space(8.0);

                // Confirm buttons
                ui.horizontal(|ui| {
                    let parsed_time = dt_resp.parsed;
                    let confirm_clicked = ui.button(
                        RichText::new("Confirm").size(14.0).color(Color32::WHITE).strong()
                    ).clicked() || do_confirm;
                    if confirm_clicked && !selected_map.is_empty() {
                        // Webapp behavior: use edited time if user changed it, otherwise "now" at confirm moment
                        let dt = if self.dt_edited {
                            parsed_time
                                .and_then(|n| n.and_local_timezone(chrono::Local).single())
                                .map(|dt| dt.timestamp_millis())
                                .unwrap_or(self.now_epoch_ms)
                        } else {
                            self.now_epoch_ms
                        };
                        confirm_time = Some(dt);
                        confirm_map = Some(selected_map.clone());
                        confirm_position = self.kill_modal_position.clone();
                        close_request = true;
                    }
                    if ui.button("Cancel").clicked() {
                        close_request = true;
                    }
                });
            });

        if close_request || !open {
            if let Some(dt) = confirm_time {
                self.do_kill(mvp, Some(dt), confirm_map.clone(), confirm_position.clone());
            }
            self.show_kill_modal = None;
            self.kill_modal_position = None;
            self.kill_modal_selected_map = None;
            self.reset_dt_picker();
        }
    }

    fn show_edit_modal(&mut self, ctx: &egui::Context, mvp: &ExpandedMvp) {
        let mut open = self.show_edit_modal.is_some();
        let mut close_request = false;
        let mut do_save = false;
        let edit_mvp = mvp.clone();

        // Global Enter/Escape (like webapp's useKey)
        // Skip Enter if modal was just opened this frame
        let global_enter = if self.edit_modal_just_opened {
            false
        } else {
            ctx.input(|i| i.key_pressed(egui::Key::Enter))
        };
        self.edit_modal_just_opened = false;
        let global_escape = ctx.input(|i| i.key_pressed(egui::Key::Escape));

        if global_escape {
            self.show_edit_modal = None;
            self.reset_dt_picker();
            self.edit_modal_position = None;
            self.edit_modal_selected_map = None;
            return;
        }
        if global_enter {
            do_save = true;
        }

        egui::Window::new(format!("✏ Edit {}", mvp.name))
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .open(&mut open)
            .show(ctx, |ui| {
                // Name + Sprite (like webapp)
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new(&mvp.name).strong().size(16.0).color(Color32::from_rgb(147, 112, 219)));
                    let key = format!("icon_{}", mvp.id);
                    let path = exe_dir().join(format!("assets/icons/{}.png", mvp.id));
                    if let Some(tex) = load_texture_cached(ctx, &mut self.icon_textures, true, &key, &path, 80) {
                        ui.image((tex.id(), tex.size_vec2()));
                    }
                });

                ui.add_space(8.0);

                // Question: "When was killed?"
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new("When was it killed?").size(14.0).color(Color32::from_gray(200)));
                });
                ui.add_space(4.0);

                // Date time picker
                let dt_resp = self.show_dt_picker(ui);

                // Check DTPicker's own Enter/Escape too
                if dt_resp.escape {
                    close_request = true;
                    return;
                }
                if dt_resp.enter {
                    do_save = true;
                }

                ui.add_space(4.0);
                ui.label(
                    RichText::new("↑↓ adjust | Tab next field | Enter save | Esc cancel")
                        .size(9.0)
                        .color(Color32::from_gray(100)),
                );

                ui.add_space(8.0);

                // Question: "Where's the tombstone?"
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new("Where's the tombstone?").size(14.0).color(Color32::from_gray(200)));
                    ui.label(RichText::new("(optional: click to mark)").size(10.0).color(Color32::from_gray(120)));
                });
                ui.add_space(4.0);

                // Map selection for multiple spawns
                let selected_map = self.edit_modal_selected_map.clone()
                    .unwrap_or_else(|| mvp.death_map.clone().unwrap_or_else(|| mvp.spawn.mapname.clone()));

                if mvp.all_spawns.len() > 1 {
                    ui.label(RichText::new("Change map:").size(11.0).color(Color32::from_gray(180)));
                    ui.add_space(2.0);
                    ui.horizontal_wrapped(|ui| {
                        for spawn in &mvp.all_spawns {
                            let is_sel = spawn.mapname == selected_map;
                            if ui.selectable_label(is_sel, &spawn.mapname).clicked() {
                                self.edit_modal_selected_map = Some(spawn.mapname.clone());
                            }
                        }
                    });
                    ui.add_space(4.0);
                }

                // Clickable map image (256x256)
                let map_key = format!("edit_map_{}_{}", mvp.id, selected_map);
                let map_path = exe_dir().join(format!("assets/maps/{}.png", selected_map));
                if let Some(tex) = load_texture_cached(ctx, &mut self.map_textures, false, &map_key, &map_path, 256) {
                    let resp = ui.add(
                        egui::Image::new((tex.id(), tex.size_vec2()))
                            .max_size(egui::vec2(256.0, 256.0))
                            .sense(egui::Sense::click()),
                    );

                    // Draw tombstone at current position
                    if let Some(ref pos) = self.edit_modal_position {
                        let rect = resp.rect;
                        let img_w = rect.width();
                        let img_h = rect.height();
                        let screen_x = rect.left() + (pos.x as f32 / 512.0) * img_w;
                        let screen_y = rect.top() + (pos.y as f32 / 512.0) * img_h;
                        let painter = ui.painter();
                        painter.circle_filled(egui::pos2(screen_x, screen_y), 8.0, Color32::from_rgba_premultiplied(200, 0, 0, 200));
                        painter.text(egui::pos2(screen_x, screen_y), egui::Align2::CENTER_CENTER, "†", egui::FontId::proportional(14.0), Color32::WHITE);
                    }

                    // Click to set position
                    if resp.clicked() {
                        if let Some(pointer_pos) = resp.interact_pointer_pos() {
                            let rect = resp.rect;
                            let img_w = rect.width();
                            let img_h = rect.height();
                            let mx = ((pointer_pos.x - rect.left()) / img_w * 512.0).round() as f64;
                            let my = ((pointer_pos.y - rect.top()) / img_h * 512.0).round() as f64;
                            self.edit_modal_position = Some(MapMark { x: mx, y: my });
                        }
                    }
                }

                ui.add_space(12.0);

                // Confirm buttons
                ui.horizontal(|ui| {
                    let enter_pressed = do_save;
                    let parsed_time = dt_resp.parsed;
                    let save_clicked = ui.button(
                        RichText::new("Confirm").size(14.0).color(Color32::WHITE).strong()
                    ).clicked() || enter_pressed;
                    if save_clicked {
                        if let Some(new_time) = parsed_time {
                            if let Some(em) = self.active_mvps.iter_mut().find(|m| m.key() == edit_mvp.key()) {
                                em.death_time = Some(new_time.and_local_timezone(chrono::Local).unwrap().timestamp_millis());
                                em.death_position = self.edit_modal_position.clone();
                                if let Some(ref map) = self.edit_modal_selected_map {
                                    em.death_map = Some(map.clone());
                                    if let Some(new_spawn) = em.all_spawns.iter().find(|s| &s.mapname == map).cloned() {
                                        em.spawn = new_spawn;
                                    }
                                }
                            }
                            self.persist();
                        }
                        close_request = true;
                    }
                    if ui.button("Cancel").clicked() {
                        close_request = true;
                    }
                });

                // Keyboard hints
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    ui.label(RichText::new("ESC close").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("•").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("ENTER confirm").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("•").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("TAB loop fields").size(9.0).color(Color32::from_gray(100)));
                });
            });

        if close_request || !open {
            self.show_edit_modal = None;
            self.reset_dt_picker();
            self.edit_modal_position = None;
            self.edit_modal_selected_map = None;
        }
    }

    fn show_map_modal(&mut self, ctx: &egui::Context, mvp: &ExpandedMvp) {
        let mut open = self.show_map_modal.is_some();
        let mut close_request = false;
        let mut do_confirm = false;
        let mvp_clone = mvp.clone();

        // Global Enter/Escape (like webapp)
        // Skip Enter if modal was just opened this frame
        let global_enter = if self.map_modal_just_opened {
            false
        } else {
            ctx.input(|i| i.key_pressed(egui::Key::Enter))
        };
        self.map_modal_just_opened = false;
        let global_escape = ctx.input(|i| i.key_pressed(egui::Key::Escape));

        if global_escape {
            self.show_map_modal = None;
            return;
        }
        if global_enter {
            do_confirm = true;
        }

        let current_map = mvp.death_map.clone().unwrap_or_else(|| mvp.spawn.mapname.clone());

        egui::Window::new(format!("🗺 {} — {}", mvp.name, current_map))
            .collapsible(false)
            .resizable(false)
            .default_size([512.0, 560.0])
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .open(&mut open)
            .show(ctx, |ui| {
                // Name
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new(&mvp.name).strong().size(16.0).color(Color32::from_rgb(147, 112, 219)));
                });
                ui.add_space(4.0);

                // Question (like webapp)
                ui.vertical_centered(|ui| {
                    ui.label(RichText::new("Where's the tombstone?").size(14.0).color(Color32::from_gray(200)));
                    ui.label(RichText::new("(optional: click to mark)").size(10.0).color(Color32::from_gray(120)));
                });
                ui.add_space(4.0);

                // Map image (using cached texture)
                let key = format!("modal_map_{}", current_map);
                let path = exe_dir().join(format!("assets/maps/{}.png", current_map));
                if let Some(tex) = load_texture_cached(ctx, &mut self.map_textures, false, &key, &path, 512) {
                    let resp = ui.add(
                        egui::Image::new((tex.id(), tex.size_vec2()))
                            .max_size(egui::vec2(512.0, 512.0))
                            .sense(egui::Sense::click()),
                    );

                    // Draw tombstone at death_position
                    if let Some(ref pos) = mvp.death_position {
                        let rect = resp.rect;
                        let img_w = rect.width();
                        let img_h = rect.height();
                        let screen_x = rect.left() + (pos.x as f32 / 512.0) * img_w;
                        let screen_y = rect.top() + (pos.y as f32 / 512.0) * img_h;
                        let painter = ui.painter();
                        painter.circle_filled(egui::pos2(screen_x, screen_y), 10.0, Color32::from_rgba_premultiplied(200, 0, 0, 200));
                        painter.text(egui::pos2(screen_x, screen_y), egui::Align2::CENTER_CENTER, "†", egui::FontId::proportional(18.0), Color32::WHITE);
                    }

                    // Click to set position (local, not persisted yet)
                    if resp.clicked() {
                        if let Some(pointer_pos) = resp.interact_pointer_pos() {
                            let rect = resp.rect;
                            let img_w = rect.width();
                            let img_h = rect.height();
                            let mx = ((pointer_pos.x - rect.left()) / img_w * 512.0).round() as f64;
                            let my = ((pointer_pos.y - rect.top()) / img_h * 512.0).round() as f64;
                            let new_pos = MapMark { x: mx, y: my };
                            // Store temporarily - will be saved on confirm
                            self.kill_modal_position = Some(new_pos);
                        }
                    }
                } else {
                    ui.label("Map image not found");
                }

                ui.add_space(8.0);

                // Confirm / Cancel buttons
                ui.horizontal(|ui| {
                    let confirm_clicked = ui.button(
                        RichText::new("Confirm").size(14.0).color(Color32::WHITE).strong()
                    ).clicked() || do_confirm;
                    if confirm_clicked {
                        // Persist the death position
                        let key = mvp_clone.key();
                        let pos = self.kill_modal_position.clone().or_else(|| mvp_clone.death_position.clone());
                        if let Some(em) = self.active_mvps.iter_mut().find(|m| m.key() == key) {
                            em.death_position = pos;
                            self.persist();
                        }
                        close_request = true;
                    }
                    if ui.button("Cancel").clicked() {
                        close_request = true;
                    }
                });

                // Keyboard hints
                ui.add_space(4.0);
                ui.horizontal(|ui| {
                    ui.label(RichText::new("ESC close").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("•").size(9.0).color(Color32::from_gray(100)));
                    ui.label(RichText::new("ENTER confirm").size(9.0).color(Color32::from_gray(100)));
                });
            });

        if close_request || !open {
            self.show_map_modal = None;
        }
    }
}

fn sort_mvps_by_respawn_time_active(mvps: &mut [ExpandedMvp]) {
    mvps.sort_by(|a, b| {
        let a_time = a.death_time.unwrap_or(0) + a.spawn.respawn_time as i64;
        let b_time = b.death_time.unwrap_or(0) + b.spawn.respawn_time as i64;
        a_time.cmp(&b_time)
    });
}
