import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';

// Self-contained custom hook for persisting state to localStorage
const usePersistedState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Failed to parse stored state:", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
};

// Self-contained mock theme hook for this context
const useTheme = () => {
  const resetTheme = useCallback(() => {
    // This function can be implemented later if needed. For now, it's a placeholder.
    console.log("Theme reset requested. (Function not implemented)");
  }, []);
  return { resetTheme };
};

// Local definitions to make the component self-contained
const LOCALES = {
  ENGLISH: 'en-US',
};

const DEFAULT_THEME = 'dark';
const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
const DEFAULT_LANG = LOCALES.ENGLISH;
const DEFAULT_SERVER = 'iRO';

const DEFAULT_SETTINGS = {
  respawnAsCountdown: true,
  hideActiveContent: false,
  animatedSprites: false,
  use24HourFormat: true,
  isNotificationSoundEnabled: true,
  isGlassUIEnabled: false,
  isAnimatedBackgroundEnabled: true,
  backgroundEffectMode: 'full' as 'full' | 'top' | 'bottom' | 'center',
  particleDensity: 'medium' as 'low' | 'medium' | 'high',
  particleColor: 'rgba(0, 0, 0, 0.5)',
  waveAmplitude: 10,
  waveColor: 'rgba(0, 0, 0, 0.1)',
  animatedBackgroundClearColor: 'rgba(0, 0, 0, 0.05)',
  isMainContentTransparent: false,
  isSparkleEffectEnabled: false,
  sparkleDensity: 50,
  isFallingElementsEnabled: false,
  particleEffect: 'default' as 'default' | 'gravity',
  language: DEFAULT_LANG,
  server: DEFAULT_SERVER,
  font: 'Jost',
};

const LOCAL_STORAGE_THEME_KEY = 'theme';
const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';

interface SettingsProviderProps {
  children: ReactNode;
}

interface SettingsContextData {
  respawnAsCountdown: boolean;
  toggleRespawnCountdown: () => void;
  hideActiveContent: boolean;
  toggleHideActiveContent: () => void;
  animatedSprites: boolean;
  toggleAnimatedSprites: () => void;
  use24HourFormat: boolean;
  toggle24HourFormat: () => void;
  isNotificationSoundEnabled: boolean;
  toggleNotificationSound: () => void;
  isGlassUIEnabled: boolean;
  toggleGlassUI: () => void;
  language: string;
  changeLanguage: (id: string) => void;
  server: string;
  changeServer: (id: string) => void;
  font: string;
  changeFont: () => void;
  isAnimatedBackgroundEnabled: boolean;
  toggleAnimatedBackground: () => void;
  backgroundEffectMode: 'full' | 'top' | 'bottom' | 'center';
  changeBackgroundEffectMode: (mode: 'full' | 'top' | 'bottom' | 'center') => void;
  particleDensity: 'low' | 'medium' | 'high';
  changeParticleDensity: (density: 'low' | 'medium' | 'high') => void;
  particleColor: string;
  changeParticleColor: (color: string) => void;
  waveAmplitude: number;
  changeWaveAmplitude: (amplitude: number) => void;
  waveColor: string;
  changeWaveColor: (color: string) => void;
  animatedBackgroundClearColor: string;
  changeAnimatedBackgroundClearColor: (color: string) => void;
  isMainContentTransparent: boolean;
  toggleMainContentTransparency: () => void;
  particleEffect: 'default' | 'gravity';
  changeParticleEffect: (effect: 'default' | 'gravity') => void;
  isSparkleEffectEnabled: boolean;
  toggleSparkleEffect: () => void;
  sparkleDensity: number;
  changeSparkleDensity: (density: number) => void;
  isFallingElementsEnabled: boolean;
  toggleFallingElements: () => void;
}

