import { useState } from 'react';
import { Users } from '@styled-icons/feather';
import { ModalPartySharing } from '@/modals';
import { Container } from './styles';

declare const __LITE_MODE__: boolean;

export function PartyButton() {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const handleClick = () => {
    if (__LITE_MODE__) {
      setIsPartyModalOpen(true);
    } else {
      window.dispatchEvent(new CustomEvent('showWelcomeScreen'));
    }
  };

  return (
    <>
      <Container>
        <Users onClick={handleClick} />
      </Container>
      {__LITE_MODE__ && isPartyModalOpen && (
        <ModalPartySharing onClose={() => setIsPartyModalOpen(false)} />
      )}
    </>
  );
}
