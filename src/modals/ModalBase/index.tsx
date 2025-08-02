import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { Container } from './styles';

interface Props {
  children: ReactNode;
}

export function ModalBase({ children }: Props) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(<Container>{children}</Container>, modalRoot);
}
