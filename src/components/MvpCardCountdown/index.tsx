import { FormattedMessage } from 'react-intl';
import dayjs, { type Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';

import { useCountdown } from '@/hooks';
import { RESPAWN_TIMER_SOON_THRESHOLD_MS } from '@/constants';

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
    // If it's missed, show humanized "ago" or just zeros
    if (missedRespawn) return duration.humanize(true);

    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const hStr = String(Math.abs(hours)).padStart(2, '0');
    const mStr = String(Math.abs(minutes)).padStart(2, '0');
    const sStr = String(Math.abs(seconds)).padStart(2, '0');

    return `${hStr}:${mStr}:${sStr}`;
  }

  if (missedRespawn) return duration.humanize(true);

  return nextRespawn.format('HH:mm:ss');
}

export function MvpCardCountdown({
  nextRespawn,
  respawnAsCountdown,
  onTriggerNotification,
}: MvpCardCountdownProps) {
  const { duration } = useCountdown(nextRespawn);

  const durationAsMs = duration.asMilliseconds();
  const respawningSoon =
    durationAsMs >= 0 && durationAsMs <= RESPAWN_TIMER_SOON_THRESHOLD_MS;
  const missedRespawn = durationAsMs < 0;

  const formattedTimeString = getTimeString(
    nextRespawn,
    duration,
    respawnAsCountdown,
    missedRespawn
  );

  const shouldTriggerNotification =
    Math.trunc(duration.asSeconds()) ===
    RESPAWN_TIMER_SOON_THRESHOLD_MS / 1000;

  if (onTriggerNotification && shouldTriggerNotification) {
    onTriggerNotification();
  }

  return (
    <Container>
      <FormattedMessage
        id={
          respawningSoon
            ? 'respawning'
            : missedRespawn
            ? 'already_respawned'
            : respawnAsCountdown
            ? 'respawn_in'
            : 'respawn_at'
        }
      />

      <RespawnTimeText
        respawningSoon={respawningSoon}
        missedRespawn={missedRespawn}
      >
        {formattedTimeString || '-- : -- : --'} {'\n'}
      </RespawnTimeText>
    </Container>
  );
}
