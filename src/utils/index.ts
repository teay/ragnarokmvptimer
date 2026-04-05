import Question from '../assets/question.gif';
import { IMvp } from '../types';

// Explicitly import and map assets based on actual file extensions found
const mapImages = import.meta.glob('../assets/mvp_maps/*.png', {
  eager: true,
  import: 'default',
});
const mvpIcons = import.meta.glob('../assets/mvp_icons/*.png', {
  eager: true,
  import: 'default',
});
const animatedMvpIcons = import.meta.glob(
  '../assets/mvp_icons_animated/*.{png,gif}',
  { eager: true, import: 'default' }
);

/**
 * Robust asset path resolver that works in both dev and production
 */
function resolveAsset(glob: Record<string, any>, key: string | number): string {
  const target = String(key);
  const path = Object.keys(glob).find((p) => {
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
    const animatedIcon = resolveAsset(animatedMvpIcons, mvpId);
    if (animatedIcon !== Question) {
      return animatedIcon;
    }
  }
  return resolveAsset(mvpIcons, mvpId);
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

/**
 * Returns the death map MINIMUM respawn time in milliseconds.
 */
export function getMvpRespawnTime(mvp: IMvp): number {
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return 0;

  // ค้นหาเฉพาะแมพที่ตรงกับ deathMap เท่านั้น
  const deathMap = mvp.spawn.find(
    (spawn) => spawn && spawn.mapname === mvp.deathMap
  );

  // ถ้าไม่เจอแมพที่ตรงกัน ให้คืนค่า 0 (ห้าม Fallback ไป spawn[0]) 
  // เพื่อให้ผ่านเทส: should return 0 if no matching mapname is found
  return deathMap?.respawnTime || 0;
}

/**
 * Returns the death map MAXIMUM respawn window in milliseconds (spread).
 * Default to 10 minutes if not specified in data.
 */
export function getMvpRespawnWindow(mvp: IMvp): number {
  const DEFAULT_WINDOW = 10 * 60 * 1000;
  
  if (!mvp || !mvp.spawn || !Array.isArray(mvp.spawn)) return DEFAULT_WINDOW;

  // ค้นหาเฉพาะแมพที่ตรงกับ deathMap
  const deathMap = mvp.spawn.find(
    (spawn) => spawn && spawn.mapname === mvp.deathMap
  );

  // ถ้าหาแมพไม่เจอ ให้คืนค่า DEFAULT_WINDOW (600,000) ทันที
  if (!deathMap) return DEFAULT_WINDOW;

  const window = deathMap.window;
  return typeof window === 'number' ? window : DEFAULT_WINDOW;
}

export function clearData() {
  localStorage.removeItem('activeMvps');
}