export const SettingsContext = createContext({} as SettingsContextData);

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { resetTheme } = useTheme();
  const [settings, setSettings] = usePersistedState(
    LOCAL_STORAGE_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const {
    isSparkleEffectEnabled,
    sparkleDensity,
    isFallingElementsEnabled,
    particleColor,
    waveColor,
  } = settings;

  const toggleRespawnCountdown = useCallback(
    () =>
      setSettings((prev) => ({
        ...prev,
        respawnAsCountdown: !prev.respawnAsCountdown,
      })),
    [setSettings]
  );

  const toggleHideActiveContent = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      hideActiveContent: !prev.hideActiveContent,
    }));
  }, [setSettings]);

  const toggleAnimatedSprites = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      animatedSprites: !prev.animatedSprites,
    }));
  }, [setSettings]);

  const toggle24HourFormat = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      use24HourFormat: !prev.use24HourFormat,
    }));
  }, [setSettings]);

  const toggleNotificationSound = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isNotificationSoundEnabled: !prev.isNotificationSoundEnabled,
    }));
  }, [setSettings]);

  const toggleGlassUI = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isGlassUIEnabled: !prev.isGlassUIEnabled,
    }));
  }, [setSettings]);

  const toggleAnimatedBackground = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isAnimatedBackgroundEnabled: !prev.isAnimatedBackgroundEnabled,
    }));
  }, [setSettings]);

  const changeLanguage = useCallback(
    (language: string) => {
      setSettings((prev) => ({
        ...prev,
        language,
      }));
    },
    [setSettings]
  );

  const changeServer = useCallback(
    (server: string) => {
      setSettings((prev) => ({
        ...prev,
        server,
      }));
    },
    [setSettings]
  );

  const changeBackgroundEffectMode = useCallback(
    (mode: 'full' | 'top' | 'bottom' | 'center') => {
      setSettings((prev) => ({
        ...prev,
        backgroundEffectMode: mode,
      }));
    },
    [setSettings]
  );

  const changeParticleDensity = useCallback(
    (density: 'low' | 'medium' | 'high') => {
      setSettings((prev) => ({
        ...prev,
        particleDensity: density,
      }));
    },
    [setSettings]
  );

  const changeParticleColor = useCallback(
    (color: string) => {
      setSettings((prev) => ({
        ...prev,
        particleColor: color,
      }));
    },
    [setSettings]
  );

  const changeWaveAmplitude = useCallback(
    (amplitude: number) => {
      setSettings((prev) => ({
        ...prev,
        waveAmplitude: amplitude,
      }));
    },
    [setSettings]
  );

  const changeWaveColor = useCallback(
    (color: string) => {
      setSettings((prev) => ({
        ...prev,
        waveColor: color,
      }));
    },
    [setSettings]
  );

  const changeAnimatedBackgroundClearColor = useCallback(
    (color: string) => {
      setSettings((prev) => ({
        ...prev,
        animatedBackgroundClearColor: color,
      }));
    },
    [setSettings]
  );

  const toggleMainContentTransparency = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isMainContentTransparent: !prev.isMainContentTransparent,
    }));
  }, [setSettings]);

  const changeParticleEffect = useCallback(
    (effect: 'default' | 'gravity') => {
      setSettings((prev) => ({
        ...prev,
        particleEffect: effect,
      }));
    },
    [setSettings]
  );

  const changeFont = useCallback(() => {
    const fonts = ['Jost', 'Orbitron', 'Exo 2'];
    setSettings((prev) => {
      const currentIndex = fonts.indexOf(prev.font || 'Jost');
      const nextIndex = (currentIndex + 1) % fonts.length;
      return {
        ...prev,
        font: fonts[nextIndex],
      };
    });
  }, [setSettings]);

  const toggleSparkleEffect = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isSparkleEffectEnabled: !prev.isSparkleEffectEnabled,
    }));
  }, [setSettings]);

  const changeSparkleDensity = useCallback((density: number) => {
    setSettings((prev) => ({
      ...prev,
      sparkleDensity: density,
    }));
  }, [setSettings]);

  const toggleFallingElements = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      isFallingElementsEnabled: !prev.isFallingElementsEnabled,
    }));
  }, [setSettings]);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        toggleRespawnCountdown,
        toggleHideActiveContent,
        toggleAnimatedSprites,
        toggle24HourFormat,
        toggleNotificationSound,
        toggleGlassUI,
        changeLanguage,
        changeServer,
        changeFont,
        toggleAnimatedBackground,
        changeBackgroundEffectMode,
        changeParticleDensity,
        changeParticleColor,
        changeWaveAmplitude,
        changeWaveColor,
        changeAnimatedBackgroundClearColor,
        toggleMainContentTransparency,
        changeParticleEffect,
        toggleSparkleEffect,
        changeSparkleDensity,
        toggleFallingElements,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
