import React from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { IMvp } from '../../interfaces';
import { useCountdown } from '../../hooks/useCountdown';
import { getMvpRespawnTime } from '../../utils';

dayjs.extend(duration);

interface MvpCardTextProps {
  mvp: IMvp;
  isActive: boolean;
}

const MvpCardText: React.FC<MvpCardTextProps> = ({ mvp, isActive }) => {
  const name = mvp.name;
  const map = mvp.deathMap || (mvp.spawn.length > 0 ? mvp.spawn[0].mapname : 'N/A');

  let statusDisplay = '';
  let countdownDisplay = '';
  let deathTimeDisplay = '';
  let actionsDisplay = '';

  if (isActive) {
    const respawnTimeMs = getMvpRespawnTime(mvp);
    const respawnTimestamp = mvp.deathTime
      ? dayjs(mvp.deathTime).add(respawnTimeMs, 'ms')
      : dayjs();

    const { duration: countdownDuration } = useCountdown(respawnTimestamp);

    if (countdownDuration.asSeconds() <= 0) {
      statusDisplay = 'Already Respawned';
      countdownDisplay = ''; // No countdown if already respawned
    } else {
      statusDisplay = ''; // No specific status like "I killed now!" for active
      countdownDisplay = `${String(Math.floor(countdownDuration.asHours())).padStart(2, '0')}:${String(countdownDuration.minutes()).padStart(2, '0')}:${String(countdownDuration.seconds()).padStart(2, '0')}`;
    }

    deathTimeDisplay = mvp.deathTime
      ? `When was mvp killed?\n${dayjs(mvp.deathTime).format('DD/MM/YYYY HH:mm')}`
      : '';
    actionsDisplay = 'Reset Timer | Remove MVP | Edit MVP';
  } else {
    // statusDisplay is empty for inactive MVPs, as "I killed now!" is a button
    actionsDisplay = 'Edit'; // This will be overridden by the specific buttons below
  }

  return (
    <div className="mvp-card-text">
      <div className="mvp-card-text-id">((ID: {mvp.id}))</div>
      <div className="mvp-card-text-name">{name}</div>
      <div className="mvp-card-text-map">Map: {map}</div>
      <div className="mvp-card-text-status-line">
        {statusDisplay && <p className="mvp-status">{statusDisplay}</p>}
        {countdownDisplay && <p className="mvp-countdown">{countdownDisplay}</p>}
      </div>
      {deathTimeDisplay && <div className="mvp-card-text-death-time">{deathTimeDisplay}</div>}
      <div className="mvp-card-text-actions">
        {isActive ? (
          <>
            <span className="mvp-action-button">Reset Timer</span>
            <span className="mvp-action-button">Remove MVP</span>
            <span className="mvp-action-button">Edit MVP</span>
          </>
        ) : (
          <>
            <span className="mvp-action-button kill-now-button">I killed now!</span>
            <span className="mvp-action-button edit-button">Edit</span>
          </>
        )}
      </div>
    </div>
  );
};

export default MvpCardText;
