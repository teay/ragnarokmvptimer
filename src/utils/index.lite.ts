import { IMvp } from '../types';
import {
  formatTime,
  formatTimeOfDay,
  getMvpRespawnTime,
  getMvpRespawnWindow,
  clearData,
} from './shared';

export { formatTime, formatTimeOfDay, getMvpRespawnTime, getMvpRespawnWindow, clearData };

// Animated icons that are GIF format (not APNG)
const animatedGifIds = new Set([1511,1583,1623,1630,1658,1685,1688,1719,1734,1751,1768,1785,1832,1871,1885,1917,2068,2087,2156,2202,2249,2251,2253,2255,2362,2441,2442,2483,3741]);

export function getMapImage(mapName: string): string {
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
