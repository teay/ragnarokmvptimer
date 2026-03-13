import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import dayjs from 'dayjs';

interface TimerContextData {
  now: dayjs.Dayjs;
}

const TimerContext = createContext<TimerContextData>({} as TimerContextData);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TimerContext.Provider value={{ now }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
