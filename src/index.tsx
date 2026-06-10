import React from 'react';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

import App from './App';
import './styles/Global';

import { SettingsProvider } from './contexts/SettingsContext';
import { TimerProvider } from './contexts/TimerContext';

dayjs.locale('th');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </SettingsProvider>
  </React.StrictMode>
);
