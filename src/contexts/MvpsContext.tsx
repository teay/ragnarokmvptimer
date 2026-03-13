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

import { database, ref, set, onValue, off } from '@/services/firebase';
import { getMvpRespawnTime, getServerData } from '../utils';
import {
  loadMvpsFromLocalStorage,
  saveActiveMvpsToLocalStorage,
} from '@/controllers/mvp';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';

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
}

export const MvpsContext = createContext({} as MvpsContextData);

function sortMvpsByRespawnTime(mvps: IMvp[]): IMvp[] {
  return mvps.sort((a: IMvp, b: IMvp) => {
    const bothHaveDeathTime = a.deathTime && b.deathTime;
    if (!bothHaveDeathTime) {
      return 0;
    }
    
    // Safety check for spawn data
    const respawnA = getMvpRespawnTime(a) || 0;
    const respawnB = getMvpRespawnTime(b) || 0;
    
    return dayjs(a.deathTime)
      .add(respawnA, 'ms')
      .diff(dayjs(b.deathTime).add(respawnB, 'ms'));
  });
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { 
    server, 
    partyRoom, 
    changePartyRoom, 
    localSaveEnabled, 
    toggleLocalSave,
    cloudSyncEnabled 
  } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const dataLocation: 'local' | 'online' | 'ghost' | 'warning' = !localSaveEnabled 
    ? 'warning' 
    : (partyRoom ? (cloudSyncEnabled ? 'online' : 'ghost') : 'local');

  const rehydrateMvps = useCallback((mvps: any[]) => {
    return mvps.map(mvp => {
      const original = originalAllMvps.find(o => Number(o.id) === Number(mvp.id));
      if (original) {
        const deathTime = mvp.deathTime ? new Date(mvp.deathTime) : undefined;
        const specificSpawn = original.spawn.filter(s => s.mapname === mvp.deathMap);
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

  /**
   * Smart Merge Logic:
   * Merges a set of MVPs with the existing data in LocalStorage.
   * Remote/New data overwrites only matching entries.
   */
  const performSmartMerge = useCallback(async (newMvps: IMvp[]) => {
    const existingLocal = await loadMvpsFromLocalStorage(server);
    const merged = [...existingLocal];

    newMvps.forEach(newMvp => {
      const index = merged.findIndex(m => m.id === newMvp.id && m.deathMap === newMvp.deathMap);
      if (index !== -1) {
        // Update existing with new data from party
        merged[index] = { ...merged[index], ...newMvp };
      } else {
        // Add new entry from party that didn't exist locally
        merged.push(newMvp);
      }
    });

    return merged;
  }, [server]);

  const saveMvps = useCallback(async (mvps: IMvp[]) => {
    const rehydrated = rehydrateMvps(mvps);
    setActiveMvps(sortMvpsByRespawnTime(rehydrated));

    if (localSaveEnabled) {
      console.log('💾 Saving to LocalStorage...');
      saveActiveMvpsToLocalStorage(rehydrated, server);
    }

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

  // Firebase Real-time Listener
  useEffect(() => {
    if (!partyRoom) return;

    const mvpsRef = ref(database, `parties/${partyRoom}/${server}/mvps`);

    const unsubscribe = onValue(mvpsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const remoteMvps = Array.isArray(data) ? data : Object.values(data);
        if (originalAllMvps.length === 0) {
          setActiveMvps(remoteMvps as IMvp[]);
          setTimeout(() => setIsLoading(false), 3000);
          return;
        }

        const rehydratedRemote = rehydrateMvps(remoteMvps);
        
        // If Local Save is ON, we might want to merge.
        // However, for the LIVE UI, we show what's in the room.
        // The merging happens during the "Join (Smart Merge)" action.
        setActiveMvps(sortMvpsByRespawnTime(rehydratedRemote));
        
        // Important: If localSaveEnabled is ON, we write the party data to local.
        // This is the "Join (Overwrite)" behavior.
        if (localSaveEnabled) {
          saveActiveMvpsToLocalStorage(rehydratedRemote, server);
        }
        
        setIsLoading(false);
      } else {
        setActiveMvps([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [partyRoom, server, originalAllMvps, rehydrateMvps, localSaveEnabled]);

  // Effect to handle Auto-sync when Cloud Sync is toggled ON
  useEffect(() => {
    if (partyRoom && cloudSyncEnabled && activeMvps.length > 0) {
      saveMvps(activeMvps);
    }
  }, [cloudSyncEnabled]);

  // Exit Warning
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
    if (!localSaveEnabled) toggleLocalSave(); // Re-enable saving when leaving
    setTimeout(() => setIsLoading(false), 100);
  }, [activeMvps, server, changePartyRoom, rehydrateMvps, localSaveEnabled, toggleLocalSave]);

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date(), deathPosition: undefined };
    setActiveMvps((state) => {
      const newState = state.map((m) => (m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m));
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap);
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const killMvp = useCallback((mvp: IMvp, deathTime = new Date()) => {
    setActiveMvps((s) => {
      const killedMvp = { ...mvp, deathTime };
      const existingMvpIndex = s.findIndex((m) => m.id === mvp.id && m.deathMap === mvp.deathMap);
      let newState = existingMvpIndex !== -1 ? [...s] : [...s, killedMvp];
      if (existingMvpIndex !== -1) newState[existingMvpIndex] = killedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const updateMvp = useCallback((mvp: IMvp, deathTime = mvp.deathTime) => {
    setActiveMvps((s) => {
      const updatedMvp = { ...mvp, deathTime };
      const existingMvpIndex = s.findIndex((m) => m.id === mvp.id && m.deathMap === mvp.deathMap);
      let newState = existingMvpIndex !== -1 ? [...s] : [...s, updatedMvp];
      if (existingMvpIndex !== -1) newState[existingMvpIndex] = updatedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const updateMvpDeathLocation = useCallback((mvpId: number, oldDeathMap: string, newDeathMap: string, newDeathPosition: IMapMark) => {
    setActiveMvps((s) => {
      const existingMvpIndex = s.findIndex((m) => m.id === mvpId && m.deathMap === oldDeathMap);
      if (existingMvpIndex === -1) return s;
      const updatedMvp = { ...s[existingMvpIndex], deathMap: newDeathMap, deathPosition: newDeathPosition };
      const newState = [...s];
      newState[existingMvpIndex] = updatedMvp;
      saveMvps(newState);
      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

  const allMvps = useMemo(() => {
    const activeMvpKeys = new Set(activeMvps.map((mvp) => `${mvp.id}-${mvp.deathMap}`));
    return originalAllMvps
      .flatMap((mvp) => mvp.spawn.map((spawn) => ({ ...mvp, spawn: [spawn], deathMap: spawn.mapname })))
      .filter((mvp) => !activeMvpKeys.has(`${mvp.id}-${mvp.deathMap}`))
      .map(({ deathTime, ...rest }) => rest);
  }, [activeMvps, originalAllMvps]);

  return (
    <MvpsContext.Provider value={{
      activeMvps, allMvps, editingMvp, editingTimeMvp, killingMvp, resetMvpTimer, killMvp, updateMvp,
      updateMvpDeathLocation, removeMvpByMap, setEditingMvp, closeEditMvpModal: () => setEditingMvp(undefined),
      setEditingTimeMvp, closeEditTimeMvpModal: () => setEditingTimeMvp(undefined), setKillingMvp,
      closeKillMvpModal: () => setKillingMvp(undefined), isLoading, dataLocation, saveMvps, leaveParty
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
