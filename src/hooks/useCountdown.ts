import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import { useTimer } from '@/contexts/TimerContext';

function timeToDuration(startTime: Dayjs, now: Dayjs) {
  const diff = startTime.diff(now);
  return dayjs.duration(diff);
}

export function useCountdown(startTime = dayjs()) {
  const { now } = useTimer();

  const duration = useMemo(
    () => timeToDuration(startTime, now),
    [startTime, now]
  );

  return { duration };
}
