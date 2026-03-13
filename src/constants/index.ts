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
  animatedSprites: false,
  use24HourFormat: true,
  isNotificationSoundEnabled: true,
  isGlassUIEnabled: true, 
  isAnimatedBackgroundEnabled: true,
  backgroundEffectMode: 'full' as 'full' | 'top' | 'bottom' | 'center',
  particleDensity: 'medium' as 'low' | 'medium' | 'high' | 'Empty',
  particleColor: '#fa0000',
  particleOpacity: 0.5,
  waveAmplitude: 150,
  waveLineWidth: 5,
  waveColor: '#0011ff',
  waveOpacity: 0.1,
  animatedBackgroundColor: '#000000',
  animatedBackgroundOpacity: 0.05,
  isMainContentTransparent: true, 
  waveTrailColor: '#0011ff',
  waveTrailOpacity: 0.1,
  isSparkleEffectEnabled: false,
  sparkleDensity: 50,
  isFallingElementsEnabled: true, 
  simpleGlassUI: false,
  ultraLite: false,
  particleEffect: 'default' as 'default' | 'gravity',
  language: DEFAULT_LANG,
  server: DEFAULT_SERVER,
  font: 'Jost',
  showMvpMap: true,
  partyRoom: null as string | null,
  localSaveEnabled: true,
  cloudSyncEnabled: true,
  autoSnapshotEnabled: false,
};

export const LOCAL_STORAGE_THEME_KEY = 'theme';
export const LOCAL_STORAGE_SETTINGS_KEY = 'settings';
export const LOCAL_STORAGE_ACTIVE_MVPS_KEY = 'activeMvps';
export const LOCAL_STORAGE_BACKUPS_KEY = 'mvpBackups';
export const MAX_BACKUPS = 10;
export const RESPAWN_TIMER_SOON_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes
