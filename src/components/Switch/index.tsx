import { Container, Input, Thumb } from './styles';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  id?: string;
  name?: string;
}

export function Switch({ onChange, checked, id, name }: SwitchProps) {
  return (
    <Container>
      <Input
        type='checkbox'
        onChange={onChange}
        checked={checked}
        id={id}
        name={name}
      />
      <Thumb />
    </Container>
  );
}
