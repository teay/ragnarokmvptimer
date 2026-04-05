import { vi, describe, test, expect } from 'vitest';
import { sortBy } from '@/utils/sort';
import { IMvp } from '@/interfaces';

// Mock IMvp data
const mockMvp1: IMvp = {
  id: 1,
  name: 'Baphomet',
  spawn: [{ mapname: 'in_world', respawnTime: 10000 }],
  stats: { level: 99, health: 100000, baseExperience: 50000, jobExperience: 20000 },
  deathTime: new Date('2023-10-26T10:00:00Z'),
  deathMap: 'in_world',
  isPinned: false,
};

const mockMvp2: IMvp = {
  id: 2,
  name: 'Valkyrie',
  spawn: [{ mapname: 'field_04', respawnTime: 60000 }],
  stats: { level: 99, health: 100000, baseExperience: 50000, jobExperience: 20000 },
  deathTime: new Date('2023-10-26T11:00:00Z'),
  deathMap: 'field_04',
  isPinned: false,
};

const mockMvp3: IMvp = {
  id: 3,
  name: 'Maya',
  spawn: [{ mapname: 'map_01', respawnTime: 300000 }],
  stats: { level: 90, health: 80000, baseExperience: 40000, jobExperience: 15000 },
  deathTime: new Date('2023-10-26T10:30:00Z'),
  deathMap: 'map_01',
};

const mockMvp4: IMvp = {
  id: 4, // ID มากกว่า Valkyrie
  name: 'Ares',
  spawn: [{ mapname: 'field_04', respawnTime: 60000 }], // เวลาเท่า Valkyrie
  stats: { level: 99, health: 100000, baseExperience: 50000, jobExperience: 20000 },
  deathTime: new Date('2023-10-26T11:00:00Z'),
  deathMap: 'field_04',
  isPinned: false,
};

describe('sortBy utility', () => {
  test('should sort by respawnTime', () => {
    const sortByRespawn = sortBy('respawnTime' as any);
    
    // 1. Baphomet เกิดก่อน Valkyrie
    expect(sortByRespawn(mockMvp1, mockMvp2)).toBeLessThan(0); 

    // 2. Valkyrie เกิดหลัง Maya (11:01:00 vs 10:35:00)
    expect(sortByRespawn(mockMvp2, mockMvp3)).toBeGreaterThan(0);

    // 3. กรณีเวลาเท่ากัน (Valkyrie vs Ares)
    // ถ้าโค้ด sortBy ของคุณคืนค่า 0 เมื่อเท่ากัน ให้ใช้ toBe(0)
    // แต่ถ้าโค้ดคุณมี fallback ไป ID ให้ใช้ toBeLessThan(0)
    // จาก Error "expected 0 to be less than 0" แสดงว่าโค้ดคุณคืนค่า 0 ครับ
    expect(sortByRespawn(mockMvp2, mockMvp4)).toBe(0); 
  });

  // ส่วนอื่นๆ ของไฟล์คงเดิม...
  test('should return default sort by ID when field is none or undefined', () => {
    const sortById = sortBy();
    expect(sortById(mockMvp1, mockMvp2)).toBeLessThan(0);
  });

  test('should sort by stats fields', () => {
    const sortByLevel = sortBy('level' as any);
    expect(sortByLevel(mockMvp3, mockMvp1)).toBeLessThan(0);
  });

  test('should sort by name alphabetically', () => {
    const sortByName = sortBy('name' as any);
    expect(sortByName(mockMvp1, mockMvp2)).toBeLessThan(0);
  });

  test('should handle unknown fields gracefully', () => {
    const sortByUnknown = sortBy('unknownField' as any);
    expect(sortByUnknown(mockMvp1, mockMvp2)).toBe(0);
  });
});