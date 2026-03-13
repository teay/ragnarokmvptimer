import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs, { type Dayjs } from 'dayjs';

import { useCountdown } from '@/hooks';
import { formatTime } from '@/utils';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { getMvpRespawnWindow } from '@/utils';

import { Container, RespawnTimeText } from './styles';

interface MvpCardCountdownProps {
  mvp: IMvp; // Passing full MVP object now to access spawn data
  respawnAsCountdown?: boolean;
  onTriggerNotification?: () => void;
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

  const { duration } = useCountdown(nextRespawnMin);
  const durationAsMs = duration.asMilliseconds();
  
  const isTimeUp = durationAsMs <= 0;
  const isWithinWindow = isTimeUp && dayjs().isBefore(nextRespawnMax);
  const missedRespawn = isTimeUp && !isWithinWindow;

  // Notification trigger (1 minute before min)
  const shouldTriggerNotification = Math.floor(duration.asSeconds()) === 60;
  if (onTriggerNotification && shouldTriggerNotification) {
    onTriggerNotification();
  }

  const renderContent = () => {
    if (respawnAsCountdown) {
      if (missedRespawn) return duration.humanize(true);
      if (isWithinWindow) {
        // While respawning, show countdown to MAX time
        const maxDuration = dayjs.duration(nextRespawnMax.diff(dayjs()));
        return formatTime(maxDuration.asMilliseconds());
      }
      return formatTime(durationAsMs);
    }

    // Standard mode: Show Range
    return `${nextRespawnMin.format('HH:mm')} ~ ${nextRespawnMax.format('HH:mm')}`;
  };

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
        {renderContent() || '-- : -- : --'}
      </RespawnTimeText>
    </Container>
  );
}
