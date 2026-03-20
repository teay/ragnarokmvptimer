import { useCallback, useState, useEffect } from 'react';
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
import { database, ref, set, get, remove } from '@/services/firebase'; // Ensure set and ref are imported
import { saveActiveMvpsToLocalStorage } from '@/controllers/mvp';

import {
  Modal,
  Title,
  SettingsContainer,
  SettingName,
  SettingSecondary,
  ActionButton,
  Input,
  InputWrapper,
  RandomButton,
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
  
  const { leaveParty, backups, personalBackups, roomBackups, createBackup, restoreBackup, deleteBackup, activeMvps, saveMvps } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomCreator, setRoomCreator] = useState<string | null>(null);

  const modalRef = useClickOutside(onClose);

  // Fetch room metadata to check for creator
  useEffect(() => {
    if (partyRoom) {
      const metaRef = ref(database, `parties/${partyRoom}/metadata`);
      get(metaRef).then(snapshot => {
        if (snapshot.exists()) {
          setRoomCreator(snapshot.val().creator || null);
        }
      });
    }
  }, [partyRoom]);

  const handleNicknameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // 🛡️ Security & Format Filter: Only English letters (A-Z), max 8
    const rawValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    const limitedValue = rawValue.slice(0, 8);
    
    setNicknameInput(limitedValue);
    
    // 🛡️ Check uniqueness in local backups history
    const isAlreadyUsed = backups.some(b => b.user === limitedValue && b.user !== nickname);
    
    // 🎯 Only persist if length 4-8 and NOT taken
    if (limitedValue.length >= 4 && limitedValue.length <= 8 && !isAlreadyUsed) {
      changeNickname(limitedValue);
    } else if (limitedValue.length === 0) {
      changeNickname(''); 
    }
  }, [changeNickname, backups, nickname]);

  // 🛡️ Room Name Validation: 8 English Chars + 1-24 Digits
  const isRoomValid = roomInput.length > 0 && /^[A-Z]{8}[0-9]{1,24}$/.test(roomInput.toUpperCase());
  const isNicknameValid = nicknameInput.length >= 4 && nicknameInput.length <= 8 && !backups.some(b => b.user === nicknameInput && b.user !== nickname);

  const handleRandomNickname = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = Math.floor(Math.random() * 5) + 4; // 4 to 8
    let result = '';
    
    // Try up to 10 times to get a unique nickname
    for (let attempt = 0; attempt < 10; attempt++) {
      let candidate = '';
      for (let i = 0; i < length; i++) {
        candidate += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!backups.some(b => b.user === candidate)) {
        result = candidate;
        break;
      }
      if (attempt === 9) result = candidate; // Fallback
    }
    
    setNicknameInput(result);
    changeNickname(result);
  }, [backups, changeNickname]);

  const handleRandomRoom = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let letters = '';
    for (let i = 0; i < 8; i++) {
      letters += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let digits = '';
    const digitLength = Math.floor(Math.random() * 8) + 1; // 1 to 8 for reasonable length
    for (let i = 0; i < digitLength; i++) {
      digits += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    setRoomInput(letters + digits);
  }, []);

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
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('party', base64Data);
        navigator.clipboard.writeText(url.toString());
        alert('Data share link copied to clipboard!');
      } catch (e) {
        alert('Failed to generate share link.');
      }
    } else {
      alert('No MVP data found in local storage.');
    }
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    if (!partyRoom) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('room', partyRoom);
    url.searchParams.set('server', server);
    
    navigator.clipboard.writeText(url.toString());
    alert('Invite link copied! Send this to your friends.');
  }, [partyRoom, server]);

  // Shared creation logic to be reused by the redirect
  const performCreateWithData = useCallback(async (roomName: string) => {
    createBackup('AUTO', `Pre-Host with Data: ${roomName}`);
    if (!localSaveEnabled) toggleLocalSave();
    changePartyRoom(roomName);

    const allLocalDataRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    let success = false; // Use a flag to track success

    if (allLocalDataRaw) {
      try {
        const parsed = JSON.parse(allLocalDataRaw);
        if (parsed[server]) {
          const metadataRef = ref(database, `parties/${roomName}/metadata`);
          const serverRef = ref(database, `parties/${roomName}/${server}`);
          const minimalMvps = parsed[server].map((m: any) => ({
            id: m.id, deathTime: m.deathTime || null, deathMap: m.deathMap || null, deathPosition: m.deathPosition || null,
          }));
          
          console.log('Creating party:', roomName, 'Server:', server, 'Creator:', nickname);

          await Promise.all([
            set(metadataRef, { server, createdAt: dayjs().toISOString(), creator: nickname }),
            set(serverRef, { mvps: minimalMvps })
          ]);
          
          // Add creator as the first member
          if (nickname) {
            console.log('Adding creator as member:', nickname, 'to room:', roomName);
            const membersRef = ref(database, `parties/${roomName}/members/${nickname}`); // Use nickname as key
            await set(membersRef, { name: nickname }); // Store name
          }
          success = true;
        }
      } catch (e) { 
        console.error('Error during create/join with data:', e);
        alert('Failed to create room with data. Please check connection or try again.');
      }
    } else {
      // Fallback if no data
      const metadataRef = ref(database, `parties/${roomName}/metadata`);
      try {
        await set(metadataRef, { server, createdAt: dayjs().toISOString(), creator: nickname });
        // Add creator as the first member (for fallback case too)
        if (nickname) {
          console.log('Adding creator as member (fallback):', nickname, 'to room:', roomName);
          const membersRef = ref(database, `parties/${roomName}/members/${nickname}`);
          await set(membersRef, { name: nickname });
        }
        success = true;
      } catch (e) {
        console.error('Error during fallback create:', e);
        alert('Failed to create room. Please check connection or try again.');
      }
    }
    // Update state and return success
    changePartyRoom(roomName); 
    setIsProcessing(false); // Reset processing state
    return success; // Return actual success status
  }, [server, localSaveEnabled, toggleLocalSave, changePartyRoom, createBackup, nickname, onClose, isProcessing, roomInput]); // Added dependencies that might be missing

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
          `❌ Room "${roomName}" not found.

Would you like to CREATE this room now using your current boss timers?`
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
      // Add joining member to Firebase
      if (nickname) {
        console.log('Joining party: Adding member', nickname, 'to room', roomName);
        const membersRef = ref(database, `parties/${roomName}/members/${nickname}`); // Use roomName being joined and nickname
        await set(membersRef, { name: nickname }); // Store the name
      }
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
          set(metadataRef, { server, createdAt: dayjs().toISOString(), creator: nickname }),
          set(serverRef, { mvps: [] })
        ]);
        // Add creator as the first member (for fresh creation)
        if (nickname) {
          console.log('Adding creator as member (fresh create):', nickname, 'to room:', roomName);
          const membersRef = ref(database, `parties/${roomName}/members/${nickname}`);
          await set(membersRef, { name: nickname });
        }
        onClose();
      } catch (e) {
        console.error('Error during fresh create:', e);
        alert('Failed to create room. Please check connection or try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [roomInput, localSaveEnabled, toggleLocalSave, changePartyRoom, server, onClose, createBackup, isProcessing, nickname]);

  const handleRestore = useCallback((backupId: string, source: 'local' | 'personal' | 'room' = 'local') => {
    restoreBackup(backupId, source);
    onClose(); 
  }, [restoreBackup, onClose]);

  const handleLeaveRoom = useCallback(() => {
    leaveParty(true); // 'true' might indicate clearing cloud data? Check leaveParty implementation.
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
        console.error('Failed to destroy room data:', e);
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
            <InputWrapper>
              <Input 
                id="userNickname" 
                name="userNickname" 
                placeholder="Nickname (4-8 UPPERCASE)" 
                value={nicknameInput} 
                onChange={handleNicknameChange} 
                disabled={isProcessing} 
                maxLength={8}
                style={!isNicknameValid && nicknameInput.length > 0 ? { borderColor: '#d32f2f', background: 'rgba(211, 47, 47, 0.05)' } : {}}
              />
              <RandomButton onClick={handleRandomNickname} title="Random Nickname" type="button">
                <RefreshCw />
              </RandomButton>
            </InputWrapper>
            {!isNicknameValid && nicknameInput.length > 0 && (
              <p style={{ fontSize: '1.1rem', color: '#f44336', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                {nicknameInput.length < 4 ? 'At least 4 chars' : backups.some(b => b.user === nicknameInput && b.user !== nickname) ? 'Nickname taken in history' : ''}
              </p>
            )}
            <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>
              4-8 uppercase English letters. Must be unique from existing history.
            </p>
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
                  <ActionButton onClick={handleCopyInviteLink} style={{ background: '#1976d2', width: '100%', justifyContent: 'center' }}>
                    <Copy size={18} /> Copy Invite Link
                  </ActionButton>

                  <ActionButton onClick={handleLeaveRoom} style={{ background: '#388e3c', width: '100%', justifyContent: 'center' }}>
                    <ZapOff /> <FormattedMessage id='leave_and_keep_data' />
                  </ActionButton>
                  
                  {(roomCreator && roomCreator === nickname) && (
                    <ActionButton onClick={handleDestroyRoomData} disabled={isProcessing} style={{ background: 'transparent', border: '1px solid #d32f2f', color: '#d32f2f', width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                      <XOctagon size={18} /> Destroy Cloud Room Data
                    </ActionButton>
                  )}
                </div>
              </>
            ) : (
              <>
                <InputWrapper>
                  <Input 
                    id="partyRoomName" 
                    name="partyRoomName" 
                    placeholder="8 English + 1-24 Digits (e.g. ROOMNAME123)" 
                    value={roomInput} 
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                    disabled={isProcessing} 
                    style={!isRoomValid && roomInput.length > 0 ? { borderColor: '#d32f2f', background: 'rgba(211, 47, 47, 0.05)' } : {}}
                  />
                  <RandomButton onClick={handleRandomRoom} title="Random Room Name" type="button">
                    <RefreshCw />
                  </RandomButton>
                </InputWrapper>
                {!isRoomValid && roomInput.length > 0 && (
                  <p style={{ fontSize: '1.1rem', color: '#f44336', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    Must be 8 letters followed by 1-24 numbers.
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <ActionButton 
                      onClick={handleCreateWithData} 
                      disabled={isProcessing || !isRoomValid} 
                      style={{ width: '100%', justifyContent: 'flex-start', background: isRoomValid ? '#388e3c' : '#444' }}
                    >
                      <PlusSquare size={18} /> <FormattedMessage id='join_live_room_with_local' />
                    </ActionButton>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Host new room with current local timers.</p>
                  </div>
                  <div>
                    <ActionButton 
                      onClick={handleCreateFresh} 
                      disabled={isProcessing || !isRoomValid} 
                      style={{ width: '100%', justifyContent: 'flex-start', background: isRoomValid ? '#1976d2' : '#444' }}
                    >
                      <RefreshCw size={18} /> <FormattedMessage id='create_fresh_party' />
                    </ActionButton>
                    <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem', textAlign: 'left' }}>Host new room with zero timers.</p>
                  </div>
                  <div>
                    <ActionButton 
                      onClick={handleJoinExisting} 
                      disabled={isProcessing || !isRoomValid} 
                      style={{ width: '100%', justifyContent: 'flex-start', background: isRoomValid ? '#666' : '#444' }}
                    >
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
                  <StatusBadge active={cloudSyncEnabled && !!partyRoom}>{partyRoom ? (cloudSyncEnabled ? 'Syncing' : 'Ghost Mode') : 'Offline'}</StatusBadge>
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
