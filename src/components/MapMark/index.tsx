import mvp_tomb from '@/assets/mvp_tomb.png';

import { Container, Tomb } from './styles';

export function MapMark({ x, y }: { x: number; y: number }) {
  return (
    <Container $x={x} $y={y}>
      <Tomb src={mvp_tomb} alt='MVP tomb marker' width={20} height={24} />
    </Container>
  );
}
