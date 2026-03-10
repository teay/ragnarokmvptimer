import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';
import { styled } from '@linaria/react';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { Map } from '../../components/Map';
import { ModalSelectMap } from '../ModalSelectMap';
import { SegmentedDateTimePicker } from '../../components/DateTimePicker';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Optional,
  Footer,
} from './styles';

const ButtonBase = styled.button`
  min-height: 5rem;
  font-weight: 600;
  font-size: 1.8rem;
  border-radius: 0.8rem;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
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

const ChangeMapButton = styled(ButtonBase)`
  width: 25rem;
  background: transparent;
  border: 1px solid var(--modal_changeMap_border);
  color: var(--modal_changeMap_text);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export function ModalEditMvp() {
  useScrollBlock(true);
  const { killMvp, updateMvp, editingMvp: mvp, closeEditMvpModal } = useMvpsContext();
  const { animatedSprites } = useSettings();

  const [newTime, setNewTime] = useState<Date | null>(
    mvp.deathTime || new Date()
  );

  const [selectedMap, setSelectedMap] = useState<string>(mvp.deathMap || '');
  const [markCoordinates, setMarkCoordinates] = useState<IMapMark>({
    x: -1,
    y: -1,
  });

  const hasMoreThanOneMap = mvp.spawn.length > 1;

  function handleConfirm() {
    if (!selectedMap) return;
  
    const updatedMvp: IMvp = {
      ...mvp,
      deathMap: selectedMap,
      deathPosition: markCoordinates,
    };
  
    if (mvp.deathTime) {
      updateMvp(updatedMvp, newTime);
    } else {
      killMvp(updatedMvp, newTime);
    }
    
    closeEditMvpModal();
  }

  useEffect(() => {
    if (!hasMoreThanOneMap) setSelectedMap(mvp.spawn[0].mapname);
  }, [hasMoreThanOneMap, mvp.spawn]);

  useKey('Escape', closeEditMvpModal);

  if (!selectedMap) {
    return (
      <ModalSelectMap
        spawnMaps={mvp.spawn}
        onSelect={setSelectedMap}
        onClose={closeEditMvpModal}
      />
    );
  }

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={closeEditMvpModal} />

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

        {selectedMap && (
          <>
            <Question>
              <FormattedMessage id='wheres_tombstone' />
              <Optional>
                (<FormattedMessage id='optional_mark' />)
              </Optional>
            </Question>
            <Map mapName={selectedMap} onChange={setMarkCoordinates} coordinates={markCoordinates} />
          </>
        )}

        <Footer>
          {hasMoreThanOneMap && (
            <ChangeMapButton onClick={() => setSelectedMap('')}>
              <FormattedMessage id='change_map' />
            </ChangeMapButton>
          )}
          <PrimaryButton
            onClick={handleConfirm}
            disabled={!selectedMap || !dayjs(newTime).isValid()}
          >
            <FormattedMessage id='confirm' />
          </PrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
