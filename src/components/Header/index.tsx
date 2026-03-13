import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { PartyButton } from '../PartyButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';

import mvpImg from '@/assets/mvp.png';

import { Container, Customization, Logo, LogoContainer, Title, LiveBadge, DataBadge } from './styles';

export function Header() {
  const { use24HourFormat, partyRoom, cloudSyncEnabled, localSaveEnabled } = useSettings();
  const { dataLocation } = useMvpsContext();

  const getBadgeStatus = (): 'local' | 'online' | 'ghost' | 'warning' => {
    if (!localSaveEnabled) return 'warning';
    if (partyRoom && !cloudSyncEnabled) return 'ghost';
    if (partyRoom) return 'online';
    return 'local';
  };

  const getBadgeText = () => {
    if (!localSaveEnabled) return 'Save Paused';
    if (partyRoom && !cloudSyncEnabled) return 'Ghost Mode';
    if (partyRoom) return 'Party Sync';
    return 'Local Data';
  };

  return (
    <Container>
      <LogoContainer>
        <Logo src={mvpImg} alt='mvp' />
        <Title>Ragnarok MVP Timer</Title>
        <DataBadge location={getBadgeStatus()}>
          {getBadgeText()}
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
