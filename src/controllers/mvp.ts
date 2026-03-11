import dayjs from 'dayjs';
import { readTextFile, writeTextFile, exists, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { getServerData } from '@/utils';

const DATA_FILENAME = 'mvps_data.json';

export const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

// --- Tauri Specific Functions ---

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
    const appDataDirPath = await appDataDir();
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
    // If file doesn't exist, it's fine
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
  
  // Save to Tauri File System if available
  if (isTauri()) {
    saveMvpsToFileSystem(updatedActiveData);
  }
  
  // Save to Web Folder if handle is provided
  if (directoryHandle) {
    saveMvpsToWebFolder(directoryHandle, updatedActiveData);
  }
}
