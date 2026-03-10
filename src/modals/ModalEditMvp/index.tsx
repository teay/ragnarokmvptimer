import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { Map } from '../../components/Map';
import { ModalSelectMap } from '../ModalSelectMap';
import { SegmentedDateTimePicker } from '../../components/DateTimePicker';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { ModalPrimaryButton } from '@/ui/ModalPrimaryButton';


import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Optional,
  Footer,
  ChangeMapButton,
} from './styles';

export function ModalEditMvp() {
  useScrollBlock(true);
  // const { killMvp, editingMvp: mvp, closeEditMvpModal } = useMvpsContext();
  // ใน ModalEditMvp/index.tsx
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

  const canChangeMap = !mvp.deathMap;
  const hasMoreThanOneMap = mvp.spawn.length > 1;


  function handleConfirm() {
    if (!selectedMap) return;
  
    const updatedMvp: IMvp = {
      ...mvp,
      deathMap: selectedMap,
      deathPosition: markCoordinates,
    };
  
    if (mvp.deathTime) {
      // ถ้ามี deathTime แสดงว่าเป็น MVP ที่มีอยู่แล้ว ให้อัพเดต
      updateMvp(updatedMvp, newTime);
    } else {
      // ถ้าไม่มี deathTime แสดงว่าเป็น MVP ใหม่ ให้ใช้ killMvp
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
            <ChangeMapButton size='lg' onClick={() => setSelectedMap('')}>
              <FormattedMessage id='change_map' />
            </ChangeMapButton>
          )}
          <ModalPrimaryButton
            size='lg'
            onClick={handleConfirm}
            disabled={!selectedMap || !dayjs(newTime).isValid()}
          >
            <FormattedMessage id='confirm' />
          </ModalPrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
