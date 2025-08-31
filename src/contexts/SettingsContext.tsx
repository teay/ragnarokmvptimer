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
  particleDensity: 'medium' as 'low' | 'medium' | 'high' | 'Empty', // <-- แก้ไขตรงนี้
  particleColor: '#000000',
  particleOpacity: 0.5,
  waveAmplitude: 10,
  waveLineWidth: 5,
  waveColor: '#000000',
  waveOpacity: 0.1,
  animatedBackgroundColor: '#000000',
  animatedBackgroundOpacity: 0.05,
  isMainContentTransparent: false,
  waveTrailColor: '#000000',
  waveTrailOpacity: 0.1,
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
  particleDensity: 'low' | 'medium' | 'high' | 'Empty';
  changeParticleDensity: (density: 'low' | 'medium' | 'high' | 'Empty') => void;
  particleColor: string;
  changeParticleColor: (color: string) => void;
  particleOpacity: number;
  changeParticleOpacity: (opacity: number) => void;
  // เพิ่ม 2 บรรทัดนี้
  waveAmplitude: number;
  changeWaveAmplitude: (amplitude: number) => void;
  waveLineWidth: number;
  changeWaveLineWidth: (width: number) => void;
  waveColor: string;
  changeWaveColor: (color: string) => void;
  waveOpacity: number;
  changeWaveOpacity: (opacity: number) => void;
  animatedBackgroundColor: string;
  changeAnimatedBackgroundColor: (color: string) => void;
  animatedBackgroundOpacity: number;
  changeAnimatedBackgroundOpacity: (opacity: number) => void;
  waveTrailColor: string;
  changeWaveTrailColor: (color: string) => void;
  waveTrailOpacity: number;
  changeWaveTrailOpacity: (opacity: number) => void;
  resetColorsToThemeDefaults: (theme: string) => void;
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
    (density: 'low' | 'medium' | 'high' | 'Empty') => { // <-- แก้ไขตรงนี้
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

  const changeParticleOpacity = useCallback(
    (opacity: number) => {
      setSettings((prev) => ({
        ...prev,
        particleOpacity: opacity,
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

  const changeWaveLineWidth = useCallback(
    (width: number) => {
      setSettings((prev) => ({
        ...prev,
        waveLineWidth: width,
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

  const changeWaveOpacity = useCallback(
    (opacity: number) => {
      setSettings((prev) => ({
        ...prev,
        waveOpacity: opacity,
      }));
    },
    [setSettings]
  );

  const changeAnimatedBackgroundColor = useCallback(
    (color: string) => {
      setSettings((prev) => ({
        ...prev,
        animatedBackgroundColor: color,
      }));
    },
    [setSettings]
  );

  const changeAnimatedBackgroundOpacity = useCallback(
    (opacity: number) => {
      setSettings((prev) => ({
        ...prev,
        animatedBackgroundOpacity: opacity,
      }));
    },
    [setSettings]
  );

  const changeWaveTrailColor = useCallback(
    (color: string) => {
      setSettings((prev) => ({
        ...prev,
        waveTrailColor: color,
      }));
    },
    [setSettings]
  );

  const changeWaveTrailOpacity = useCallback(
    (opacity: number) => {
      setSettings((prev) => ({
        ...prev,
        waveTrailOpacity: opacity,
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

  const resetColorsToThemeDefaults = useCallback((theme: string) => {
    setSettings((prev) => {
      if (theme === 'light') {
        return {
          ...prev,
          particleColor: '#01d5ab',
          particleOpacity: 0.5,
          waveColor: '#2836f0',
          waveOpacity: 1.0,
          animatedBackgroundColor: '#858585',
          animatedBackgroundOpacity: 1.0,
          waveTrailColor: '#2836f0',
          waveTrailOpacity: 1.0,
        };
      } else if (theme === 'darkest') {
        return {
          ...prev,
          particleColor: '#2a2e8d',
          particleOpacity: 0.5,
          waveColor: '#3f15e0',
          waveOpacity: 1.0,
          animatedBackgroundColor: '#000000',
          animatedBackgroundOpacity: 1.0,
          waveTrailColor: '#3f15e0',
          waveTrailOpacity: 1.0,
        };
      } else if (theme === 'dark') {
        return {
          ...prev,
          particleColor: '#fa0000',
          particleOpacity: 0.5,
          waveColor: '#0011ff',
          waveOpacity: 1.0,
          animatedBackgroundColor: '#333333',
          animatedBackgroundOpacity: 1.0,
          waveTrailColor: '#0011ff',
          waveTrailOpacity: 1.0,
        };
      }
    });
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
        changeParticleOpacity,
        changeWaveAmplitude,
        waveLineWidth: settings.waveLineWidth,
        changeWaveLineWidth,
        changeWaveColor,
        changeWaveOpacity,
        changeAnimatedBackgroundColor,
        animatedBackgroundOpacity: settings.animatedBackgroundOpacity,
        changeAnimatedBackgroundOpacity,
        toggleMainContentTransparency,
        changeParticleEffect,
        toggleSparkleEffect,
        changeSparkleDensity,
        toggleFallingElements,
        resetColorsToThemeDefaults,
        changeWaveTrailColor,
        changeWaveTrailOpacity,
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