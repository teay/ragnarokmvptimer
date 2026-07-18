import { useState } from 'react';
import { Users } from '@styled-icons/feather';
import { ModalPartySharing } from '@/modals';
import { Container } from './styles';

declare const __LITE_MODE__: boolean;

export function PartyButton() {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const handleClick = () => {
    setIsPartyModalOpen(true);
  };

  return (
    <>
      <Container>
        <Users onClick={handleClick} />
      </Container>
      {isPartyModalOpen && (
        <ModalPartySharing onClose={() => setIsPartyModalOpen(false)} />
      )}
    </>
  );
}
