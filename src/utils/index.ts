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
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const hoursStr = String(Math.abs(hours)).padStart(2, '0');
  const minutesStr = String(Math.abs(minutes)).padStart(2, '0');
  const secondsStr = String(Math.abs(seconds)).padStart(2, '0');

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
 * Most bosses have a spread, e.g. 10 minutes.
 */
export function getMvpRespawnWindow(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;
  const deathMap = mvp.spawn.find((spawn) => spawn && spawn.mapname === mvp.deathMap);
  // In many RO databases, there's a window (random time). 
  // If the JSON structure has 'window' or 'maxRespawnTime', use it.
  // For now, checking if 'window' exists in ISpawn interface (need to verify)
  return (deathMap as any)?.window || 0; 
}

export function clearData() {
  localStorage.clear();
}
