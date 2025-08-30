import { LOCALES } from '../locales';

export const DEFAULT_THEME = 'dark';

export const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
export const DEFAULT_LANG = LOCALES.ENGLISH;
export const DEFAULT_SERVER = 'iRO';

export const DEFAULT_SETTINGS = {
  respawnAsCountdown: true,
  hideActiveContent: false,
  animatedSprites: false,
  use24HourFormat: true,
  isNotificationSoundEnabled: true,
  
  isGlassUIEnabled: false,
  isAnimatedBackgroundEnabled: true, // New setting
  backgroundEffectMode: 'full' as 'full' | 'top' | 'bottom' | 'center', // New: default to full screen
  particleDensity: 'medium' as 'low' | 'medium' | 'high', // New: default particle density
  particleColor: 'rgba(0, 0, 0, 0.5)', // Adjusted for light mode
  waveAmplitude: 10, // New: default wave amplitude
  waveColor: 'rgba(0, 0, 0, 0.1)', // Adjusted for light mode
  isMainContentTransparent: false, // New setting for main content transparency
  isSparkleEffectEnabled: false,
  sparkleDensity: 50,
  isFallingElementsEnabled: false,
  particleEffect: 'default' as 'default' | 'gravity',
  language: DEFAULT_LANG,
  server: DEFAULT_SERVER,
  font: 'Jost',
};

export const LOCAL_STORAGE_THEME_KEY = 'theme';
export const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
export const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';
