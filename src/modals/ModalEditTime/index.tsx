import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { SegmentedDateTimePicker } from '../../components/DateTimePicker';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { ModalPrimaryButton } from '@/ui/ModalPrimaryButton';

import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Footer,
} from './styles';

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
          <ModalPrimaryButton
            size='lg'
            onClick={handleConfirm}
            disabled={!dayjs(newTime).isValid()}
          >
            <FormattedMessage id='confirm' />
          </ModalPrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
