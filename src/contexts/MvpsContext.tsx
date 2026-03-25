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

import { database, ref, set, onValue, DB_ROOT_PATH } from '@/services/firebase';
import { getMvpRespawnTime, getServerData } from '../utils';

interface MvpProviderProps {
  children: ReactNode;
}

interface MvpsContextData {
  activeMvps: IMvp[];
  allMvps: IMvp[];
  originalAllMvps: IMvp[];
  editingMvp: IMvp | undefined;
  editingTimeMvp: IMvp | undefined;
  killingMvp: IMvp | undefined;
  isLoading: boolean;
  dataLocation: 'local' | 'online' | 'ghost' | 'warning';
  killMvp: (mvp: IMvp, time?: Date | null) => void;
  updateMvp: (mvp: IMvp, time?: Date | null) => void;
  updateMvpDeathLocation: (
    mvpId: number,
    oldDeathMap: string,
    newDeathMap: string,
    newDeathPosition: IMapMark
  ) => void;
  moveToAll: (mvpID: number, deathMap: string) => void;
  addToWait: (mvp: IMvp) => void;
  removeFromWait: (mvp: IMvp) => void;
  moveToWait: (mvp: IMvp) => void;
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
  if (!mvps) return [];
  return [...mvps].sort((a: IMvp, b: IMvp) => {
    if (!a || !b) return 0;
    const bothHaveDeathTime = a.deathTime && b.deathTime;
    if (!bothHaveDeathTime) return 0;
    if (
      !a.spawn ||
      !Array.isArray(a.spawn) ||
      !b.spawn ||
      !Array.isArray(b.spawn)
    )
      return 0;
    try {
      const respawnA = getMvpRespawnTime(a) || 0;
      const respawnB = getMvpRespawnTime(b) || 0;
      return dayjs(a.deathTime)
        .add(respawnA, 'ms')
        .diff(dayjs(b.deathTime).add(respawnB, 'ms'));
    } catch (e) {
      return 0;
    }
  });
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { server, partyRoom, changePartyRoom, nickname } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();

  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);

  const dataLocation: 'local' | 'online' | 'ghost' | 'warning' = nickname
    ? 'online'
    : 'local';

  // Write to party members when joining
  useEffect(() => {
    if (!partyRoom || !nickname) return;

    const membersRef = ref(
      database,
      `${DB_ROOT_PATH}/party/${partyRoom}/members/${nickname}`
    );

    // Function to update heartbeat
    const updateHeartbeat = () => {
      set(membersRef, {
        name: nickname,
        lastSeen: dayjs().toISOString(),
      }).catch(console.error);
    };

    // Initial heartbeat
    updateHeartbeat();

    // Update heartbeat every 30 seconds
    const interval = setInterval(updateHeartbeat, 30000);

    // Cleanup: remove self when leaving
    return () => {
      clearInterval(interval);
      const selfRef = ref(
        database,
        `${DB_ROOT_PATH}/party/${partyRoom}/members/${nickname}`
      );
      set(selfRef, null).catch(console.error);
    };
  }, [partyRoom, nickname]);

  const rehydrateMvps = useCallback(
    (mvps: any[]) => {
      if (!mvps) return [];
      if (originalAllMvps.length === 0) return mvps;

      return mvps.map((mvp) => {
        if (!mvp) return mvp;
        const original = originalAllMvps.find(
          (o) => o && Number(o.id) === Number(mvp.id)
        );

        if (original) {
          const deathTime = mvp.deathTime ? new Date(mvp.deathTime) : undefined;
          const specificSpawn = original.spawn
            ? original.spawn.filter((s) => s && s.mapname === mvp.deathMap)
            : [];

          return {
            ...original,
            ...mvp,
            deathTime,
            spawn:
              (specificSpawn.length > 0 ? specificSpawn : original.spawn) || [],
          };
        }
        return {
          ...mvp,
          deathTime: mvp.deathTime ? new Date(mvp.deathTime) : undefined,
          spawn: mvp.spawn || [],
        };
      });
    },
    [originalAllMvps]
  );

  useEffect(() => {
    async function loadOriginalAllMvps() {
      try {
        const data = await getServerData(server);
        setOriginalAllMvps(data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadOriginalAllMvps();
  }, [server]);

  useEffect(() => {
    if (!originalAllMvps.length) return;

    // Solo mode: partyRoom is null but nickname exists
    // Party mode: partyRoom has value
    const isSoloMode = !partyRoom && !!nickname;

    if (!isSoloMode && !partyRoom) {
      setActiveMvps([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let mvpsRef;
    if (isSoloMode) {
      mvpsRef = ref(
        database,
        `${DB_ROOT_PATH}/solo/${nickname}/${server}/mvps`
      );
    } else {
      mvpsRef = ref(
        database,
        `${DB_ROOT_PATH}/party/${partyRoom}/${server}/mvps`
      );
    }

    const unsubscribe = onValue(
      mvpsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setActiveMvps([]);
          setIsLoading(false);
          return;
        }

        const remoteMvpsRaw = data
          ? Array.isArray(data)
            ? data
            : Object.values(data)
          : [];
        const rehydrated = rehydrateMvps(remoteMvpsRaw);
        const sorted = sortMvpsByRespawnTime(rehydrated);

        setActiveMvps(sorted);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [partyRoom, server, originalAllMvps, rehydrateMvps, nickname]);

  const saveMvpsToTarget = useCallback(
    (mvps: IMvp[]) => {
      const minimalMvps = mvps.map((m) => ({
        id: m.id,
        deathTime: m.deathTime
          ? m.deathTime instanceof Date
            ? m.deathTime.toISOString()
            : m.deathTime
          : null,
        deathMap: m.deathMap || null,
        deathPosition: m.deathPosition || null,
        isPinned: m.isPinned || false,
        updatedBy: nickname || 'Anon',
      }));

      const isSoloMode = !partyRoom && !!nickname;

      if (isSoloMode) {
        const serverRef = ref(
          database,
          `${DB_ROOT_PATH}/solo/${nickname}/${server}/mvps`
        );
        set(serverRef, minimalMvps).catch((err) => console.error(err));
      } else if (partyRoom) {
        const serverRef = ref(
          database,
          `${DB_ROOT_PATH}/party/${partyRoom}/${server}/mvps`
        );
        set(serverRef, minimalMvps).catch((err) => console.error(err));
      }
    },
    [partyRoom, server, nickname]
  );

  const modifyMvps = useCallback(
    (modifier: (currentMvps: IMvp[]) => IMvp[]) => {
      const newMvps = modifier(activeMvps);
      saveMvpsToTarget(newMvps);
    },
    [activeMvps, saveMvpsToTarget]
  );

  const killMvp = useCallback(
    (mvp: IMvp, deathTime = new Date()) => {
      modifyMvps((current) => {
        const killedMvp = {
          ...mvp,
          deathTime,
          isPinned: mvp.isPinned || false,
        };
        const exists = current.some(
          (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
        );
        return exists
          ? current.map((m) =>
              m.id === mvp.id && m.deathMap === mvp.deathMap ? killedMvp : m
            )
          : [...current, killedMvp];
      });
    },
    [modifyMvps]
  );

  const updateMvp = useCallback(
    (mvp: IMvp, deathTime = mvp.deathTime) => {
      modifyMvps((current) => {
        const updatedMvp = { ...mvp, deathTime };
        const exists = current.some(
          (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
        );
        return exists
          ? current.map((m) =>
              m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m
            )
          : [...current, updatedMvp];
      });
    },
    [modifyMvps]
  );

  const updateMvpDeathLocation = useCallback(
    (
      mvpId: number,
      oldDeathMap: string,
      newDeathMap: string,
      newDeathPosition: IMapMark
    ) => {
      modifyMvps((current) => {
        return current.map((m) => {
          if (m.id === mvpId && m.deathMap === oldDeathMap) {
            return {
              ...m,
              deathMap: newDeathMap,
              deathPosition: newDeathPosition,
            };
          }
          return m;
        });
      });
    },
    [modifyMvps]
  );

  const removeMvpByMap = useCallback(
    (mvpID: number, deathMap: string) => {
      const willBeEmpty =
        activeMvps.length === 1 &&
        activeMvps.some((m) => m.id === mvpID && m.deathMap === deathMap);

      if (willBeEmpty) {
        setActiveMvps([]);
      }

      modifyMvps((current) => {
        return current.filter(
          (m) => !(m.id === mvpID && m.deathMap === deathMap)
        );
      });
    },
    [modifyMvps, activeMvps]
  );

  const pinMvp = useCallback(
    (mvp: IMvp) => {
      const pinnedMvp = { ...mvp, isPinned: true };
      modifyMvps((current) => {
        const exists = current.some(
          (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
        );
        return exists
          ? current.map((m) =>
              m.id === mvp.id && m.deathMap === mvp.deathMap
                ? { ...m, isPinned: true }
                : m
            )
          : [...current, pinnedMvp];
      });
    },
    [modifyMvps]
  );

  const unpinMvp = useCallback(
    (mvp: IMvp, removeFromActive = false) => {
      if (removeFromActive) {
        modifyMvps((current) => {
          return current.filter(
            (m) => !(m.id === mvp.id && m.deathMap === mvp.deathMap)
          );
        });
      } else {
        modifyMvps((current) => {
          return current.map((m) =>
            m.id === mvp.id && m.deathMap === mvp.deathMap
              ? { ...m, deathTime: undefined, isPinned: true }
              : m
          );
        });
      }
    },
    [modifyMvps]
  );

  const addToWait = useCallback(
    (mvp: IMvp) => {
      pinMvp(mvp);
    },
    [pinMvp]
  );

  const removeFromWait = useCallback(
    (mvp: IMvp) => {
      unpinMvp(mvp, true);
    },
    [unpinMvp]
  );

  const moveToWait = useCallback(
    (mvp: IMvp) => {
      unpinMvp(mvp, false);
    },
    [unpinMvp]
  );

  const moveToAll = useCallback(
    (mvpID: number, deathMap: string) => {
      removeMvpByMap(mvpID, deathMap);
    },
    [removeMvpByMap]
  );

  const leaveParty = useCallback(
    (saveToLocal: boolean) => {
      changePartyRoom(null);
    },
    [changePartyRoom]
  );

  const allMvps = useMemo(() => {
    const activeMvpKeys = new Set(
      activeMvps.map((mvp) => (mvp ? `${mvp.id}-${mvp.deathMap}` : ''))
    );
    return originalAllMvps
      .flatMap((mvp) =>
        mvp && mvp.spawn
          ? mvp.spawn.map((spawn) => ({
              ...mvp,
              spawn: [spawn],
              deathMap: spawn.mapname,
            }))
          : []
      )
      .filter((mvp) => mvp && !activeMvpKeys.has(`${mvp.id}-${mvp.deathMap}`))
      .map(({ deathTime, ...rest }) => rest);
  }, [activeMvps, originalAllMvps]);

  const saveMvps = saveMvpsToTarget;

  return (
    <MvpsContext.Provider
      value={{
        activeMvps,
        allMvps,
        originalAllMvps,
        editingMvp,
        editingTimeMvp,
        killingMvp,
        killMvp,
        updateMvp,
        updateMvpDeathLocation,
        moveToAll,
        addToWait,
        removeFromWait,
        moveToWait,
        setEditingMvp,
        closeEditMvpModal: () => setEditingMvp(undefined),
        setEditingTimeMvp,
        closeEditTimeMvpModal: () => setEditingTimeMvp(undefined),
        setKillingMvp,
        closeKillMvpModal: () => setKillingMvp(undefined),
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
  if (!context)
    throw new Error('useMvpsContext must be used within a MvpProvider');
  return context;
}
