import { useCallback, useRef, useState, useEffect } from 'react';
import { IMapMark } from '@/interfaces';

import { getMapImage } from '@/utils';
import { MapMark } from '../MapMark';

import { MapImg } from './styles';

interface MapProps {
  mapName: string;
  onChange?: (x: IMapMark) => void;
  coordinates?: IMapMark;
  isLarge?: boolean;
  containerHeight?: string;
}

const defaultCoordinates: IMapMark = {
  x: -1,
  y: -1,
};

export function Map({ mapName, onChange, coordinates, isLarge, containerHeight }: MapProps) {
  const safeCoords = coordinates ?? defaultCoordinates;
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        const { width, height } = imgRef.current.getBoundingClientRect();
        const ratio = Math.min(width / naturalWidth, height / naturalHeight);
        setScale(ratio);
        setOffset({
          x: (width - naturalWidth * ratio) / 2,
          y: (height - naturalHeight * ratio) / 2,
        });
      }
    };
    
    // Initial scale check and on window resize
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mapName, isLarge, containerHeight]);

  const mapMark = useCallback(
    (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
      if (!onChange) return;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const { naturalWidth, naturalHeight } = img;
      const ratio = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
      
      const renderedWidth = naturalWidth * ratio;
      const renderedHeight = naturalHeight * ratio;
      
      const offsetX = (rect.width - renderedWidth) / 2;
      const offsetY = (rect.height - renderedHeight) / 2;

      // Only map if click is within the rendered image area
      if (
        clickX >= offsetX &&
        clickX <= rect.width - offsetX &&
        clickY >= offsetY &&
        clickY <= rect.height - offsetY
      ) {
        onChange({
          x: (clickX - offsetX) / ratio,
          y: (clickY - offsetY) / ratio,
        });
      }
    },
    [onChange]
  );

  return (
    <div style={{ height: containerHeight || (isLarge ? '55rem' : '25rem'), width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
      <MapImg
        ref={imgRef}
        src={getMapImage(mapName)}
        alt={mapName}
        onClick={mapMark}
        clickable={!!onChange}
        isSelected={safeCoords.x !== -1 || safeCoords.y !== -1}
      />
      {(safeCoords.x !== -1 || safeCoords.y !== -1) && (
        <MapMark x={safeCoords.x} y={safeCoords.y} scale={scale} offsetX={offset.x} offsetY={offset.y} />
      )}
    </div>
  );
}
