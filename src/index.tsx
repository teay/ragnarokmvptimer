import React from 'react';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
// import 'dayjs/locale/en-gb'; // Import the desired locale

import App from './App';
import './styles/Global';

import { SettingsProvider } from './contexts/SettingsContext';
import { TimerProvider } from './contexts/TimerContext';

// dayjs.locale('en-gb'); // Set the global locale

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
