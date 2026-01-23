import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useScrollBlock, useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { Map } from '../../components/Map';
import { ModalSelectMap } from '../ModalSelectMap';

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

export function ModalKillMvp() {
  useScrollBlock(true);
  const { killMvp, killingMvp: mvp, closeKillMvpModal } = useMvpsContext();
  const { animatedSprites } = useSettings();

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
  
    killMvp(updatedMvp, new Date());
    
    closeKillMvpModal();
  }

  useEffect(() => {
    if (!hasMoreThanOneMap) setSelectedMap(mvp.spawn[0].mapname);
  }, [hasMoreThanOneMap, mvp.spawn]);

  useKey('Escape', closeKillMvpModal);

  if (!selectedMap) {
    return (
      <ModalSelectMap
        spawnMaps={mvp.spawn}
        onSelect={setSelectedMap}
        onClose={closeKillMvpModal}
      />
    );
  }

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={closeKillMvpModal} />

        <Name>{mvp.name}</Name>

        <SpriteWrapper>
          <MvpSprite id={mvp.id} name={mvp.name} animated={animatedSprites} />
        </SpriteWrapper>

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
            disabled={!selectedMap}
          >
            <FormattedMessage id='confirm' />
          </ModalPrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
