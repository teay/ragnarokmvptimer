import { useMemo, useState } from 'react';
import { RefreshCcw, Trash2, Edit2 } from '@styled-icons/feather';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';

import { MvpSprite } from '../MvpSprite';
import { MvpCardCountdown } from '../MvpCardCountdown';
import { ModalMvpMap } from '@/modals';
import { Map as MvpMap } from '../Map';

import { useNotification } from '@/hooks';

import { useMvpsContext } from '@/contexts/MvpsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getMvpRespawnTime } from '@/utils';
import { GetTranslateText } from '@/utils/GetTranslateText';

import {
  Container,
  Header,
  ID,
  Name,
  MapName,
  Controls,
  Control,
  Bold,
  KilledNow,
  EditButton,
  Tombstone,
  ControlText,
  BottomControls,
} from './styles';

interface MvpCardProps {
  mvp: IMvp;
}

export function MvpCard({ mvp }: MvpCardProps) {
  const { killMvp, resetMvpTimer, removeMvpByMap, setEditingMvp, editingMvp } =
    useMvpsContext();
  const { respawnAsCountdown, animatedSprites } = useSettings();
  const { respawnNotification } = useNotification();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const isActive = !!mvp.deathMap;
  const isEditing = editingMvp?.id === mvp.id;

  const nextRespawn = useMemo(
    () => dayjs(mvp.deathTime).add(getMvpRespawnTime(mvp), 'ms'),
    [mvp]
  );

  function handleKilledNow() {
    const hasMoreThanOneMap = mvp.spawn.length > 1;

    isActive
      ? killMvp(mvp)
      : hasMoreThanOneMap
      ? setEditingMvp(mvp)
      : killMvp({ ...mvp, deathMap: mvp.spawn[0].mapname });
  }

  return (
    <>
      <Container isEditing={isEditing}>
        <Header>
          <ID>{`((${mvp.id}))`}</ID>
          <Name>{mvp.name}</Name>
        </Header>

        <MvpSprite id={mvp.id} name={mvp.name} animated={animatedSprites} />

        {isActive ? (
          <>
            <MvpCardCountdown
              nextRespawn={nextRespawn}
              respawnAsCountdown={respawnAsCountdown}
              onTriggerNotification={() =>
                respawnNotification(
                  mvp.id,
                  `${mvp.name} ${GetTranslateText('will_respawn')}`,
                  `${mvp.deathMap} - ${nextRespawn.format('HH:mm')}`
                )
              }
            />

            <MvpMap mapName={mvp.deathMap} coordinates={mvp.deathPosition} />

            <BottomControls>
              <MapName>
                <FormattedMessage id='map' />
                {
}
                <Bold>{mvp.deathMap}</Bold>
              </MapName>

              <Tombstone>
                <FormattedMessage id='when_was_mvp_killed' />
                <br />
                <Bold>{dayjs(mvp.deathTime).format('DD/MM/YYYY HH:mm A')}</Bold>
              </Tombstone>

              <Controls>
                <Control onClick={() => resetMvpTimer(mvp)} title='Reset timer'>
                  <RefreshCcw />
                  <ControlText><FormattedMessage id='reset_timer' /></ControlText>
                </Control>
                <Control
                  onClick={() => removeMvpByMap(mvp.id, mvp.deathMap)}
                  title='Remove this mvp'
                >
                  <Trash2 />
                  <ControlText><FormattedMessage id='remove_mvp' /></ControlText>
                </Control>
                <Control
                  onClick={() => setEditingMvp(mvp)}
                  title='Edit this mvp'
                >
                  <Edit2 />
                  <ControlText><FormattedMessage id='edit_mvp' /></ControlText>
                </Control>
              </Controls>
            </BottomControls>
          </>
        ) : (
          <Controls>
            <KilledNow onClick={handleKilledNow}>
              <FormattedMessage id='killed_now' />
            </KilledNow>
            <EditButton onClick={() => setEditingMvp(mvp)}>
              <FormattedMessage id='edit' />
            </EditButton>
          </Controls>
        )}
      </Container>

      {isActive && isMapModalOpen && (
        <ModalMvpMap
          deathMap={mvp.deathMap}
          deathPosition={mvp.deathPosition}
          close={() => setIsMapModalOpen(false)}
        />
      )}
    </>
  );
}