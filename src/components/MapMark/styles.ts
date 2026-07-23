import { styled } from '@linaria/react';

export const Container = styled.div<{ $x: number; $y: number }>`
  height: 0;
  width: 0;
  position: absolute;
  top: ${({ $y }) => $y}px;
  left: ${({ $x }) => $x}px;
  pointer-events: none;
`;

export const Tomb = styled.img`
  width: 20px;
  height: auto;
  transform: translate(-50%, -50%);
`;
