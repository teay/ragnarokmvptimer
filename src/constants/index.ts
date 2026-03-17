// Local definition to make the component self-contained
const LOCALES = {
  ENGLISH: 'en',
};

export const SERVERS = [
  'aRO',
  'bRO',
  'cRO',
  'fRO',
  'GGH',
  'idRO',
  'iRO',
  'iROC',
  'jRO',
  'kROM',
  'kROZ',
  'kROZS',
  'ruRO',
  'thROG',
  'twRO',
];

export const DEFAULT_THEME = 'dark';
export const DEFAULT_LANG = LOCALES.ENGLISH;
export const DEFAULT_SERVER = 'iRO';

export const DEFAULT_SETTINGS = {
  respawnAsCountdown: true,
  hideActiveContent: false,
  animatedSprites: true, // Enabled Animated MVP Sprites
  use24HourFormat: true,
  isNotificationSoundEnabled: true,
  isGlassUIEnabled: false, // Disabled for Ultra Lite Mode
  isAnimatedBackgroundEnabled: false, // Disabled for Ultra Lite Mode
  backgroundEffectMode: 'full' as 'full' | 'top' | 'bottom' | 'center', // Keep default or adjust if needed
  particleDensity: 'low' as 'low' | 'medium' | 'high' | 'Empty', // Set particle density to low
  particleColor: '#fa0000',
  particleOpacity: 0.5,
  waveAmplitude: 0, // Minimized for Extreme Performance
  waveLineWidth: 0, // Minimized for Extreme Performance
  waveColor: '#0011ff',
  waveOpacity: 0.1,
  animatedBackgroundColor: '#000000',
  animatedBackgroundOpacity: 0.05,
  isMainContentTransparent: true, 
  waveTrailColor: '#0011ff',
  waveTrailOpacity: 0.1,
  isSparkleEffectEnabled: false, // Disabled
  sparkleDensity: 0, // Set sparkle density to 0
  isFallingElementsEnabled: false, // Disabled for Ultra Lite Mode
  simpleGlassUI: true, // Enabled for Lite Mode
  ultraLite: true, // Enabled Ultra Lite Mode
  particleEffect: 'default' as 'default' | 'gravity', // Keep default or adjust
  language: DEFAULT_LANG,
  server: DEFAULT_SERVER,
  font: 'Jost',
  showMvpMap: true,
  partyRoom: null as string | null,
  localSaveEnabled: true,
  cloudSyncEnabled: true,
  autoSnapshotEnabled: false,
  nickname: '',
};

export const LOCAL_STORAGE_THEME_KEY = 'theme';
export const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
export const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';
export const LOCAL_STORAGE_BACKUPS_KEY = 'mvpBackups';
export const MAX_BACKUPS = 10;
export const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
