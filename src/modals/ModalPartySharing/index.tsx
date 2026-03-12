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

  const { partyRoom, changePartyRoom } = useSettings();
  const { activeMvps, saveMvps } = useMvpsContext();
  const [roomInput, setRoomInput] = useState(partyRoom || '');

  const modalRef = useClickOutside(onClose);

  const handleExportData = useCallback(() => {
    if (activeMvps && activeMvps.length > 0) {
      navigator.clipboard.writeText(JSON.stringify(activeMvps));
      alert('MVP data copied to clipboard!');
    } else {
      alert('No MVP data to export.');
    }
  }, [activeMvps]);

  const handleShareLink = useCallback(() => {
    if (activeMvps && activeMvps.length > 0) {
      try {
        const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(activeMvps))));
        const url = new URL(window.location.href);
        url.searchParams.set('party', base64Data);
        navigator.clipboard.writeText(url.toString());
        alert('Share link copied to clipboard!');
      } catch (e) {
        alert('Failed to generate share link.');
      }
    } else {
      alert('No MVP data to share.');
    }
  }, [activeMvps]);

  const handleImportData = useCallback(() => {
    const data = prompt('Paste MVP JSON data here:');
    if (data) {
      try {
        const parsed = JSON.parse(data); // Validate JSON
        saveMvps(parsed);
        alert(partyRoom ? 'Data pushed to Live Room successfully!' : 'Data imported to local successfully!');
        if (!partyRoom) window.location.reload();
      } catch (e) {
        alert('Invalid JSON data!');
      }
    }
  }, [saveMvps, partyRoom]);

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
