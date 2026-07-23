import { useCallback, useEffect, useRef, useState } from 'react';

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

function computeContentRect(rect: DOMRect, nw: number, nh: number) {
  const imgAspect = nw / nh;
  const elAspect = rect.width / rect.height;
  let contentW = rect.width;
  let contentH = rect.height;
  let offLeft = 0;
  let offTop = 0;

  if (imgAspect > elAspect) {
    contentH = rect.width / imgAspect;
    offTop = (rect.height - contentH) / 2;
  } else {
    contentW = rect.height * imgAspect;
    offLeft = (rect.width - contentW) / 2;
  }

  return { contentW, contentH, offLeft, offTop };
}

export function Map({ mapName, onChange, coordinates }: MapProps) {
  const safeCoords = coordinates ?? defaultCoordinates;
  const imgRef = useRef<HTMLImageElement>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const updateMarker = useCallback(() => {
    const img = imgRef.current;
    if (!img || safeCoords.x < 0 || safeCoords.y < 0) {
      setMarkerPos(null);
      return;
    }

    const rect = img.getBoundingClientRect();
    const nw = img.naturalWidth || rect.width || 512;
    const nh = img.naturalHeight || rect.height || 512;
    const { contentW, contentH, offLeft, offTop } = computeContentRect(
      rect,
      nw,
      nh
    );

    const elX = (safeCoords.x / 256) * contentW + offLeft;
    const elY = (safeCoords.y / 256) * contentH + offTop;

    setMarkerPos({ x: elX, y: elY });
  }, [safeCoords]);

  useEffect(() => {
    updateMarker();
    window.addEventListener('resize', updateMarker);
    return () => window.removeEventListener('resize', updateMarker);
  }, [updateMarker]);

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
      if (!onChange) return;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();
      const { offsetX, offsetY } = e.nativeEvent;
      const nw = img.naturalWidth || rect.width;
      const nh = img.naturalHeight || rect.height;
      const { contentW, contentH, offLeft, offTop } = computeContentRect(
        rect,
        nw,
        nh
      );

      const contentX = offsetX - offLeft;
      const contentY = offsetY - offTop;

      const newCoords = {
        x: (contentX / contentW) * 256,
        y: (contentY / contentH) * 256,
      };
      onChange(newCoords);
    },
    [onChange]
  );

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
        onLoad={updateMarker}
      />
      {markerPos && <MapMark x={markerPos.x} y={markerPos.y} />}
    </div>
  );
}
