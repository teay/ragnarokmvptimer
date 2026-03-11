import dayjs from 'dayjs';
import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { getServerData } from '@/utils';

const DATA_FILENAME = 'mvps_data.json';

export const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

// --- Tauri Specific Functions ---

export async function loadMvpsFromFileSystem(): Promise<Record<string, any> | null> {
  if (!isTauri()) return null;
  try {
    const fileExists = await exists(DATA_FILENAME, { baseDir: BaseDirectory.AppLocalData });
    if (!fileExists) return null;

    const data = await readTextFile(DATA_FILENAME, { baseDir: BaseDirectory.AppLocalData });
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load mvps from file system', error);
    return null;
  }
}

export async function saveMvpsToFileSystem(data: any) {
  if (!isTauri()) return;
  try {
    await writeTextFile(DATA_FILENAME, JSON.stringify(data, null, 2), { 
      baseDir: BaseDirectory.AppLocalData 
    });
  } catch (error) {
    console.error('Failed to save mvps to file system', error);
  }
}

// --- Web Specific Functions (File System Access API) ---

export const canUseWebFolderSync = () => 'showDirectoryPicker' in window;

export async function pickWebDataFolder() {
  try {
    const directoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });
    return directoryHandle;
  } catch (error) {
    console.error('Failed to pick directory', error);
    return null;
  }
}

export async function loadMvpsFromWebFolder(directoryHandle: any): Promise<Record<string, any> | null> {
  if (!directoryHandle) return null;
  try {
    const fileHandle = await directoryHandle.getFileHandle(DATA_FILENAME, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

export async function saveMvpsToWebFolder(directoryHandle: any, data: any) {
  if (!directoryHandle) return;
  try {
    const fileHandle = await directoryHandle.getFileHandle(DATA_FILENAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (error) {
    console.error('Failed to save to web folder', error);
  }
}

// --- General Local Storage Functions ---

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
  server: string,
  directoryHandle?: any // Optional handle for web sync
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
  
  if (isTauri()) {
    saveMvpsToFileSystem(updatedActiveData);
  }
  
  if (directoryHandle) {
    saveMvpsToWebFolder(directoryHandle, updatedActiveData);
  }
}
