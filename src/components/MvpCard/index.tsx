import { useMemo, useState } from 'react';
import { Trash2, Edit2, Star, X } from '@styled-icons/feather';
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
import { getOptimalFontSize } from '@/utils/textMeasurement';

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
  ActionGrid,
  MiniControl,
  KillTime,
} from './styles';

interface MvpCardProps {
  mvp: IMvp;
  zone?: 'active' | 'wait' | 'all';
}

export function MvpCard({ mvp, zone = 'all' }: MvpCardProps) {
  const {
    moveToAll,
    addToWait,
    removeFromWait,
    moveToWait,
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

  const inActive = !!mvp.deathTime;
  const inWait = mvp.isPinned === true && !inActive;
  const isEditing = editingMvp?.id === mvp.id;

  // Pretext: Calculate optimal font size for MVP name
  const optimalFontSize = useMemo(() => {
    const fontFamily =
      document.documentElement.getAttribute('data-font') || 'Jost';
    // Max width is container (280px) minus padding (20px) and some margin
    return getOptimalFontSize(mvp.name, 22, 12, 220, fontFamily);
  }, [mvp.name]);

  const nextRespawn = useMemo(
    () => dayjs(mvp.deathTime).add(getMvpRespawnTime(mvp), 'ms'),
    [mvp]
  );

  function handleSelectToKill() {
    addToWait(mvp);
  }

  return (
    <>
      <Container isEditing={isEditing} zone={zone}>
        <Header>
          <ID>{`((${mvp.id}))`}</ID>
          <Name fontSize={optimalFontSize}>{mvp.name}</Name>
          {inActive && mvp.deathTime && (
            <KillTime
              onClick={() => setEditingTimeMvp(mvp)}
              title='Click to edit time'
            >
              {dayjs(mvp.deathTime).format('DD/MM HH:mm')}
            </KillTime>
          )}
        </Header>

        <MvpSprite id={mvp.id} name={mvp.name} animated={animatedSprites} />

        {(inActive || inWait) && (
          <>
            {inActive && (
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
            {inWait && (
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
            <Bold>{inActive ? mvp.deathMap : mvp.spawn[0].mapname}</Bold>
          </MapName>

          {showMvpMap && (
            <MapWrapper onClick={() => inActive && setIsMapModalOpen(true)}>
              <MvpMap
                mapName={inActive ? mvp.deathMap : mvp.spawn[0].mapname}
                coordinates={inActive ? mvp.deathPosition : undefined}
              />
            </MapWrapper>
          )}

          {inActive ? (
            <Controls>
              <ButtonGroup variant='primary'>
                <KilledNow onClick={() => setKillingMvp(mvp)}>
                  <FormattedMessage id='killed_now_position' />
                </KilledNow>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ActionGrid>
                <MiniControl
                  onClick={() => setEditingMvp(mvp)}
                  title='Edit MVP'
                  variant='secondary'
                >
                  <Edit2 />
                  <span>{intl.formatMessage({ id: 'edit' })}</span>
                </MiniControl>
                <MiniControl
                  onClick={() => moveToAll(mvp.id, mvp.deathMap)}
                  title='Remove MVP'
                  variant='danger'
                >
                  <Trash2 />
                  <span>RMV</span>
                </MiniControl>
                <MiniControl
                  onClick={() => moveToWait(mvp)}
                  title='Back to wait'
                  variant='back'
                >
                  <Star />
                  <span>BACK</span>
                </MiniControl>
              </ActionGrid>
            </Controls>
          ) : inWait ? (
            <Controls>
              <ButtonGroup variant='primary'>
                <KilledNow onClick={() => setKillingMvp(mvp)}>
                  <FormattedMessage id='killed_now_position' />
                </KilledNow>
              </ButtonGroup>
              <ButtonGroupDivider />
              <ActionGrid>
                <MiniControl
                  onClick={() => setEditingMvp(mvp)}
                  title='Edit MVP'
                  variant='secondary'
                >
                  <Edit2 />
                  <span>{intl.formatMessage({ id: 'edit' })}</span>
                </MiniControl>
                <MiniControl
                  onClick={() =>
                    moveToAll(mvp.id, mvp.deathMap || mvp.spawn[0].mapname)
                  }
                  title='Remove MVP'
                  variant='danger'
                >
                  <Trash2 />
                  <span>RMV</span>
                </MiniControl>
                <MiniControl
                  onClick={() => removeFromWait(mvp)}
                  title='Cancel Hunting'
                  variant='back'
                >
                  <X />
                  <span>CANCEL</span>
                </MiniControl>
              </ActionGrid>
            </Controls>
          ) : (
            <Controls>
              <ButtonGroup variant='primary'>
                <Control onClick={handleSelectToKill} title='Select to kill'>
                  <Star />
                  <ControlText>
                    <FormattedMessage id='select_to_kill' />
                  </ControlText>
                </Control>
              </ButtonGroup>
            </Controls>
          )}
        </BottomControls>
      </Container>

      {inActive && isMapModalOpen && (
        <ModalMvpMap mvp={mvp} close={() => setIsMapModalOpen(false)} />
      )}
    </>
  );
}
