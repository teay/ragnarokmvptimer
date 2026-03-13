import dayjs from 'dayjs';

import { LOCAL_STORAGE_ACTIVE_MVPS_KEY } from '@/constants';
import { getServerData } from '@/utils';

export async function loadMvpsFromLocalStorage(
  server: string
): Promise<IMvp[]> {
  try {
    const dataString = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);

    if (!dataString) return [];

    const activeMvps = JSON.parse(dataString);
    const savedServerData = activeMvps[server];

    const hasSavedServerData = !!savedServerData && savedServerData.length > 0;

    if (!hasSavedServerData) return [];

    const originalServerData = await getServerData(server);

    const finalData = savedServerData.map((mvp: IMvp) => {
      const original = originalServerData.find((m) => m && m.id === mvp.id);
      return {
        ...original,
        ...mvp,
        deathTime: dayjs(mvp.deathTime).toDate(),
      };
    });

    return finalData;
  } catch (error) {
    console.error('Error loading MVPs from localStorage:', error);
    return [];
  }
}

export function saveActiveMvpsToLocalStorage(data: IMvp[], server: string) {
  const dataString = localStorage.getItem(LOCAL_STORAGE_ACTIVE_MVPS_KEY);

  const activeMvps = dataString ? JSON.parse(dataString) : {};

  const updatedActiveData = {
    ...activeMvps,
    [server]: data,
  };

  Object.keys(updatedActiveData).forEach(
    (key) => !isNaN(Number(key)) && delete updatedActiveData[key]
  );

  localStorage.setItem(
    LOCAL_STORAGE_ACTIVE_MVPS_KEY,
    JSON.stringify(updatedActiveData)
  );
}
