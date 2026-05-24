import { styled } from '@linaria/react';

interface MapImgProps {
  clickable: boolean;
  isSelected: boolean;
  isLarge?: boolean;
}

export const MapImg = styled.img<MapImgProps>`
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  border: none;
`;
