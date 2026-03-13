interface IMapMark {
  x: number;
  y: number;
}

interface ISpawn {
  mapname: string;
  respawnTime: number;
}

interface IMvp {
  id: number;
  name: string;
  spawn: Array<ISpawn>;
  stats: {
    level: number;
    health: number;
    baseExperience: number;
    jobExperience: number;
  };
  deathTime?: Date;
  deathMap?: string;
  deathPosition?: IMapMark;
}

interface IMvpBackup {
  id: string;
  timestamp: string;
  type: 'AUTO' | 'MANUAL';
  description: string;
  data: Record<string, any[]>; // Standard activeMvps format { server: mvps[] }
  bossCount: number;
  server: string;
}
