import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type Response<T> = [T, Dispatch<SetStateAction<T>>];

export function usePersistedState<T>(
  key: string,
  initialState: T
): Response<T> {
  const [state, setState] = useState(() => {
    try {
      const storageValue = localStorage.getItem(key);
      if (storageValue) {
        try {
          const parsedValue = JSON.parse(storageValue);
          // Merge with initialState to ensure all properties are present
          return { ...initialState, ...parsedValue };
        } catch (error) {
          console.error("Error parsing stored value:", error);
          return initialState;
        }
      }
      return initialState;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state || initialState));
  }, [key, state]);

  return [state, setState];
}
