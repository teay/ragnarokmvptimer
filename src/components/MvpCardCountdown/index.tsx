import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs, { type Dayjs } from 'dayjs';

import { useCountdown } from '@/hooks';
import { formatTime } from '@/utils';
import { getMvpRespawnWindow } from '@/utils';

import { Container, RespawnTimeText } from './styles';

interface MvpCardCountdownProps {
  mvp: IMvp;
  respawnAsCountdown?: boolean;
  onTriggerNotification?: () => void;
}

function getTimeString(
  nextRespawnMin: Dayjs,
  nextRespawnMax: Dayjs,
  durationMin: any,
  respawnAsCountdown?: boolean,
  isWithinWindow?: boolean,
  missedRespawn?: boolean
) {
  if (respawnAsCountdown) {
    if (missedRespawn) {
      // Show time passed since MAX respawn time (End of window)
      // This makes the transition smooth: 00:00:01 -> a few seconds ago
      return dayjs.duration(dayjs().diff(nextRespawnMax)).humanize(true);
    }
    
    if (isWithinWindow) {
      // While respawning, show countdown to MAX time
      const maxDurationMs = nextRespawnMax.diff(dayjs());
      return formatTime(maxDurationMs);
    }
    
    // Default: Countdown to MIN time
    return formatTime(durationMin.asMilliseconds());
  }

  // Standard mode: Show Range
  return `${nextRespawnMin.format('HH:mm')} ~ ${nextRespawnMax.format('HH:mm')}`;
}

export function MvpCardCountdown({
  mvp,
  respawnAsCountdown,
  onTriggerNotification,
}: MvpCardCountdownProps) {
  const nextRespawnMin = useMemo(
    () => dayjs(mvp.deathTime).add(mvp.spawn.find(s => s.mapname === mvp.deathMap)?.respawnTime || 0, 'ms'),
    [mvp]
  );
  
  const windowMs = useMemo(() => getMvpRespawnWindow(mvp), [mvp]);
  const nextRespawnMax = useMemo(() => nextRespawnMin.add(windowMs, 'ms'), [nextRespawnMin, windowMs]);

  const { duration: durationMin } = useCountdown(nextRespawnMin);
  const durationAsMs = durationMin.asMilliseconds();
  
  const isTimeUp = durationAsMs <= 0;
  const isWithinWindow = isTimeUp && dayjs().isBefore(nextRespawnMax);
  const missedRespawn = isTimeUp && !isWithinWindow;

  const formattedTimeString = getTimeString(
    nextRespawnMin,
    nextRespawnMax,
    durationMin,
    respawnAsCountdown,
    isWithinWindow,
    missedRespawn
  );

  // Notification trigger (1 minute before MIN time)
  const shouldTriggerNotification = Math.floor(durationMin.asSeconds()) === 60;
  if (onTriggerNotification && shouldTriggerNotification) {
    onTriggerNotification();
  }

  return (
    <Container>
      <FormattedMessage
        id={
          isWithinWindow
            ? 'respawning'
            : missedRespawn
            ? 'already_respawned'
            : respawnAsCountdown
            ? 'respawn_in'
            : 'respawn_at'
        }
      />

      <RespawnTimeText
        respawningSoon={isWithinWindow}
        missedRespawn={missedRespawn}
      >
        {formattedTimeString || '-- : -- : --'}
      </RespawnTimeText>
    </Container>
  );
}
