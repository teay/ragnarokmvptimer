import { useEffect, useCallback } from 'react';

import { getMapImg } from '@/utils';
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

export function Map({
  mapName,
  onChange,
  coordinates = defaultCoordinates,
}: MapProps) {
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
        src={getMapImg(mapName)}
        alt={mapName}
        onClick={mapMark}
        clickable={!!onChange}
        loading='lazy'
      />
      {(coordinates.x !== -1 || coordinates.y !== -1) && (
        <MapMark x={coordinates.x} y={coordinates.y} />
      )}
    </div>
  );
}
