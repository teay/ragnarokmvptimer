import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import dayjs from 'dayjs';
import { ref, onValue } from '@/services/firebase'; // Use shared service
import { database, DB_ROOT_PATH } from '@/services/firebase';
import { useSettings } from '@/contexts/SettingsContext';

// Define the structure for Timer Context
interface TimerContextData {
  now: dayjs.Dayjs;
  partyMembers: string[] | undefined;
}

// Create the context
const TimerContext = createContext<TimerContextData>({} as TimerContextData);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(dayjs());
  const [partyMembers, setPartyMembers] = useState<string[] | undefined>(
    undefined
  );

  const { partyRoom } = useSettings();

  // Effect to update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Effect to listen for party members from Firebase
  useEffect(() => {
    if (!partyRoom || partyRoom.startsWith('solo:')) {
      setPartyMembers(undefined);
      return;
    }

    const membersRef = ref(database, `${DB_ROOT_PATH}/${partyRoom}/members`);

    const unsubscribe = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const membersData = snapshot.val();
        const membersArray = Object.keys(membersData).map(
          (key) => membersData[key].name || key
        );
        setPartyMembers(membersArray);
      } else {
        setPartyMembers([]);
      }
    });

    return () => unsubscribe();
  }, [partyRoom]);

  return (
    <TimerContext.Provider value={{ now, partyMembers }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
