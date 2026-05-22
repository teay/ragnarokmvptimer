import mvp_tomb from '@/assets/mvp_tomb.png';

import { Container, Tomb } from './styles';

export function MapMark({ x, y, scale = 1, offsetX = 0, offsetY = 0 }: IMapMark & { scale?: number; offsetX?: number; offsetY?: number }) {
  return (
    <Container coordinates={{ x, y }} scale={scale} offsetX={offsetX} offsetY={offsetY}>
      <Tomb src={mvp_tomb} />
    </Container>
  );
}
