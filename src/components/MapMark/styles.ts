import { styled } from '@linaria/react';

interface Props {
  coordinates: IMapMark;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const Container = styled.div<Props>`
  height: 0;
  width: 0;
  position: absolute;
  top: ${({ coordinates, scale, offsetY }) => coordinates.y * scale + offsetY - 10}px;
  left: ${({ coordinates, scale, offsetX }) => coordinates.x * scale + offsetX - 10}px;
  pointer-events: none;
`;

export const Tomb = styled.img`
  width: 20px;
  height: 20px;
`;
