import { styled } from '@linaria/react';

export const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  height: 100%;

  background-color: var(--modal_bg);
  backdrop-filter: var(--modal_backdrop_filter);
  z-index: 9999;
`;
