import { styled } from '@linaria/react';

export const Button = styled.a`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  white-space: nowrap;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--primary);
    color: #fff;
  }
`;