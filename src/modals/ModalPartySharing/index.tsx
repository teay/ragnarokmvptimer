import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Download, Share, Zap, ZapOff } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { useSettings } from '@/contexts/SettingsContext';
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

  const { partyRoom, changePartyRoom } = useSettings();
  const [roomInput, setRoomInput] = useState(partyRoom || '');

  const modalRef = useClickOutside(onClose);

  const handleExportData = useCallback(() => {
    const activeMvps = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (activeMvps) {
      navigator.clipboard.writeText(activeMvps);
      alert('Party data copied to clipboard!');
    } else {
      alert('No MVP data found.');
    }
  }, []);

  const handleShareLink = useCallback(() => {
    const activeMvps = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
    if (activeMvps) {
      try {
        const base64Data = btoa(unescape(encodeURIComponent(activeMvps)));
        const url = new URL(window.location.href);
        url.searchParams.set('party', base64Data);
        navigator.clipboard.writeText(url.toString());
        alert('Share link copied to clipboard!');
      } catch (e) {
        alert('Failed to generate share link.');
      }
    } else {
      alert('No MVP data found.');
    }
  }, []);

  const handleImportData = useCallback(() => {
    const data = prompt('Paste Party JSON data here:');
    if (data) {
      try {
        JSON.parse(data); // Validate JSON
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY, data);
        window.location.reload();
      } catch (e) {
        alert('Invalid JSON data!');
      }
    }
  }, []);

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
            Manual Sharing
          </SettingName>

          <SettingSecondary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              <ActionButton onClick={handleShareLink} title="Generate and copy share link">
                <Share /> <FormattedMessage id='share_link' defaultMessage="Share Link" />
              </ActionButton>
              <ActionButton onClick={handleExportData} title="Copy all servers MVP data to clipboard">
                <Copy /> <FormattedMessage id='copy_party_data' />
              </ActionButton>
              <ActionButton onClick={handleImportData} title="Paste MVP data from clipboard">
                <Download /> <FormattedMessage id='import_party_data' />
              </ActionButton>
            </div>
          </SettingSecondary>
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
