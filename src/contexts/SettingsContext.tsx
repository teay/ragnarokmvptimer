import { createContext, useContext, ReactNode, useCallback } from 'react';

import { usePersistedState } from '@/hooks/usePersistedState';

import { 
  SERVERS, 
  DEFAULT_SETTINGS, 
  LOCAL_STORAGE_SETTINGS_KEY 
} from '@/constants';

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
  servers: string[];
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
  showMvpMap: boolean;
  toggleShowMvpMap: () => void;
}

export const SettingsContext = createContext({} as SettingsContextData);

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = usePersistedState(
    LOCAL_STORAGE_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

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

  const toggleShowMvpMap = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      showMvpMap: !prev.showMvpMap,
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
    (density: 'low' | 'medium' | 'high' | 'Empty') => {
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
      } else {
        // dark default
        return {
          ...prev,
          particleColor: '#fa0000',
          particleOpacity: 0.5,
          waveColor: '#0011ff',
          waveOpacity: 1.0,
          animatedBackgroundColor: '#000000',
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
        servers: SERVERS,
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
        changeWaveLineWidth,
        changeWaveColor,
        changeWaveOpacity,
        changeAnimatedBackgroundColor,
        changeAnimatedBackgroundOpacity,
        toggleMainContentTransparency,
        changeParticleEffect,
        toggleSparkleEffect,
        changeSparkleDensity,
        toggleFallingElements,
        resetColorsToThemeDefaults,
        changeWaveTrailColor,
        changeWaveTrailOpacity,
        toggleShowMvpMap,
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
