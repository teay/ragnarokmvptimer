import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

import { useSettings } from '@/contexts/SettingsContext';
import { useScrollBlock, useKey } from '@/hooks';

import { ModalBase } from '../ModalBase';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { Modal, Title, ServerList, ServerItem } from './styles';

const ButtonBase = styled.button`
  min-height: 5rem;
  font-weight: 600;
  font-size: 1.8rem;
  border-radius: 0.8rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;

  &:hover {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 3px solid white;
    outline-offset: 2px;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(ButtonBase)`
  width: 25rem;
  background-color: var(--modal_button);
`;

interface ModalSelectServerProps {
  onClose: () => void;
}

export function ModalSelectServer({ onClose }: ModalSelectServerProps) {
  useScrollBlock(true);
  const { servers, server: currentServer, changeServer } = useSettings();
  const [selectedServer, setSelectedServer] = useState(currentServer);

  useKey('Escape', onClose);

  function confirmChange() {
    changeServer(selectedServer);
    onClose();
  }

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={onClose} />

        <Title>
          <FormattedMessage id='which_server' />
        </Title>

        <ServerList>
          {servers.map((server) => (
            <ServerItem
              key={server}
              onClick={() => setSelectedServer(server)}
              style={{ '--isActive': selectedServer === server ? 1 : 0 } as React.CSSProperties}
            >
              {server}
            </ServerItem>
          ))}
        </ServerList>

        <PrimaryButton onClick={confirmChange}>
          <FormattedMessage id='confirm' />
        </PrimaryButton>
      </Modal>
    </ModalBase>
  );
}
