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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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

export const SpriteWrapper = styled.div`
  > img {
    width: auto;
    height: auto;
    max-width: 120px;
    max-height: 120px;
  }
`;

export const Name = styled.span`
  color: var(--modal_name);
  margin-top: -10px;

  font-size: 2.2rem;
  font-weight: 600;
`;

export const Question = styled.span`
  color: #e0e0e0 !important;

  font-size: 1.8rem;
  font-weight: 700;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Optional = styled.span`
  font-size: 1.4rem;
  font-weight: 400;
  margin-bottom: 5px;
`;

export const Footer = styled.footer`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
  gap: 16px;
`;

export const KeyboardHint = styled.div`
  color: #aaa;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: nowrap;
  justify-content: center;
  width: 100%;

  kbd {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-weight: bold;
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-right: 4px;
    font-size: 1rem;
    text-transform: uppercase;
  }

  span {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
`;
