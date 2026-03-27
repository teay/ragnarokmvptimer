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
import { WelcomeScreen } from './components/WelcomeScreen';

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

function RecordingControl() {
  const { isRecording, toggleRecording } = useMvpsContext();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px 15px',
        borderRadius: '30px',
        border: `2px solid ${isRecording ? '#ff4444' : '#444'}`,
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      }}
    >
      {isRecording && (
        <div
          style={{
            width: '12px',
            height: '12px',
            background: '#ff4444',
            borderRadius: '50%',
            animation: 'blink 1s infinite',
          }}
        />
      )}
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      <button
        onClick={toggleRecording}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1.2rem',
        }}
      >
        {isRecording ? 'STOP RECORDING' : 'START REC (DEV)'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <MvpProvider>
      <AppContent />
    </MvpProvider>
  );
}

function AppContent() {
  const { activeMvps, saveMvps } = useMvpsContext();
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
        const isInput =
          target.tagName === 'INPUT' ||
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

  // App version check - disabled for now
  /*
  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      localStorage.clear();
      localStorage.setItem('appVersion', APP_VERSION);
      window.location.reload();
    }
  }, []);
  */

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
        {!hideActiveContent && (
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

            <WelcomeScreen />
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        Welcome to the Hunt!
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '30px', opacity: 0.9 }}>
        Please enter a nickname to join the room:
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: '20px',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <input
          type='text'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Your Nickname'
          autoFocus
          style={{
            padding: '15px 25px',
            fontSize: '1.2rem',
            borderRadius: '10px',
            border: 'none',
            minWidth: '250px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          }}
        />
        <button
          type='submit'
          style={{
            padding: '15px 40px',
            fontSize: '1.2rem',
            borderRadius: '10px',
            cursor: 'pointer',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          }}
        >
          Join Room
        </button>
      </form>
    </div>
  );
}

function JoiningScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(15px)',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          border: '8px solid #f3f3f3',
          borderTop: '8px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '30px',
        }}
      ></div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      <h1
        style={{
          fontSize: '2.5rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        Joining Room...
      </h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.8, marginTop: '10px' }}>
        Synchronizing with the party data.
      </p>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(15px)',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          color: '#4CAF50',
          marginBottom: '20px',
          animation: 'bounce 1s ease infinite',
        }}
      >
        ✓
      </div>
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>
      <h1
        style={{
          fontSize: '3.5rem',
          color: '#4CAF50',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        Success!
      </h1>
      <p style={{ fontSize: '1.5rem', marginTop: '10px' }}>
        You have joined the room. Redirecting...
      </p>
    </div>
  );
}
