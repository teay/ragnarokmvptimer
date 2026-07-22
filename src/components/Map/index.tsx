import { useCallback, useState } from 'react';

import { getMapImage } from '@/utils';
import { MapMark } from '../MapMark';

import { MapImg } from './styles';

interface MapProps {
  mapName: string;
  onChange?: (x: IMapMark) => void;
  coordinates?: IMapMark;
}

interface ContentArea {
  ox: number;
  oy: number;
  cw: number;
  ch: number;
}

const defaultCoordinates: IMapMark = {
  x: -1,
  y: -1,
};

declare const __LITE_MODE__: boolean;

export function Map({ mapName, onChange, coordinates }: MapProps) {
  const safeCoords = coordinates ?? defaultCoordinates;
  const [area, setArea] = useState<ContentArea | null>(null);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height, naturalWidth, naturalHeight } = img;
    const scale = Math.min(width / naturalWidth, height / naturalHeight);
    const cw = naturalWidth * scale;
    const ch = naturalHeight * scale;
    setArea({ ox: (width - cw) / 2, oy: (height - ch) / 2, cw, ch });
  }, []);

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!onChange) return;
      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const scale = Math.min(rect.width / nw, rect.height / nh);
      const cw = nw * scale;
      const ch = nh * scale;
      const ox = (rect.width - cw) / 2;
      const oy = (rect.height - ch) / 2;
      const x = Math.round(((e.clientX - rect.left - ox) / cw) * 256);
      const y = Math.round(((e.clientY - rect.top - oy) / ch) * 256);
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
        onLoad={onImgLoad}
        clickable={!!onChange}
        isSelected={safeCoords.x !== -1 || safeCoords.y !== -1}
        loading={__LITE_MODE__ ? 'lazy' : undefined}
      />
      {(safeCoords.x !== -1 || safeCoords.y !== -1) && area && (
        <div style={{
          position: 'absolute',
          left: area.ox,
          top: area.oy,
          width: area.cw,
          height: area.ch,
          pointerEvents: 'none',
        }}>
          <MapMark x={safeCoords.x} y={safeCoords.y} />
        </div>
      )}
    </div>
  );
}
