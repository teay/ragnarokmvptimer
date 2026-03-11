import dayjs from 'dayjs';
import { readTextFile, writeTextFile, exists, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { getServerData } from '@/utils';

const DATA_FILENAME = 'mvps_data.json';

export const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

async function getFilePath() {
  const appDataDirPath = await appDataDir();
  return await join(appDataDirPath, DATA_FILENAME);
}

export async function loadMvpsFromFileSystem(): Promise<Record<string, any> | null> {
  if (!isTauri()) return null;
  try {
    const filePath = await getFilePath();
    const fileExists = await exists(filePath);
    if (!fileExists) return null;

    const data = await readTextFile(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load mvps from file system', error);
    return null;
  }
}

export async function saveMvpsToFileSystem(data: any) {
  if (!isTauri()) return;
  try {
    const appDataDirPath = await appLocalDataDir();
    const fileExists = await exists(appDataDirPath);
    if (!fileExists) {
      await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
    }
    
    const filePath = await getFilePath();
    await writeTextFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save mvps to file system', error);
  }
}

export async function loadMvpsFromLocalStorage(
  server: string
): Promise<IMvp[]> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (!data) return [];

    const dataParse = JSON.parse(data);
    if (!dataParse) return [];

    const savedServerData = dataParse[server];

    const hasSavedServerData = !!savedServerData;
    if (!hasSavedServerData) return [];

    const originalServerData = await getServerData(server);

    const finalData = savedServerData.map((mvp: IMvp) => ({
      ...originalServerData.find((m) => m.id === mvp.id),
      deathMap: mvp.deathMap,
      deathPosition: mvp.deathPosition,
      deathTime: dayjs(mvp.deathTime).toDate(),
    }));

    return finalData;
  } catch (error) {
    console.error('Failed to load mvps from local storage', error);
    return [];
  }
}

export function saveActiveMvpsToLocalStorage(
  activeMvps: IMvp[],
  server: string
) {
  const data = activeMvps?.map((mvp) => ({
    id: mvp.id,
    deathMap: mvp.deathMap,
    deathTime: mvp.deathTime,
    deathPosition: mvp.deathPosition,
  }));

  const currentLocalMvps = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);

  const currentData = currentLocalMvps ? JSON.parse(currentLocalMvps) : {};

  const updatedActiveData = {
    ...currentData,
    [server]: data,
  };

  Object.keys(updatedActiveData).forEach(
    (key) => !isNaN(Number(key)) && delete updatedActiveData[key]
  );

  const dataString = JSON.stringify(updatedActiveData);
  localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, dataString);
  
  // If in Tauri, also save to file system automatically
  if (isTauri()) {
    saveMvpsToFileSystem(updatedActiveData);
  }
}
