import { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

export type Sizes = 'sm' | 'md' | 'lg';

export interface ModalPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Sizes;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
