import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

import { useScrollBlock, useKey } from '@/hooks';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { Map as MvpMap } from '../../components/Map';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { Modal, Name, Question, Footer } from './styles';

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

interface ModalMvpMapProps {
  mvp: IMvp;
  close: () => void;
}

export function ModalMvpMap({ mvp, close }: ModalMvpMapProps) {
  useScrollBlock(true);
  const { updateMvpDeathLocation } = useMvpsContext();

  const [selectedMap, setSelectedMap] = useState(mvp.deathMap || '');
  const [markCoordinates, setMarkCoordinates] = useState<IMapMark>(
    mvp.deathPosition || {
      x: -1,
      y: -1,
    }
  );

  useKey('Escape', close);

  function handleConfirm() {
    updateMvpDeathLocation(
      mvp.id,
      mvp.deathMap || '',
      selectedMap,
      markCoordinates
    );
    close();
  }

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={close} />

        <Name>{mvp.name}</Name>

        <Question>
          <FormattedMessage id='wheres_tombstone' />
        </Question>

        <MvpMap
          mapName={selectedMap}
          onChange={setMarkCoordinates}
          coordinates={markCoordinates}
        />

        <Footer>
          <PrimaryButton onClick={handleConfirm}>
            <FormattedMessage id='confirm' />
          </PrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
