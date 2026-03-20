import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import dayjs from 'dayjs';
import { getDatabase, ref, onValue, off, DatabaseReference } from 'firebase/database'; // Import Firebase functions
import { useSettings } from '@/contexts/SettingsContext'; // Import useSettings to get partyRoom

// Define the structure for Timer Context
interface TimerContextData {
  now: dayjs.Dayjs;
  partyMembers: string[] | undefined; // Added partyMembers
}

// Create the context
const TimerContext = createContext<TimerContextData>({} as TimerContextData);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(dayjs());
  const [partyMembers, setPartyMembers] = useState<string[] | undefined>(undefined); // State for party members

  // Get settings, including partyRoom
  const { partyRoom, nickname } = useSettings(); // Assuming nickname is also relevant for party context

  console.log('Current partyRoom in TimerProvider:', partyRoom); // Log partyRoom

  // Effect to update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Effect to listen for party members from Firebase
  useEffect(() => {
    let membersRef: DatabaseReference | null = null;

    console.log('Checking partyRoom value in useEffect:', partyRoom); // Log partyRoom before checking

    if (partyRoom) {
      const database = getDatabase(); // Get Firebase database instance
      // Construct path for party members in Firebase Realtime Database
      // Assumes data is stored under 'parties/{partyRoom}/members'
      membersRef = ref(database, `parties/${partyRoom}/members`); // Construct path

      console.log('Firebase listener attached for party:', partyRoom); // Log listener attachment

      // Set up a real-time listener for changes in party members
      const unsubscribe = onValue(membersRef, (snapshot) => {
        console.log('onValue callback executed'); // Log that callback is called
        console.log('Firebase snapshot exists:', snapshot.exists()); // Log if snapshot exists
        console.log('Raw Firebase data:', snapshot.val()); // Log received data

        if (snapshot.exists()) {
          const membersData = snapshot.val();
          // Assuming membersData is an object where keys are member IDs/names
          // and we want to extract the names (or whatever is stored) as an array of strings.
          // Adjust this logic if the data structure is different.
          // Example: if membersData is like { memberId1: { name: '...' }, memberId2: { name: '...' } }
          const membersArray = Object.keys(membersData).map(key => membersData[key].name || key); // Example: assuming data structure { memberId: { name: '...' } } or just { memberId: 'name' }
          console.log('Processed membersArray:', membersArray); // Added log for processed array
          setPartyMembers(membersArray);
        } else {
          setPartyMembers(undefined); // No party members found or party deleted
        }
      });

      // Cleanup function to remove the listener when the component unmounts or partyRoom changes
      return () => {
        if (membersRef) {
          off(membersRef, unsubscribe); // Properly remove listener
        }
      };
    } else {
      // If there's no partyRoom, clear party members
      setPartyMembers(undefined);
    }
  }, [partyRoom]); // Re-run effect if partyRoom changes

  return (
    <TimerContext.Provider value={{ now, partyMembers }}> {/* Include partyMembers in context value */}
      {children}
    </TimerContext.Provider>
  );
}

// Hook to consume the timer context
export function useTimer() {
  const context = useContext(TimerContext);
  // Return all necessary values
  return { now: context.now, partyMembers: context.partyMembers };
}
