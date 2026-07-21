use crate::data::mvp::Mvp;
use crate::core::timer::get_mvp_respawn_time;

pub fn sort_mvps_by_respawn_time(mvps: &mut Vec<Mvp>) {
    mvps.sort_by(|a, b| {
        let a_has_dt = a.death_time.is_some();
        let b_has_dt = b.death_time.is_some();

        if !a_has_dt && !b_has_dt {
            return a.name.cmp(&b.name);
        }
        if !a_has_dt {
            return std::cmp::Ordering::Greater;
        }
        if !b_has_dt {
            return std::cmp::Ordering::Less;
        }

        let eta_a = a.death_time.unwrap() + get_mvp_respawn_time(a) as i64;
        let eta_b = b.death_time.unwrap() + get_mvp_respawn_time(b) as i64;
        eta_a.cmp(&eta_b)
    });
}
