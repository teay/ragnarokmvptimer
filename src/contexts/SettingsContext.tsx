import { createContext, useContext, ReactNode, useCallback } from 'react';

import { usePersistedState, useTheme } from '../hooks';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_SETTINGS_KEY } from '../constants';

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
  isMainContentTransparent: boolean; // New setting
  toggleMainContentTransparency: () => void; // New toggle
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

  const { isSparkleEffectEnabled, sparkleDensity, isFallingElementsEnabled } = settings;

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

  const toggleAnimatedBackground = useCallback(() => { // New toggle implementation
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

  /* const resetSettings = useCallback(() => {

  

  /* const resetSettings = useCallback(() => {
    resetTheme();
    setSettings(DEFAULT_SETTINGS);
  }, [resetTheme, setSettings]); */

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
