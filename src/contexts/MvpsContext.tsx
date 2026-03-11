import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import dayjs from 'dayjs';

import { useSettings } from './SettingsContext';

import { getMvpRespawnTime, getServerData } from '../utils';
import {
  loadMvpsFromLocalStorage,
  saveActiveMvpsToLocalStorage,
  loadMvpsFromFileSystem,
  saveMvpsToFileSystem,
  isTauri,
  loadMvpsFromWebFolder,
  saveMvpsToWebFolder,
  pickWebDataFolder,
} from '@/controllers/mvp';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';

interface MvpProviderProps {
  children: ReactNode;
}

interface SyncConflict {
  browser: any;
  file: any;
  servers: string[];
}

interface MvpsContextData {
  activeMvps: IMvp[];
  allMvps: IMvp[];
  editingMvp: IMvp | undefined;
  editingTimeMvp: IMvp | undefined;
  killingMvp: IMvp | undefined;
  syncConflict: SyncConflict | undefined;
  isLoading: boolean;
  webDirectoryHandle: any | undefined;
  resetMvpTimer: (mvp: IMvp) => void;
  killMvp: (mvp: IMvp, time?: Date | null) => void;
  updateMvp: (mvp: IMvp, time?: Date | null) => void;
  updateMvpDeathLocation: (
    mvpId: number,
    oldDeathMap: string,
    newDeathMap: string,
    newDeathPosition: IMapMark
  ) => void;
  removeMvpByMap: (mvpID: number, deathMap: string) => void;
  setEditingMvp: (mvp: IMvp) => void;
  closeEditMvpModal: () => void;
  setEditingTimeMvp: (mvp: IMvp) => void;
  closeEditTimeMvpModal: () => void;
  setKillingMvp: (mvp: IMvp) => void;
  closeKillMvpModal: () => void;
  handleSyncChoice: (choices: Record<string, 'browser' | 'file'>) => void;
  connectWebFolder: () => Promise<void>;
  disconnectWebFolder: () => void;
}

export const MvpsContext = createContext({} as MvpsContextData);

