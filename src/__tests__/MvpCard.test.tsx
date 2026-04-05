import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect } from 'vitest';
import { IntlProvider } from 'react-intl';
import { MvpCard } from '@/components/MvpCard'; 
import { MvpsContext } from '@/contexts/MvpsContext';
import { SettingsContext } from '@/contexts/SettingsContext';

vi.mock('@/utils/textMeasurement', () => ({
  getOptimalFontSize: vi.fn().mockReturnValue('1.6rem'),
}));

vi.mock('@/utils', () => ({
  getMvpRespawnTime: vi.fn().mockReturnValue(10000),
  formatTime: vi.fn((ms) => `Formatted(${ms}ms)`),
  getMvpRespawnWindow: vi.fn().mockReturnValue(10000),
  getMvpIcon: vi.fn().mockReturnValue('mock-icon.png'),
  getMapImage: vi.fn().mockReturnValue('mock-map.png'),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({ respawnNotification: vi.fn() }),
}));

vi.mock('dayjs', async () => {
  const actual: any = await vi.importActual('dayjs');
  const duration: any = await vi.importActual('dayjs/plugin/duration');
  const dayjsFunc = actual.default || actual;
  dayjsFunc.extend(duration.default || duration);
  const mockDayjs = (date?: any) => dayjsFunc(date || '2023-10-26T10:00:00Z');
  Object.assign(mockDayjs, dayjsFunc);
  return { default: mockDayjs };
});

const messages = {
  edit: 'Edit',
  map: 'Map',
  remove_mvp: 'Remove MVP',
  select_to_kill: 'Select to kill',
  respawning: 'Respawning',
  killed_now_position: 'Killed at'
};

const mockMvpsContextValue = {
  activeMvps: [],
  allMvps: [],
  killMvp: vi.fn(),
  updateMvp: vi.fn(),
  moveToAll: vi.fn(),
  moveToWait: vi.fn(),
  setEditingMvp: vi.fn(),
  setKillingMvp: vi.fn(),
};

const mockSettingsContextValue = {
  respawnAsCountdown: true,
  language: 'en',
  server: 'thROG',
  showMvpMap: false,
  animatedSprites: false,
  use24HourFormat: false,
  isNotificationSoundEnabled: false,
};

const renderMvpCard = (ui: React.ReactElement) => {
  return render(
    <IntlProvider locale="en" messages={messages}>
      <SettingsContext.Provider value={mockSettingsContextValue as any}>
        <MvpsContext.Provider value={mockMvpsContextValue as any}>
          {ui}
        </MvpsContext.Provider>
      </SettingsContext.Provider>
    </IntlProvider>
  );
};

describe('MvpCard', () => {
  test('should render correctly with active MVP data', () => {
    const mvpData = {
      id: 1,
      name: 'Baphomet',
      spawn: [{ mapname: 'prt_fild10', respawnTime: 10000 }],
      deathTime: new Date('2023-10-26T10:00:00Z'),
      deathMap: 'prt_fild10',
    };
    renderMvpCard(<MvpCard mvp={mvpData as any} zone="active" />);
    expect(screen.getByText('Baphomet')).toBeInTheDocument();
  });

  test('should call moveToAll when Remove MVP button is clicked', async () => {
    const mvpData = { 
      id: 1, 
      name: 'Baphomet', 
      deathMap: 'prt_fild10', 
      deathTime: new Date(), // ต้องมีเพื่อให้ปุ่ม Remove แสดง
      spawn: [] 
    };
    renderMvpCard(<MvpCard mvp={mvpData as any} zone="active" />);
    
    const removeButton = screen.getByTitle(/Remove MVP/i);
    await act(async () => {
      fireEvent.click(removeButton);
    });
    expect(mockMvpsContextValue.moveToAll).toHaveBeenCalled();
  });
});