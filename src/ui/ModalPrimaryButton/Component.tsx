import React from 'react';
import { Button, BtnSizes } from './styles';
import { ModalPrimaryButtonProps } from './types';

export function ModalPrimaryButton({ 
  size = 'sm', 
  children, 
  style, 
  className,
  ...rest 
}: ModalPrimaryButtonProps) {
  const width = size === 'lg' ? BtnSizes.lg : BtnSizes.sm;
  
  return (
    <Button 
      {...rest} 
      className={className}
      style={{ ...style, '--button-width': width } as React.CSSProperties}
    >
      {children}
    </Button>
  );
}
