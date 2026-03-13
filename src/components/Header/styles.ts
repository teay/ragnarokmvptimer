import { styled } from '@linaria/react';

export const Container = styled.header`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr;

  height: 75px;
  padding: 0 30px;

  background-color: var(--header_bg);
  backdrop-filter: var(--header_backdrop_filter);
  box-shadow: var(--header_box_shadow);

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  grid-area: 1 / 1 / 2 / 2;
`;

export const Logo = styled.img`
  width: 55px;
  height: auto;
`;

export const Title = styled.h1`
  margin-left: 20px;

  font-weight: bold;
  font-size: 22px;

  white-space: nowrap;

  color: var(--header_text);

  @media (min-width: 768px) and (max-width: 935px) {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const Customization = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 1.6rem;
`;

export const LiveBadge = styled.div`
  background: #d32f2f;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 8px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(211, 47, 47, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const DataBadge = styled.div<{ location: 'local' | 'online' }>`
  background: ${props => props.location === 'online' ? '#388e3c' : '#1976d2'};
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    display: block;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;
