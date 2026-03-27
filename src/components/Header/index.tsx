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

// CSS Keyframes for background pulse
const styleId = 'online-pulse-styles';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes glow {
      0%, 100% { 
        box-shadow: 0 0 2px rgba(76,175,80,0.3);
      }
      50% { 
        box-shadow: 0 0 10px rgba(76,175,80,0.6);
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
    if (nickname) return 'Solo Mode';
    return 'Local Data';
  };

  return (
    <Container>
      <LogoContainer>
        <Logo src={mvpImg} alt='mvp' />
        <Title>Ragnarok MVP Timer</Title>
        <DataBadge location={getBadgeStatus()}>{getBadgeText()}</DataBadge>
        {nickname && !partyRoom && (
          <span
            style={{
              marginLeft: '15px',
              padding: '8px 15px',
              background: 'rgba(76, 175, 80, 0.3)',
              borderRadius: '20px',
              fontSize: '1rem',
              color: '#4CAF50',
              fontWeight: 'bold',
            }}
          >
            👤 {nickname}
          </span>
        )}
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
            <LiveBadge>👥 {partyRoom}</LiveBadge>
            {nickname && (
              <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                {nickname}
              </span>
            )}
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
                            ? 'rgba(76,175,80,0.15)'
                            : 'rgba(128,128,128,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        opacity: member.isOnline ? 1 : 0.6,
                        animation: member.isOnline
                          ? 'glow 2s ease-in-out infinite'
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
