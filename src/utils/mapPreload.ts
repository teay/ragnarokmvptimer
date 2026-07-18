declare const __LITE_MODE__: boolean;

interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

type PreloadCallback = (progress: PreloadProgress) => void;

const preloadCache = new Map<string, boolean>();

/**
 * Preload all map images for a given server in the background.
 * Only runs in lite mode.
 */
export function preloadMaps(
  server: string,
  onProgress?: PreloadCallback
): Promise<void> {
  if (!__LITE_MODE__) return Promise.resolve();

  const cacheKey = `maps-${server}`;
  if (preloadCache.get(cacheKey)) {
    onProgress?.({ loaded: 100, total: 100, percentage: 100 });
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // Dynamic import of server data to get map list
    import(`../data/${server}.json`).then((data) => {
      const mvps = data.default;
      const mapNames = new Set<string>();

      mvps.forEach((mvp: any) => {
        if (mvp.spawn && Array.isArray(mvp.spawn)) {
          mvp.spawn.forEach((spawn: any) => {
            if (spawn.mapname) {
              mapNames.add(spawn.mapname);
            }
          });
        }
      });

      const maps = Array.from(mapNames);
      const total = maps.length;
      let loaded = 0;

      if (total === 0) {
        preloadCache.set(cacheKey, true);
        resolve();
        return;
      }

      maps.forEach((mapName, index) => {
        const img = new Image();
        img.onload = () => {
          loaded++;
          onProgress?.({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });

          if (loaded === total) {
            preloadCache.set(cacheKey, true);
            resolve();
          }
        };
        img.onerror = () => {
          loaded++;
          onProgress?.({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });

          if (loaded === total) {
            preloadCache.set(cacheKey, true);
            resolve();
          }
        };

        // Stagger load to not overwhelm bandwidth
        setTimeout(() => {
          img.src = `/maps/${mapName}.png`;
        }, index * 30);
      });
    });
  });
}

/**
 * Check if maps are preloaded for a server
 */
export function isMapsPreloaded(server: string): boolean {
  return preloadCache.get(`maps-${server}`) === true;
}
