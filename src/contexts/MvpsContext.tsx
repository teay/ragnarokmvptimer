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
  //clearActiveMvps: () => void;
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
  const { server, partyRoom } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const saveMvps = useCallback((mvps: IMvp[]) => {
    if (partyRoom) {
      const mvpsRef = ref(database, `parties/${partyRoom}/${server}/mvps`);
      // For Firebase, we only save the minimal necessary data to avoid bloating and race conditions
      const minimalMvps = mvps.map(m => ({
        id: m.id,
        deathTime: m.deathTime,
        deathMap: m.deathMap,
        deathPosition: m.deathPosition
      }));
      set(mvpsRef, minimalMvps);
    } else {
      saveActiveMvpsToLocalStorage(mvps, server);
      setActiveMvps(sortMvpsByRespawnTime(mvps));
    }
  }, [partyRoom, server]);

  // Firebase Real-time Listener
  useEffect(() => {
    if (!partyRoom) return;

    const mvpsRef = ref(database, `parties/${partyRoom}/${server}/mvps`);
    
    const unsubscribe = onValue(mvpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const remoteMvps = Array.isArray(data) ? data : Object.values(data);
        
        // Merge with originalAllMvps to restore missing fields (sprites, respawn times, etc.)
        const mergedMvps = (remoteMvps as IMvp[]).map(remoteMvp => {
          const original = originalAllMvps.find(o => o.id === remoteMvp.id);
          if (original) {
            // Find the correct spawn entry that matches the death map
            const specificSpawn = original.spawn.filter(s => s.mapname === remoteMvp.deathMap);
            return { 
              ...original, 
              ...remoteMvp, 
              // Keep only the specific spawn to ensure UI (like MvpCard) correctly shows map info
              spawn: specificSpawn.length > 0 ? specificSpawn : original.spawn 
            };
          }
          return remoteMvp;
        });

        setActiveMvps(sortMvpsByRespawnTime(mergedMvps));
      } else {
        setActiveMvps([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partyRoom, server, originalAllMvps]);


  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date(), deathPosition: undefined };
    setActiveMvps((state) => {
      const newState = state.map((m) => (m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m));
      saveMvps(newState);
      return partyRoom ? state : sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps, partyRoom]);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap);
      saveMvps(newState);
      return partyRoom ? state : sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps, partyRoom]);

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

      return partyRoom ? s : sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps, partyRoom]);

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

      return partyRoom ? s : sortMvpsByRespawnTime(newState);
    });
  }, [saveMvps, partyRoom]);

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

        return partyRoom ? s : sortMvpsByRespawnTime(newState);
      });
    },
    [saveMvps, partyRoom]
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
        // We just need to stop the loading state once the listener is ready.
        // (The listener sets isLoading(false) on the first value)
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