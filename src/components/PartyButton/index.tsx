import { Users } from '@styled-icons/feather';
import { Container } from './styles';

export function PartyButton() {
  const handleClick = () => {
    // Add query param to force show welcome screen, then reload
    const url = new URL(window.location.href);
    url.searchParams.set('setup', 'true');
    window.location.href = url.toString();
  };

  return (
    <Container>
      <Users onClick={handleClick} />
    </Container>
  );
}
