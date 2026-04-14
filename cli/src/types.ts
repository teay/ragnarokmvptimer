interface IMapMark {
  x: number;
  y: number;
}

interface ISpawn {
  mapname: string;
  respawnTime: number;
  window?: number;
}

interface IMvp {
  id: number;
  dbname: string;
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
  isPinned?: boolean;
}

interface MvpData extends IMvp {
  deathTime?: number;
  deathMap?: string;
  respawnTimes?: Array<number>;
}

export { IMapMark, ISpawn, IMvp, MvpData };
