import { useCallback } from 'react';
import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { PartyButton } from '../PartyButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { Copy } from '@styled-icons/feather';

import mvpImg from '@/assets/mvp.png';

import { Container, Customization, Logo, LogoContainer, Title, LiveBadge, DataBadge } from './styles';

export function Header() {
  const { use24HourFormat, partyRoom, server, cloudSyncEnabled, localSaveEnabled } = useSettings();
  const { dataLocation } = useMvpsContext();

  const handleCopyInviteLink = useCallback(() => {
    if (!partyRoom) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('room', partyRoom);
    url.searchParams.set('server', server);
    
    navigator.clipboard.writeText(url.toString());
    alert('Invite link copied!');
  }, [partyRoom, server]);

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
        {partyRoom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LiveBadge 
              onClick={handleCopyInviteLink} 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Click to copy invite link"
            >
              <Copy size={12} /> {partyRoom}
            </LiveBadge>
            {nickname && (
              <span style={{ 
                fontSize: '1.2rem', color: '#fbc02d', fontWeight: 'bold', 
                background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' 
              }}>
                @{nickname}
              </span>
            )}
          </div>
        )}
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
