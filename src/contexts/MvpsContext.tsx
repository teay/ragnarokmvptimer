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
} from '@/controllers/mvp';

interface MvpProviderProps {
  children: ReactNode;
}

interface MvpsContextData {
  activeMvps: IMvp[];
  allMvps: IMvp[];
  editingMvp: IMvp | undefined;
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
  const { server } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date() };
    setActiveMvps((state) =>
      sortMvpsByRespawnTime(state.map((m) => (m.deathMap === mvp.deathMap ? updatedMvp : m)))
    );
  }, []);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap);
      saveActiveMvpsToLocalStorage(newState, server);
      return sortMvpsByRespawnTime(newState);
    });
  }, [server]);

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

      saveActiveMvpsToLocalStorage(newState, server);

      return sortMvpsByRespawnTime(newState);
    });
  }, [server]);

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

      saveActiveMvpsToLocalStorage(newState, server);

      return sortMvpsByRespawnTime(newState);
    });
  }, [server]);

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

        saveActiveMvpsToLocalStorage(newState, server);

        return sortMvpsByRespawnTime(newState);
      });
    },
    [server]
  );

  const closeEditMvpModal = useCallback(() => {
    setEditingMvp(undefined);
    window.scrollTo(0, 0);
  }, []);

  const closeKillMvpModal = useCallback(() => {
    setKillingMvp(undefined);
    window.scrollTo(0, 0);
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
    async function loadActiveMvpsOnly() {
      setIsLoading(true);
      const savedActiveMvps = await loadMvpsFromLocalStorage(server);
      setActiveMvps(sortMvpsByRespawnTime(savedActiveMvps || []));
      setIsLoading(false);
    }
    loadActiveMvpsOnly();
  }, [server]);

  useEffect(() => {
    if (isLoading) return;

    async function loadOriginalAllMvps() {
      const data = await getServerData(server);
      setOriginalAllMvps(data);
    }
    loadOriginalAllMvps();
  }, [server, isLoading]);

  return (
    <MvpsContext.Provider
      value={{
        activeMvps,
        allMvps,
        editingMvp,
        killingMvp,
        resetMvpTimer,
        killMvp,
        updateMvp,
        updateMvpDeathLocation,
        removeMvpByMap,
        setEditingMvp,
        closeEditMvpModal,
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