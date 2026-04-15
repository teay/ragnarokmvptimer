import dayjs from 'dayjs';
import { getMvpRespawnTime } from './index';

function getFastestRespawn(mvp: IMvp) {
  if (!mvp.spawn || mvp.spawn.length === 0) return 0;
  return Math.min(...mvp.spawn.map((i) => i.respawnTime));
}

function getActualRespawnTime(mvp: IMvp) {
  if (mvp.deathTime) {
    // Priority 1: Use specific respawnTime if available (from rehydrated data)
    const respawnMs = mvp.respawnTime || getMvpRespawnTime(mvp) || 0;
    return dayjs(mvp.deathTime).add(respawnMs, 'ms').valueOf();
  }
  // Priority 2: Use fastest spawn for unkilled bosses
  return getFastestRespawn(mvp);
}

export function sortBy(field?: string) {
  if (!field || field === 'none') {
    return (a: IMvp, b: IMvp) => a.id - b.id;
  }

  if (['level', 'health', 'baseExperience', 'jobExperience'].includes(field)) {
    const statsField = field as keyof IMvp['stats'];
    return (a: IMvp, b: IMvp) => a.stats[statsField] - b.stats[statsField];
  }

  if (field === 'respawnTime') {
    return (a: IMvp, b: IMvp) =>
      getActualRespawnTime(a) - getActualRespawnTime(b);
  }

  if (field === 'name') {
    return (a: IMvp, b: IMvp) => a.name.localeCompare(b.name);
  }

  const mvpField = field as keyof IMvp;
  return (a: IMvp, b: IMvp) => {
    const valA = a[mvpField];
    const valB = b[mvpField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    return 0;
  };
}
