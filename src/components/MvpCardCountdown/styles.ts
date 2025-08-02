import { styled } from '@linaria/react';

interface TimerProps {
  respawningSoon: boolean;
  missedRespawn: boolean;
}

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  white-space: pre-wrap;
  color: var(--mvpCard_text);
  width: 100%; /* เพิ่มความกว้างเต็ม */
  font-size: 2.0rem;
`;

export const RespawnTimeText = styled.span<TimerProps>`
  font-weight: bold;
  font-size: 2.4rem;
  color: ${({ respawningSoon, missedRespawn }) =>
    respawningSoon
      ? 'var(--timers_respawning)'
      : missedRespawn
      ? 'var(--timers_passed)'
      : 'var(--mvpCard_text)'};
`;
