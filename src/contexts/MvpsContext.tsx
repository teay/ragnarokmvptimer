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

import { database, ref, set, get, onValue } from '@/services/firebase';
import { getMvpRespawnTime, getServerData } from '../utils';
import {
  loadMvpsFromLocalStorage,
  saveActiveMvpsToLocalStorage,
} from '@/controllers/mvp';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY, LOCAL_STORAGE_BACKUPS_KEY, MAX_BACKUPS } from '@/constants';

interface MvpProviderProps {
  children: ReactNode;
}

interface MvpsContextData {
  activeMvps: IMvp[];
  allMvps: IMvp[];
  editingMvp: IMvp | undefined;
  editingTimeMvp: IMvp | undefined;
  killingMvp: IMvp | undefined;
  isLoading: boolean;
  dataLocation: 'local' | 'online' | 'ghost' | 'warning';
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
  saveMvps: (mvps: IMvp[]) => void;
  leaveParty: (saveToLocal: boolean) => void;
  backups: IMvpBackup[];
  createBackup: (type: 'AUTO' | 'MANUAL', description: string) => void;
  restoreBackup: (backupId: string) => void;
  deleteBackup: (backupId: string) => void;
}

export const MvpsContext = createContext({} as MvpsContextData);

/**
 * Safety-guarded Sort Function
 * Ensures we don't crash if spawn data is missing.
 */
