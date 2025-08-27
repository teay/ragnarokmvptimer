import { styled } from '@linaria/react';

export const Button = styled.button`
  font-weight: 500;
  color: var(--header_text);
  background: none;

  &:hover {
    opacity: 0.8;
    text-shadow: 0 0 10px var(--secondary);
  }
`;
