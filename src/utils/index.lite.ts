import Question from '../assets/question.gif';
import { IMvp } from '../types';

// In lite mode, all assets are served from public/ directory
// No import.meta.glob - assets loaded on demand

// Animated icons that are GIF format (not APNG)
const animatedGifIds = new Set([1511,1583,1623,1630,1658,1685,1688,1719,1734,1751,1768,1785,1832,1871,1885,1917,2068,2087,2156,2202,2249,2251,2253,2255,2362,2441,2442,2483,3741]);

export function getMapImage(mapName: string): string {
  // In dev mode (no /maps/ in public), use Vite's asset serving
  // In build mode, maps are in /maps/ directory
  return `/maps/${mapName}.png`;
}

export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (animated && animatedGifIds.has(mvpId)) {
    return `/icons/${mvpId}.gif`;
  }
  return `/icons/${mvpId}.png`;
}

export async function getServerData(server: string): Promise<IMvp[]> {
  const data = await import(`../data/${server}.json`);
  return data.default;
}

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

export function getMvpRespawnTime(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;
  const deathMap = mvp.spawn.find(
    (spawn) => spawn && spawn.mapname === mvp.deathMap
  );
  return deathMap?.respawnTime || 0;
}

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
