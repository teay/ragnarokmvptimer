import { useMemo, useState } from 'react';
import {
  RefreshCcw,
  Trash2,
  Edit2,
  MapPin,
  Star,
  X,
} from '@styled-icons/feather';
import { FormattedMessage, useIntl } from 'react-intl';
import dayjs from 'dayjs';

import { MvpSprite } from '../MvpSprite';
import { MvpCardCountdown } from '../MvpCardCountdown';
import { ModalMvpMap } from '@/modals';
import { Map as MvpMap } from '../Map';

import { useNotification } from '@/hooks';

import { useMvpsContext } from '@/contexts/MvpsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getMvpRespawnTime } from '@/utils';

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
  MapWrapper,
  ButtonGroup,
  ButtonGroupDivider,
  ButtonGroupPrimary,
  ButtonGroupTimer,
  ButtonGroupSecondary,
} from './styles';

interface MvpCardProps {
  mvp: IMvp;
  zone?: 'active' | 'wait' | 'all';
}

export function MvpCard({ mvp, zone = 'all' }: MvpCardProps) {
  const {
    killMvp,
    resetMvpTimer,
    removeMvpByMap,
    pinMvp,
    unpinMvp,
    setEditingMvp,
    setEditingTimeMvp,
    editingMvp,
    setKillingMvp,
  } = useMvpsContext();
  const { respawnAsCountdown, animatedSprites, showMvpMap, toggleShowMvpMap } =
    useSettings();
  const { respawnNotification } = useNotification();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const intl = useIntl();

  const isActive = !!mvp.deathTime;
  const isPinned = mvp.isPinned === true;
  const isPinnedOnly = isPinned && !isActive;
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
      ? setKillingMvp(mvp)
      : killMvp({ ...mvp, deathMap: mvp.spawn[0].mapname });
  }

  function handleSelectToKill() {
    pinMvp(mvp);
  }

  return (
    <>
      <Container isEditing={isEditing} zone={zone}>
        <Header>
          <ID>{`((${mvp.id}))`}</ID>
          <Name>{mvp.name}</Name>
        </Header>

        <MvpSprite id={mvp.id} name={mvp.name} animated={animatedSprites} />

        {(isActive || isPinnedOnly) && (
          <>
            {isActive && (
              <MvpCardCountdown
                mvp={mvp}
                respawnAsCountdown={respawnAsCountdown}
                onTriggerNotification={() =>
                  respawnNotification(
                    mvp.id,
                    `${mvp.name} ${intl.formatMessage({ id: 'will_respawn' })}`,
                    `${mvp.deathMap} - ${nextRespawn.format('HH:mm')}`
                  )
                }
              />
            )}
            {isPinnedOnly && (
              <Tombstone>
                <Star
                  size={18}
                  style={{ marginRight: 4, verticalAlign: 'middle' }}
                />
                <FormattedMessage id='pinned' />
              </Tombstone>
            )}
          </>
        )}

        <BottomControls>
          <MapName onClick={toggleShowMvpMap}>
            <FormattedMessage id='map' />:{' '}
            <Bold>{isActive ? mvp.deathMap : mvp.spawn[0].mapname}</Bold>
          </MapName>

          {showMvpMap && (
            <MapWrapper onClick={() => isActive && setIsMapModalOpen(true)}>
              <MvpMap
                mapName={isActive ? mvp.deathMap : mvp.spawn[0].mapname}
                coordinates={isActive ? mvp.deathPosition : undefined}
              />
            </MapWrapper>
          )}

          {isActive ? (
            <Controls>
              <ButtonGroup variant='timer-position'>
                <Control
                  onClick={() => {
                    resetMvpTimer(mvp);
                    setIsMapModalOpen(true);
                  }}
                  title='Reset timer and record new position'
                >
                  <MapPin />
                  <ControlText>
                    <FormattedMessage id='reset_timer_position' />
                  </ControlText>
                </Control>
              </ButtonGroup>
              <ButtonGroup variant='timer'>
                <Control onClick={() => resetMvpTimer(mvp)} title='Reset timer'>
                  <RefreshCcw />
                  <ControlText>
                    <FormattedMessage id='reset_timer' />
                  </ControlText>
                </Control>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ButtonGroup variant='secondary'>
                <Control
                  onClick={() => setEditingMvp(mvp)}
                  title='Edit this mvp'
                >
                  <Edit2 />
                  <ControlText>
                    <FormattedMessage id='edit_mvp' />
                  </ControlText>
                </Control>
              </ButtonGroup>
              <ButtonGroup variant='danger'>
                <Control
                  onClick={() => removeMvpByMap(mvp.id, mvp.deathMap)}
                  title='Remove this mvp'
                >
                  <Trash2 />
                  <ControlText>
                    <FormattedMessage id='remove_mvp' />
                  </ControlText>
                </Control>
              </ButtonGroup>
              <ButtonGroup variant='back'>
                <Control
                  onClick={() => unpinMvp(mvp, false)}
                  title='Back to wait'
                >
                  <Star />
                  <ControlText>
                    <FormattedMessage id='backToWait' />
                  </ControlText>
                </Control>
              </ButtonGroup>
            </Controls>
          ) : isPinnedOnly ? (
            <Controls>
              <ButtonGroup variant='primary'>
                <KilledNow onClick={handleKilledNow}>
                  <FormattedMessage id='killed_now' />
                </KilledNow>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ButtonGroup variant='secondary'>
                <EditButton onClick={() => setEditingMvp(mvp)}>
                  <FormattedMessage id='edit' />
                </EditButton>
              </ButtonGroup>
              <ButtonGroup variant='back'>
                <Control
                  onClick={() => unpinMvp(mvp, true)}
                  title='Back to All'
                >
                  <X />
                  <ControlText>
                    <FormattedMessage id='unpin' />
                  </ControlText>
                </Control>
              </ButtonGroup>
            </Controls>
          ) : (
            <Controls>
              <ButtonGroup variant="primary">
                <Control onClick={handleSelectToKill} title="Select to kill">
                  <Star />
                  <ControlText>
                    <FormattedMessage id="pin" />
                  </ControlText>
                </Control>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ButtonGroup variant="timer">
                <KilledNow onClick={handleKilledNow}>
                  <FormattedMessage id="killed_now" />
                </KilledNow>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ButtonGroup variant="secondary">
                <EditButton onClick={() => setEditingMvp(mvp)}>
                  <FormattedMessage id="edit" />
                </EditButton>
              </ButtonGroup>
            </Controls>
          )}
        </BottomControls>
      </Container>

      {isActive && isMapModalOpen && (
        <ModalMvpMap mvp={mvp} close={() => setIsMapModalOpen(false)} />
      )}
    </>
  );
}
