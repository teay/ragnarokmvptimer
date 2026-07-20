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

      const img = e.target as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // Compute rendered image content area within the element
      // (accounts for object-fit: contain centering)
      let displayW: number, displayH: number, offsetX: number, offsetY: number;
      if (nw / nh > rect.width / rect.height) {
        displayW = rect.width;
        displayH = rect.width * (nh / nw);
        offsetX = 0;
        offsetY = (rect.height - displayH) / 2;
      } else {
        displayW = rect.height * (nw / nh);
        displayH = rect.height;
        offsetX = (rect.width - displayW) / 2;
        offsetY = 0;
      }

      const px = e.clientX - rect.left - offsetX;
      const py = e.clientY - rect.top - offsetY;

      // Normalize to 512x512 canonical space (matching Rust app)
      const newCoords = {
        x: Math.round((px / displayW) * 512),
        y: Math.round((py / displayH) * 512),
      };
      onChange(newCoords);
    },
    [onChange]
  );

  return (
    <div style={{ position: 'relative' }}>
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
