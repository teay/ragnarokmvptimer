import { FormattedMessage } from 'react-intl';
import dayjs, { type Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';

import { useCountdown } from '@/hooks';
import { RESPAWN_TIMER_SOON_THRESHOLD_MS } from '@/constants';
import { respawnAt } from '@/utils';

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
  if (respawnAsCountdown && duration) {
    const totalHours = Math.floor(duration.asHours());
    const totalHoursAbs = Math.abs(totalHours);

    if (totalHoursAbs >= 24) return duration.humanize(true);

    const hours = String(totalHoursAbs).padStart(2, '0');
    const minutes = String(Math.abs(duration.minutes())).padStart(2, '0');
    const seconds = String(Math.abs(duration.seconds())).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  if (missedRespawn) return duration.humanize(true);

  return respawnAt(nextRespawn);
}

export function MvpCardCountdown({
  nextRespawn,
  respawnAsCountdown,
  onTriggerNotification,
}: MvpCardCountdownProps) {
  const { duration } = useCountdown(nextRespawn);

  const durationWithRespawnDelay = duration.add(
    RESPAWN_TIMER_SOON_THRESHOLD_MS,
    'ms'
  );
  const durationAsMs = durationWithRespawnDelay.asMilliseconds();
  const respawningSoon =
    durationAsMs >= 0 && durationAsMs <= RESPAWN_TIMER_SOON_THRESHOLD_MS;
  const missedRespawn = durationAsMs < 0;

  const formattedTimeString = getTimeString(
    nextRespawn,
    respawningSoon || missedRespawn ? durationWithRespawnDelay : duration,
    respawnAsCountdown,
    missedRespawn
  );

  const shouldTriggerNotification =
    Math.trunc(durationWithRespawnDelay.asSeconds()) ===
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
