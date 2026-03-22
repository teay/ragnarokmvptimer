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
      // Show elapsed time since MAX respawn time (End of window)
      const elapsedMs = dayjs().diff(nextRespawnMax);
      // Ensure we don't show negative time if somehow time goes backward
      const displayMs = Math.max(0, elapsedMs); 
      // Format elapsed time to HH:mm:ss
      const seconds = Math.floor(displayMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      return `Already Respawned ${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    () => dayjs(mvp.deathTime).add(mvp.spawn?.find(s => s.mapname === mvp.deathMap)?.respawnTime || 0, 'ms'),
    [mvp]
  );
  
  const windowMs = useMemo(() => getMvpRespawnWindow(mvp), [mvp]);
  const nextRespawnMax = useMemo(() => nextRespawnMin.add(windowMs, 'ms'), [nextRespawnMin, windowMs]);

  const { duration: durationMin } = useCountdown(nextRespawnMin);
  const durationAsMs = durationMin.asMilliseconds();
  
  // Removed durationMax related lines as per user request to trigger at nextRespawnMin === 0

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

  // Notification trigger (at MIN respawn time)
  const shouldTriggerNotification = Math.floor(durationMin.asSeconds()) === 0;
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
