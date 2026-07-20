import { styled } from '@linaria/react';

interface Props {
  coordinates: IMapMark;
}

export const Container = styled.div<Props>`
  height: 0;
  width: 0;
  position: absolute;
  top: ${({ coordinates }) => coordinates.y}px;
  left: ${({ coordinates }) => coordinates.x}px;
  pointer-events: none;
  transform: translate(-50%, -100%);
`;

export const Tomb = styled.img`
  width: 20px;
  height: auto;
`;
