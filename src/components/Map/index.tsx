import { useCallback, useRef, useState, useEffect } from 'react';

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

interface Dims {
  displayW: number; displayH: number;
  offsetL: number; offsetT: number;
}

function getDims(img: HTMLImageElement): Dims | null {
  const rect = img.getBoundingClientRect();
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh || !rect.width || !rect.height) return null;
  if (nw / nh > rect.width / rect.height) {
    const displayH = rect.width * (nh / nw);
    return { displayW: rect.width, displayH, offsetL: 0, offsetT: (rect.height - displayH) / 2 };
  } else {
    const displayW = rect.height * (nw / nh);
    return { displayW, displayH: rect.height, offsetL: (rect.width - displayW) / 2, offsetT: 0 };
  }
}

function to512(img: HTMLImageElement, clientX: number, clientY: number): IMapMark {
  const rect = img.getBoundingClientRect();
  const d = getDims(img);
  if (!d) return { x: 0, y: 0 };
  const px = clientX - rect.left - d.offsetL;
  const py = clientY - rect.top - d.offsetT;
  return {
    x: Math.round((px / d.displayW) * 512),
    y: Math.round((py / d.displayH) * 512),
  };
}

function toCSS(img: HTMLImageElement, coord: IMapMark): { cssX: number; cssY: number } | null {
  const d = getDims(img);
  if (!d) return null;
  return {
    cssX: d.offsetL + (coord.x / 512) * d.displayW,
    cssY: d.offsetT + (coord.y / 512) * d.displayH,
  };
}

declare const __LITE_MODE__: boolean;

export function Map({ mapName, onChange, coordinates }: MapProps) {
  const safeCoords = coordinates ?? defaultCoordinates;
  const imgRef = useRef<HTMLImageElement>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => { forceUpdate(1); }, []);

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!onChange) return;
      const img = e.target as HTMLImageElement;
      onChange(to512(img, e.clientX, e.clientY));
    },
    [onChange]
  );

  let markStyle: React.CSSProperties | undefined;
  if ((safeCoords.x !== -1 || safeCoords.y !== -1) && imgRef.current) {
    const css = toCSS(imgRef.current, safeCoords);
    if (css) {
      markStyle = {
        position: 'absolute',
        left: css.cssX - 10,
        top: css.cssY - 24,
        pointerEvents: 'none',
      };
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
