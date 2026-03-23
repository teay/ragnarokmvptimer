import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import dayjs from 'dayjs';
import { ref, onValue } from '@/services/firebase';
import { database, DB_ROOT_PATH } from '@/services/firebase';
import { useSettings } from '@/contexts/SettingsContext';

interface PartyMember {
  name: string;
  lastSeen: string;
  isOnline: boolean;
}

interface TimerContextData {
  now: dayjs.Dayjs;
  partyMembers: PartyMember[] | undefined;
}

const TimerContext = createContext<TimerContextData>({} as TimerContextData);

const ONLINE_THRESHOLD_MS = 60000; // 1 minute

export function TimerProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(dayjs());
  const [partyMembers, setPartyMembers] = useState<PartyMember[] | undefined>(
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
    if (!partyRoom) {
      setPartyMembers(undefined);
      return;
    }

    const membersRef = ref(
      database,
      `${DB_ROOT_PATH}/party/${partyRoom}/members`
    );

    const unsubscribe = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) {
        const membersData = snapshot.val();
        const now = dayjs();

        const membersList: PartyMember[] = Object.keys(membersData).map(
          (key) => {
            const data = membersData[key];
            const lastSeen = data.lastSeen ? dayjs(data.lastSeen) : dayjs(0);
            const isOnline = now.diff(lastSeen) < ONLINE_THRESHOLD_MS;

            return {
              name: data.name || key,
              lastSeen: data.lastSeen || '',
              isOnline,
            };
          }
        );
        setPartyMembers(membersList);
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
