import { useCallback } from 'react';

import { getMapImage } from '@/utils';
import { MapMark } from '../MapMark';

import { MapImg } from './styles';

interface MapProps {
  mapName: string;
  onChange?: (x: IMapMark) => void;
  coordinates?: IMapMark;
}

const defaultCoordinates: IMapMark = {
  x: -1,
  y: -1,
};

declare const __LITE_MODE__: boolean;

export function Map({ mapName, onChange, coordinates }: MapProps) {
  const safeCoords = coordinates ?? defaultCoordinates;

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!onChange) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 256);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 256);
      onChange({ x, y });
    },
    [onChange]
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <MapImg
        src={getMapImage(mapName)}
        alt={mapName}
        width={512}
        height={512}
        onClick={mapMark}
        clickable={!!onChange}
        isSelected={safeCoords.x !== -1 || safeCoords.y !== -1}
        loading={__LITE_MODE__ ? 'lazy' : undefined}
      />
      {(safeCoords.x !== -1 || safeCoords.y !== -1) && (
        <MapMark x={safeCoords.x} y={safeCoords.y} />
      )}
    </div>
  );
}
