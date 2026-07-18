import mvp_tomb from '@/assets/mvp_tomb.png';

import { Container, Tomb } from './styles';

export function MapMark({ x, y }: IMapMark) {
  return (
    <Container coordinates={{ x, y }}>
      <Tomb src={mvp_tomb} alt='MVP tomb marker' width={20} height={20} />
    </Container>
  );
}