function sortMvpsByRespawnTime(mvps: IMvp[]): IMvp[] {
  return mvps.sort((a: IMvp, b: IMvp) => {
    const bothHaveDeathTime = a.deathTime && b.deathTime;
    if (!bothHaveDeathTime) {
      return 0;
    }
    return dayjs(a.deathTime)
      .add(getMvpRespawnTime(a), 'ms')
      .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
  });
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { server } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [syncConflict, setSyncConflict] = useState<SyncConflict>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);
  const [webDirectoryHandle, setWebDirectoryHandle] = useState<any>();

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date(), deathPosition: undefined };
    setActiveMvps((state) => {
      const newState = sortMvpsByRespawnTime(state.map((m) => (m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m)));
      saveActiveMvpsToLocalStorage(newState, server, webDirectoryHandle);
      return newState;
    });
  }, [server, webDirectoryHandle]);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap);
      saveActiveMvpsToLocalStorage(newState, server, webDirectoryHandle);
      return sortMvpsByRespawnTime(newState);
    });
  }, [server, webDirectoryHandle]);

  const killMvp = useCallback((mvp: IMvp, deathTime = new Date()) => {
    setActiveMvps((s) => {
      const killedMvp = {
        ...mvp,
        deathTime,
      };

      const existingMvpIndex = s.findIndex(
        (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
      );

      let newState;
      if (existingMvpIndex !== -1) {
        newState = [...s];
        newState[existingMvpIndex] = killedMvp;
      } else {
        newState = [...s, killedMvp];
      }

      saveActiveMvpsToLocalStorage(newState, server, webDirectoryHandle);

      return sortMvpsByRespawnTime(newState);
    });
  }, [server, webDirectoryHandle]);

  const updateMvp = useCallback((mvp: IMvp, deathTime = mvp.deathTime) => {
    setActiveMvps((s) => {
      const updatedMvp = {
        ...mvp,
        deathTime,
      };

      const existingMvpIndex = s.findIndex(
        (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
      );

      let newState;
      if (existingMvpIndex !== -1) {
        newState = [...s];
        newState[existingMvpIndex] = updatedMvp;
      } else {
        newState = [...s, updatedMvp];
      }

      saveActiveMvpsToLocalStorage(newState, server, webDirectoryHandle);

      return sortMvpsByRespawnTime(newState);
    });
  }, [server, webDirectoryHandle]);

  const updateMvpDeathLocation = useCallback(
    (
      mvpId: number,
      oldDeathMap: string,
      newDeathMap: string,
      newDeathPosition: IMapMark
    ) => {
      setActiveMvps((s) => {
        const existingMvpIndex = s.findIndex(
          (m) => m.id === mvpId && m.deathMap === oldDeathMap
        );

        if (existingMvpIndex === -1) return s;

        const updatedMvp = {
          ...s[existingMvpIndex],
          deathMap: newDeathMap,
          deathPosition: newDeathPosition,
        };

        const newState = [...s];
        newState[existingMvpIndex] = updatedMvp;

        saveActiveMvpsToLocalStorage(newState, server, webDirectoryHandle);

        return sortMvpsByRespawnTime(newState);
      });
    },
    [server, webDirectoryHandle]
  );

  const closeEditMvpModal = useCallback(() => {
    setEditingMvp(undefined);
  }, []);

  const closeEditTimeMvpModal = useCallback(() => {
    setEditingTimeMvp(undefined);
  }, []);

  const closeKillMvpModal = useCallback(() => {
    setKillingMvp(undefined);
  }, []);

  const handleSyncChoice = useCallback(async (choices: Record<string, 'browser' | 'file'>) => {
    try {
      if (!syncConflict) return;

      const mergedData = { ...syncConflict.browser };
      
      Object.entries(choices).forEach(([serverName, choice]) => {
        if (choice === 'file') {
          mergedData[serverName] = syncConflict.file[serverName];
        }
      });

      localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, JSON.stringify(mergedData));
      if (isTauri()) {
        await saveMvpsToFileSystem(mergedData);
      } else if (webDirectoryHandle) {
        await saveMvpsToWebFolder(webDirectoryHandle, mergedData);
      }

      const savedActiveMvps = await loadMvpsFromLocalStorage(server);
      setActiveMvps(sortMvpsByRespawnTime(savedActiveMvps || []));
      setSyncConflict(undefined);
    } catch (err) {
      console.error('Error handling sync choice', err);
      setSyncConflict(undefined);
    }
  }, [syncConflict, server, webDirectoryHandle]);

  const connectWebFolder = async () => {
    try {
      const handle = await pickWebDataFolder();
      if (handle) {
        setWebDirectoryHandle(handle);
        const fileData = await loadMvpsFromWebFolder(handle);
        const browserDataRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
        const browserData = browserDataRaw ? JSON.parse(browserDataRaw) : null;
        
        if (fileData && browserData) {
          const conflictServers: string[] = [];
          const allServers = new Set([...Object.keys(fileData), ...Object.keys(browserData)]);
          allServers.forEach(s => {
            if (JSON.stringify(fileData[s]) !== JSON.stringify(browserData[s])) {
              conflictServers.push(s);
            }
          });
          if (conflictServers.length > 0) {
            setSyncConflict({ browser: browserData, file: fileData, servers: conflictServers });
          }
        } else if (!fileData) {
          await saveMvpsToWebFolder(handle, browserData || {});
        }
      }
    } catch (err) {
      console.error('Error connecting web folder', err);
    }
  };

  const disconnectWebFolder = () => {
    setWebDirectoryHandle(undefined);
  };

  const allMvps = useMemo(() => {
    const activeMvpKeys = new Set(
      activeMvps.map((mvp) => `${mvp.id}-${mvp.deathMap}`)
    );

    const inactiveMvps = originalAllMvps
      .flatMap((mvp) =>
        mvp.spawn.map((spawn) => ({
          ...mvp,
          spawn: [spawn],
          deathMap: spawn.mapname,
        }))
      )
      .filter((mvp) => !activeMvpKeys.has(`${mvp.id}-${mvp.deathMap}`))
      .map((mvp) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deathTime, ...rest } = mvp;
        return rest;
      });

    return inactiveMvps;
  }, [activeMvps, originalAllMvps]);

  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        if (isTauri()) {
          const fileData = await loadMvpsFromFileSystem();
          const browserDataRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
          const browserData = browserDataRaw ? JSON.parse(browserDataRaw) : null;

          if (fileData && browserData) {
            const conflictServers: string[] = [];
            const allServers = new Set([...Object.keys(fileData), ...Object.keys(browserData)]);
            allServers.forEach(s => {
              if (JSON.stringify(fileData[s]) !== JSON.stringify(browserData[s])) {
                conflictServers.push(s);
              }
            });

            if (conflictServers.length > 0) {
              setSyncConflict({ browser: browserData, file: fileData, servers: conflictServers });
            }
          } else if (fileData && !browserData) {
            localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, JSON.stringify(fileData));
          } else if (!fileData && browserData) {
            await saveMvpsToFileSystem(browserData);
          }
        }
      } catch (err) {
        console.error('Initial sync failed, but app will continue loading', err);
      }

      try {
        const savedActiveMvps = await loadMvpsFromLocalStorage(server);
        setActiveMvps(sortMvpsByRespawnTime(savedActiveMvps || []));
      } catch (err) {
        console.error('Failed to load local storage data', err);
      }
      setIsLoading(false);
    }
    initData();
  }, [server]);

  useEffect(() => {
    if (isLoading) return;

    async function loadOriginalAllMvps() {
      try {
        const data = await getServerData(server);
        setOriginalAllMvps(data);
      } catch (err) {
        console.error('Failed to fetch server data', err);
      }
    }
    loadOriginalAllMvps();
  }, [server, isLoading]);

  return (
    <MvpsContext.Provider
      value={{
        activeMvps,
        allMvps,
        editingMvp,
        editingTimeMvp,
        killingMvp,
        syncConflict,
        isLoading,
        webDirectoryHandle,
        resetMvpTimer,
        killMvp,
        updateMvp,
        updateMvpDeathLocation,
        removeMvpByMap,
        setEditingMvp,
        closeEditMvpModal,
        setEditingTimeMvp,
        closeEditTimeMvpModal,
        setKillingMvp,
        closeKillMvpModal,
        handleSyncChoice,
        connectWebFolder,
        disconnectWebFolder,
      }}
    >
      {children}
    </MvpsContext.Provider>
  );
}

export function useMvpsContext() {
  const context = useContext(MvpsContext);
  if (!context) {
    throw new Error('useMvpsContext must be used within a MvpProvider');
  }
  return context;
}
