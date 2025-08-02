import { useEffect } from 'react';
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
import { useNotification } from './hooks';
import { useTheme } from './hooks';

import { LOCALES } from './locales';
import { messages } from './locales/messages';

export default function App() {
  
  const { language, isGlassUIEnabled } = useSettings();
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
    const html = document.querySelector('html');
    if (html) {
      if (!isGlassUIEnabled) {
        html.classList.add('non-glass-ui');
      } else {
        html.classList.remove('non-glass-ui');
      }
    }
  }, [isGlassUIEnabled]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      html.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <>
      <IntlProvider
        messages={messages[language]}
        locale={language}
        defaultLocale={LOCALES.ENGLISH}
      >
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
      </IntlProvider>
    </>
  );
}
