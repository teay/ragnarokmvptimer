import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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
  const [allMvps, setAllMvps] = useState<IMvp[]>([]);

  const resetMvpTimer = useCallback((mvp: IMvp) => {
    const updatedMvp = { ...mvp, deathTime: new Date() };
    setActiveMvps((state) =>
      state.map((m) => (m.deathMap === mvp.deathMap ? updatedMvp : m))
    );
  }, []);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    setActiveMvps((state) =>
      state.filter((m) => mvpID !== m.id || m.deathMap !== deathMap)
    );
  }, []);

  const killMvp = useCallback((mvp: IMvp, deathTime = new Date()) => {
    const killedMvp = {
      ...mvp,
      deathTime,
    };

    setActiveMvps((s) => {
      // ตรวจสอบว่า MVP นี้มีอยู่แล้วหรือไม่ (ตรวจสอบทั้ง id และ deathMap)
      const existingMvpIndex = s.findIndex(
        (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
      );

      // ถ้ามีอยู่แล้ว ให้อัพเดต
      if (existingMvpIndex !== -1) {
        const newState = [...s];
        newState[existingMvpIndex] = killedMvp;
        return newState.sort((a: IMvp, b: IMvp) => {
          const bothHaveDeathTime = a.deathTime && b.deathTime;
          if (!bothHaveDeathTime) {
            return 0;
          }
          return dayjs(a.deathTime)
            .add(getMvpRespawnTime(a), 'ms')
            .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
        });
      }

      // ถ้ายังไม่มี ให้เพิ่มใหม่
      return [...s, killedMvp].sort((a: IMvp, b: IMvp) => {
        const bothHaveDeathTime = a.deathTime && b.deathTime;
        if (!bothHaveDeathTime) {
          return 0;
        }
        return dayjs(a.deathTime)
          .add(getMvpRespawnTime(a), 'ms')
          .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
      });
    });
  }, []);

  // เพิ่มฟังก์ชัน updateMvp เพื่อแก้ไข MVP ที่มีอยู่แล้ว
  const updateMvp = useCallback((mvp: IMvp, deathTime = mvp.deathTime) => {
    const updatedMvp = {
      ...mvp,
      deathTime,
    };

    setActiveMvps((s) => {
      // ค้นหา MVP ที่ต้องการอัพเดต
      const existingMvpIndex = s.findIndex(
        (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
      );

      // ถ้าพบ ให้อัพเดต
      if (existingMvpIndex !== -1) {
        const newState = [...s];
        newState[existingMvpIndex] = updatedMvp;
        return newState.sort((a: IMvp, b: IMvp) => {
          const bothHaveDeathTime = a.deathTime && b.deathTime;
          if (!bothHaveDeathTime) {
            return 0;
          }
          return dayjs(a.deathTime)
            .add(getMvpRespawnTime(a), 'ms')
            .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
        });
      }

      // ถ้าไม่พบ ให้เพิ่มใหม่
      return [...s, updatedMvp].sort((a: IMvp, b: IMvp) => {
        const bothHaveDeathTime = a.deathTime && b.deathTime;
        if (!bothHaveDeathTime) {
          return 0;
        }
        return dayjs(a.deathTime)
          .add(getMvpRespawnTime(a), 'ms')
          .diff(dayjs(b.deathTime).add(getMvpRespawnTime(b), 'ms'));
      });
    });
  }, []);

  const closeEditMvpModal = useCallback(() => setEditingMvp(undefined), []);

  //const clearActiveMvps = useCallback(() => setActiveMvps([]), []);

  useEffect(() => {
    console.log('Loading active MVPs');
    async function loadActiveMvps() {
      setIsLoading(true);
      const savedActiveMvps = await loadMvpsFromLocalStorage(server);
      console.log('Loaded MVPs from localStorage:', savedActiveMvps);
      setActiveMvps(savedActiveMvps || []);
      setIsLoading(false);
    }
    loadActiveMvps();
  }, [server]);

  useEffect(() => {
    if (isLoading) return;

    async function filterAllMvps() {
      const originalServerData = await getServerData(server);
      const activeSpawns = activeMvps.map((m) => m.deathMap);
      const activeIds = activeMvps.map((m) => m.id);

      const filteredAllMvps = originalServerData
        .map((mvp) => {
          const isActive = activeIds.includes(mvp.id);
          if (!isActive) return mvp;

          return {
            ...mvp,
            spawn: mvp.spawn.filter(
              (spawn) => !activeSpawns.includes(spawn.mapname)
            ),
          };
        })
        .filter((mvp) => mvp.spawn.length > 0);

      setAllMvps(filteredAllMvps);
    }

    filterAllMvps();
    saveActiveMvpsToLocalStorage(activeMvps, server);
  }, [isLoading, activeMvps, server]);

  return (
    <MvpsContext.Provider
      value={{
        activeMvps,
        allMvps,
        editingMvp,
        resetMvpTimer,
        killMvp,
        updateMvp, // เพิ่มฟังก์ชันใหม่
        removeMvpByMap,
        setEditingMvp,
        closeEditMvpModal,
        //clearActiveMvps,
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