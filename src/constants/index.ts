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
  isGlassUIEnabled: true, // User prefers glass UI enabled
  isAnimatedBackgroundEnabled: false, // Keep off for performance
  backgroundEffectMode: 'full' as 'full' | 'top' | 'bottom' | 'center',
  particleDensity: 'Empty' as 'low' | 'medium' | 'high' | 'Empty', // Empty for performance
  particleColor: '#fa0000',
  particleOpacity: 0.5,
  waveAmplitude: 150, // As per user's preferred setting
  waveLineWidth: 5, // As per user's preferred setting
  waveColor: '#0011ff',
  waveOpacity: 1, // As per user's preferred setting
  animatedBackgroundColor: '#000000',
  animatedBackgroundOpacity: 1, // As per user's preferred setting
  isMainContentTransparent: false,
  waveTrailColor: '#0011ff',
  waveTrailOpacity: 1,
  isSparkleEffectEnabled: false,
  sparkleDensity: 0,
  isFallingElementsEnabled: false,
  simpleGlassUI: false,
  ultraLite: true, // Enabled Ultra Lite Mode (but note: may conflict with glass UI; user wants both)
  particleEffect: 'default' as 'default' | 'gravity',
  language: DEFAULT_LANG,
  server: 'thROG', // User's preferred server
  font: 'Jost',
  showMvpMap: true,
  partyRoom: null as string | null,
  localSaveEnabled: true,
  cloudSyncEnabled: true,
  nickname: '',
};

export const LOCAL_STORAGE_THEME_KEY = 'theme';
export const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
export const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';
export const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
