import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { formatTime, getMvpRespawnTime, getMvpRespawnWindow } from '@/utils';

// Extend dayjs with duration plugin for formatTime tests if needed, though formatTime uses raw numbers
dayjs.extend(duration);

// Mock IMvp and ISpawn interfaces directly for test data
interface IMapMark { x: number; y: number; }
interface ISpawn { mapname: string; respawnTime: number; window?: number; }
interface IMvp {
  id: number;
  name: string;
  spawn: ISpawn[] | null | undefined; // Allow null/undefined for testing
  stats: { level: number; health: number; baseExperience: number; jobExperience: number; };
  deathTime?: Date;
  deathMap?: string;
  deathPosition?: IMapMark;
  isPinned?: boolean;
}

describe('utils/index', () => {
  // Mocking utilities that depend on external factors or are complex to test directly
  // For formatTime, we can test directly as it's pure logic.
  // For getMvpRespawnTime and getMvpRespawnWindow, we need to mock the mvp.spawn data.

  describe('formatTime', () => {
    test('should format duration in H:MM:SS correctly', () => {
      expect(formatTime(3723000)).toBe('01:02:03'); // 1 hour, 2 minutes, 3 seconds
      expect(formatTime(3661000)).toBe('01:01:01'); // 1 hour, 1 minute, 1 second
      expect(formatTime(3600000)).toBe('01:00:00'); // Exactly 1 hour
    });

    test('should format duration in MM:SS correctly', () => {
      expect(formatTime(123000)).toBe('00:02:03'); // 2 minutes, 3 seconds
      expect(formatTime(60000)).toBe('00:01:00'); // Exactly 1 minute
    });

    test('should format duration in SS correctly', () => {
      expect(formatTime(5000)).toBe('00:00:05'); // 5 seconds
      expect(formatTime(900)).toBe('00:00:00'); // Less than 1 second, rounds down to 0
    });

    test('should handle zero duration', () => {
      expect(formatTime(0)).toBe('00:00:00');
    });

    test('should handle negative duration (absolute value)', () => {
      // Assuming formatTime should display absolute duration, or as per its implementation for negative values
      // Current implementation uses Math.abs()
      expect(formatTime(-3723000)).toBe('01:02:03');
    });
  });

  describe('getMvpRespawnTime', () => {
    const mvpWithSpawn: IMvp = {
      id: 1,
      name: 'Test MVP',
      spawn: [
        { mapname: 'map1', respawnTime: 5000 },
        { mapname: 'map2', respawnTime: 10000 },
      ],
      stats: { level: 1, health: 100, baseExperience: 10, jobExperience: 1 },
    };

    const mvpWithMatchingSpawn: IMvp = {
      id: 2,
      name: 'Test MVP 2',
      spawn: [
        { mapname: 'mapA', respawnTime: 15000 },
        { mapname: 'mapB', respawnTime: 20000 },
      ],
      stats: { level: 1, health: 100, baseExperience: 10, jobExperience: 1 },
      deathMap: 'mapB',
    };

    test('should return the respawnTime for the matching deathMap', () => {
      expect(getMvpRespawnTime(mvpWithMatchingSpawn)).toBe(20000);
    });

    test('should return 0 if spawn data is null or undefined', () => {
      const mvpNullSpawn = { ...mvpWithSpawn, spawn: null };
      expect(getMvpRespawnTime(mvpNullSpawn as any)).toBe(0);

      const mvpUndefinedSpawn = { ...mvpWithSpawn, spawn: undefined };
      expect(getMvpRespawnTime(mvpUndefinedSpawn as any)).toBe(0);
    });

    test('should return 0 if spawn array is empty', () => {
      const mvpEmptySpawn = { ...mvpWithSpawn, spawn: [] };
      expect(getMvpRespawnTime(mvpEmptySpawn)).toBe(0);
    });
    
    test('should return 0 if no matching mapname is found in spawn', () => {
      const mvpNoMatch = { ...mvpWithSpawn, deathMap: 'non_existent_map' };
      expect(getMvpRespawnTime(mvpNoMatch)).toBe(0);
    });
  });

  describe('getMvpRespawnWindow', () => {
    const mvpWithSpawnAndWindow: IMvp = {
      id: 1,
      name: 'Test MVP',
      spawn: [
        { mapname: 'map1', respawnTime: 5000, window: 60000 }, // 1 minute window
        { mapname: 'map2', respawnTime: 10000, window: 120000 }, // 2 minute window
      ],
      stats: { level: 1, health: 100, baseExperience: 10, jobExperience: 1 },
      deathMap: 'map2',
    };

    const mvpWithSpawnNoWindow: IMvp = {
      id: 2,
      name: 'Test MVP 2',
      spawn: [
        { mapname: 'mapA', respawnTime: 15000 }, // No window specified
      ],
      stats: { level: 1, health: 100, baseExperience: 10, jobExperience: 1 },
      deathMap: 'mapA',
    };

    test('should return the window for the matching deathMap', () => {
      expect(getMvpRespawnWindow(mvpWithSpawnAndWindow)).toBe(120000); // 2 minutes
    });

    test('should return default window if window property is not specified', () => {
      expect(getMvpRespawnWindow(mvpWithSpawnNoWindow)).toBe(10 * 60 * 1000); // Default 10 minutes
    });

    test('should return default window if spawn data is null or undefined', () => {
      const mvpNullSpawn = { ...mvpWithSpawnAndWindow, spawn: null };
      expect(getMvpRespawnWindow(mvpNullSpawn as any)).toBe(10 * 60 * 1000); // Default 10 minutes

      const mvpUndefinedSpawn = { ...mvpWithSpawnAndWindow, spawn: undefined };
      expect(getMvpRespawnWindow(mvpUndefinedSpawn as any)).toBe(10 * 60 * 1000); // Default 10 minutes
    });

    test('should return default window if spawn array is empty', () => {
      const mvpEmptySpawn = { ...mvpWithSpawnAndWindow, spawn: [] };
      expect(getMvpRespawnWindow(mvpEmptySpawn)).toBe(10 * 60 * 1000); // Default 10 minutes
    });
    
    test('should return default window if no matching mapname is found in spawn', () => {
      const mvpNoMatch = { ...mvpWithSpawnAndWindow, deathMap: 'non_existent_map' };
      expect(getMvpRespawnWindow(mvpNoMatch)).toBe(10 * 60 * 1000); // Default 10 minutes
    });
  });
});
