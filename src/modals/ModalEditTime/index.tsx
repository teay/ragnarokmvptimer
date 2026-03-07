import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { ModalPrimaryButton } from '@/ui/ModalPrimaryButton';

import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Footer,
  DateTimePicker,
} from './styles';

export function ModalEditTime() {
  useScrollBlock(true);
  const { updateMvp, editingTimeMvp: mvp, closeEditTimeMvpModal } = useMvpsContext();
  const { animatedSprites } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  const [newTime, setNewTime] = useState<Date | null>(
    mvp?.deathTime || new Date()
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

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

        <DateTimePicker
          ref={inputRef}
          type='datetime-local'
          value={dayjs(newTime).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              setNewTime(dayjs(val).toDate());
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') {
              e.stopPropagation();
            }
          }}
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
