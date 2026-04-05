import React from 'react';
import { renderHook, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from 'vitest';

import { MvpProvider, useMvpsContext } from '@/contexts/MvpsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getServerData } from '@/utils';
import { database, ref, set, onValue, DB_ROOT_PATH } from '@/services/firebase';

// --- 1. Mocking External Dependencies ---

vi.mock('@/contexts/SettingsContext');

vi.mock('@/utils', () => ({
  getServerData: vi.fn(),
  getMvpRespawnTime: vi.fn().mockReturnValue(10000),
  getMvpRespawnWindow: vi.fn().mockReturnValue(10000),
  formatTime: vi.fn((ms) => `${ms}ms`),
}));

vi.mock('@/services/firebase', () => ({
  database: {}, 
  ref: vi.fn((db, path) => path),
  set: vi.fn().mockResolvedValue(undefined),
  onValue: vi.fn((reference, callback) => {
    // ส่งคืนฟังก์ชัน unsubscribe
    return vi.fn();
  }),
  DB_ROOT_PATH: 'hunting',
}));

// --- 2. Mock Data Interfaces ---
interface IMapMark { x: number; y: number; }
interface ISpawn { mapname: string; respawnTime: number; window?: number; }
interface IMvp {
  id: number;
  name: string;
  spawn: ISpawn[];
  stats: { level: number; health: number; baseExperience: number; jobExperience: number; };
  deathTime?: Date;
  deathMap?: string;
  deathPosition?: IMapMark;
  isPinned?: boolean;
}

const mockSettingsContext = {
  server: 'iRO',
  partyRoom: null,
  nickname: 'TestUser',
  changePartyRoom: vi.fn(),
};

describe('MvpsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup initial mock returns
    (useSettings as any).mockReturnValue(mockSettingsContext);
    (getServerData as any).mockResolvedValue([
      { id: 1, name: 'Baphomet', spawn: [{ mapname: 'in_world', respawnTime: 10000 }], stats: { level: 99, health: 100000, baseExperience: 50000, jobExperience: 20000 } },
      { id: 2, name: 'Valkyrie', spawn: [{ mapname: 'field_04', respawnTime: 60000 }], stats: { level: 99, health: 100000, baseExperience: 50000, jobExperience: 20000 } },
      { id: 3, name: 'Maya', spawn: [{ mapname: 'map_01', respawnTime: 300000 }], stats: { level: 90, health: 80000, baseExperience: 40000, jobExperience: 15000 } },
    ]);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MvpProvider>{children}</MvpProvider>
  );

  test('should initialize context and load original MVPs', async () => {
    let hook: any;
    
    await act(async () => {
      hook = renderHook(() => useMvpsContext(), { wrapper });
    });

    // รอให้ useEffect ภายใน MvpProvider ทำงานเสร็จ
    await act(async () => {
      await Promise.resolve(); 
    });

    expect(hook.result.current.originalAllMvps.length).toBe(3);
    expect(hook.result.current.originalAllMvps[0].name).toBe('Baphomet');
  });

  test('rehydrateMvps should merge remote data with original data', async () => {
    let hook: any;
    
    await act(async () => {
      hook = renderHook(() => useMvpsContext(), { wrapper });
    });

    await act(async () => {
      await Promise.resolve();
    });

    const remoteMvps = [
      { id: 1, deathTime: '2023-10-27T10:00:00Z', deathMap: 'in_world', deathPosition: { x: 50, y: 50 }, isPinned: false },
    ];

    let rehydratedMvps: IMvp[] = [];
    act(() => {
      rehydratedMvps = (hook.result.current as any).rehydrateMvps(remoteMvps);
    });

    expect(rehydratedMvps.length).toBeGreaterThan(0);
    const rehydratedBaphomet = rehydratedMvps.find(mvp => mvp.id === 1);
    expect(rehydratedBaphomet?.name).toBe('Baphomet');
    expect(new Date(rehydratedBaphomet?.deathTime!).toISOString()).toContain('2023-10-27');
  });

  test('rehydrateMvps should return empty array if input is null', async () => {
    let hook: any;
    
    await act(async () => {
      hook = renderHook(() => useMvpsContext(), { wrapper });
    });

    let rehydratedNull: any;
    act(() => {
      rehydratedNull = (hook.result.current as any).rehydrateMvps(null);
    });
    
    expect(rehydratedNull).toEqual([]);
  });

  test('killMvp should correctly trigger firebase set', async () => {
    let hook: any;
    
    await act(async () => {
      hook = renderHook(() => useMvpsContext(), { wrapper });
    });

    const initialMvp: IMvp = {
      id: 10,
      name: 'Test MVP',
      spawn: [{ mapname: 'test_map', respawnTime: 5000 }],
      stats: { level: 1, health: 100, baseExperience: 10, jobExperience: 1 },
    };

    await act(async () => {
      hook.result.current.killMvp(initialMvp, new Date('2023-10-27T12:00:00Z'));
    });

    expect(set).toHaveBeenCalled();
  });
});