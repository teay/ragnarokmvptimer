import Question from '../assets/question.gif';
import { IMvp } from '../types';
import {
  formatTime,
  formatTimeOfDay,
  getMvpRespawnTime,
  getMvpRespawnWindow,
  clearData,
} from './shared';

export { formatTime, formatTimeOfDay, getMvpRespawnTime, getMvpRespawnWindow, clearData };

declare const __LITE_MODE__: boolean;

// In full mode, eagerly load all assets
// In lite mode, use lazy loading for maps, skip icon preloading
const mapImages = __LITE_MODE__
  ? {}
  : import.meta.glob('../assets/mvp_maps/*.png', {
      eager: true,
      import: 'default',
    });

const mvpIcons = __LITE_MODE__
  ? {}
  : import.meta.glob('../assets/mvp_icons/*.png', {
      eager: true,
      import: 'default',
    });

const animatedMvpIcons = __LITE_MODE__
  ? {}
  : import.meta.glob(
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
  // In lite mode, maps are served from /maps/ directory
  if (__LITE_MODE__) {
    return `/maps/${mapName}.png`;
  }
  return resolveAsset(mapImages, mapName);
}

export function getMvpIcon(mvpId: number, animated?: boolean): string {
  if (__LITE_MODE__) {
    // In lite mode, serve icons from /icons/ directory
    return `/icons/${mvpId}.png`;
  }
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
