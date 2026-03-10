import { styled } from '@linaria/react';

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--filterSearch_bg);
  border: 2px solid var(--modal_datePicker_border);
  border-radius: 6px;
  padding: 12px;
  width: 100%;
  color: var(--text);
  font-family: inherit;
  font-size: 2rem;
  transition: all 0.2s ease-in-out;

  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }
`;

export const Segment = styled.input`
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: center;
  width: 3rem;
  padding: 2px;
  outline: none;
  border-radius: 4px;
  transition: all 0.1s;

  &:focus {
    background-color: rgba(255, 255, 255, 0.2);
    color: #ffffff; /* ใช้สีขาวทึบเพื่อให้มองเห็นชัดเจนแน่นอน */
    font-weight: bold;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  }

  &.year {
    width: 5.5rem;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
`;

export const Separator = styled.span`
  margin: 0 4px;
  opacity: 0.5;
  font-weight: bold;
`;

export const Spacer = styled.div`
  width: 20px;
`;
