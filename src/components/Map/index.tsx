import { useEffect, useCallback, useRef, useState } from 'react';

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [, setTick] = useState(0);

  // Re-render after mount so getBoundingClientRect is available
  useEffect(() => {
    setTick(1);
  }, []);

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!onChange) return;

      const img = e.target as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // Compute rendered image content area within the element
      // (accounts for object-fit: contain centering)
      let displayW: number, displayH: number, offsetL: number, offsetT: number;
      if (nw / nh > rect.width / rect.height) {
        displayW = rect.width;
        displayH = rect.width * (nh / nw);
        offsetL = 0;
        offsetT = (rect.height - displayH) / 2;
      } else {
        displayW = rect.height * (nw / nh);
        displayH = rect.height;
        offsetL = (rect.width - displayW) / 2;
        offsetT = 0;
      }

      const px = e.clientX - rect.left - offsetL;
      const py = e.clientY - rect.top - offsetT;

      // Normalize to 512x512 canonical space (matching Rust app)
      const newCoords = {
        x: Math.round((px / displayW) * 512),
        y: Math.round((py / displayH) * 512),
      };
      onChange(newCoords);
    },
    [onChange]
  );

  // Convert 512-space coords to CSS display pixels
  let markStyle: React.CSSProperties | undefined;
  if (safeCoords.x !== -1 || safeCoords.y !== -1) {
    const img = imgRef.current;
    if (img) {
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      let displayW: number, displayH: number, offsetL: number, offsetT: number;
      if (nw / nh > rect.width / rect.height) {
        displayW = rect.width;
        displayH = rect.width * (nh / nw);
        offsetL = 0;
        offsetT = (rect.height - displayH) / 2;
      } else {
        displayW = rect.height * (nw / nh);
        displayH = rect.height;
        offsetL = (rect.width - displayW) / 2;
        offsetT = 0;
      }
      const cssX = offsetL + (safeCoords.x / 512) * displayW;
      const cssY = offsetT + (safeCoords.y / 512) * displayH;
      markStyle = { position: 'absolute', left: cssX - 10, top: cssY - 24,
        pointerEvents: 'none' };
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <MapImg
        ref={imgRef}
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
