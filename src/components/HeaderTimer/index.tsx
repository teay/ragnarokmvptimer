import { useTimer } from '@/contexts/TimerContext';
import { Hour } from './styles';

type Props = {
  use24HourFormat: boolean;
};

export function HeaderTimer({ use24HourFormat }: Props) {
  const { now } = useTimer();

  return (
    <Hour>{now.format(use24HourFormat ? 'HH:mm:ss' : 'hh:mm:ss A')}</Hour>
  );
}
