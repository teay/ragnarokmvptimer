import { styled } from '@linaria/react';

export const Container = styled.div<{ isEditing: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 28rem;
  padding: 10px;

  border-radius: 8px;

  background-color: var(--mvpCard_bg);
  backdrop-filter: var(--mvpCard_backdrop_filter);
  border: none;
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
    border-radius: 8px;
  }

  ${({ isEditing }) =>
    isEditing
      ? `
    box-shadow: 5px 5px 15px 0px rgba(0, 0, 0, 0.5);
  `
      : ''}
`;

export const BottomControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  width: 100%;
  padding: 0; /* Removed horizontal padding */
`;

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
  align-items: center;
`;

export const Bold = styled.span`
  font-weight: bold;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 10px;
`;

export const ID = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--mvpCard_id);
`;

export const Name = styled.span`
  font-weight: bold;
  color: var(--mvpCard_name);
  font-size: 1.6rem;
`;

export const MapName = styled.span`
  text-align: center;
  white-space: pre-wrap;
  margin-top: 5px;
  color: var(--mvpCard_text);
  font-size: 1.6rem;
`;

export const Tombstone = styled.p`
  font-size: 1.6rem;
  text-align: center;
  line-height: 1.2;
  white-space: pre-wrap;
`;

const Button = styled.button`
  width: 200px; /* Fixed width */
  margin: 0 auto; /* Center the button */
  padding: 10px 20px;

  border: 0;
  border-radius: 4px;

  font-size: 1.6rem;
  font-weight: bold;
  color: #fff;

  &:hover {
    opacity: 0.8;
  }
`;

export const KilledNow = styled(Button)`
  background-color: var(--mvpCard_killButton);
`;

export const EditButton = styled(Button)`
  background-color: var(--mvpCard_editButton);
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column; /* Always column */
  width: 100%; /* Always full width */
  margin-top: 10px;
  gap: 10px;
  padding: 0; /* Removed horizontal padding */
`;

export const Control = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 200px; /* Fixed width */
  margin: 0 auto; /* Center the button */
  height: auto;
  padding: 10px 12px;
  border: 0; /* Removed red border */
  border-radius: 4px;

  font-weight: bolder;

  svg {
    stroke-width: 2px;
    width: 24px;
    height: 24px;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover {
    opacity: 0.8;
  }

  &:first-child {
    background-color: var(--mvpCard_controls_showMap);
  }

  &:nth-child(2) {
    background-color: var(--mvpCard_controls_delete);
  }

  &:nth-child(3) {
    background-color: var(--mvpCard_controls_edit);
  }
`;

export const ControlText = styled.span`
  font-size: 1.4rem; /* Increased font size */
  color: #fff;
`;