import { styled } from '@linaria/react';

export const Modal = styled.div`
  height: auto;
  max-height: 95vh;

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
  box-shadow: 5px 5px 15px 0px rgba(0, 0, 0, 0.5), inset 0 0 10px 0px rgba(0, 0, 0, 0.3);
  border: none;

  @media (max-width: ${1000 / 16}em) {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }
`;

export const Title = styled.span`
  color: var(--modal_name);
  margin-top: -30px;
  text-align: center;

  font-size: 24px;
  font-weight: 600;
`;

export const MapsDisplayGrid = styled.div<{ cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ cols }) => (cols > 2 ? 3 : 2)}, 1fr);
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: ${1000 / 16}em) {
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const MapCard = styled.button<{ isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(---modal_text);
  background: none;
  cursor: pointer;

  padding: 1rem;
  border-width: 3px;
  border-style: solid;
  border-radius: 6px;
  border-color: ${({ isSelected }) =>
    isSelected ? 'var(--modal_changeMap_selectedMapBorder)' : 'transparent'};
`;

export const MapDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1.8rem;
`;

export const MapName = styled.span`
  font-weight: bold;
`;

export const MapRespawnTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;
