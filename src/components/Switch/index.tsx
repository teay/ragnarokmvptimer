import { Container, Input, Thumb } from './styles';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function Switch({ onChange, checked, id, name, disabled }: SwitchProps) {
  return (
    <Container disabled={disabled}>
      <Input
        type='checkbox'
        onChange={disabled ? () => {} : onChange}
        checked={checked}
        id={id}
        name={name}
        disabled={disabled}
      />
      <Thumb />
    </Container>
  );
}
