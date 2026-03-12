import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Copy, Download, Share } from '@styled-icons/feather';

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
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalPartySharing({ onClose }: Props) {
  useScrollBlock(true);
  useKey('Escape', onClose);

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

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />

        <Title>
          <FormattedMessage id='party_sharing' />
        </Title>

        <SettingsContainer>
          <SettingName style={{ marginBottom: '1rem' }}>
            <FormattedMessage id='party_sharing_description' />
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
