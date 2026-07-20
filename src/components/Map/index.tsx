import { useCallback } from 'react';

import { getMapImage } from '@/utils';
import mvp_tomb from '@/assets/mvp_tomb.png';

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

      // Use raw offsetX/offsetY directly (CSS pixels relative to element)
      const newCoords = {
        x: Math.round(e.nativeEvent.offsetX),
        y: Math.round(e.nativeEvent.offsetY),
      };
      onChange(newCoords);
    },
    [onChange]
  );

  // Use raw coords directly as CSS pixel positions
  let markStyle: React.CSSProperties | undefined;
  if (safeCoords.x !== -1 || safeCoords.y !== -1) {
    markStyle = { position: 'absolute', left: safeCoords.x, top: safeCoords.y,
      pointerEvents: 'none' };
  }

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
      {markStyle && (
        <div style={markStyle}>
          <img src={mvp_tomb} alt="MVP tomb marker" style={{ width: 20, height: 24 }} />
        </div>
      )}
    </div>
  );
}
