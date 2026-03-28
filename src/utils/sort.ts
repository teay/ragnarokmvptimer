import dayjs from 'dayjs';
import { getMvpRespawnTime } from './index';

function getFastestRespawn(mvp: IMvp) {
  if (!mvp.spawn || mvp.spawn.length === 0) return 0;
  return Math.min(...mvp.spawn.map((i) => i.respawnTime));
}

function getActualRespawnTime(mvp: IMvp) {
  if (mvp.deathTime) {
    return dayjs(mvp.deathTime).add(getMvpRespawnTime(mvp), 'ms').valueOf();
  }
  return getFastestRespawn(mvp);
}

export function sortBy(field?: string) {
  if (!field || field === 'none') {
    return (a: IMvp, b: IMvp) => a.id - b.id;
  }

  if (['level', 'health', 'baseExperience', 'jobExperience'].includes(field)) {
    return (a: IMvp, b: IMvp) => a.stats[field] - b.stats[field];
  }

  if (field === 'respawnTime') {
    return (a: IMvp, b: IMvp) => getActualRespawnTime(a) - getActualRespawnTime(b);
  }

  if (field === 'name') {
    return (a: IMvp, b: IMvp) => a.name.localeCompare(b.name);
  }

  return (a: IMvp, b: IMvp) => (a as any)[field] - (b as any)[field];
}
