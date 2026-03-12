import { useState } from 'react';
import { Users } from '@styled-icons/feather';
import { ModalPartySharing } from '@/modals';
import { Container } from './styles';

export function PartyButton() {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  return (
    <>
      <Container>
        <Users onClick={() => setIsPartyModalOpen(true)} />
      </Container>

      {isPartyModalOpen && (
        <ModalPartySharing onClose={() => setIsPartyModalOpen(false)} />
      )}
    </>
  );
}
