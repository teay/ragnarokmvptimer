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
  max-height: 80vh;
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

  > svg {
    width: 18px;
    height: 18px;
  }
`;
