import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useKey, useScrollBlock } from '@/hooks';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { Map } from '../../components/Map';
import { ModalSelectMap } from '../ModalSelectMap';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { ModalPrimaryButton } from '@/ui/ModalPrimaryButton';

import {
  Modal,
  Name,
  Question,
  Optional,
  Footer,
  ChangeMapButton,
} from './styles';

interface MvpMapModalProps {
  mvp: IMvp;
  close: () => void;
}

export function ModalMvpMap({ mvp, close }: MvpMapModalProps) {
  const { updateMvpDeathLocation } = useMvpsContext();

  const [selectedMap, setSelectedMap] = useState<string>(mvp.deathMap);
  const [markCoordinates, setMarkCoordinates] = useState<IMapMark>(
    mvp.deathPosition || {
      x: -1,
      y: -1,
    }
  );

  const hasMoreThanOneMap = mvp.spawn.length > 1;

  useScrollBlock(true);
  useKey('Escape', close);

  function handleConfirm() {
    updateMvpDeathLocation(
      mvp.id,
      mvp.deathMap,
      selectedMap,
      markCoordinates
    );
    close();
  }

  if (!selectedMap) {
    return (
      <ModalSelectMap
        spawnMaps={mvp.spawn}
        onSelect={setSelectedMap}
        onClose={() => setSelectedMap(mvp.deathMap)} // Go back to prev map
      />
    );
  }

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={close} />

        <Name>{mvp.name}</Name>

        <Question>
          <FormattedMessage id='wheres_tombstone' />
          <Optional>
            (<FormattedMessage id='optional_mark' />)
          </Optional>
        </Question>

        <Map
          mapName={selectedMap}
          onChange={setMarkCoordinates}
          coordinates={markCoordinates}
        />

        <Footer>
          {hasMoreThanOneMap && (
            <ChangeMapButton size='lg' onClick={() => setSelectedMap('')}>
              <FormattedMessage id='change_map' />
            </ChangeMapButton>
          )}
          <ModalPrimaryButton size='lg' onClick={handleConfirm}>
            <FormattedMessage id='confirm' />
          </ModalPrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}