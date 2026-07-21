use crate::data::mvp::Mvp;

pub fn rehydrate_mvps(remote_mvps: &[Mvp], original_all: &[Mvp]) -> Vec<Mvp> {
    if original_all.is_empty() {
        return remote_mvps.to_vec();
    }

    remote_mvps
        .iter()
        .map(|remote| {
            if let Some(original) = original_all.iter().find(|o| o.id == remote.id) {
                let filtered_spawn = if let Some(ref death_map) = remote.death_map {
                    let specific: Vec<_> = original
                        .spawn
                        .iter()
                        .filter(|s| s.mapname == *death_map)
                        .cloned()
                        .collect();
                    if !specific.is_empty() {
                        specific
                    } else {
                        original.spawn.clone()
                    }
                } else {
                    original.spawn.clone()
                };

                Mvp {
                    id: original.id,
                    dbname: original.dbname.clone(),
                    name: original.name.clone(),
                    spawn: filtered_spawn,
                    stats: original.stats.clone(),
                    death_time: remote.death_time,
                    death_map: remote.death_map.clone(),
                    death_position: remote.death_position.clone(),
                    is_pinned: remote.is_pinned,
                    updated_at: remote.updated_at,
                }
            } else {
                remote.clone()
            }
        })
        .collect()
}
