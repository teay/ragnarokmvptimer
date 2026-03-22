import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import dayjs from 'dayjs';

import { useSettings } from './SettingsContext';

import {
  database,
  ref,
  set,
  get,
  onValue,
  push,
  query,
  limitToLast,
  remove,
  DB_ROOT_PATH,
} from '@/services/firebase';
import { getMvpRespawnTime, getServerData } from '../utils';
import {
  LOCAL_STORAGE_ACTIVE_MVPS_KEY,
  LOCAL_STORAGE_BACKUPS_KEY,
  MAX_BACKUPS,
} from '@/constants';

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
  personalBackups: IMvpBackup[];
  roomBackups: IMvpBackup[];
  createBackup: (
    type: 'AUTO' | 'MANUAL' | 'CHANGE',
    description: string,
    changeDetail?: string
  ) => void;
  restoreBackup: (
    backupId: string,
    source?: 'local' | 'personal' | 'room'
  ) => void;
  deleteBackup: (
    backupId: string,
    source?: 'local' | 'personal' | 'room'
  ) => void;
}

export const MvpsContext = createContext({} as MvpsContextData);

/**
 * Safety-guarded Sort Function
 */
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
  const {
    server,
    partyRoom,
    changePartyRoom,
    localSaveEnabled,
    toggleLocalSave,
    cloudSyncEnabled,
    autoSnapshotEnabled,
    nickname,
  } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();

  // Single Source of Truth
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);

  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);
  const [backups, setBackups] = useState<IMvpBackup[]>([]);
  const [personalBackups, setPersonalBackups] = useState<IMvpBackup[]>([]);
  const [roomBackups, setRoomBackups] = useState<IMvpBackup[]>([]);

  // Visual indicator for data source
  // Firebase is always used when nickname exists, local is only when no nickname
  const dataLocation: 'local' | 'online' | 'ghost' | 'warning' = nickname
    ? 'online'
    : 'local';

  /**
   * Rehydrate Helper: Merges Cloud Data with Static JSON Data
   */
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

  // --- 1. Load Static Data (Server JSON) ---
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

  // --- 2. Main Cloud Sync Logic ---
  useEffect(() => {
    if (!originalAllMvps.length) return;

    // Determine the actual partyRoom to use
    let effectivePartyRoom = partyRoom;
    let isSoloMode = false;

    // If no partyRoom is set, check if nickname exists (auto-enter solo mode)
    if (!partyRoom && nickname) {
      effectivePartyRoom = `solo:${nickname}`;
      isSoloMode = true;
    }

    if (!effectivePartyRoom) {
      // No partyRoom and no nickname - show empty state
      setActiveMvps([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Determine if we are in solo mode (partyRoom prefixed with "solo:")
    if (effectivePartyRoom.startsWith('solo:')) {
      isSoloMode = true;
    }

    let mvpsRef;
    if (isSoloMode) {
      // Solo mode: use personal path under users/<nickname>
      const userId = effectivePartyRoom.substring(5); // after "solo:"
      mvpsRef = ref(database, `${DB_ROOT_PATH}/users/${userId}/${server}/mvps`);
    } else {
      // Normal party mode
      mvpsRef = ref(
        database,
        `${DB_ROOT_PATH}/${effectivePartyRoom}/${server}/mvps`
      );
    }

    const unsubscribe = onValue(
      mvpsRef,
      (snapshot) => {
        const data = snapshot.val();
        // If Firebase is empty, treat as intentionally empty - don't auto-seed
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
  }, [partyRoom, server, originalAllMvps, rehydrateMvps, localSaveEnabled]);

  // --- Actions: Direct Cloud/Local Updates ---

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
        updatedBy: nickname || 'Anon',
      }));

      // Determine target reference
      // If no partyRoom but nickname exists, auto-use solo mode
      let effectivePartyRoom = partyRoom;
      let isSoloMode = false;

      if (!partyRoom && nickname) {
        effectivePartyRoom = `solo:${nickname}`;
        isSoloMode = true;
      }

      if (effectivePartyRoom) {
        if (effectivePartyRoom.startsWith('solo:')) {
          isSoloMode = true;
        }

        let serverRef;
        if (isSoloMode) {
          const userId = effectivePartyRoom.substring(5); // after "solo:"
          serverRef = ref(
            database,
            `${DB_ROOT_PATH}/users/${userId}/${server}/mvps`
          );
        } else {
          serverRef = ref(
            database,
            `${DB_ROOT_PATH}/${effectivePartyRoom}/${server}/mvps`
          );
        }
        set(serverRef, minimalMvps).catch((err) => console.error(err));
      }
      // If no partyRoom and no nickname, do nothing (user needs to set nickname first)
    },
    [partyRoom, server, nickname]
  );

  const modifyMvps = useCallback(
    (
      modifier: (currentMvps: IMvp[]) => IMvp[],
      actionType?: string,
      actionDetail?: string
    ) => {
      const newMvps = modifier(activeMvps);
      saveMvpsToTarget(newMvps);

      if (autoSnapshotEnabled && actionType) {
        setTimeout(() => createBackup('CHANGE', actionType, actionDetail), 100);
      }
    },
    [activeMvps, saveMvpsToTarget, autoSnapshotEnabled]
  );

  const resetMvpTimer = useCallback(
    (mvp: IMvp) => {
      modifyMvps(
        (current) => {
          const updatedMvp = {
            ...mvp,
            deathTime: new Date(),
            deathPosition: undefined,
          };
          return current.map((m) =>
            m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m
          );
        },
        'Boss Reset',
        `Reset: ${mvp.name}`
      );
    },
    [modifyMvps]
  );

  const killMvp = useCallback(
    (mvp: IMvp, deathTime = new Date()) => {
      modifyMvps(
        (current) => {
          const killedMvp = { ...mvp, deathTime };
          const exists = current.some(
            (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
          );
          return exists
            ? current.map((m) =>
                m.id === mvp.id && m.deathMap === mvp.deathMap ? killedMvp : m
              )
            : [...current, killedMvp];
        },
        'Boss Added',
        `Added: ${mvp.name}`
      );
    },
    [modifyMvps]
  );

  const updateMvp = useCallback(
    (mvp: IMvp, deathTime = mvp.deathTime) => {
      modifyMvps(
        (current) => {
          const updatedMvp = { ...mvp, deathTime };
          const exists = current.some(
            (m) => m.id === mvp.id && m.deathMap === mvp.deathMap
          );
          return exists
            ? current.map((m) =>
                m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m
              )
            : [...current, updatedMvp];
        },
        'Boss Time Updated',
        `Edited: ${mvp.name}`
      );
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
      modifyMvps(
        (current) => {
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
        },
        'Tomb Location Updated',
        `Tomb updated`
      );
    },
    [modifyMvps]
  );

  const removeMvpByMap = useCallback(
    (mvpID: number, deathMap: string) => {
      const target = activeMvps.find(
        (m) => m.id === mvpID && m.deathMap === deathMap
      );

      // Check if this is the last one
      const willBeEmpty =
        activeMvps.length === 1 &&
        activeMvps.some((m) => m.id === mvpID && m.deathMap === deathMap);

      if (willBeEmpty) {
        // OPTIMISTIC UPDATE: Clear state immediately
        setActiveMvps([]);
      }

      // Proceed with normal removal (will sync to Firebase)
      modifyMvps(
        (current) => {
          return current.filter(
            (m) => !(m.id === mvpID && m.deathMap === deathMap)
          );
        },
        'Boss Removed',
        target ? `Removed: ${target.name}` : 'Removed Boss'
      );
    },
    [modifyMvps, activeMvps, server]
  );

  // History / Backups
  const loadBackups = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
    if (saved) {
      try {
        setBackups(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  useEffect(() => {
    // Determine actual partyRoom (handle auto-solo)
    let effectivePartyRoom = partyRoom;
    let isSoloMode = false;
    if (!partyRoom && nickname) {
      effectivePartyRoom = `solo:${nickname}`;
      isSoloMode = true;
    }

    // Only listen for party history (not solo mode)
    if (!cloudSyncEnabled || !effectivePartyRoom || isSoloMode) return;

    const historyRef = ref(
      database,
      `${DB_ROOT_PATH}/${effectivePartyRoom}/history`
    );
    const q = query(historyRef, limitToLast(MAX_BACKUPS));
    return onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(
            ([key, val]: [string, any]) =>
              ({
                ...val,
                id: key,
                source: 'room',
              } as IMvpBackup)
          )
          .sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)));
        setRoomBackups(list);
      } else {
        setRoomBackups([]);
      }
    });
  }, [partyRoom, cloudSyncEnabled, nickname]);

  const createBackup = useCallback(
    (
      type: 'AUTO' | 'MANUAL' | 'CHANGE',
      description: string,
      changeDetail?: string
    ) => {
      const backupData = {
        timestamp: dayjs().toISOString(),
        type,
        description,
        changeDetail: changeDetail || null,
        data: {
          [server]: activeMvps.map((m) => ({
            id: m.id,
            deathTime: m.deathTime
              ? m.deathTime instanceof Date
                ? m.deathTime.toISOString()
                : m.deathTime
              : null,
            deathMap: m.deathMap || null,
            deathPosition: m.deathPosition || null,
          })),
        },
        bossCount: activeMvps.length,
        server,
        user: nickname || 'Anon',
      };

      // Determine actual partyRoom (handle auto-solo)
      let effectivePartyRoom = partyRoom;
      let isSoloMode = false;
      if (!partyRoom && nickname) {
        effectivePartyRoom = `solo:${nickname}`;
        isSoloMode = true;
      }

      // Only save history for party mode (not solo mode)
      if (cloudSyncEnabled && effectivePartyRoom && !isSoloMode) {
        const historyRef = ref(
          database,
          `${DB_ROOT_PATH}/${effectivePartyRoom}/history`
        );
        push(historyRef, backupData).then(() => {
          get(query(historyRef, limitToLast(MAX_BACKUPS + 1))).then((snap) => {
            const data = snap.val();
            if (data && Object.keys(data).length > MAX_BACKUPS) {
              const oldestKey = Object.keys(data).sort((a, b) =>
                data[a].timestamp > data[b].timestamp ? 1 : -1
              )[0];
              remove(
                ref(
                  database,
                  `${DB_ROOT_PATH}/${effectivePartyRoom}/history/${oldestKey}`
                )
              );
            }
          });
        });
      }

      setBackups((prev) => {
        const newLocalBackup = {
          ...backupData,
          id: dayjs().valueOf().toString(),
          sequence: prev.length + 1,
        };
        const updated = [...prev, newLocalBackup].slice(-MAX_BACKUPS);
        localStorage.setItem(
          LOCAL_STORAGE_BACKUPS_KEY,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [partyRoom, server, activeMvps, cloudSyncEnabled, nickname]
  );

  const restoreBackup = useCallback(
    (backupId: string, source: 'local' | 'personal' | 'room' = 'local') => {
      let backup;
      if (source === 'local') backup = backups.find((b) => b.id === backupId);
      else if (source === 'personal')
        backup = personalBackups.find((b) => b.id === backupId);
      else if (source === 'room')
        backup = roomBackups.find((b) => b.id === backupId);

      if (!backup) return;
      if (
        window.confirm(
          `Restore backup from ${dayjs(backup.timestamp).format(
            'DD/MM HH:mm'
          )}?`
        )
      ) {
        const backupServerData = backup.data[server];
        if (backupServerData) saveMvpsToTarget(backupServerData);
      }
    },
    [backups, personalBackups, roomBackups, server, saveMvpsToTarget]
  );

  const deleteBackup = useCallback(
    (backupId: string, source: 'local' | 'personal' | 'room' = 'local') => {
      if (source === 'local') {
        setBackups((prev) => {
          const updated = prev.filter((b) => b.id !== backupId);
          localStorage.setItem(
            LOCAL_STORAGE_BACKUPS_KEY,
            JSON.stringify(updated)
          );
          return updated;
        });
      } else if (partyRoom) {
        // Determine if solo mode
        let isSoloMode = partyRoom.startsWith('solo:');
        // Only delete from Firebase if in party mode (not solo mode)
        if (!isSoloMode) {
          remove(
            ref(database, `${DB_ROOT_PATH}/${partyRoom}/history/${backupId}`)
          );
        }
      }
    },
    [partyRoom]
  );

  const leaveParty = useCallback(
    (saveToLocal: boolean) => {
      // Note: Since Firebase is now the source of truth,
      // we don't need to save to localStorage anymore
      // Just clear the party room
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
        editingMvp,
        editingTimeMvp,
        killingMvp,
        resetMvpTimer,
        killMvp,
        updateMvp,
        updateMvpDeathLocation,
        removeMvpByMap,
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
        backups,
        personalBackups,
        roomBackups,
        createBackup,
        restoreBackup,
        deleteBackup,
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
