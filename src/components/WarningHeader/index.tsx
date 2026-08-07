import { Container, CloseButton } from './styles';

interface WarningHeaderProps {
  text: string;
  onClose?: () => void;
}

export function WarningHeader({ text, onClose }: WarningHeaderProps) {
  return (
    <Container>
      {text}
      {onClose && (
        <CloseButton onClick={onClose} aria-label='Close'>
          &times;
        </CloseButton>
      )}
    </Container>
  );
}
