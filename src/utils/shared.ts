import { IMvp } from '../types';

/**
 * Format the time to ALWAYS be HH:mm:ss (e.g. 00:09:02)
 */
export function formatTime(duration: number): string {
  const absDuration = Math.abs(duration);
  const seconds = Math.floor((absDuration / 1000) % 60);
  const minutes = Math.floor((absDuration / (1000 * 60)) % 60);
  const hours = Math.floor(absDuration / (1000 * 60 * 60));

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

export function formatTimeOfDay(
  timeStr24: string,
  use24HourFormat: boolean
): string {
  if (use24HourFormat) return timeStr24;

  const [hStr, rest] = timeStr24.split(':');
  let hours = parseInt(hStr, 10);
  if (isNaN(hours)) return timeStr24;
  const suffix = hours >= 12 ? ' PM' : ' AM';
  hours = hours % 12 || 12;
  return `${hours}:${rest}${suffix}`;
}

/**
 * Returns the death map MINIMUM respawn time in milliseconds.
 */
export function getMvpRespawnTime(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;

  const deathMap = mvp.spawn.find(
    (spawn) => spawn && spawn.mapname === mvp.deathMap
  );

  return deathMap?.respawnTime || 0;
}

/**
 * Returns the death map MAXIMUM respawn window in milliseconds (spread).
 * Default to 10 minutes if not specified in data.
 */
export function getMvpRespawnWindow(mvp: IMvp): number {
  const DEFAULT_WINDOW = 10 * 60 * 1000;

  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return DEFAULT_WINDOW;

  const deathMap = mvp.spawn.find(
    (spawn) => spawn && spawn.mapname === mvp.deathMap
  );

  if (!deathMap) return DEFAULT_WINDOW;

  const window = deathMap.window;
  return typeof window === 'number' ? window : DEFAULT_WINDOW;
}

export function clearData() {
  localStorage.removeItem('activeMvps');
}
