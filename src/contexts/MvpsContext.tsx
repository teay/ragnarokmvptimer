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
  dataLocation: 'local' | 'online' | 'mixed';
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
  const { server, partyRoom, changePartyRoom, localSaveEnabled, cloudSyncEnabled } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const dataLocation: 'local' | 'online' | 'mixed' = partyRoom ? 'online' : 'local';

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

  const saveMvps = useCallback((mvps: IMvp[]) => {
    // 1. Update Local State immediately for responsiveness (Always in Memory)
    const rehydrated = rehydrateMvps(mvps);
    setActiveMvps(sortMvpsByRespawnTime(rehydrated));

    // 2. Save to LocalStorage ONLY if enabled
    if (localSaveEnabled) {
      console.log('💾 Saving to LocalStorage...');
      saveActiveMvpsToLocalStorage(rehydrated, server);
    } else {
      console.log('🚫 Local Save is PAUSED. Not writing to disk.');
    }

    // 3. Save to Firebase ONLY if in a room and cloud sync is enabled
    if (partyRoom && cloudSyncEnabled) {
      console.log(`☁️ Syncing to Cloud (Room: ${partyRoom})...`);
      const serverRef = ref(database, `parties/${partyRoom}/${server}`);
      const minimalMvps = rehydrated.map(m => {
        const cleaned: any = {
          id: m.id,
          deathTime: m.deathTime ? (m.deathTime instanceof Date ? m.deathTime.toISOString() : m.deathTime) : null,
          deathMap: m.deathMap || null,
        };
        if (m.deathPosition) {
          cleaned.deathPosition = m.deathPosition;
        }
        return cleaned;
      });
      set(serverRef, { mvps: minimalMvps });
    } else if (partyRoom && !cloudSyncEnabled) {
      console.log('👻 GHOST MODE: Not broadcasting kills to cloud.');
    }
  }, [partyRoom, server, rehydrateMvps, localSaveEnabled, cloudSyncEnabled]);

  // Effect to handle Auto-sync when Cloud Sync is toggled ON
  useEffect(() => {
    if (partyRoom && cloudSyncEnabled && activeMvps.length > 0) {
      console.log('🔄 Cloud Sync toggled ON. Performing immediate synchronization...');
      saveMvps(activeMvps);
    }
  }, [cloudSyncEnabled]); // Run whenever sync toggle changes

  // Effect to warn user if they try to leave while saving is paused
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!localSaveEnabled) {
        e.preventDefault();
        e.returnValue = 'Data saving is currently paused. If you leave, your recent changes will be lost!';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [localSaveEnabled]);

  // Firebase Real-time Listener
  useEffect(() => {
    if (!partyRoom) return;

    const mvpsRef = ref(database, `parties/${partyRoom}/${server}/mvps`);

    const unsubscribe = onValue(mvpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const remoteMvps = Array.isArray(data) ? data : Object.values(data);

        // If static data is not yet loaded, show minimal and keep loading true
        // BUT we must ensure that once static data loads, we re-run this.
        if (originalAllMvps.length === 0) {
          setActiveMvps(remoteMvps as IMvp[]);
          // Safety timeout to show even if static data hangs
          setTimeout(() => setIsLoading(false), 3000);
          return;
        }

        const mergedMvps = rehydrateMvps(remoteMvps);
        setActiveMvps(sortMvpsByRespawnTime(mergedMvps));
        setIsLoading(false);
      } else {
        setActiveMvps([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [partyRoom, server, originalAllMvps, rehydrateMvps]);

  // Effect to handle case where originalAllMvps loads AFTER Firebase data
  useEffect(() => {
    if (partyRoom && originalAllMvps.length > 0 && activeMvps.length > 0 && isLoading) {
      // Re-hydrate activeMvps now that we have original data
      const mergedMvps = rehydrateMvps(activeMvps);
      setActiveMvps(sortMvpsByRespawnTime(mergedMvps));
      setIsLoading(false);
    } else if (partyRoom && originalAllMvps.length > 0 && activeMvps.length === 0 && isLoading) {
      // Data was empty but static is ready
      setIsLoading(false);
    }
  }, [originalAllMvps, partyRoom, rehydrateMvps, activeMvps, isLoading]);



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

      saveMvps(newState);

      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

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

      saveMvps(newState);

      return sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps]);

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

        saveMvps(newState);

        return sortMvpsByRespawnTime(newState);
      });
    },
    [saveMvps]
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

  const leaveParty = useCallback((saveToLocal: boolean) => {
    console.log('Leaving party room...', { saveToLocal, currentRoom: partyRoom });
    
    if (saveToLocal) {
      // Ensure we have rehydrated data before saving to local
      const rehydrated = rehydrateMvps(activeMvps);
      saveActiveMvpsToLocalStorage(rehydrated, server);
      // Update local state too so the transition is instant
      setActiveMvps(sortMvpsByRespawnTime(rehydrated));
    } else {
      // If discarding online changes, we should immediately reload from local storage
      // to avoid seeing the online data after partyRoom becomes null
      loadMvpsFromLocalStorage(server).then(saved => {
        setActiveMvps(sortMvpsByRespawnTime(saved || []));
      });
    }
    
    // Clear party room (this will trigger the init effect)
    changePartyRoom(null);
    
    // Ensure loading is false after a short delay to allow re-rendering
    setTimeout(() => setIsLoading(false), 100);
  }, [activeMvps, server, changePartyRoom, rehydrateMvps, partyRoom]);

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
    async function init() {
      setIsLoading(true);

      const urlParams = new URLSearchParams(window.location.search);
      const partyData = urlParams.get('party');

      if (partyData) {
        try {
          const decodedData = decodeURIComponent(escape(atob(partyData)));
          JSON.parse(decodedData); // Validate JSON
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, decodedData);

          // Clear the parameter from the URL without reloading
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('party');
          window.history.replaceState({}, '', newUrl.toString());

          alert('Party data imported successfully!');
        } catch (e) {
          console.error('Failed to import party data', e);
        }
      }

      if (partyRoom) {
        // If in a party room, the Firebase listener will handle loading.
        // We stay in isLoading(true) until the first value with static data is processed.
        return;
      }

      // Load final state from localStorage (which may have been updated by the party param)
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

  return (
    <MvpsContext.Provider
      value={{
        activeMvps,
        allMvps,
        editingMvp,
        editingTimeMvp,
        killingMvp,
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
        isLoading,
        dataLocation,
        saveMvps,
        leaveParty,
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
