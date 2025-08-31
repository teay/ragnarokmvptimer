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

const APP_VERSION = '2'; // Define the current version of the application

export default function App() {
  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      console.log('Old app version detected, clearing storage and reloading.');
      localStorage.clear();
      localStorage.setItem('appVersion', APP_VERSION);
      window.location.reload();
    }
  }, []);

  const { language, isGlassUIEnabled, isAnimatedBackgroundEnabled, isMainContentTransparent, font, isSparkleEffectEnabled, sparkleDensity, isFallingElementsEnabled, hideActiveContent, toggleHideActiveContent } = useSettings(); // Add new setting
  const { theme } = useTheme();
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

      // Add/remove class for main content transparency
      if (isMainContentTransparent) {
        html.classList.add('transparent-main-content');
      } else {
        html.classList.remove('transparent-main-content');
      }
    }
  }, [isGlassUIEnabled, isMainContentTransparent]); // Add isMainContentTransparent to dependencies

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
      {isAnimatedBackgroundEnabled && <LuminousParticlesBackground />} {/* Conditionally render */}
      {isSparkleEffectEnabled && <SparkleEffect count={sparkleDensity} />} {/* Conditionally render SparkleEffect */}
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

            <Header />

            <MvpProvider>
              <Main />
            </MvpProvider>

            <Footer />
            <WarningHeader text={messages[language]['under_development']} />
          </>
        )}
      </IntlProvider>
    </>
  );
}