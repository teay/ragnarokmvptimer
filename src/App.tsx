import { useEffect, useState } from 'react';
import LuminousParticlesBackground from './components/LuminousParticlesBackground';
import { SparkleEffect } from './components/SparkleEffect';
import { IntlProvider } from 'react-intl';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(duration);
dayjs.extend(relativeTime);

import { Main } from './pages/Main';

import { Header } from './components/Header';
import { WarningHeader } from './components/WarningHeader';
import { Footer } from './components/Footer';

import { useSettings } from './contexts/SettingsContext';
import { MvpProvider, useMvpsContext } from './contexts/MvpsContext';
import { useNotification } from './hooks';
import { useTheme } from './hooks';

import { LOCALES } from './locales';
import { messages } from './locales/messages';
import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from './constants';

const APP_VERSION = '2'; // Define the current version of the application

export default function App() {
  const { 
    activeMvps,
    saveMvps,
  } = useMvpsContext();

  const { 
    language, 
    isGlassUIEnabled, 
    isAnimatedBackgroundEnabled, 
    isMainContentTransparent, 
    font, 
    isSparkleEffectEnabled, 
    sparkleDensity, 
    hideActiveContent, 
    toggleHideActiveContent,
    toggleShowMvpMap, // Get the toggle function
    ultraLite,
    joinState,
    setJoinState,
    joinRoomId,
    setJoinRoomId,
    joinServer,
    setJoinServer,
    joinNickname,
    setJoinNickname,
    nickname,
    changePartyRoom,
    changeServer,
    changeNickname,
    server,
  } = useSettings();
  
  const { theme } = useTheme();
  const {
    hasNotificationPermission,
    isNotificationPermissionDenied,
    browserSupportsNotifications,
  } = useNotification();

  // Handle Global Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = async (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;
        
        if (!isInput) {
          toggleShowMvpMap();
        }
      }

      if (e.code === 'F11' || (e.altKey && e.code === 'Enter')) {
        if (window.__TAURI_INTERNALS__) {
          e.preventDefault();
          try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const appWindow = getCurrentWindow();
            const isFullscreen = await appWindow.isFullscreen();
            await appWindow.setFullscreen(!isFullscreen);
          } catch (err) {
            console.error('Failed to toggle fullscreen:', err);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [toggleShowMvpMap]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const serverParam = params.get('server');
    const nick = params.get('nickname');

    if (room) {
      setJoinRoomId(room);
      if (serverParam) setJoinServer(serverParam);
      if (nick) setJoinNickname(nick);

      if (nick || nickname) {
        setJoinState('joining');
      } else {
        setJoinState('idle');
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [nickname, setJoinNickname, setJoinRoomId, setJoinServer, setJoinState]);

  useEffect(() => {
    if (joinState === 'joining') {
      const timer = setTimeout(() => {
        setJoinState('success');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [joinState, setJoinState]);

  useEffect(() => {
    if (joinState === 'success') {
      const timer = setTimeout(() => {
        const room = joinRoomId;
        const serverToJoin = joinServer || server;
        const nick = joinNickname;

        try {
          const allLocalRaw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);
          const allLocal = allLocalRaw ? JSON.parse(allLocalRaw) : {};
          const myLocalData = allLocal[serverToJoin] || [];
          
          if (room) {
            changePartyRoom(room);
            if (joinServer) changeServer(joinServer);
            if (nick) changeNickname(nick);
            
            if (myLocalData.length > 0) {
              setTimeout(() => {
                 saveMvps([...activeMvps, ...myLocalData]); 
              }, 500);
            }
          }
        } catch (e) {
          console.error("Failed to merge local data into room", e);
          if (room) changePartyRoom(room);
        }

        setJoinState('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [joinState, setJoinState, joinRoomId, joinServer, joinNickname, changePartyRoom, changeServer, changeNickname, server, activeMvps, saveMvps]);

  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('appVersion', APP_VERSION);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    dayjs.locale(language);
  }, [language]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      if (ultraLite) {
        html.classList.add('ultra-lite');
      } else {
        html.classList.remove('ultra-lite');
      }
    }
  }, [ultraLite]);

  useEffect(() => {
    if (hideActiveContent) {
      const exitHideMode = () => {
        toggleHideActiveContent();
        document.removeEventListener('mousemove', exitHideMode);
        document.removeEventListener('touchstart', exitHideMode);
      };
      document.addEventListener('mousemove', exitHideMode);
      document.addEventListener('touchstart', exitHideMode);

      return () => {
        document.removeEventListener('mousemove', exitHideMode);
        document.removeEventListener('touchstart', exitHideMode);
      };
    }
  }, [hideActiveContent, toggleHideActiveContent]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      if (!isGlassUIEnabled) {
        html.classList.add('non-glass-ui');
      } else {
        html.classList.remove('non-glass-ui');
      }

      if (isMainContentTransparent) {
        html.classList.add('transparent-main-content');
      } else {
        html.classList.remove('transparent-main-content');
      }
    }
  }, [isGlassUIEnabled, isMainContentTransparent]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      html.dataset.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      html.dataset.font = font;
    }
  }, [font]);

  return (
    <>
      {isAnimatedBackgroundEnabled && <LuminousParticlesBackground />}
      {isSparkleEffectEnabled && <SparkleEffect count={sparkleDensity} />}
      <IntlProvider
        messages={messages[language]}
        locale={language}
        defaultLocale={LOCALES.ENGLISH}
      >
        {joinState === 'joining' && <JoiningScreen />}
        {joinState === 'success' && <SuccessScreen />}
        {joinState === 'idle' && new URLSearchParams(window.location.search).get('room') && (
          <NicknamePrompt />
        )}

        {!hideActiveContent && joinState === 'idle' && !new URLSearchParams(window.location.search).get('room') && (
          <>
            {!hasNotificationPermission && (
              <WarningHeader
                text={
                  messages[language][
                    !browserSupportsNotifications
                      ? 'notifications_not_supported'
                      : isNotificationPermissionDenied
                      ? 'denied_notifications'
                      : 'disabled_notifications'
                  ]
                }
              />
            )}

            <MvpProvider>
              <Header />
              <Main />
              <Footer />
            </MvpProvider>
            <WarningHeader text={messages[language]['under_development']} />
          </>
        )}
      </IntlProvider>
    </>
  );
}

function NicknamePrompt() {
  const { setJoinState, setJoinNickname, changeNickname } = useSettings();
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      changeNickname(value.trim());
      setJoinNickname(value.trim());
      setJoinState('joining');
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', color: 'white', textAlign: 'center', padding: '20px'
    }}>
      <h1>Welcome to the Hunt!</h1>
      <p>Please enter a nickname to join the room:</p>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your Nickname"
          style={{ padding: '10px', borderRadius: '5px', border: 'none', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
          Join Room
        </button>
      </form>
    </div>
  );
}

function JoiningScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', color: 'white', textAlign: 'center'
    }}>
      <div className="loader"></div>
      <h1 style={{ marginTop: '20px' }}>Joining Room...</h1>
      <p>Synchronizing with the party data.</p>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', color: 'white', textAlign: 'center'
    }}>
      <h1 style={{ color: '#4CAF50' }}>Success!</h1>
      <p>You have joined the room. Redirecting to the main board...</p>
    </div>
  );
}
