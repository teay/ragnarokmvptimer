import { useCallback } from 'react';
import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { PartyButton } from '../PartyButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useTimer } from '@/contexts/TimerContext'; // <-- เปลี่ยนจาก useTimerContext เป็น useTimer

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

// CSS Keyframes for online glow
const styleId = 'online-pulse-styles';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes glow {
      0% { 
        box-shadow: 0 0 2px rgba(255,255,255,0.3);
      }
      30% { 
        box-shadow: 0 0 6px rgba(255,255,255,0.6);
      }
      60% {
        box-shadow: 0 0 2px rgba(255,255,255,0.3);
      }
      100% {
        box-shadow: 0 0 2px rgba(255,255,255,0.3);
      }
    }
  `;
  document.head.appendChild(style);
}

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
              gap: '6px',
              marginLeft: '20px',
            }}
          >
            <LiveBadge
              onClick={handleCopyInviteLink}
              style={{ cursor: 'pointer' }}
              title='Click to copy invite link'
            >
              📋 {partyRoom}
            </LiveBadge>
            {partyMembers && partyMembers.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  justifyContent: 'center',
                }}
              >
                {partyMembers
                  .sort((a, b) => {
                    // Sort: self first, then online, then offline
                    if (a.name === nickname) return -1;
                    if (b.name === nickname) return 1;
                    if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
                    return 0;
                  })
                  .map((member) => (
                    <span
                      key={member.name}
                      style={{
                        fontSize: '0.8rem',
                        color:
                          member.name === nickname
                            ? '#fbc02d'
                            : member.isOnline
                            ? '#e0e0e0'
                            : '#888',
                        fontWeight:
                          member.name === nickname ? 'bold' : 'normal',
                        background:
                          member.name === nickname
                            ? 'rgba(251,192,45,0.2)'
                            : member.isOnline
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(128,128,128,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        opacity: member.isOnline ? 1 : 0.6,
                        animation: member.isOnline
                          ? 'glow 6s ease-in-out infinite'
                          : 'none',
                      }}
                    >
                      {member.name === nickname
                        ? '⭐ '
                        : member.isOnline
                        ? '🟢 '
                        : '⬜ '}
                      @{member.name}
                    </span>
                  ))}
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
