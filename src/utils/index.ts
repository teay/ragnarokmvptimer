import type { Dayjs } from 'dayjs';

import Question from '../assets/question.gif';

// Explicitly import and map assets based on actual file extensions found
const mapImages = import.meta.glob('../assets/mvp_maps/*.png', { eager: true, import: 'default' });
const mvpIcons = import.meta.glob('../assets/mvp_icons/*.png', { eager: true, import: 'default' });
const animatedMvpIcons = import.meta.glob('../assets/mvp_icons_animated/*.{png,gif}', { eager: true, import: 'default' });

/**
 * Robust asset path resolver that works in both dev and production
 */
function resolveAsset(glob: Record<string, any>, key: string | number): string {
  const target = String(key);
  const path = Object.keys(glob).find(p => {
    const parts = p.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    return filename === target;
  });
  
  return path ? (glob[path] as string) : Question;
}

export function getMapImage(mapName: string): string {
  return resolveAsset(mapImages, mapName);
}

export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (animated) {
    return resolveAsset(animatedMvpIcons, mvpId);
  }
  return resolveAsset(mvpIcons, mvpId);
}

export async function getServerData(server: string): Promise<IMvp[]> {
  const data = await import(`../data/${server}.json`);
  return data.default;
}

export function formatTime(duration: number): string {
  const absDuration = Math.abs(duration);
  const seconds = Math.floor((absDuration / 1000) % 60);
  const minutes = Math.floor((absDuration / (1000 * 60)) % 60);
  const hours = Math.floor((absDuration / (1000 * 60 * 60)) % 24);

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  return `${minutesStr}:${secondsStr}`;
}

/**
 * Returns the death map MINIMUM respawn time in milliseconds.
 */
export function getMvpRespawnTime(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;
  const deathMap = mvp.spawn.find((spawn) => spawn && spawn.mapname === mvp.deathMap);
  return deathMap?.respawnTime || 0;
}

/**
 * Returns the death map MAXIMUM respawn window in milliseconds (spread).
 * Default to 10 minutes if not specified in data.
 */
export function getMvpRespawnWindow(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;
  const deathMap = mvp.spawn.find((spawn) => spawn && spawn.mapname === mvp.deathMap);
  
  // Try to get explicit window from data, otherwise default to 10 minutes
  const window = (deathMap as any)?.window;
  return window !== undefined ? window : (10 * 60 * 1000); 
}

export function clearData() {
  localStorage.clear();
}
