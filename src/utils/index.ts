import type { Dayjs } from 'dayjs';

import Question from '../assets/question.gif';

// Explicitly import and map assets to ensure they work in production
const mapImages = import.meta.glob('../assets/mvp_maps/*.webp', { eager: true, import: 'default' });
const mvpIcons = import.meta.glob('../assets/mvp_icons/*.webp', { eager: true, import: 'default' });
const animatedMvpIcons = import.meta.glob('../assets/mvp_icons_animated/*.webp', { eager: true, import: 'default' });

/**
 * Robust asset path resolver that works in both dev and production
 */
function resolveAsset(glob: Record<string, any>, key: string | number): string {
  const target = String(key);
  // Look through the glob keys for a filename match
  const path = Object.keys(glob).find(p => {
    const parts = p.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    return filename === target;
  });
  
  return path ? (glob[path] as string) : Question;
}

/**
 * Returns the map image.
 * @param mapName map name
 * @returns map image
 */
export function getMapImage(mapName: string): string {
  return resolveAsset(mapImages, mapName);
}

/**
 * Returns the mvp icon.
 * @param mvpId mvp id
 * @param animated whether to return the animated icon
 * @returns mvp icon
 */
export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (animated) {
    return resolveAsset(animatedMvpIcons, mvpId);
  }
  return resolveAsset(mvpIcons, mvpId);
}

/**
 * Loads the server data from the json files.
 * @param server server name
 * @returns server data
 */
export async function getServerData(server: string): Promise<IMvp[]> {
  const data = await import(`../data/${server}.json`);
  return data.default;
}

/**
 * Format the time to hh:mm:ss
 * @param duration duration in milliseconds
 * @returns formatted time
 */
export function formatTime(duration: number): string {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const hoursStr = hours < 10 ? `0${hours}` : hours;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const secondsStr = seconds < 10 ? `0${seconds}` : seconds;

  if (hours > 0) {
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  return `${minutesStr}:${secondsStr}`;
}

/**
 * Returns the death map respawn time in milliseconds.
 * @param mvp Mvp object
 * @returns respawn time in milliseconds
 */
export function getMvpRespawnTime(mvp: IMvp): number | undefined {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;
  const deathMap = mvp.spawn.find((spawn) => spawn && spawn.mapname === mvp.deathMap);
  const respawnTime = deathMap?.respawnTime;
  return respawnTime;
}

/**
 * Clear the local storage
 */
export function clearData() {
  localStorage.clear();
}
