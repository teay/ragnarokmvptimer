import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Share, Zap, ZapOff, Database, Cloud, Activity, PlusSquare, Users, RefreshCw, Layers } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { Switch } from '@/components/Switch';

import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useScrollBlock, useClickOutside, useKey } from '@/hooks';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { database, ref, set, get } from '@/services/firebase';
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
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalPartySharing({ onClose }: Props) {
  useScrollBlock(true);
  useKey('Escape', onClose);

  const { 
    server, 
    partyRoom, 
    changePartyRoom, 
    localSaveEnabled, 
    toggleLocalSave, 
    cloudSyncEnabled, 
    toggleCloudSync 
  } = useSettings();
  
  const { leaveParty, activeMvps } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');

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

  // 🤝 1. Join Existing Party (Isolated) - Disable Local Save
  const handleJoinIsolated = useCallback(() => {
    const roomName = roomInput.trim();
    if (!roomName) return;

    // Turn off local save automatically to protect data
    if (localSaveEnabled) toggleLocalSave();
    
    changePartyRoom(roomName);
    onClose();
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, onClose]);

  // 📥 2. Join Existing Party (Smart Merge) - Keep Local Save & Merge
  const handleJoinSmartMerge = useCallback(async () => {
    const roomName = roomInput.trim();
    if (!roomName) return;

    try {
      // 1. Fetch current online data for this server
      const serverRef = ref(database, `parties/${roomName}/${server}/mvps`);
      const snapshot = await get(serverRef);
      const onlineMvps = snapshot.val() || [];
      const remoteMvps = Array.isArray(onlineMvps) ? onlineMvps : Object.values(onlineMvps);

      if (remoteMvps.length > 0) {
        // 2. Perform merge with local data
        const allLocalRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
        const allLocal = allLocalRaw ? JSON.parse(allLocalRaw) : {};
        const localForServer = allLocal[server] || [];

        // Combine: Party data overwrites Local if ID and Map match
        const merged = [...localForServer];
        remoteMvps.forEach((rm: any) => {
          const idx = merged.findIndex((lm: any) => lm.id === rm.id && lm.deathMap === rm.deathMap);
          if (idx !== -1) {
            merged[idx] = { ...merged[idx], ...rm };
          } else {
            merged.push(rm);
          }
        });

        // 3. Save merged data back to local storage
        saveActiveMvpsToLocalStorage(merged, server);
      }

      // 4. Join room and keep local save ON
      if (!localSaveEnabled) toggleLocalSave();
      changePartyRoom(roomName);
      onClose();
    } catch (e) {
      console.error('Smart Merge failed', e);
      // Fallback to isolated join if merge fails
      changePartyRoom(roomName);
      onClose();
    }
  }, [roomInput, server, localSaveEnabled, toggleLocalSave, changePartyRoom, onClose]);

  // 🆕 3. Create Fresh Party (Empty)
  const handleCreateFresh = useCallback(() => {
    const roomName = roomInput.trim();
    if (!roomName) return;

    if (window.confirm(`Are you sure you want to create a FRESH party room "${roomName}"? This will clear any existing online data in this room.`)) {
      if (!localSaveEnabled) toggleLocalSave(); // Enable saving for new party
      changePartyRoom(roomName);
      const serverRef = ref(database, `parties/${roomName}/${server}`);
      set(serverRef, { mvps: [] })
        .then(() => onClose())
        .catch(() => onClose());
    }
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, server, onClose]);

  // ⚔️ 4. Create Party & Sync My Data
  const handleCreateAndSyncLocal = useCallback(() => {
    const roomName = roomInput.trim();
    if (!roomName) return;

    if (!localSaveEnabled) toggleLocalSave(); // Ensure saving is on
    changePartyRoom(roomName);

    const allLocalData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalData) {
      try {
        const parsed = JSON.parse(allLocalData);
        if (parsed[server]) {
          const serverRef = ref(database, `parties/${roomName}/${server}`);
          const minimalMvps = parsed[server].map((m: any) => ({
            id: m.id,
            deathTime: m.deathTime || null,
            deathMap: m.deathMap || null,
            deathPosition: m.deathPosition || null,
          }));
          set(serverRef, { mvps: minimalMvps }).finally(() => onClose());
        } else {
          onClose();
        }
      } catch (e) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, server, onClose]);

  const handleLeaveRoom = useCallback(() => {
    leaveParty(false);
    onClose();
  }, [leaveParty, onClose]);

  const handleLeaveAndSaveLocal = useCallback(() => {
    leaveParty(true);
    onClose();
  }, [leaveParty, onClose]);

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />

        <Title>
          <FormattedMessage id='party_sharing' />
        </Title>

        <SettingsContainer>
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
              <Switch 
                id="localSave"
                name="localSave"
                checked={localSaveEnabled}
                onChange={toggleLocalSave}
              />
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
              <Switch 
                id="cloudSync"
                name="cloudSync"
                checked={cloudSyncEnabled}
                onChange={toggleCloudSync}
                disabled={!partyRoom}
              />
            </ControlRow>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

            <SettingName style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={24} color="#fbc02d" /> Live Room
              </div>
            </SettingName>

            {partyRoom ? (
              <>
                <LiveStatus active>Connected to: {partyRoom}</LiveStatus>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ActionButton onClick={handleLeaveAndSaveLocal} style={{ background: '#388e3c', width: '100%', justifyContent: 'center' }}>
                    <ZapOff /> <FormattedMessage id='leave_and_keep_data' />
                  </ActionButton>
                  <ActionButton onClick={handleLeaveRoom} style={{ background: '#d32f2f', width: '100%', justifyContent: 'center' }}>
                    <ZapOff /> <FormattedMessage id='leave_and_discard_data' />
                  </ActionButton>
                </div>
              </>
            ) : (
              <>
                <Input 
                  id="partyRoomName"
                  name="partyRoomName"
                  placeholder="Enter Room Name (e.g. MyParty123)" 
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ActionButton onClick={handleCreateAndSyncLocal} style={{ width: '100%', justifyContent: 'flex-start', background: '#388e3c' }}>
                    <PlusSquare size={18} /> <FormattedMessage id='join_live_room_with_local' />
                  </ActionButton>
                  <ActionButton onClick={handleCreateFresh} style={{ width: '100%', justifyContent: 'flex-start', background: '#1976d2' }}>
                    <RefreshCw size={18} /> <FormattedMessage id='create_fresh_party' />
                  </ActionButton>
                  <ActionButton onClick={handleJoinSmartMerge} style={{ width: '100%', justifyContent: 'flex-start', background: '#fb8c00' }}>
                    <Layers size={18} /> <FormattedMessage id='join_live_room_merge' />
                  </ActionButton>
                  <ActionButton onClick={handleJoinIsolated} style={{ width: '100%', justifyContent: 'flex-start' }}>
                    <Users size={18} /> <FormattedMessage id='join_live_room' />
                  </ActionButton>
                </div>
              </>
            )}
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

          <SettingName style={{ marginBottom: '1rem' }}>
            Data Portability
          </SettingName>

          <SettingSecondary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              <ActionButton onClick={handleShareLink} title="Generate and copy share link">
                <Share /> <FormattedMessage id='share_link' />
              </ActionButton>
              <ActionButton onClick={handleExportData} title="Copy current MVP data to clipboard">
                <Copy /> 
                <FormattedMessage id='copy_local_data' />
              </ActionButton>
            </div>
          </SettingSecondary>
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
