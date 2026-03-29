import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type Response<T> = [T, Dispatch<SetStateAction<T>>];

export function useSessionState<T>(
  key: string,
  initialState: T
): Response<T> {
  const [state, setState] = useState(() => {
    try {
      const storageValue = sessionStorage.getItem(key);
      if (storageValue) {
        try {
          const parsedValue = JSON.parse(storageValue);
          return parsedValue;
        } catch (error) {
          console.error("Error parsing session stored value:", error);
          return initialState;
        }
      }
      return initialState;
    } catch (error) {
      console.error("Error accessing sessionStorage:", error);
      return initialState;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
