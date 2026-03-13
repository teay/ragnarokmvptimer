import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { PartyButton } from '../PartyButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import mvpImg from '@/assets/mvp.png';

import { Container, Customization, Logo, LogoContainer, Title, LiveBadge, DataBadge } from './styles';

export function Header() {
  const { use24HourFormat, partyRoom } = useSettings();
  const { dataLocation } = useMvpsContext();

  return (
    <Container>
      <LogoContainer>
        <Logo src={mvpImg} alt='mvp' />
        <Title>Ragnarok MVP Timer</Title>
        <DataBadge location={dataLocation === 'online' ? 'online' : 'local'}>
          {dataLocation === 'online' ? 'Party Sync' : 'Local Data'}
        </DataBadge>
        {partyRoom && <LiveBadge>Live: {partyRoom}</LiveBadge>}
      </LogoContainer>

      <HeaderTimer use24HourFormat={use24HourFormat} />

      <Customization>
        <PartyButton />
        <ServerButton />
        <SettingsButton />
      </Customization>
    </Container>
  );
}
