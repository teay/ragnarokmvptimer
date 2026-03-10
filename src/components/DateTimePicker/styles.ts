import { styled } from '@linaria/react';

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--filterSearch_bg);
  border: 1px solid var(--modal_datePicker_border);
  border-radius: 4px;
  padding: 10px;
  width: 100%;
  color: var(--text);
  font-family: inherit;
  font-size: 1.8rem;

  &:focus-within {
    border-color: var(--filterSearch_border_focus);
  }
`;

export const Segment = styled.input`
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: center;
  width: 2.5rem;
  padding: 0;
  outline: none;

  &.year {
    width: 4.5rem;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

export const Separator = styled.span`
  margin: 0 2px;
  opacity: 0.6;
`;

export const Spacer = styled.div`
  width: 15px;
`;
