import { useCallback } from 'react';
import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { PartyButton } from '../PartyButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useTimer } from '@/contexts/TimerContext'; // <-- เปลี่ยนจาก useTimerContext เป็น useTimer
import { Copy } from '@styled-icons/feather';

import mvpImg from '@/assets/mvp.png';

import {
  Container,
  Customization,
  Logo,
  LogoContainer,
  Title,
  LiveBadge,
  DataBadge,
} from './styles';

export function Header() {
  const {
    use24HourFormat,
    partyRoom,
    server,
    nickname,
    cloudSyncEnabled,
    localSaveEnabled,
  } = useSettings();
  const { dataLocation } = useMvpsContext();
  const { partyMembers } = useTimer();

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
        <DataBadge location={getBadgeStatus()}>{getBadgeText()}</DataBadge>
        {partyRoom && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LiveBadge
                onClick={handleCopyInviteLink}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title='Click to copy invite link'
              >
                <Copy size={12} /> {partyRoom}
              </LiveBadge>
            </div>
            {partyMembers && partyMembers.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                {partyMembers.filter((m) => m !== nickname).length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                      👥
                    </span>
                    {partyMembers
                      .filter((m) => m !== nickname)
                      .map((member) => (
                        <span
                          key={member}
                          style={{
                            fontSize: '0.85rem',
                            color: '#e0e0e0',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          @{member}
                        </span>
                      ))}
                  </div>
                )}
                {nickname && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ color: '#fbc02d', fontSize: '0.85rem' }}>
                      👤
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: '#fbc02d',
                        fontWeight: 'bold',
                        background: 'rgba(251,192,45,0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      @{nickname} (You)
                    </span>
                  </div>
                )}
              </div>
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
