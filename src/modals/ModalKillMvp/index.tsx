import { useEffect, useState, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

import { useScrollBlock } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import { ModalBase } from '../ModalBase';
import { MvpSprite } from '../../components/MvpSprite';
import { Map } from '../../components/Map';
import { ModalSelectMap } from '../ModalSelectMap';

import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import {
  Modal,
  SpriteWrapper,
  Name,
  Question,
  Optional,
  Footer,
  Hint,
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

const ChangeMapButton = styled(ButtonBase)`
  width: 25rem;
  background: transparent;
  border: 1px solid var(--modal_changeMap_border);
  color: var(--modal_changeMap_text);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

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

  const hasPosition = markCoordinates.x !== -1 && markCoordinates.y !== -1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && hasPosition && selectedMap) {
        handleConfirm();
      } else if (e.key === 'Escape') {
        closeKillMvpModal();
      }
    },
    [hasPosition, selectedMap, handleConfirm, closeKillMvpModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
            <Map
              mapName={selectedMap}
              onChange={setMarkCoordinates}
              coordinates={markCoordinates}
            />
            <Hint>
              {hasPosition ? (
                <>
                  <FormattedMessage id='press_enter_to_confirm' /> •{' '}
                  <kbd>ESC</kbd> <FormattedMessage id='press_esc_to_close' />
                </>
              ) : (
                <>
                  <FormattedMessage id='optional_mark' /> • <kbd>ESC</kbd>{' '}
                  <FormattedMessage id='press_esc_to_close' />
                </>
              )}
            </Hint>
          </>
        )}

        <Footer>
          {hasMoreThanOneMap && (
            <ChangeMapButton onClick={() => setSelectedMap('')}>
              <FormattedMessage id='change_map' />
            </ChangeMapButton>
          )}
          <PrimaryButton onClick={handleConfirm} disabled={!selectedMap}>
            <FormattedMessage id='confirm' />
          </PrimaryButton>
        </Footer>
      </Modal>
    </ModalBase>
  );
}
