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
          // Check if parsedValue is an object before merging
          if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)) {
            return { ...initialState, ...parsedValue }; // Merge for objects
          }
          return parsedValue; // Directly return for non-objects (like string theme)
        } catch (error) {
          console.error("Error parsing stored value:", error);
          return initialState;
        }
      }
      localStorage.setItem(key, JSON.stringify(initialState));
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