function sortMvpsByRespawnTime(mvps: IMvp[]): IMvp[] {
  if (!mvps) return [];
  
  return [...mvps].sort((a: IMvp, b: IMvp) => {
    // 1. Basic existence checks
    if (!a || !b) return 0;
    
    // 2. Check for deathTime (the basis of sorting)
    const bothHaveDeathTime = a.deathTime && b.deathTime;
    if (!bothHaveDeathTime) return 0;
    
    // 3. CRITICAL: Check for spawn data existence before calling utility
    if (!a.spawn || !Array.isArray(a.spawn) || !b.spawn || !Array.isArray(b.spawn)) {
      return 0;
    }

    try {
      const respawnA = getMvpRespawnTime(a) || 0;
      const respawnB = getMvpRespawnTime(b) || 0;
      
      const timeA = dayjs(a.deathTime).add(respawnA, 'ms');
      const timeB = dayjs(b.deathTime).add(respawnB, 'ms');
      
      return timeA.diff(timeB);
    } catch (e) {
      console.warn('Sorting error for MVPs:', { a, b, error: e });
      return 0;
    }
  });
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { 
    server, partyRoom, changePartyRoom, localSaveEnabled, toggleLocalSave, cloudSyncEnabled 
  } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);
  const [backups, setBackups] = useState<IMvpBackup[]>([]);

  const dataLocation: 'local' | 'online' | 'ghost' | 'warning' = !localSaveEnabled 
    ? 'warning' 
    : (partyRoom ? (cloudSyncEnabled ? 'online' : 'ghost') : 'local');

  const rehydrateMvps = useCallback((mvps: any[]) => {
    if (!mvps) return [];
    
    return mvps.map(mvp => {
      if (!mvp) return mvp;
      
      const original = originalAllMvps.find(o => o && Number(o.id) === Number(mvp.id));
      if (original) {
        const deathTime = mvp.deathTime ? new Date(mvp.deathTime) : undefined;
        // Try to find the specific spawn for the map it died on
        const specificSpawn = original.spawn ? original.spawn.filter(s => s && s.mapname === mvp.deathMap) : [];
        return { 
          ...original, 
          ...mvp, 
          deathTime,
          spawn: specificSpawn.length > 0 ? specificSpawn : original.spawn 
        };
      }
      return mvp;
    });
  }, [originalAllMvps]);

  const loadBackups = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
    if (saved) {
      try {
        setBackups(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse backups', e);
      }
    }
  }, []);

  const createBackup = useCallback((type: 'AUTO' | 'MANUAL', description: string) => {
    const allLocalDataRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (!allLocalDataRaw) return;

    try {
      const allLocalData = JSON.parse(allLocalDataRaw);
      const serverData = allLocalData[server] || [];

      const newBackup: IMvpBackup = {
        id: dayjs().valueOf().toString(),
        timestamp: dayjs().toISOString(),
        type, description, data: allLocalData, bossCount: serverData.length, server,
      };

      setBackups(prev => {
        const updated = [newBackup, ...prev].slice(0, MAX_BACKUPS);
        localStorage.setItem(LOCAL_STORAGE_BACKUPS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Backup creation failed', e);
    }
  }, [server]);

  const restoreBackup = useCallback((backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;
    if (window.confirm(`Restore backup from ${dayjs(backup.timestamp).format('DD/MM HH:mm')}? This overwrites CURRENT local data.`)) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, JSON.stringify(backup.data));
      const serverMvps = backup.data[server] || [];
      const rehydrated = rehydrateMvps(serverMvps);
      setActiveMvps(sortMvpsByRespawnTime(rehydrated));
      alert('Data restored successfully!');
    }
  }, [backups, server, rehydrateMvps]);

  const deleteBackup = useCallback((backupId: string) => {
    setBackups(prev => {
      const updated = prev.filter(b => b.id !== backupId);
      localStorage.setItem(LOCAL_STORAGE_BACKUPS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveMvps = useCallback(async (mvps: IMvp[]) => {
    if (!mvps) return;
    const rehydrated = rehydrateMvps(mvps);
    setActiveMvps(sortMvpsByRespawnTime(rehydrated));
    if (localSaveEnabled) saveActiveMvpsToLocalStorage(rehydrated, server);
    if (partyRoom && cloudSyncEnabled) {
      console.log(`☁️ Syncing to Cloud...`);
      const serverRef = ref(database, `parties/${partyRoom}/${server}`);
      const minimalMvps = rehydrated.map(m => ({
        id: m.id,
        deathTime: m.deathTime ? (m.deathTime instanceof Date ? m.deathTime.toISOString() : m.deathTime) : null,
        deathMap: m.deathMap || null,
        deathPosition: m.deathPosition || null,
      }));
      set(serverRef, { mvps: minimalMvps });
    }
  }, [partyRoom, server, rehydrateMvps, localSaveEnabled, cloudSyncEnabled]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  // Firebase Real-time Listener
  useEffect(() => {
    if (!partyRoom) return;
    const mvpsRef = ref(database, `parties/${partyRoom}/${server}/mvps`);
    
    const unsubscribe = onValue(mvpsRef, async (snapshot) => {
      const data = snapshot.val();
      const remoteMvpsRaw = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
      
      // Safety: Only proceed with complex merge if originalAllMvps is ready
      if (originalAllMvps.length === 0) {
        setActiveMvps(remoteMvpsRaw as IMvp[]);
        return;
      }

      const rehydratedRemote = rehydrateMvps(remoteMvpsRaw);

      let allLocal: any = {};
      try {
        const allLocalRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
        allLocal = allLocalRaw ? JSON.parse(allLocalRaw) : {};
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
      
      const localForServer = allLocal[server] || [];

      // Smart Merge Listener Logic
      const remoteKeys = new Set(rehydratedRemote.map(m => m ? `${m.id}-${m.deathMap}` : ''));
      const uniqueLocal = localForServer.filter((m: any) => m && !remoteKeys.has(`${m.id}-${m.deathMap}`));

      const mergedResult = [...rehydratedRemote, ...uniqueLocal];
      const sortedMerged = sortMvpsByRespawnTime(mergedResult);

      setActiveMvps(sortedMerged);

      if (localSaveEnabled) {
        saveActiveMvpsToLocalStorage(sortedMerged, server);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [partyRoom, server, originalAllMvps, rehydrateMvps, localSaveEnabled]);

  // Effect to handle case where originalAllMvps loads AFTER Firebase data
  useEffect(() => {
    if (partyRoom && originalAllMvps.length > 0 && activeMvps.length > 0 && isLoading) {
      const mergedMvps = rehydrateMvps(activeMvps);
      setActiveMvps(sortMvpsByRespawnTime(mergedMvps));
      setIsLoading(false);
    } else if (partyRoom && originalAllMvps.length > 0 && activeMvps.length === 0 && isLoading) {
      setIsLoading(false);
    }
  }, [originalAllMvps, partyRoom, rehydrateMvps, activeMvps, isLoading]);

  useEffect(() => {
    if (partyRoom && cloudSyncEnabled && activeMvps.length > 0) saveMvps(activeMvps);
  }, [cloudSyncEnabled]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!localSaveEnabled) {
        e.preventDefault();
        e.returnValue = 'Data saving is currently paused!';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [localSaveEnabled]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      if (partyRoom) return;
      const savedActiveMvps = await loadMvpsFromLocalStorage(server);
      setActiveMvps(sortMvpsByRespawnTime(savedActiveMvps || []));
      setIsLoading(false);
    }
    init();
  }, [server, partyRoom]);

  useEffect(() => {
    async function loadOriginalAllMvps() {
      const data = await getServerData(server);
      setOriginalAllMvps(data);
    }
    loadOriginalAllMvps();
  }, [server]);

  const leaveParty = useCallback((saveToLocal: boolean) => {
    if (saveToLocal) {
      const rehydrated = rehydrateMvps(activeMvps);
      saveActiveMvpsToLocalStorage(rehydrated, server);
      setActiveMvps(sortMvpsByRespawnTime(rehydrated));
    } else {
      loadMvpsFromLocalStorage(server).then(saved => {
        setActiveMvps(sortMvpsByRespawnTime(saved || []));
      });
    }
    changePartyRoom(null);
    if (!localSaveEnabled) toggleLocalSave();
    setTimeout(() => setIsLoading(false), 100);
  }, [activeMvps, server, changePartyRoom, rehydrateMvps, localSaveEnabled, toggleLocalSave]);

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date(), deathPosition: undefined };
    setActiveMvps((state) => {
      const newState = state.map((m) => (m && m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m));
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => m && (mvpID !== m.id || m.deathMap !== deathMap));
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const killMvp = useCallback((mvp: IMvp, deathTime = new Date()) => {
    setActiveMvps((s) => {
      const killedMvp = { ...mvp, deathTime };
      const existingMvpIndex = s.findIndex((m) => m && m.id === mvp.id && m.deathMap === mvp.deathMap);
      let newState = existingMvpIndex !== -1 ? [...s] : [...s, killedMvp];
      if (existingMvpIndex !== -1) newState[existingMvpIndex] = killedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const updateMvp = useCallback((mvp: IMvp, deathTime = mvp.deathTime) => {
    setActiveMvps((s) => {
      const updatedMvp = { ...mvp, deathTime };
      const existingMvpIndex = s.findIndex((m) => m && m.id === mvp.id && m.deathMap === mvp.deathMap);
      let newState = existingMvpIndex !== -1 ? [...s] : [...s, updatedMvp];
      if (existingMvpIndex !== -1) newState[existingMvpIndex] = updatedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const updateMvpDeathLocation = useCallback((mvpId: number, oldDeathMap: string, newDeathMap: string, newDeathPosition: IMapMark) => {
    setActiveMvps((s) => {
      const existingMvpIndex = s.findIndex((m) => m && m.id === mvpId && m.deathMap === oldDeathMap);
      if (existingMvpIndex === -1) return s;
      const updatedMvp = { ...s[existingMvpIndex], deathMap: newDeathMap, deathPosition: newDeathPosition };
      const newState = [...s];
      newState[existingMvpIndex] = updatedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const allMvps = useMemo(() => {
    const activeMvpKeys = new Set(activeMvps.map((mvp) => mvp ? `${mvp.id}-${mvp.deathMap}` : ''));
    return originalAllMvps
      .flatMap((mvp) => (mvp && mvp.spawn) ? mvp.spawn.map((spawn) => ({ ...mvp, spawn: [spawn], deathMap: spawn.mapname })) : [])
      .filter((mvp) => mvp && !activeMvpKeys.has(`${mvp.id}-${mvp.deathMap}`))
      .map(({ deathTime, ...rest }) => rest);
  }, [activeMvps, originalAllMvps]);

  return (
    <MvpsContext.Provider value={{
      activeMvps, allMvps, editingMvp, editingTimeMvp, killingMvp, resetMvpTimer, killMvp, updateMvp,
      updateMvpDeathLocation, removeMvpByMap, setEditingMvp, closeEditMvpModal: () => setEditingMvp(undefined),
      setEditingTimeMvp, closeEditTimeMvpModal: () => setEditingTimeMvp(undefined), setKillingMvp,
      closeKillMvpModal: () => setKillingMvp(undefined), isLoading, dataLocation, saveMvps, leaveParty,
      backups, createBackup, restoreBackup, deleteBackup
    }}>
      {children}
    </MvpsContext.Provider>
  );
}

export function useMvpsContext() {
  const context = useContext(MvpsContext);
  if (!context) throw new Error('useMvpsContext must be used within a MvpProvider');
  return context;
}
