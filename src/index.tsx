import React from 'react';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
// import 'dayjs/locale/en-gb'; // Import the desired locale

// import App from './App';
import AppTextOnly from './AppTextOnly';
import './styles/Global';

import { SettingsProvider } from './contexts/SettingsContext';
import { MvpProvider } from './contexts/MvpsContext'; // Import MvpProvider

// dayjs.locale('en-gb'); // Set the global locale

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <MvpProvider>
        <AppTextOnly />
      </MvpProvider>
    </SettingsProvider>
  </React.StrictMode>
);
