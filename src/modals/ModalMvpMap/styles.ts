import { styled } from '@linaria/react';

export const Modal = styled.div`
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 95vh;
  overflow-y: auto;
  padding: 2rem;
  gap: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
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

export const Name = styled.span`
  color: var(--modal_name);
  font-size: 2.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
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
  color: #e0e0e0 !important;
  font-size: 1.4rem;
`;

export const Footer = styled.footer`
  display: flex;
  max-width: 100%;
  gap: 2rem;
  margin-top: 1rem;

  @media (max-width: ${1000 / 16}em) {
    flex-direction: column;
    gap: 1rem;
  }
`;

export const ChangeMapButton = styled.button<{ size?: 'sm' | 'md' | 'lg' }>`
  min-width: 100px;
  padding: ${({ size }) =>
    size === 'sm'
      ? '8px 12px'
      : size === 'lg'
      ? '12px 24px'
      : '10px 20px'};
  font-size: ${({ size }) =>
    size === 'sm' ? '0.9rem' : size === 'lg' ? '1.4rem' : '1.1rem'};
  border: none;
  border-radius: 5px;
  background-color: var(--primary);
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(0.9);
    box-shadow: 0 0 15px var(--secondary);
  }
`;