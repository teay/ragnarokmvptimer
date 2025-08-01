import { styled } from '@linaria/react';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 28rem;
  padding: 0px 0px 10px 0px;

  border-radius: 8px;

  background-color: var(--mvpCard_bg);
  border: none;
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
  flex-direction: column;
  align-items: center;
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
  width: 100%;
  padding: 5px 20px;

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

export const Controls = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: ${({ isActive }) => (isActive ? 'column' : 'row')};

  margin-top: ${({ isActive }) => (isActive ? 35 : 8)}px;
  gap: 10px;
`;

export const Control = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  width: auto;
  height: auto;
  padding: 8px 12px; /* เพิ่ม padding */
  border-radius: 4px; /* ปรับ border-radius */

  font-weight: bolder;

  svg {
    stroke-width: 2px; /* ปรับ stroke-width */
    width: 24px; /* เพิ่มขนาดไอคอน */
    height: 24px; /* เพิ่มขนาดไอคอน */
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
    background-color: var(--mvpCard_controls_edit);
  }

  &:nth-child(3) {
    background-color: var(--mvpCard_controls_delete);
  }
`;