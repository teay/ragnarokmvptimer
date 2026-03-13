import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Share, Zap, ZapOff } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useScrollBlock, useClickOutside, useKey } from '@/hooks';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { database, ref, set } from '@/services/firebase';

import {
  Modal,
  Title,
  SettingsContainer,
  SettingName,
  SettingSecondary,
  ActionButton,
  Input,
  LiveStatus,
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalPartySharing({ onClose }: Props) {
  useScrollBlock(true);
  useKey('Escape', onClose);

  const { server, partyRoom, changePartyRoom } = useSettings();
  const { activeMvps, saveMvps, leaveParty } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');

  const modalRef = useClickOutside(onClose);

  const handleExportData = useCallback(() => {
    // Export EVERYTHING from localStorage for all servers, or just current server if in party?
    // Let's stick to the original behavior of exporting all local data to keep it compatible with old exports.
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

  const handleJoinRoom = useCallback(() => {
    if (roomInput.trim()) {
      changePartyRoom(roomInput.trim());
      // alert(`Joined Hunting Party: ${roomInput.trim()}`); // Removed for seamless experience
      onClose(); // Go back to main page automatically
    }
  }, [roomInput, changePartyRoom, onClose]);

  const handleJoinAndImport = useCallback(() => {
    const roomName = roomInput.trim();
    if (!roomName) return;

    // 1. Join the room in settings
    changePartyRoom(roomName);

    // 2. Get local data and push for CURRENT server directly to Firebase
    const allLocalData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (allLocalData) {
      try {
        const parsed = JSON.parse(allLocalData);
        if (parsed[server]) {
          // Push directly to Firebase to be sure it goes to the RIGHT room name immediately
          const serverRef = ref(database, `parties/${roomName}/${server}`);
          const minimalMvps = parsed[server].map((m: any) => {
            const cleaned: any = {
              id: m.id,
              deathTime: m.deathTime || null,
              deathMap: m.deathMap || null,
            };
            if (m.deathPosition) {
              cleaned.deathPosition = m.deathPosition;
            }
            return cleaned;
          });
          
          set(serverRef, { mvps: minimalMvps })
            .then(() => {
              // alert(`Joined "${roomName}" and synced ${server} boss timers!`); // Removed for seamless experience
              onClose(); // Go back to main page automatically
            })
            .catch((err) => {
              console.error('Firebase sync failed', err);
              alert(`Joined "${roomName}" but failed to sync data.`);
              onClose();
            });
        } else {
          // alert(`Joined "${roomName}", but no local data found for ${server}.`); // Removed for seamless experience
          onClose();
        }
      } catch (e) {
        alert(`Joined "${roomName}", but failed to parse local data.`);
        onClose();
      }
    } else {
      // alert(`Joined "${roomName}".`); // Removed for seamless experience
      onClose();
    }
  }, [roomInput, changePartyRoom, server, onClose]);

  const handleLeaveRoom = useCallback(() => {
    console.log('Action: Leave Party (Discard Changes)');
    try {
      leaveParty(false);
      onClose();
    } catch (e) {
      console.error('Failed to leave party', e);
      // Fallback if context is somehow broken
      changePartyRoom(null);
      onClose();
    }
  }, [leaveParty, onClose, changePartyRoom]);

  const handleLeaveAndSaveLocal = useCallback(() => {
    console.log('Action: Leave Party (Save to Local)');
    try {
      leaveParty(true);
      onClose();
    } catch (e) {
      console.error('Failed to leave and save party', e);
      // Fallback
      changePartyRoom(null);
      onClose();
    }
  }, [leaveParty, onClose, changePartyRoom]);

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />

        <Title>
          <FormattedMessage id='party_sharing' />
        </Title>

        <SettingsContainer>
          <div style={{ width: '100%' }}>
            <SettingName style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={24} color="#fbc02d" /> Live Sync (Experimental)
              </div>
            </SettingName>
            <SettingName style={{ fontSize: '1.4rem', opacity: 0.8, marginBottom: '2rem', alignItems: 'flex-start', textAlign: 'left' }}>
              Connect to a live room to sync timers automatically in real-time.
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
                  <ActionButton onClick={handleJoinRoom} style={{ width: '100%', justifyContent: 'center' }}>
                    <Zap /> <FormattedMessage id='join_live_room' />
                  </ActionButton>
                  <ActionButton onClick={handleJoinAndImport} style={{ width: '100%', justifyContent: 'center', background: '#388e3c' }}>
                    <Zap /> <FormattedMessage id='join_live_room_with_local' />
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
