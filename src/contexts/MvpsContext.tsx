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
  isLoading: boolean;
  resetMvpTimer: (mvp: IMvp) => void;
  killMvp: (mvp: IMvp, time?: Date | null) => void;
  updateMvp: (mvp: IMvp, time?: Date | null) => void; // เพิ่มฟังก์ชันใหม่
  removeMvpByMap: (mvpID: number, deathMap: string) => void;
  setEditingMvp: (mvp: IMvp) => void;
  closeEditMvpModal: () => void;
  //clearActiveMvps: () => void;
}

export const MvpsContext = createContext({} as MvpsContextData);

export function MvpProvider({ children }: MvpProviderProps) {
  console.log('MvpProvider initializing');
  
  const { server } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date() };
    setActiveMvps((state) =>
      state.map((m) => (m.deathMap === mvp.deathMap ? updatedMvp : m))
    );
  }, []);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) => {
      const newState = state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap);
      saveActiveMvpsToLocalStorage(newState, server);
      return newState;
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

      console.log('killMvp: newState', newState);
      saveActiveMvpsToLocalStorage(newState, server);

      return newState.sort((a: IMvp, b: IMvp) => {
        const bothHaveDeathTime = a.deathTime && b.deathTime;
        if (!bothHaveDeathTime) {
          return 0;
        }
        return dayjs(a.deathTime)
          .add(getMvpRespawnTime(a), 'ms')
          .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
      });
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

      console.log('updateMvp: newState', newState);
      saveActiveMvpsToLocalStorage(newState, server);

      return newState.sort((a: IMvp, b: IMvp) => {
        const bothHaveDeathTime = a.deathTime && b.deathTime;
        if (!bothHaveDeathTime) {
          return 0;
        }
        return dayjs(a.deathTime)
          .add(getMvpRespawnTime(a), 'ms')
          .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
      });
    });
  }, [server]);

  const closeEditMvpModal = useCallback(() => setEditingMvp(undefined), []);

  const allMvps = useMemo(() => {
    const activeMvpIds = new Set(activeMvps.map((mvp) => mvp.id));
    const combinedMvps = [
      ...activeMvps,
      ...originalAllMvps.filter((mvp) => !activeMvpIds.has(mvp.id)),
    ];
    return combinedMvps;
  }, [activeMvps, originalAllMvps]);

  useEffect(() => {
    console.log('Loading active MVPs for server:', server);
    async function loadActiveMvpsOnly() {
      setIsLoading(true);
      const savedActiveMvps = await loadMvpsFromLocalStorage(server);
      setActiveMvps(savedActiveMvps || []);
      setIsLoading(false); // ตั้งค่าเป็น false ทันทีที่โหลด activeMvps เสร็จ
    }
    loadActiveMvpsOnly();
  }, [server]);

  useEffect(() => {
    // โหลด originalAllMvps หลังจาก activeMvps โหลดเสร็จและ isLoading เป็น false
    if (isLoading) return; 

    console.log('Loading all MVPs data for server:', server);
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
        resetMvpTimer,
        killMvp,
        updateMvp,
        removeMvpByMap,
        setEditingMvp,
        closeEditMvpModal,
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