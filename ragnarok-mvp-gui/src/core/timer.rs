use crate::data::mvp::Mvp;

/// Format milliseconds duration as HH:MM:SS
pub fn format_time(duration_ms: i64) -> String {
    let abs_duration = duration_ms.abs();
    let seconds = (abs_duration / 1000) % 60;
    let minutes = (abs_duration / (1000 * 60)) % 60;
    let hours = abs_duration / (1000 * 60 * 60);

    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
}

/// Format time of day (24h or 12h)
pub fn format_time_of_day(time_str: &str, use_24_hour: bool) -> String {
    if use_24_hour {
        return time_str.to_string();
    }

    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() < 2 {
        return time_str.to_string();
    }

    let hours: i32 = parts[0].parse().unwrap_or(0);
    let suffix = if hours >= 12 { " PM" } else { " AM" };
    let h12 = if hours % 12 == 0 { 12 } else { hours % 12 };

    format!("{}:{}{}", h12, parts[1..].join(":"), suffix)
}

/// Get the respawn time (in ms) for the death map of an MVP
pub fn get_mvp_respawn_time(mvp: &Mvp) -> u64 {
    if let Some(ref death_map) = mvp.death_map {
        for spawn in &mvp.spawn {
            if spawn.mapname == *death_map {
                return spawn.respawn_time;
            }
        }
    }
    // Fallback: return first spawn's respawn time
    mvp.spawn.first().map(|s| s.respawn_time).unwrap_or(0)
}

/// Get the respawn window (spread) in ms for the death map
pub fn get_mvp_respawn_window(mvp: &Mvp) -> u64 {
    let default_window = 10 * 60 * 1000; // 10 minutes

    if let Some(ref death_map) = mvp.death_map {
        for spawn in &mvp.spawn {
            if spawn.mapname == *death_map {
                return spawn.window.unwrap_or(default_window);
            }
        }
    }
    mvp.spawn
        .first()
        .and_then(|s| s.window)
        .unwrap_or(default_window)
}

/// Get the earliest respawn time (death_time + respawn_time) in epoch ms
pub fn get_respawn_eta(mvp: &Mvp) -> Option<i64> {
    let death_time = mvp.death_time?;
    let respawn = get_mvp_respawn_time(mvp) as i64;
    Some(death_time + respawn)
}

/// Check if MVP has respawned (current time > respawn ETA)
pub fn has_respawned(mvp: &Mvp, now_epoch_ms: i64) -> bool {
    if let Some(eta) = get_respawn_eta(mvp) {
        now_epoch_ms >= eta
    } else {
        false
    }
}
