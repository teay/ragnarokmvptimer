import { styled } from '@linaria/react';

export const MapWrapper = styled.div`
  cursor: pointer;
`;

export const Container = styled.div<{
  isEditing: boolean;
  zone?: 'active' | 'wait' | 'all';
}>`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 28rem;
  padding: 10px;

  border-radius: 8px;

  background-color: var(--mvpCard_bg);
  backdrop-filter: var(--mvpCard_backdrop_filter);
  position: relative;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0px 12px 25px 8px rgba(0, 0, 0, 0.3);
  }

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
        box-shadow: 0px 8px 20px 5px rgba(0, 0, 0, 0.2);
  `
      : ''}
`;

export const BottomControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: auto; /* This will push it to the bottom */
  width: 100%;
  padding: 0;

  > *:not(:first-child) {
    margin-top: 10px;
  }
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

export const KillTime = styled.span`
  font-size: 0.7rem;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    font-size: 1.4rem;
    color: #fff;
  }
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
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--mvpCard_id);
`;

export const Name = styled.span<{ fontSize?: number }>`
  font-weight: bold;
  color: var(--mvpCard_name);
  font-size: ${({ fontSize }) => (fontSize ? `${fontSize}px` : '2.2rem')};
`;

export const MapName = styled.span`
  text-align: center;
  white-space: pre-wrap;
  margin-top: 5px;
  color: #e0e0e0 !important;
  font-size: 1.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
  user-select: none;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
`;

export const Tombstone = styled.p`
  font-size: 1.8rem;
  text-align: center;
  line-height: 1.2;
  white-space: pre-wrap;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
`;

const Button = styled.button`
  width: 200px; /* Fixed width */
  margin: 0 auto; /* Center the button */
  padding: 10px 20px;

  border: 0;
  border-radius: 4px;

  font-size: 1.6rem;
  font-weight: bold;
  color: #e0e0e0;

  &:hover {
    opacity: 0.8;
  }
`;

export const KilledNow = styled(Button)``;

export const EditButton = styled(Button)``;

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
    color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover {
    opacity: 0.8;
  }
`;

export const ControlText = styled.span`
  font-size: 1.6rem;
  color: #e0e0e0;
`;

export const ButtonGroup = styled.div<{
  variant?:
    | 'primary'
    | 'timer'
    | 'timer-position'
    | 'secondary'
    | 'back'
    | 'danger';
}>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;

  & > button,
  & > * > button {
    background-color: ${({ variant }) => {
      if (variant === 'primary') return '#8b5a2b'; // น้ำตาล - ปุ่มหลัก
      if (variant === 'timer-position') return '#4a7a9b'; // ฟ้ากลาง - Reset Timer & Position
      if (variant === 'timer') return '#7a9bad'; // ฟ้าอ่อน - Reset Timer
      if (variant === 'back') return '#d65a5a'; // แดงอ่อน - ปุ่มกลับ
      if (variant === 'danger') return '#b33a3a'; // แดงเข้ม - Remove
      return '#4a4a4a'; // เทาเข้ม - ปุ่มรอง
    }} !important;
  }
`;

export const ButtonGroupDivider = styled.hr`
  width: 80%;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin: 8px 0;
`;

export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 200px;
  gap: 8px;
  margin: 0 auto;
`;

export const MiniControl = styled.button<{
  variant?: 'danger' | 'secondary' | 'back';
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border: 0;
  border-radius: 4px;
  background-color: ${({ variant }) => {
    if (variant === 'danger') return '#b33a3a';
    if (variant === 'back') return '#d65a5a';
    return '#4a4a4a';
  }} !important;
  color: #e0e0e0;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  svg {
    width: 18px;
    height: 18px;
    margin-bottom: 4px;
  }

  span {
    font-size: 1.1rem;
    font-weight: bold;
    text-transform: uppercase;
  }
`;
