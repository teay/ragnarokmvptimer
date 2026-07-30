import { styled } from '@linaria/react';

export const Modal = styled.div`
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 95vh;
  overflow-y: auto;
  padding: 2rem;
  gap: 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
  background-color: var(--modal_bg);
  backdrop-filter: var(--modal_backdrop_filter);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.1),
      transparent 50%,
      rgba(255, 255, 255, 0.05)
    );
    pointer-events: none;
    border-radius: 6px;
  }
  box-shadow: 0px 8px 20px 5px rgba(0, 0, 0, 0.2);
  border: none;

  @media (max-width: ${1000 / 16}em) {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }
`;

export const Title = styled.h2`
  font-size: 2rem;
  color: var(--modal_name);
  text-align: center;
  margin: 0;
`;

export const Description = styled.p`
  font-size: 1.4rem;
  color: var(--modal_text);
  text-align: center;
  line-height: 1.5;
  margin: 0;
  white-space: pre-line;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 10px 20px;
  font-size: 1.4rem;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--modal_text);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255,255,255,0.1);
  }
`;

export const ConfirmButton = styled.button`
  flex: 1;
  padding: 10px 20px;
  font-size: 1.4rem;
  border: none;
  border-radius: 8px;
  background: #FF9800;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(0.9);
  }
`;
