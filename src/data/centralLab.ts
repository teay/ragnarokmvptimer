export const ELEMENTS = ['Neutral','Water','Earth','Fire','Wind','Poison','Holy','Shadow','Ghost','Undead'];
export const WEAK_MAP = ['Neutral','Wind','Fire','Water','Earth','Holy','Shadow','Holy','Ghost','Holy'];
export const RACES = ['Formless','Undead','Brute','Plant','Insect','Fish','Demon','Human','Angel','Dragon'];

export interface CentralLabBoss {
  id: number;
  name: string;
  hp: string;
  race: number;
  element: number;
  elemName: string;
  weakName: string;
  raceName: string;
}

export type BossStage = Record<number, CentralLabBoss[]>;

const RAW_BOSS_DATA: Record<number, Array<Pick<CentralLabBoss, 'id' | 'name' | 'hp' | 'race' | 'element'>>> = {
  1: [
    { id: 1038, name: 'Osiris', hp: '1.18M', race: 1, element: 9 },
    { id: 1039, name: 'Baphomet', hp: '0.67M', race: 6, element: 7 },
    { id: 1046, name: 'Doppelganger', hp: '0.38M', race: 6, element: 7 },
    { id: 1059, name: 'Mistress', hp: '0.38M', race: 4, element: 4 },
    { id: 1086, name: 'Golden Thief Bug', hp: '0.22M', race: 4, element: 3 },
    { id: 1087, name: 'Orc Hero', hp: '0.36M', race: 7, element: 2 },
    { id: 1115, name: 'Eddga', hp: '0.95M', race: 2, element: 3 },
    { id: 1871, name: 'Falling Bishop', hp: '5.66M', race: 6, element: 7 },
    { id: 2251, name: 'Gioia', hp: '2.51M', race: 0, element: 4 },
    { id: 3074, name: 'Time Holder', hp: '25M', race: 6, element: 0 },
    { id: 3505, name: 'Big Eggring', hp: '0.14M', race: 3, element: 2 },
    { id: 20260, name: 'Shining Teddy Bear', hp: '10.72M', race: 0, element: 6 },
    { id: 20601, name: 'Jewgoliant', hp: '37.85M', race: 4, element: 0 },
  ],
  2: [
    { id: 1157, name: 'Pharaoh', hp: '0.9M', race: 7, element: 7 },
    { id: 1272, name: 'Dark Lord', hp: '1.19M', race: 6, element: 9 },
    { id: 1630, name: 'White Lady', hp: '0.72M', race: 7, element: 4 },
    { id: 1708, name: 'Thanatos Phantom', hp: '1.45M', race: 6, element: 8 },
    { id: 1779, name: 'Ktullanux', hp: '2.63M', race: 2, element: 1 },
    { id: 2068, name: 'Boitata', hp: '1.28M', race: 2, element: 3 },
    { id: 2362, name: 'Amon Ra (Nightmare)', hp: '2.52M', race: 7, element: 2 },
    { id: 3796, name: 'Awaken Ktullanux', hp: '13.52M', race: 2, element: 1 },
    { id: 20421, name: 'Corrupted Queen Spider', hp: '74.62M', race: 6, element: 7 },
    { id: 20618, name: 'Bone Detardeurus', hp: '88.47M', race: 1, element: 9 },
    { id: 20843, name: 'Abysmal Witch', hp: '78.37M', race: 6, element: 7 },
    { id: 21301, name: 'Burning Fang', hp: '98.16M', race: 2, element: 3 },
  ],
  3: [
    { id: 1312, name: 'Turtle General', hp: '1.44M', race: 2, element: 2 },
    { id: 1719, name: 'Detardeurus', hp: '6.01M', race: 9, element: 7 },
    { id: 1734, name: 'Kiel D-01', hp: '2.5M', race: 0, element: 7 },
    { id: 1751, name: 'Valkyrie Randgris', hp: '3.21M', race: 8, element: 6 },
    { id: 1768, name: 'Gloom Under Night', hp: '3.01M', race: 0, element: 8 },
    { id: 1832, name: 'Ifrit', hp: '6.94M', race: 0, element: 3 },
    { id: 1874, name: 'Beelzebub', hp: '4.81M', race: 6, element: 8 },
    { id: 20610, name: 'Valkyrie Reginleif', hp: '79.62M', race: 8, element: 3 },
    { id: 20611, name: 'Valkyrie Ingrid', hp: '79.58M', race: 8, element: 1 },
    { id: 20928, name: 'The One', hp: '0.28G', race: 0, element: 0 },
    { id: 20934, name: 'R001-Bestia', hp: '0.13G', race: 2, element: 7 },
    { id: 20943, name: 'Death Witch', hp: '0.4G', race: 7, element: 7 },
    { id: 21537, name: 'Ultra Limacina', hp: '0.37G', race: 5, element: 1 },
  ],
};

export const BOSS_DATA: BossStage = Object.keys(RAW_BOSS_DATA).reduce<BossStage>((acc, stageKey) => {
  const stage = Number(stageKey);
  acc[stage] = RAW_BOSS_DATA[stage].map((b) => ({
    ...b,
    elemName: ELEMENTS[b.element],
    weakName: WEAK_MAP[b.element],
    raceName: RACES[b.race],
  }));
  return acc;
}, {});

export const BOSS_DURATIONS = [150, 80, 160];

export interface BossTimerState {
  remaining: number;
  started: boolean;
  startedAt: number | null;
}

export const DEFAULT_SET_NAMES = ['Set 1', 'Set 2', 'Set 3'];
