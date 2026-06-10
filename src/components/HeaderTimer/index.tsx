import { useTimer } from '@/contexts/TimerContext';
import { Hour } from './styles';

type Props = {
  use24HourFormat: boolean;
};

export function HeaderTimer({ use24HourFormat }: Props) {
  const { now } = useTimer();
  const thaiNow = now.locale('th'); // Force Thai locale for this component

  const time = thaiNow.format(use24HourFormat ? 'HH:mm:ss' : 'hh:mm:ss A');
  const day = thaiNow.format('ddd'); // e.g., พุธ
  const date = `${thaiNow.format('D/M/')}${thaiNow.year() + 543}`; // e.g., 10/6/2569

  return (
    <Hour>
      {time} &nbsp; &nbsp;{day} {date}
    </Hour>
  );
}

