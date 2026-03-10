import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';
import { styled } from '@linaria/react';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { SegmentedDateTimePicker } from '../../components/DateTimePicker';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Footer,
} from './styles';

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

export function ModalEditTime() {
  useScrollBlock(true);
  const { updateMvp, editingTimeMvp: mvp, closeEditTimeMvpModal } = useMvpsContext();
  const { animatedSprites } = useSettings();

  const [newTime, setNewTime] = useState<Date | null>(
    mvp?.deathTime || new Date()
  );

  if (!mvp) return null;

  function handleConfirm() {
    if (!mvp) return;
    updateMvp(mvp, newTime);
    closeEditTimeMvpModal();
  }

  useKey('Escape', closeEditTimeMvpModal);

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={closeEditTimeMvpModal} />

        <Name>{mvp.name}</Name>

        <SpriteWrapper>
          <MvpSprite id={mvp.id} name={mvp.name} animated={animatedSprites} />
        </SpriteWrapper>

        <Question>
          <FormattedMessage id='when_was_killed' />
        </Question>

        <SegmentedDateTimePicker
          value={newTime || new Date()}
          onChange={setNewTime}
        />

        <Footer>
          <PrimaryButton
            onClick={handleConfirm}
            disabled={!dayjs(newTime).isValid()}
          >
            <FormattedMessage id='confirm' />
          </PrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
