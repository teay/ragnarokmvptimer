import { useEffect } from 'react';
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
import { MvpProvider } from './contexts/MvpsContext';
import { useNotification, useKey } from './hooks';
import { useTheme } from './hooks';

import { LOCALES } from './locales';
import { messages } from './locales/messages';

const APP_VERSION = "2.1"; 

export default function App() {
  useEffect(() => {
    const handleFullscreenToggle = async (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
        e.preventDefault();
        // Skip fullscreen toggle logic if not in Tauri or complex
      }
    };

    window.addEventListener('keydown', handleFullscreenToggle);
    return () => window.removeEventListener('keydown', handleFullscreenToggle);
  }, []);

  useEffect(() => {
    const storedVersion = localStorage.getItem("appVersion");
    if (storedVersion !== APP_VERSION) {
      localStorage.setItem("appVersion", APP_VERSION);
    }
  }, []);

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
    toggleShowMvpMap,
  } = useSettings();
  const { theme } = useTheme();

  useKey('m', toggleShowMvpMap);
  const {
    hasNotificationPermission,
    isNotificationPermissionDenied,
    browserSupportsNotifications,
  } = useNotification();

  useEffect(() => {
    dayjs.locale(language);
  }, [language]);

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

  // Safety check for translations
  const currentMessages = messages[language] || messages[LOCALES.ENGLISH];

  return (
    <>
      {isAnimatedBackgroundEnabled && <LuminousParticlesBackground />}
      {isSparkleEffectEnabled && <SparkleEffect count={sparkleDensity} />}
      <IntlProvider
        messages={currentMessages}
        locale={language}
        defaultLocale={LOCALES.ENGLISH}
      >
        {!hideActiveContent && (
          <>
            {!hasNotificationPermission && (
              <WarningHeader
                text={
                  currentMessages[
                    !browserSupportsNotifications
                      ? 'notifications_not_supported'
                      : isNotificationPermissionDenied
                      ? 'denied_notifications'
                      : 'disabled_notifications'
                  ]
                }
              />
            )}

            <Header />

            <MvpProvider>
              <Main />
            </MvpProvider>

            <Footer />
            <WarningHeader text={currentMessages['under_development']} />
          </>
        )}
      </IntlProvider>
    </>
  );
}
