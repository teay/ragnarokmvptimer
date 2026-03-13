import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Share, Zap, ZapOff, Database, Cloud, Activity, PlusSquare, Users, RefreshCw, Clock, Trash2, Save, RotateCcw, XOctagon } from '@styled-icons/feather';
import dayjs from 'dayjs';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { Switch } from '@/components/Switch';

import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useScrollBlock, useClickOutside, useKey } from '@/hooks';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { database, ref, set, get, remove } from '@/services/firebase';
import { saveActiveMvpsToLocalStorage } from '@/controllers/mvp';

import {
  Modal,
  Title,
  SettingsContainer,
  SettingName,
  SettingSecondary,
  ActionButton,
  Input,
  LiveStatus,
  ControlRow,
  StatusBadge,
  BackupSection,
  BackupItem,
  BackupInfo,
  BackupActions,
  MiniButton,
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalPartySharing({ onClose }: Props) {
  useScrollBlock(true);
  useKey('Escape', onClose);

  const { 
    server, servers, changeServer, partyRoom, changePartyRoom, localSaveEnabled, toggleLocalSave, cloudSyncEnabled, toggleCloudSync 
  } = useSettings();
  
  const { leaveParty, backups, createBackup, restoreBackup, deleteBackup } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useClickOutside(onClose);

  const handleExportData = useCallback(() => {
    const allLocalData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalData) {
      navigator.clipboard.writeText(allLocalData);
      alert('MVP data copied to clipboard!');
    } else {
      alert('No MVP data found.');
    }
  }, []);

  const handleShareLink = useCallback(() => {
    const allLocalData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalData) {
      try {
        const base64Data = btoa(unescape(encodeURIComponent(allLocalData)));
        const url = new URL(window.location.href);
        url.searchParams.set('party', base64Data);
        navigator.clipboard.writeText(url.toString());
        alert('Share link copied to clipboard!');
      } catch (e) {
        alert('Failed to generate share link.');
      }
    } else {
      alert('No MVP data found in local storage.');
    }
  }, []);

  // 🤝 Join Existing Party - Now with Room Existence Check
  const handleJoinExisting = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // 1. Verify if room exists at all
      const roomRef = ref(database, `parties/${roomName}`);
      const roomSnapshot = await get(roomRef);
      
      if (!roomSnapshot.exists()) {
        alert(`❌ Room "${roomName}" does not exist!\n\nIf you want to start a new hunting session, please use "Create Party & Begin with My Boss Timers" instead.`);
        setIsProcessing(false);
        return;
      }

      // 2. Peek at room metadata
      const metadataRef = ref(database, `parties/${roomName}/metadata`);
      const metaSnapshot = await get(metadataRef);
      const roomMetadata = metaSnapshot.val();
      
      let targetServer = server;
      if (roomMetadata && roomMetadata.server) {
        targetServer = roomMetadata.server;
        if (targetServer !== server) {
          changeServer(targetServer);
        }
      }

      createBackup('AUTO', `Pre-Join: ${roomName} (${targetServer})`);

      // 3. Fetch and Merge Online Data
      const serverMvpsRef = ref(database, `parties/${roomName}/${targetServer}/mvps`);
      const mvpSnapshot = await get(serverMvpsRef);
      const onlineMvps = mvpSnapshot.val() || [];
      const remoteMvps = Array.isArray(onlineMvps) ? onlineMvps : Object.values(onlineMvps);

      if (remoteMvps.length > 0) {
        const allLocalRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
        const allLocal = allLocalRaw ? JSON.parse(allLocalRaw) : {};
        const localForServer = allLocal[targetServer] || [];

        const merged = [...localForServer];
        remoteMvps.forEach((rm: any) => {
          const idx = merged.findIndex((lm: any) => lm.id === rm.id && lm.deathMap === rm.deathMap);
          if (idx !== -1) merged[idx] = { ...merged[idx], ...rm };
          else merged.push(rm);
        });
        saveActiveMvpsToLocalStorage(merged, targetServer);
      }

      if (!localSaveEnabled) toggleLocalSave();
      changePartyRoom(roomName);
      onClose();
    } catch (e) {
      console.error('Join failed', e);
      alert('Failed to join room. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  }, [roomInput, server, changeServer, localSaveEnabled, toggleLocalSave, changePartyRoom, onClose, createBackup, isProcessing]);

  // 🆕 Create Fresh Party
  const handleCreateFresh = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName || isProcessing) return;

    if (window.confirm(`Start a FRESH party room "${roomName}"? This clears online data.`)) {
      setIsProcessing(true);
      createBackup('AUTO', `Pre-Create Fresh: ${roomName}`);
      if (!localSaveEnabled) toggleLocalSave();
      changePartyRoom(roomName);
      const metadataRef = ref(database, `parties/${roomName}/metadata`);
      const serverRef = ref(database, `parties/${roomName}/${server}`);
      try {
        await Promise.all([
          set(metadataRef, { server, createdAt: dayjs().toISOString() }),
          set(serverRef, { mvps: [] })
        ]);
        onClose();
      } catch (e) {
        onClose();
      } finally {
        setIsProcessing(false);
      }
    }
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, server, onClose, createBackup, isProcessing]);

  // ⚔️ Create Party & Begin with My Boss Timers
  const handleCreateWithData = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName || isProcessing) return;

    setIsProcessing(true);
    createBackup('AUTO', `Pre-Host with Data: ${roomName}`);
    if (!localSaveEnabled) toggleLocalSave();
    changePartyRoom(roomName);

    const allLocalData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalData) {
      try {
        const parsed = JSON.parse(allLocalData);
        if (parsed[server]) {
          const metadataRef = ref(database, `parties/${roomName}/metadata`);
          const serverRef = ref(database, `parties/${roomName}/${server}`);
          const minimalMvps = parsed[server].map((m: any) => ({
            id: m.id, deathTime: m.deathTime || null, deathMap: m.deathMap || null, deathPosition: m.deathPosition || null,
          }));
          await Promise.all([
            set(metadataRef, { server, createdAt: dayjs().toISOString() }),
            set(serverRef, { mvps: minimalMvps })
          ]);
          onClose();
        } else onClose();
      } catch (e) { onClose(); }
    } else onClose();
    setIsProcessing(false);
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, server, onClose, createBackup, isProcessing]);

  const handleRestore = useCallback((backupId: string) => {
    restoreBackup(backupId);
    onClose(); 
  }, [restoreBackup, onClose]);

  const handleLeaveRoom = useCallback(() => {
    leaveParty(true);
    onClose();
  }, [leaveParty, onClose]);

  const handleDestroyRoomData = useCallback(async () => {
    if (!partyRoom || isProcessing) return;
    if (window.confirm(`🧨 DANGER: This will permanently DELETE all boss timers in room "${partyRoom}" from the CLOUD. Your local data will NOT be affected. Are you sure?`)) {
      setIsProcessing(true);
      try {
        const roomRef = ref(database, `parties/${partyRoom}`);
        await remove(roomRef);
        alert(`Room "${partyRoom}" data has been wiped from cloud.`);
        leaveParty(true); 
        onClose();
      } catch (e) {
        alert('Failed to destroy room data.');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [partyRoom, leaveParty, onClose, isProcessing]);

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />
        <Title><FormattedMessage id='party_sharing' /></Title>
        <SettingsContainer>
          
          <div style={{ width: '100%' }}>
            <SettingName style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={24} color="#fbc02d" /> Live Room
              </div>
            </SettingName>

            {partyRoom ? (
              <>
                <LiveStatus active>Connected to: {partyRoom}</LiveStatus>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ActionButton onClick={handleLeaveRoom} style={{ background: '#388e3c', width: '100%', justifyContent: 'center' }}>
                    <ZapOff /> <FormattedMessage id='leave_and_keep_data' />
                  </ActionButton>
                  
                  <ActionButton onClick={handleDestroyRoomData} disabled={isProcessing} style={{ background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                    <XOctagon size={18} /> Destroy Cloud Room Data
                  </ActionButton>
                </div>
              </>
            ) : (
              <>
                <Input id="partyRoomName" name="partyRoomName" placeholder="Enter Room Name" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} disabled={isProcessing} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <ActionButton onClick={handleCreateWithData} disabled={isProcessing} style={{ width: '100%', justifyContent: 'flex-start', background: '#388e3c' }}>
                      <PlusSquare size={18} /> <FormattedMessage id='join_live_room_with_local' />
                    </ActionButton>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Host new room with current local timers.</p>
                  </div>
                  <div>
                    <ActionButton onClick={handleCreateFresh} disabled={isProcessing} style={{ width: '100%', justifyContent: 'flex-start', background: '#1976d2' }}>
                      <RefreshCw size={18} /> <FormattedMessage id='create_fresh_party' />
                    </ActionButton>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Host new room with zero timers.</p>
                  </div>
                  <div>
                    <ActionButton onClick={handleJoinExisting} disabled={isProcessing} style={{ width: '100%', justifyContent: 'flex-start', background: '#666' }}>
                      <Users size={18} /> <FormattedMessage id='join_live_room' />
                    </ActionButton>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Join an existing room. Server syncs automatically.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <div style={{ width: '100%' }}>
            <SettingName style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={24} color="#64b5f6" /> Data Time Machine
              </div>
            </SettingName>
            <BackupSection>
              <ActionButton onClick={() => createBackup('MANUAL', 'Manual Checkpoint')} disabled={isProcessing} style={{ background: 'var(--primary)', width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
                <Save size={18} /> Create Manual Checkpoint
              </ActionButton>
              {backups.length === 0 ? (<p style={{ fontSize: '1.2rem', opacity: 0.5 }}>No backups found.</p>) : (
                backups.map(backup => (
                  <BackupItem key={backup.id}>
                    <BackupInfo>
                      <span className="date">{dayjs(backup.timestamp).format('DD/MM HH:mm:ss')}</span>
                      <span className="desc">[{backup.type}] {backup.description}</span>
                      <span className="stats">{backup.bossCount} Bosses • {backup.server}</span>
                    </BackupInfo>
                    <BackupActions>
                      <MiniButton onClick={() => handleRestore(backup.id)} disabled={isProcessing} title="Restore this data"><RotateCcw size={14} /> Restore</MiniButton>
                      <MiniButton onClick={() => deleteBackup(backup.id)} disabled={isProcessing} variant="danger" title="Delete backup"><Trash2 size={14} /></MiniButton>
                    </BackupActions>
                  </BackupItem>
                ))
              )}
            </BackupSection>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <div style={{ width: '100%' }}>
            <SettingName style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={24} color="#fbc02d" /> Data Flow Control
              </div>
            </SettingName>
            <ControlRow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} /> 
                  <span style={{ fontSize: '1.6rem', fontWeight: 600 }}>Local Browser</span>
                  <StatusBadge active={localSaveEnabled}>{localSaveEnabled ? 'Saving' : 'Paused'}</StatusBadge>
                </div>
                <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>Backup timers to this device</span>
              </div>
              <Switch id="localSave" name="localSave" checked={localSaveEnabled} onChange={toggleLocalSave} disabled={isProcessing} />
            </ControlRow>
            <ControlRow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cloud size={16} /> 
                  <span style={{ fontSize: '1.6rem', fontWeight: 600 }}>Cloud Sync</span>
                  <StatusBadge active={cloudSyncEnabled && !!partyRoom}>
                    {partyRoom ? (cloudSyncEnabled ? 'Syncing' : 'Ghost Mode') : 'Offline'}
                  </StatusBadge>
                </div>
                <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>Broadcast your kills to party</span>
              </div>
              <Switch id="cloudSync" name="cloudSync" checked={cloudSyncEnabled} onChange={toggleCloudSync} disabled={!partyRoom || isProcessing} />
            </ControlRow>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

          <div style={{ width: '100%' }}>
            <SettingName style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>Data Portability</SettingName>
            <SettingSecondary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                <ActionButton onClick={handleShareLink} disabled={isProcessing}><Share /> <FormattedMessage id='share_link' /></ActionButton>
                <ActionButton onClick={handleExportData} disabled={isProcessing}><Copy /> <FormattedMessage id='copy_local_data' /></ActionButton>
              </div>
            </SettingSecondary>
          </div>
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
