use crate::data::mvp::Mvp;
use crate::core::timer::get_mvp_respawn_time;

/// Sort MVPs by respawn time (soonest first).
/// - Active MVPs with deathTime are sorted by respawn ETA ascending
/// - Pinned/waiting MVPs (no deathTime) go to the bottom, sorted by name
pub fn sort_mvps_by_respawn_time(mvps: &mut Vec<Mvp>) {
    mvps.sort_by(|a, b| {
        let a_has_dt = a.death_time.is_some();
        let b_has_dt = b.death_time.is_some();

        // Both without deathTime -> sort by name
        if !a_has_dt && !b_has_dt {
            return a.name.cmp(&b.name);
        }
        // One without deathTime goes to bottom
        if !a_has_dt {
            return std::cmp::Ordering::Greater;
        }
        if !b_has_dt {
            return std::cmp::Ordering::Less;
        }

        // Both have deathTime -> sort by respawn ETA (soonest first)
        let respawn_a = get_mvp_respawn_time(a) as i64;
        let respawn_b = get_mvp_respawn_time(b) as i64;
        let eta_a = a.death_time.unwrap() + respawn_a;
        let eta_b = b.death_time.unwrap() + respawn_b;

        eta_a.cmp(&eta_b)
    });
}
