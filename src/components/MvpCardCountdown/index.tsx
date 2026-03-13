import { FormattedMessage } from 'react-intl';
import dayjs, { type Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';

import { useCountdown } from '@/hooks';
import { formatTime } from '@/utils';

import { Container, RespawnTimeText } from './styles';

interface MvpCardCountdownProps {
  nextRespawn: Dayjs;
  respawnAsCountdown?: boolean;
  onTriggerNotification?: () => void;
}

function getTimeString(
  nextRespawn: Dayjs,
  duration: Duration,
  respawnAsCountdown?: boolean,
  missedRespawn?: boolean
) {
  if (respawnAsCountdown) {
    if (missedRespawn) return duration.humanize(true);
    return formatTime(duration.asMilliseconds());
  }

  return nextRespawn.format('HH:mm:ss');
}

export function MvpCardCountdown({
  nextRespawn,
  respawnAsCountdown,
  onTriggerNotification,
}: MvpCardCountdownProps) {
  const { duration } = useCountdown(nextRespawn);

  const durationAsMs = duration.asMilliseconds();
  
  // LOGIC FIX: 
  // In RO, "Respawning" (กำลังเกิด) should only show when the MINIMUM time has passed.
  // Original logic was showing it 10 mins BEFORE. 
  // Now: If duration is negative (time has passed) and not too long ago, it's "Respawning".
  // Note: Since our data doesn't have explicit 'window' yet, we assume it's spawning now if time is up.
  const isTimeUp = durationAsMs <= 0;
  const respawningNow = isTimeUp && Math.abs(durationAsMs) < (1000 * 60 * 10); // Spawning within 10 min window after time up
  const missedRespawn = isTimeUp && !respawningNow;

  const formattedTimeString = getTimeString(
    nextRespawn,
    duration,
    respawnAsCountdown,
    missedRespawn
  );

  // Notification trigger (1 minute before)
  const shouldTriggerNotification = Math.floor(duration.asSeconds()) === 60;

  if (onTriggerNotification && shouldTriggerNotification) {
    onTriggerNotification();
  }

  return (
    <Container>
      <FormattedMessage
        id={
          respawningNow
            ? 'respawning'
            : missedRespawn
            ? 'already_respawned'
            : respawnAsCountdown
            ? 'respawn_in'
            : 'respawn_at'
        }
      />

      <RespawnTimeText
        respawningSoon={respawningNow}
        missedRespawn={missedRespawn}
      >
        {formattedTimeString || '-- : -- : --'}
      </RespawnTimeText>
    </Container>
  );
}
