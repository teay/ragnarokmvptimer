import { styled } from '@linaria/react';

export const Select = styled.select`
  width: 100%;
  border-radius: 8px;
  color: var(--filterSearch_text);

  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  border: 1px solid var(--filterSearch_border);
  background-color: var(--filterSearch_bg);
  outline: none;
  padding: 1rem;
  transition: transform 0.2s ease-in-out;

  &:focus {
    border-color: var(--filterSearch_border_focus);
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

export const Option = styled.option`
  font-size: 14px;
  font-weight: 500;

  color: var(--filterSearch_text);
  background-color: var(--filterSearch_bg);

  &:checked,
  &:hover {
    background-color: rgba(128, 128, 128, 0.7); /* Darker for selected/hovered state */
  }
`;
