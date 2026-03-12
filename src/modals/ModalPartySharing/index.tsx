import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Download, Share, Zap, ZapOff } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useScrollBlock, useClickOutside, useKey } from '@/hooks';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';

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
  const { activeMvps, saveMvps } = useMvpsContext();
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

  const handleImportData = useCallback(() => {
    const data = prompt('Paste MVP JSON data here:');
    if (data) {
      try {
        const parsed = JSON.parse(data); // Validate JSON
        
        // Check if the data is a single list of MVPs or a multi-server object
        if (Array.isArray(parsed)) {
          // Single list - save to current server
          saveMvps(parsed);
          alert(partyRoom ? `Pushed list to Live Room (${server})` : `Imported list to local (${server})`);
        } else {
          // Multi-server object
          if (partyRoom) {
            // If in a room, we only push the data for the CURRENT server from the object
            if (parsed[server]) {
              saveMvps(parsed[server]);
              alert(`Pushed ${server} data to Live Room!`);
            } else {
              alert(`No data for server ${server} found in the JSON.`);
            }
          } else {
            // If local, we can save the whole thing to localStorage
            localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, data);
            alert('Imported all servers data successfully!');
            window.location.reload();
          }
        }
      } catch (e) {
        alert('Invalid JSON data!');
      }
    }
  }, [saveMvps, partyRoom, server]);

  const handleJoinRoom = useCallback(() => {
    if (roomInput.trim()) {
      changePartyRoom(roomInput.trim());
      alert(`Joined Live Room: ${roomInput.trim()}`);
    }
  }, [roomInput, changePartyRoom]);

  const handleLeaveRoom = useCallback(() => {
    changePartyRoom(null);
    setRoomInput('');
    alert('Left Live Room. Back to local mode.');
  }, [changePartyRoom]);

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
                <ActionButton onClick={handleLeaveRoom} style={{ background: '#d32f2f', width: '100%', justifyContent: 'center' }}>
                  <ZapOff /> Disconnect from Room
                </ActionButton>
              </>
            ) : (
              <>
                <Input 
                  placeholder="Enter Room Name (e.g. MyParty123)" 
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                />
                <ActionButton onClick={handleJoinRoom} style={{ width: '100%', justifyContent: 'center' }}>
                  <Zap /> Join Live Room
                </ActionButton>
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
                {partyRoom ? (
                  <>Export from Live Sync {partyRoom}</>
                ) : (
                  <FormattedMessage id='copy_party_data' />
                )}
              </ActionButton>
              <ActionButton onClick={handleImportData} title="Paste MVP data from clipboard">
                <Download /> 
                {partyRoom ? (
                  <>Import to Live Sync {partyRoom}</>
                ) : (
                  <FormattedMessage id='import_party_data' />
                )}
              </ActionButton>
            </div>
          </SettingSecondary>
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
