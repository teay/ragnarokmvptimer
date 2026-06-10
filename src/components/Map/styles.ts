import { styled } from '@linaria/react';

interface MapImgProps {
  clickable: boolean;
  isSelected: boolean;
}

export const MapImg = styled.img<MapImgProps>`
  width: 100%;
  height: auto;
  max-height: 25rem;
  object-fit: contain;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  border: none;
`;
