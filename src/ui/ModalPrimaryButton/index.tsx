// src/ui/ModalPrimaryButton/index.tsx
import { styled } from '@linaria/react';
import { ButtonHTMLAttributes } from 'react';

export type Sizes = 'sm' | 'md' | 'lg';

export interface ModalPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Sizes;
}

export const ModalPrimaryButton = styled.button<ModalPrimaryButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  border: none;
  border-radius: 5px;
  background-color: #f5950f;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(0.9);
  }

  &:disabled {
    background-color: #d9d9d9;
    cursor: not-allowed;
  }

  padding: ${({ size }) =>
    size === 'sm' ? '6px 10px' : size === 'lg' ? '10px 20px' : '8px 15px'};
  font-size: ${({ size }) =>
    size === 'sm' ? '0.8rem' : size === 'lg' ? '1.1rem' : '1rem'};
`;