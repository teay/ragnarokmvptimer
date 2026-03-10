import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

import { useScrollBlock, useKey } from '@/hooks';

import { ModalBase } from '../ModalBase';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import {
  Modal,
  Title,
  MapsDisplayGrid,
  MapCard,
  MapName,
  MapRespawnTime,
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
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(ButtonBase)`
  width: 25rem;
  background-color: var(--modal_button);
  margin-top: 10px;
`;

interface ModalSelectMapProps {
  spawnMaps: Array<{
    mapname: string;
    respawnTime: number;
  }>;
  onSelect: (mapname: string) => void;
  onClose: () => void;
}

export function ModalSelectMap({
  spawnMaps,
  onSelect,
  onClose,
}: ModalSelectMapProps) {
  useScrollBlock(true);
  const [selectedMap, setSelectedMap] = useState('');

  useKey('Escape', onClose);

  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={onClose} />

        <Title>
          <FormattedMessage id='which_map' />
        </Title>

        <MapsDisplayGrid style={{ '--cols': spawnMaps.length > 2 ? 3 : 2 } as React.CSSProperties}>
          {spawnMaps.map((spawn) => (
            <MapCard
              key={spawn.mapname}
              onClick={() => setSelectedMap(spawn.mapname)}
              style={{ '--isSelected': selectedMap === spawn.mapname ? 'yellow' : 'transparent' } as React.CSSProperties}
            >
              <MapName>{spawn.mapname}</MapName>
              <MapRespawnTime>{spawn.respawnTime} min</MapRespawnTime>
            </MapCard>
          ))}
        </MapsDisplayGrid>

        <PrimaryButton
          onClick={() => onSelect(selectedMap)}
          disabled={!selectedMap}
        >
          <FormattedMessage id='confirm' />
        </PrimaryButton>
      </Modal>
    </ModalBase>
  );
}
