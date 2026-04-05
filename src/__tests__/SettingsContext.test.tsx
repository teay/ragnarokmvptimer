import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, beforeAll } from 'vitest';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_SETTINGS_KEY } from '@/constants';
import React from 'react';

const mockStorage = () => {
  let storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: any) => { storage[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
    clear: vi.fn(() => { storage = {}; }),
  };
};

describe('SettingsContext', () => {
  let localStorageMock: any;
  let sessionStorageMock: any;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>{children}</SettingsProvider>
  );

  beforeAll(() => {
    localStorageMock = mockStorage();
    sessionStorageMock = mockStorage();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
    vi.stubGlobal('history', { replaceState: vi.fn() });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
    localStorageMock.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  });

  test('should update partyRoom correctly', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(async () => {
      result.current.changePartyRoom('NEW_ROOM');
    });

    expect(result.current.partyRoom).toBe('NEW_ROOM');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('partyRoom', JSON.stringify('NEW_ROOM'));
  });

  test('should handle ultraLite toggle correctly', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    await act(async () => {
      if (!result.current.ultraLite) result.current.toggleUltraLite();
    });
    expect(result.current.ultraLite).toBe(true);
    expect(result.current.isAnimatedBackgroundEnabled).toBe(false);
  });
});