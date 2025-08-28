import { LOCALES } from '../locales';

export const DEFAULT_THEME = 'light';

export const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
export const DEFAULT_LANG = LOCALES.ENGLISH;
export const DEFAULT_SERVER = 'iRO';

export const DEFAULT_SETTINGS = {
  respawnAsCountdown: true,
  animatedSprites: false,
  use24HourFormat: true,
  isNotificationSoundEnabled: true,
  isGlassUIEnabled: false,
  isAnimatedBackgroundEnabled: true, // New setting
  backgroundEffectMode: 'full', // New: default to full screen
  particleDensity: 'medium', // New: default particle density
  particleColor: 'rgba(255, 255, 255, 0.8)', // New: default particle color (white)
  waveAmplitude: 10, // New: default wave amplitude
  waveColor: 'rgba(0, 255, 255, 0.1)', // New: default wave color (faint cyan)
  language: DEFAULT_LANG,
  server: DEFAULT_SERVER,
  font: 'Jost',
};

export const LOCAL_STORAGE_THEME_KEY = 'theme';
export const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
export const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';
