import { styled } from '@linaria/react';

interface Props {
  coordinates: IMapMark;
}

export const Container = styled.div<Props>`
  position: absolute;
  top: ${({ coordinates }) => (coordinates.y / 256) * 100}%;
  left: ${({ coordinates }) => (coordinates.x / 256) * 100}%;
  transform: translate(-50%, -100%);
  pointer-events: none;
`;

export const Tomb = styled.img`
  width: 20px;
  height: auto;
`;
