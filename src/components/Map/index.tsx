import { useEffect, useCallback } from 'react';

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
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!onChange) return;

      const { offsetX, offsetY } = e.nativeEvent;
      const newCoords = {
        x: offsetX,
        y: offsetY,
      };
      onChange(newCoords);
    },
    [onChange]
  );

  return (
    <div>
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
