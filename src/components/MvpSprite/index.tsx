import { getMvpIcon } from '@/utils';
import { Sprite } from './styles';

type MvpSpriteProps = {
  id: number;
  name: string;
  animated?: boolean;
};

export function MvpSprite({ id, name, animated }: MvpSpriteProps) {
  return (
    <Sprite
      src={getMvpIcon(id, animated)}
      alt={name}
      isAnimated={animated}
      loading='lazy'
    />
  );
}
