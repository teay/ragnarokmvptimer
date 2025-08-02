import { styled } from '@linaria/react';

export const Modal = styled.div`
  width: 100%;
  max-width: 500px;

  padding: 1.6rem;
  padding-bottom: 2.4rem;
  margin: 0 1rem;
  gap: 2rem;

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
    overflow-y: auto;
    max-height: 85vh;
  }
`;

export const Title = styled.span`
  color: var(--modal_name);
  margin-top: -4rem;

  font-size: 2.4rem;
  font-weight: 600;
`;

export const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 3rem;
  padding: 0 2rem;
`;

export const Setting = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const SettingName = styled.span`
  color: var(---modal_text);

  font-size: 1.8rem;
  font-weight: 500;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SettingSecondary = styled(Setting)`
  width: auto;
  flex-direction: column;
`;

export const ThemeContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  > svg {
    width: 20px;
    height: 20px;
    stroke-width: 2px;
    fill: white;
    color: var(---modal_text);
  }
`;

export const ClearButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;

  width: 100%;
  padding: 5px 15px;
  gap: 6px;

  border: 0;
  border-radius: 4px;

  font-size: 18px;
  font-weight: 500;
  color: #fff;

  background-color: #d10000;

  &:hover {
    opacity: 0.8;
  }

  > svg {
    width: 16px;
    height: 16px;
    stroke-width: 3px;
    color: white;
  }
`;
