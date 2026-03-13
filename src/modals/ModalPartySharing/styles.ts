import { styled } from '@linaria/react';

export const Modal = styled.div`
  width: 100%;
  max-width: 500px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 5vh;
  z-index: 10000;
`;

export const Title = styled.span`
  color: var(--modal_name);

  font-size: 2.8rem;
  font-weight: 600;
`;

export const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 3rem;
  padding: 3rem 2rem;
  border-radius: 6px;
  position: relative;
  max-height: 85vh;
  overflow-y: auto;

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
`;

export const Setting = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const SettingName = styled.span`
  color: var(---modal_text);

  font-size: 2.0rem;
  font-weight: 500;

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const SettingSecondary = styled(Setting)`
  width: auto;
  flex-direction: column;
`;

export const ActionButton = styled.button`
  padding: 8px 16px;
  border: 0;
  border-radius: 4px;
  font-size: 1.6rem;
  font-weight: 600;
  color: #fff;
  background-color: var(--primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    filter: brightness(1.1);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  > svg {
    width: 18px;
    height: 18px;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1.6rem;
  margin-bottom: 1rem;
  outline: none;

  &:focus {
    border-color: var(--primary);
  }
`;

export const LiveStatus = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${(props) => (props.active ? '#4caf50' : '#f44336')};
  margin-bottom: 1rem;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) => (props.active ? '#4caf50' : '#f44336')};
    box-shadow: 0 0 5px ${(props) => (props.active ? '#4caf50' : '#f44336')};
  }
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 8px;
`;

export const StatusBadge = styled.div<{ active: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => props.active ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
  color: ${props => props.active ? '#4caf50' : '#f44336'};
  border: 1px solid ${props => props.active ? '#4caf50' : '#f44336'};
`;

export const BackupSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const BackupItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  border-left: 3px solid var(--primary);
`;

export const BackupInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;

  span.date {
    font-size: 1.4rem;
    font-weight: 600;
    color: #fff;
  }

  span.desc {
    font-size: 1.2rem;
    opacity: 0.6;
  }

  span.stats {
    font-size: 1.1rem;
    color: var(--primary);
    font-weight: bold;
  }
`;

export const BackupActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const MiniButton = styled.button<{ variant?: 'danger' }>`
  background: ${props => props.variant === 'danger' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.variant === 'danger' ? '#f44336' : '#fff'};
  border: 1px solid ${props => props.variant === 'danger' ? '#f44336' : 'rgba(255, 255, 255, 0.2)'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.variant === 'danger' ? '#f44336' : 'var(--primary)'};
    color: #fff;
  }
`;
