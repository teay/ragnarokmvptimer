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

import { database, ref, set, get, onValue, push, query, limitToLast, remove, DB_ROOT_PATH } from '@/services/firebase';
import { getMvpRespawnTime, getServerData } from '../utils';
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
  personalBackups: IMvpBackup[];
  roomBackups: IMvpBackup[];
  createBackup: (type: 'AUTO' | 'MANUAL' | 'CHANGE', description: string, changeDetail?: string) => void;
  restoreBackup: (backupId: string, source?: 'local' | 'personal' | 'room') => void;
  deleteBackup: (backupId: string, source?: 'local' | 'personal' | 'room') => void;
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
    if (!a.spawn || !Array.isArray(a.spawn) || !b.spawn || !Array.isArray(b.spawn)) return 0;
    try {
      const respawnA = getMvpRespawnTime(a) || 0;
      const respawnB = getMvpRespawnTime(b) || 0;
      return dayjs(a.deathTime).add(respawnA, 'ms').diff(dayjs(b.deathTime).add(respawnB, 'ms'));
    } catch (e) { return 0; }
  });
}

/**
 * Generates or retrieves a persistent User ID for solo play.
 */
function getOrCreateSoloRoomId(): string {
  const STORAGE_KEY = 'solo_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { 
    server, partyRoom, changePartyRoom, localSaveEnabled, toggleLocalSave, cloudSyncEnabled, autoSnapshotEnabled, nickname 
  } = useSettings();

  const [isLoading, setIsLoading] = useState(true);
  const [editingMvp, setEditingMvp] = useState<IMvp>();
  const [editingTimeMvp, setEditingTimeMvp] = useState<IMvp>();
  const [killingMvp, setKillingMvp] = useState<IMvp>();
  
  // The Single Source of Truth for UI (synced from Cloud)
  const [activeMvps, setActiveMvps] = useState<IMvp[]>([]);
  
  const [originalAllMvps, setOriginalAllMvps] = useState<IMvp[]>([]);
  const [backups, setBackups] = useState<IMvpBackup[]>([]);
  const [personalBackups, setPersonalBackups] = useState<IMvpBackup[]>([]);
  const [roomBackups, setRoomBackups] = useState<IMvpBackup[]>([]);

  // Persistent User ID for solo play
  const soloRoomId = useRef(getOrCreateSoloRoomId()).current;
  
  // Determine effective room ID: Party Room OR Solo User ID
  const effectiveRoomId = partyRoom || soloRoomId;

  // Visual indicator for data source
  const dataLocation: 'local' | 'online' | 'ghost' | 'warning' = !localSaveEnabled 
    ? 'warning' 
    : (partyRoom ? 'online' : 'local'); // Simplified: 'local' now means 'private cloud' essentially

  /**
   * Rehydrate Helper: Merges Cloud Data with Static JSON Data
   */
  const rehydrateMvps = useCallback((mvps: any[]) => {
    if (!mvps) return [];
    if (originalAllMvps.length === 0) return mvps; // Fallback if static data isn't ready

    return mvps.map(mvp => {
      if (!mvp) return mvp;
      // Find original static data to get full details (images, spawn info, etc.)
      const original = originalAllMvps.find(o => o && Number(o.id) === Number(mvp.id));
      
      if (original) {
        const deathTime = mvp.deathTime ? new Date(mvp.deathTime) : undefined;
        // Filter spawn points to match the specific map
        const specificSpawn = original.spawn ? original.spawn.filter(s => s && s.mapname === mvp.deathMap) : [];
        
        return { 
          ...original, // Base static data
          ...mvp,      // Overwrite with Cloud data (time, etc.)
          deathTime,   // Ensure Date object
          spawn: specificSpawn.length > 0 ? specificSpawn : original.spawn 
        };
      }
      return mvp;
    });
  }, [originalAllMvps]);

  // --- 1. Load Static Data (Server JSON) ---
  useEffect(() => {
    async function loadOriginalAllMvps() {
      try {
        const data = await getServerData(server);
        setOriginalAllMvps(data || []);
      } catch (e) {
        console.error("Failed to load server data", e);
      }
    }
    loadOriginalAllMvps();
  }, [server]);

  // --- 2. Main Cloud Sync Logic (The "Cloud First" Core) ---
  useEffect(() => {
    if (!originalAllMvps.length) return; // Wait for static data

    setIsLoading(true);
    
    // Path: /parties/{roomId}/{server}/mvps
    // OR /dev-parties/{roomId}/{server}/mvps
    const mvpsRef = ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/${server}/mvps`);

    const unsubscribe = onValue(mvpsRef, (snapshot) => {
      const data = snapshot.val();
      const remoteMvpsRaw = data ? (Array.isArray(data) ? data : Object.values(data)) : [];

      // 1. Process Data
      const rehydrated = rehydrateMvps(remoteMvpsRaw);
      const sorted = sortMvpsByRespawnTime(rehydrated);

      // 2. Update UI
      setActiveMvps(sorted);
      
      // 3. Update Local Cache (for offline/backup)
      if (localSaveEnabled) {
        // We only save the RAW cloud data structure to local storage to match the cloud format
        const cacheData = { [server]: remoteMvpsRaw }; 
        // Note: We might need to preserve other servers' data in local storage
        try {
          const existingCacheRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
          const existingCache = existingCacheRaw ? JSON.parse(existingCacheRaw) : {};
          const newCache = { ...existingCache, ...cacheData };
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, JSON.stringify(newCache));
        } catch (e) { console.error("Cache update failed", e); }
      }

      setIsLoading(false);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveRoomId, server, originalAllMvps, rehydrateMvps, localSaveEnabled]);

  // --- 3. Initial Cache Load (Optimistic Start) ---
  useEffect(() => {
    // Only load from cache if we are initializing and have no data yet
    if (activeMvps.length === 0 && isLoading) {
      const cachedRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const serverCache = cached[server];
          if (serverCache && Array.isArray(serverCache)) {
             // We render cached data immediately while waiting for Cloud
             // Note: We don't set isLoading(false) because we are still connecting
             const rehydrated = rehydrateMvps(serverCache);
             setActiveMvps(sortMvpsByRespawnTime(rehydrated));
          }
        } catch (e) { console.error("Cache load failed", e); }
      }
    }
  }, [server, rehydrateMvps]); // Intentionally limited dependencies


  // --- Actions: Direct Cloud Updates ---

  const saveMvpsToCloud = useCallback((mvps: IMvp[]) => {
    // Convert full objects back to minimal Cloud format
    const minimalMvps = mvps.map(m => ({
      id: m.id,
      deathTime: m.deathTime ? (m.deathTime instanceof Date ? m.deathTime.toISOString() : m.deathTime) : null,
      deathMap: m.deathMap || null,
      deathPosition: m.deathPosition || null,
    }));

    const serverRef = ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/${server}/mvps`);
    set(serverRef, minimalMvps).catch(err => console.error("Cloud save failed", err));
  }, [effectiveRoomId, server]);

  /**
   * Helper to modify state via callback and save to cloud
   */
  const modifyMvps = useCallback((modifier: (currentMvps: IMvp[]) => IMvp[], actionType?: string, actionDetail?: string) => {
    // We use the current 'activeMvps' as the base.
    // In a high-concurrency environment, we might want to use a transaction,
    // but for this app, Last-Write-Wins based on latest local state is acceptable for MVP.
    // Ideally, we should use firebase transaction, but rewriting all logic to transaction is complex.
    // We will stick to: Read State -> Modify -> Set Cloud.
    
    const newMvps = modifier(activeMvps);
    saveMvpsToCloud(newMvps);

    // Snapshot logic (optional)
    if (autoSnapshotEnabled && actionType) {
       // We delay slightly to let the cloud update happen, though strictly not required
       setTimeout(() => createBackup('CHANGE', actionType, actionDetail), 100);
    }
  }, [activeMvps, saveMvpsToCloud, autoSnapshotEnabled]);


  const resetMvpTimer = useCallback((mvp: IMvp) => {
    modifyMvps((current) => {
      const updatedMvp = { ...mvp, deathTime: new Date(), deathPosition: undefined };
      return current.map(m => (m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m));
    }, 'Boss Reset', `Reset: ${mvp.name}`);
  }, [modifyMvps]);

  const killMvp = useCallback((mvp: IMvp, deathTime = new Date()) => {
    modifyMvps((current) => {
      const killedMvp = { ...mvp, deathTime };
      const exists = current.some(m => m.id === mvp.id && m.deathMap === mvp.deathMap);
      if (exists) {
        return current.map(m => (m.id === mvp.id && m.deathMap === mvp.deathMap ? killedMvp : m));
      } else {
        return [...current, killedMvp];
      }
    }, 'Boss Added', `Added: ${mvp.name}`);
  }, [modifyMvps]);

  const updateMvp = useCallback((mvp: IMvp, deathTime = mvp.deathTime) => {
    modifyMvps((current) => {
       const updatedMvp = { ...mvp, deathTime };
       const exists = current.some(m => m.id === mvp.id && m.deathMap === mvp.deathMap);
       return exists 
         ? current.map(m => (m.id === mvp.id && m.deathMap === mvp.deathMap ? updatedMvp : m))
         : [...current, updatedMvp];
    }, 'Boss Time Updated', `Edited: ${mvp.name}`);
  }, [modifyMvps]);

  const updateMvpDeathLocation = useCallback((mvpId: number, oldDeathMap: string, newDeathMap: string, newDeathPosition: IMapMark) => {
     modifyMvps((current) => {
       return current.map(m => {
         if (m.id === mvpId && m.deathMap === oldDeathMap) {
           return { ...m, deathMap: newDeathMap, deathPosition: newDeathPosition };
         }
         return m;
       });
     }, 'Tomb Location Updated', `Tomb updated`);
  }, [modifyMvps]);

  const removeMvpByMap = useCallback((mvpID: number, deathMap: string) => {
    const target = activeMvps.find(m => m.id === mvpID && m.deathMap === deathMap);
    modifyMvps((current) => {
      return current.filter(m => !(m.id === mvpID && m.deathMap === deathMap));
    }, 'Boss Removed', target ? `Removed: ${target.name}` : 'Removed Boss');
  }, [modifyMvps, activeMvps]);

  // --- Backups & History (Simplified to respect DataLocation) ---
  
  const loadBackups = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
    if (saved) {
      try { setBackups(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);
  
  useEffect(() => { loadBackups(); }, [loadBackups]);

  // Unified History Sync (Party OR Solo)
  useEffect(() => {
    if (!cloudSyncEnabled) return;
    
    // Path: /parties/{roomId}/history OR /dev-parties/...
    const historyRef = ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/history`);
    const q = query(historyRef, limitToLast(MAX_BACKUPS));
    
    return onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          ...val,
          id: key,
          source: partyRoom ? 'room' : 'personal'
        } as IMvpBackup)).sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)));
        
        if (partyRoom) setRoomBackups(list);
        else setPersonalBackups(list);
      } else {
        if (partyRoom) setRoomBackups([]);
        else setPersonalBackups([]);
      }
    });
  }, [effectiveRoomId, partyRoom, cloudSyncEnabled]);

  const createBackup = useCallback((type: 'AUTO' | 'MANUAL' | 'CHANGE', description: string, changeDetail?: string) => {
     // Prepare Backup Data
     const backupData = {
       timestamp: dayjs().toISOString(),
       type, description, changeDetail,
       data: { [server]: activeMvps.map(m => ({ // Minimal backup
          id: m.id, deathTime: m.deathTime, deathMap: m.deathMap, deathPosition: m.deathPosition
       }))},
       bossCount: activeMvps.length,
       server,
       user: nickname || 'Anon',
     };

     // 1. Save to Cloud History
     if (cloudSyncEnabled) {
       const historyRef = ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/history`);
       push(historyRef, backupData).then(() => {
          // Prune old entries
           get(query(historyRef, limitToLast(MAX_BACKUPS + 1))).then(snap => {
            const data = snap.val();
            if (data && Object.keys(data).length > MAX_BACKUPS) {
              const oldestKey = Object.keys(data).sort((a, b) => (data[a].timestamp > data[b].timestamp ? 1 : -1))[0];
              remove(ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/history/${oldestKey}`));
            }
          });
       });
     }

     // 2. Save to Local Backup (Legacy/Redundant but safe)
     setBackups(prev => {
        const newLocalBackup = { ...backupData, id: dayjs().valueOf().toString(), sequence: prev.length + 1 };
        const updated = [...prev, newLocalBackup].slice(-MAX_BACKUPS);
        localStorage.setItem(LOCAL_STORAGE_BACKUPS_KEY, JSON.stringify(updated));
        return updated;
     });

  }, [effectiveRoomId, server, activeMvps, cloudSyncEnabled, nickname]);

  const restoreBackup = useCallback((backupId: string, source: 'local' | 'personal' | 'room' = 'local') => {
    let backup;
    if (source === 'local') backup = backups.find(b => b.id === backupId);
    else if (source === 'personal') backup = personalBackups.find(b => b.id === backupId);
    else if (source === 'room') backup = roomBackups.find(b => b.id === backupId);

    if (!backup) return;

    if (window.confirm(`Restore backup from ${dayjs(backup.timestamp).format('DD/MM HH:mm')}? This overwrites CURRENT data.`)) {
      // Restore simply means pushing the backup data to the Cloud
      // which will then sync back to us and everyone else.
      const backupServerData = backup.data[server];
      if (backupServerData) {
         saveMvpsToCloud(backupServerData); // This triggers the update loop!
         alert('Restoring data... Please wait for sync.');
      }
    }
  }, [backups, personalBackups, roomBackups, server, saveMvpsToCloud]);

  const deleteBackup = useCallback((backupId: string, source: 'local' | 'personal' | 'room' = 'local') => {
      if (source === 'local') {
        setBackups(prev => {
          const updated = prev.filter(b => b.id !== backupId);
          localStorage.setItem(LOCAL_STORAGE_BACKUPS_KEY, JSON.stringify(updated));
          return updated;
        });
      } else {
        // Remove from cloud
        remove(ref(database, `${DB_ROOT_PATH}/${effectiveRoomId}/history/${backupId}`));
      }
  }, [effectiveRoomId]);


  const leaveParty = useCallback((saveToLocal: boolean) => {
    // In Cloud-First, 'leaving party' just means switching roomId back to soloRoomId.
    // Data is preserved in the cloud room.
    // If saveToLocal is true, we might want to COPY data from party to solo room?
    // For now, let's keep it simple: Just switch room.
    
    if (saveToLocal) {
       // Deep copy current party MVPs to Solo Room
       const currentPartyMvps = [...activeMvps];
       // We temporarily switch ID to solo to save, then the effect will trigger? 
       // No, better to write directly to solo path.
       const soloRef = ref(database, `${DB_ROOT_PATH}/${soloRoomId}/${server}/mvps`);
       const minimal = currentPartyMvps.map(m => ({
          id: m.id,
          deathTime: m.deathTime ? (m.deathTime instanceof Date ? m.deathTime.toISOString() : m.deathTime) : null,
          deathMap: m.deathMap || null,
          deathPosition: m.deathPosition || null,
       }));
       set(soloRef, minimal);
    }
    
    changePartyRoom(null); // This triggers the useEffect to switch effectiveRoomId
  }, [activeMvps, soloRoomId, server, changePartyRoom]);

  // Computed Properties
  const allMvps = useMemo(() => {
    const activeMvpKeys = new Set(activeMvps.map((mvp) => mvp ? `${mvp.id}-${mvp.deathMap}` : ''));
    return originalAllMvps
      .flatMap((mvp) => (mvp && mvp.spawn) ? mvp.spawn.map((spawn) => ({ ...mvp, spawn: [spawn], deathMap: spawn.mapname })) : [])
      .filter((mvp) => mvp && !activeMvpKeys.has(`${mvp.id}-${mvp.deathMap}`))
      .map(({ deathTime, ...rest }) => rest);
  }, [activeMvps, originalAllMvps]);

  // Legacy support function (empty implementation to satisfy interface if needed, or mapped to cloud save)
  const saveMvps = saveMvpsToCloud;

  return (
    <MvpsContext.Provider value={{
      activeMvps, allMvps, editingMvp, editingTimeMvp, killingMvp, resetMvpTimer, killMvp, updateMvp,
      updateMvpDeathLocation, removeMvpByMap, setEditingMvp, closeEditMvpModal: () => setEditingMvp(undefined),
      setEditingTimeMvp, closeEditTimeMvpModal: () => setEditingTimeMvp(undefined), setKillingMvp,
      closeKillMvpModal: () => setKillingMvp(undefined), isLoading, dataLocation, saveMvps, leaveParty,
      backups, personalBackups, roomBackups, createBackup, restoreBackup, deleteBackup
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
