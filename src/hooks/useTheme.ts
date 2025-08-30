import { useEffect, useCallback } from 'react';
import { usePersistedState } from './usePersistedState';
import { DEFAULT_THEME, LOCAL_STORAGE_THEME_KEY } from '@/constants';

function updateHTML(theme: string) {
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setTheme] = usePersistedState(
    LOCAL_STORAGE_THEME_KEY,
    DEFAULT_THEME
  );

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme: string) => {
      if (prevTheme === 'dark') return 'light';
      if (prevTheme === 'light') return 'light-mode';
      return 'dark';
    });
  }, [setTheme]);

  const resetTheme = useCallback(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    updateHTML(theme);
  }, [theme]);

  return { theme, toggleTheme, resetTheme };
}
