import { IMvp } from '../types';
import {
  formatTime,
  formatTimeOfDay,
  getMvpRespawnTime,
  getMvpRespawnWindow,
  clearData,
} from './shared';

export { formatTime, formatTimeOfDay, getMvpRespawnTime, getMvpRespawnWindow, clearData };

// Animated GIF icons (not APNG)
const animatedGifIds = new Set([1511,1583,1623,1630,1658,1685,1688,1719,1734,1751,1768,1785,1832,1871,1885,1917,2068,2087,2156,2202,2249,2251,2253,2255,2362,2441,2442,2483,3741]);

// Animated APNG icons (same .png extension as static, but overwritten by animated version in public/)
const animatedApngIds = new Set([1038,1039,1046,1059,1086,1087,1112,1115,1147,1150,1157,1159,1190,1251,1252,1272,1312,1373,1389,1418,1492,2165,3074,3505,3633,20381,20419,20421,20422,20601,20610,20611,20618,20648,20928,20934,20943]);

// Combined set for quick lookup
const allAnimatedIds = new Set([...animatedGifIds, ...animatedApngIds]);

export function getMapImage(mapName: string): string {
  return `/maps/${mapName}.png`;
}

export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (animated && allAnimatedIds.has(mvpId)) {
    if (animatedGifIds.has(mvpId)) {
      return `/icons/${mvpId}.gif`;
    }
    // APNG: stored in /icons/anim/ to avoid conflict with static PNG
    return `/icons/anim/${mvpId}.png`;
  }
  return `/icons/${mvpId}.png`;
}

export async function getServerData(server: string): Promise<IMvp[]> {
  const data = await import(`../data/${server}.json`);
  return data.default;
}
