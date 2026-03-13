import type { Dayjs } from 'dayjs';

import Question from '../assets/question.gif';

// Map images
const mapImages = import.meta.glob('../assets/mvp_maps/*.webp', { eager: true, import: 'default' });
// MVP Icons
const mvpIcons = import.meta.glob('../assets/mvp_icons/*.webp', { eager: true, import: 'default' });
// Animated MVP Icons
const animatedMvpIcons = import.meta.glob('../assets/mvp_icons_animated/*.webp', { eager: true, import: 'default' });

function getAssetPath(glob: Record<string, any>, key: string | number): string {
  const entries = Object.entries(glob);
  const found = entries.find(([path]) => {
    const filename = path.split('/').pop()?.split('.')[0];
    return filename === String(key);
  });
  return found ? (found[1] as string) : Question;
}

/**
 * Returns the map image.
 * @param mapName map name
 * @returns map image
 */
export function getMapImage(mapName: string): string {
  return getAssetPath(mapImages, mapName);
}

/**
 * Returns the mvp icon.
 * @param mvpId mvp id
 * @param animated whether to return the animated icon
 * @returns mvp icon
 */
export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (animated) {
    return getAssetPath(animatedMvpIcons, mvpId);
  }
  return getAssetPath(mvpIcons, mvpId);
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
