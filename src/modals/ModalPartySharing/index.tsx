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
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY, MAX_BACKUPS } from '@/constants';
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
    server, servers, changeServer, partyRoom, changePartyRoom, 
    localSaveEnabled, toggleLocalSave, cloudSyncEnabled, toggleCloudSync,
    autoSnapshotEnabled, toggleAutoSnapshot, nickname, changeNickname 
  } = useSettings();
  
  const { leaveParty, backups, createBackup, restoreBackup, deleteBackup } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useClickOutside(onClose);

  const handleNicknameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNicknameInput(value);
    changeNickname(value);
  }, [changeNickname]);

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

  // Shared creation logic to be reused by the redirect
  const performCreateWithData = useCallback(async (roomName: string) => {
    createBackup('AUTO', `Pre-Host with Data: ${roomName}`);
    if (!localSaveEnabled) toggleLocalSave();
    changePartyRoom(roomName);

    const allLocalDataRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalDataRaw) {
      try {
        const parsed = JSON.parse(allLocalDataRaw);
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
          return true;
        }
      } catch (e) { console.error(e); }
    }
    return true; // Still return true to join empty room if parsing fails
  }, [server, localSaveEnabled, toggleLocalSave, changePartyRoom, createBackup]);

  // ⚔️ Create Party & Begin with My Boss Timers (Main Button)
  const handleCreateWithData = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName || isProcessing) return;

    setIsProcessing(true);
    await performCreateWithData(roomName);
    setIsProcessing(false);
    onClose();
  }, [roomInput, isProcessing, performCreateWithData, onClose]);

  // 🤝 Join Existing Party - With Smooth Redirect
  const handleJoinExisting = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // 1. Verify if room exists
      const roomRef = ref(database, `parties/${roomName}`);
      const roomSnapshot = await get(roomRef);
      
      if (!roomSnapshot.exists()) {
        // --- SMOOTH REDIRECT FLOW ---
        const shouldCreate = window.confirm(
          `❌ Room "${roomName}" not found.\n\nWould you like to CREATE this room now using your current boss timers?`
        );
        
        if (shouldCreate) {
          await performCreateWithData(roomName);
          onClose();
        }
        setIsProcessing(false);
        return;
      }

      // 2. Room exists, proceed with normal Join
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
  }, [roomInput, server, changeServer, localSaveEnabled, toggleLocalSave, changePartyRoom, onClose, createBackup, isProcessing, performCreateWithData]);

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
                <Activity size={24} color="#fbc02d" /> Your Nickname
              </div>
            </SettingName>
            <Input id="userNickname" name="userNickname" placeholder="Enter Your Nickname (e.g. คุณเอ)" value={nicknameInput} onChange={handleNicknameChange} disabled={isProcessing} />
            <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Your name will be shown in Time Machine logs.</p>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={24} color="#64b5f6" /> Data Time Machine
                </div>
                <span style={{ fontSize: '1.4rem', opacity: 0.6, fontWeight: 400 }}>{backups.length} / {MAX_BACKUPS}</span>
              </div>
            </SettingName>
            
            <ControlRow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 600 }}>Auto-Snapshot on Change</span>
                  <StatusBadge active={autoSnapshotEnabled}>{autoSnapshotEnabled ? 'Enabled' : 'Disabled'}</StatusBadge>
                </div>
                <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>Save state whenever boss is added or removed</span>
              </div>
              <Switch id="autoSnapshot" name="autoSnapshot" checked={autoSnapshotEnabled} onChange={toggleAutoSnapshot} disabled={isProcessing} />
            </ControlRow>

            <BackupSection>
              <ActionButton onClick={() => createBackup('MANUAL', 'Manual Checkpoint')} disabled={isProcessing} style={{ background: 'var(--primary)', width: '100%', justifyContent: 'center', marginBottom: '1rem' }}>
                <Save size={18} /> Create Manual Checkpoint
              </ActionButton>
              {backups.length === 0 ? (<p style={{ fontSize: '1.2rem', opacity: 0.5 }}>No backups found.</p>) : (
                backups.map((backup, index) => (
                  <BackupItem key={backup.id}>
                    <BackupInfo>
                      <span className="date">#{index + 1} - {dayjs(backup.timestamp).format('DD/MM HH:mm:ss')}</span>
                      <span className="desc">
                        [{backup.type}] {backup.description}
                        {backup.changeDetail && <span style={{ color: '#ffeb3b', marginLeft: '8px' }}>• {backup.changeDetail}</span>}
                      </span>
                      <span className="stats">
                        {backup.bossCount} Bosses • {backup.server}
                        {backup.user && <span style={{ color: '#fff', marginLeft: '8px', opacity: 0.8 }}>(โดย: {backup.user})</span>}
                      </span>
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
