import { Users } from '@styled-icons/feather';
import { Container } from './styles';

export function PartyButton() {
  return (
    <Container>
      <Users
        onClick={() =>
          window.dispatchEvent(new CustomEvent('showWelcomeScreen'))
        }
      />
    </Container>
  );
}
