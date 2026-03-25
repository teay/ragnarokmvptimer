import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  Star,
  X,
  Maximize2,
  Minimize2,
} from '@styled-icons/feather';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { MvpSprite } from '../MvpSprite';
import { MvpCardCountdown } from '../MvpCardCountdown';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getMvpRespawnTime } from '@/utils';

import {
  TableContainer,
  StyledTable,
  Th,
  Td,
  RowNumber,
  MvpNameCell,
  TimeDisplay,
  TimeLeft,
  TimeGroupLabel,
  TimeGroupTh,
  StatusBadge,
  ActionButtons,
  ActionButton,
  SummaryRow,
  SummaryCell,
  CompactRow,
  CompactTd,
  CompactTimeDisplay,
  CompactTimeLeft,
  CompactActions,
  CompactButton,
} from './styles';

dayjs.extend(duration);

interface MvpTableProps {
  mvps: IMvp[];
  zone: 'active' | 'wait' | 'all';
}

type Urgency = 1 | 2 | 3 | 4 | 5;

const getUrgency = (minutes: number): Urgency => {
  if (minutes < 0) return 5;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

const getTimeLeftString = (mvp: IMvp): string | null => {
  if (!mvp.deathTime) return null;
  const respawnTime = dayjs(mvp.deathTime).add(getMvpRespawnTime(mvp), 'ms');
  const diff = respawnTime.diff(dayjs());
  if (diff <= 0) return null;

  const dur = dayjs.duration(diff);
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();
  const seconds = dur.seconds();

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

const getTimeLeftMinutes = (mvp: IMvp): number => {
  if (!mvp.deathTime) return Infinity;
  const respawnTime = dayjs(mvp.deathTime).add(getMvpRespawnTime(mvp), 'ms');
  const diff = respawnTime.diff(dayjs());
  return diff > 0 ? dayjs.duration(diff).asMinutes() : -1;
};

export function MvpTable({ mvps, zone }: MvpTableProps) {
  const [compactMode, setCompactMode] = useState(false);
  const {
    moveToAll,
    addToWait,
    removeFromWait,
    moveToWait,
    setEditingMvp,
    setKillingMvp,
  } = useMvpsContext();
  const { respawnAsCountdown } = useSettings();

  const activeMvps = mvps
    .filter((m) => m.deathTime)
    .sort((a, b) => getTimeLeftMinutes(a) - getTimeLeftMinutes(b));

  const nonActiveMvps = mvps.filter((m) => !m.deathTime);

  const groupActiveByTime = () => {
    const groups: { label: string; mvps: IMvp[] }[] = [];

    const urgent = activeMvps.filter((m) => getTimeLeftMinutes(m) < 30);
    const soon = activeMvps.filter((m) => {
      const mins = getTimeLeftMinutes(m);
      return mins >= 30 && mins < 60;
    });
    const medium = activeMvps.filter((m) => {
      const mins = getTimeLeftMinutes(m);
      return mins >= 60 && mins < 120;
    });
    const far = activeMvps.filter((m) => getTimeLeftMinutes(m) >= 120);

    if (urgent.length) groups.push({ label: '⚠️ ภายใน 30 นาที', mvps: urgent });
    if (soon.length) groups.push({ label: '⏰ 30-60 นาที', mvps: soon });
    if (medium.length) groups.push({ label: '🕐 1-2 ชั่วโมง', mvps: medium });
    if (far.length) groups.push({ label: '💤 2+ ชั่วโมง', mvps: far });

    return groups;
  };

  const timeGroups = zone === 'all' ? groupActiveByTime() : [];

  const total = mvps.length;
  const activeCount = mvps.filter((m) => m.deathTime).length;
  const waitCount = mvps.filter((m) => m.isPinned && !m.deathTime).length;
  const aliveCount = total - activeCount - waitCount;

  const renderCompactRow = (
    mvp: IMvp,
    index: number,
    inGroup: boolean = false
  ) => {
    const inActive = !!mvp.deathTime;
    const inWait = mvp.isPinned === true && !inActive;
    const mapName = inActive ? mvp.deathMap : mvp.spawn[0]?.mapname || '-';
    const timeLeft = getTimeLeftString(mvp);
    const timeLeftMinutes = getTimeLeftMinutes(mvp);
    const urgency = getUrgency(timeLeftMinutes);
    const isFavorite = mvp.isPinned === true;

    return (
      <CompactRow key={`${mvp.id}-${mvp.deathMap}`} isFavorite={isFavorite}>
        <CompactTd>{index + 1}</CompactTd>
        <CompactTd>{mvp.id}</CompactTd>
        <CompactTd>
          {isFavorite && (
            <Star size={12} style={{ color: '#ffc107', marginRight: 4 }} />
          )}
          <MvpSprite id={mvp.id} name={mvp.name} animated={false} />
          {mvp.name}
        </CompactTd>
        <CompactTd>{mapName}</CompactTd>
        {inActive && (
          <CompactTimeDisplay urgency={urgency}>
            {timeLeft ? (
              <CompactTimeLeft urgency={urgency}>{timeLeft}</CompactTimeLeft>
            ) : (
              <CompactTimeLeft urgency={1}>NOW</CompactTimeLeft>
            )}
          </CompactTimeDisplay>
        )}
        {!inActive && <CompactTd>-</CompactTd>}
        <CompactTd>
          {inActive && <StatusBadge status='active'>A</StatusBadge>}
          {inWait && <StatusBadge status='wait'>P</StatusBadge>}
          {!inActive && !inWait && <StatusBadge status='all'>-</StatusBadge>}
        </CompactTd>
        <CompactTd>
          <CompactActions>
            {inActive && (
              <>
                <CompactButton onClick={() => setKillingMvp(mvp)} title='Kill'>
                  <Star size={12} />
                </CompactButton>
                <CompactButton onClick={() => setEditingMvp(mvp)} title='Edit'>
                  <Edit2 size={12} />
                </CompactButton>
                <CompactButton
                  onClick={() => moveToAll(mvp.id, mvp.deathMap)}
                  title='Remove'
                >
                  <Trash2 size={12} />
                </CompactButton>
              </>
            )}
            {!inActive && inWait && (
              <>
                <CompactButton onClick={() => setKillingMvp(mvp)} title='Kill'>
                  <Star size={12} />
                </CompactButton>
                <CompactButton
                  onClick={() => removeFromWait(mvp)}
                  title='Unpin'
                >
                  <X size={12} />
                </CompactButton>
              </>
            )}
            {!inActive && !inWait && zone === 'all' && (
              <CompactButton onClick={() => addToWait(mvp)} title='Pin'>
                <Star size={12} />
              </CompactButton>
            )}
          </CompactActions>
        </CompactTd>
      </CompactRow>
    );
  };

  const renderFullRow = (mvp: IMvp, index: number) => {
    const inActive = !!mvp.deathTime;
    const inWait = mvp.isPinned === true && !inActive;
    const mapName = inActive ? mvp.deathMap : mvp.spawn[0]?.mapname || '-';
    const timeLeft = getTimeLeftString(mvp);
    const timeLeftMinutes = getTimeLeftMinutes(mvp);
    const urgency = getUrgency(timeLeftMinutes);
    const isFavorite = mvp.isPinned === true;

    return (
      <CompactRow key={`${mvp.id}-${mvp.deathMap}`} isFavorite={isFavorite}>
        <RowNumber>{index + 1}</RowNumber>
        <Td sticky>{mvp.id}</Td>
        <MvpNameCell sticky>
          {isFavorite && (
            <Star size={14} style={{ color: '#ffc107', marginRight: 4 }} />
          )}
          <MvpSprite id={mvp.id} name={mvp.name} animated={false} />
          {mvp.name}
        </MvpNameCell>
        <Td>{mapName}</Td>
        <Td>
          {inActive && mvp.deathTime
            ? dayjs(mvp.deathTime).format('DD/MM HH:mm')
            : '-'}
        </Td>
        <Td>
          {inActive && (
            <MvpCardCountdown
              mvp={mvp}
              respawnAsCountdown={respawnAsCountdown}
              onTriggerNotification={() => {}}
            />
          )}
        </Td>
        <TimeDisplay urgency={urgency}>
          {timeLeft ? (
            <TimeLeft urgency={urgency}>{timeLeft}</TimeLeft>
          ) : (
            <TimeLeft urgency={1}>NOW</TimeLeft>
          )}
        </TimeDisplay>
        <Td>
          {inActive && <StatusBadge status='active'>Active</StatusBadge>}
          {inWait && <StatusBadge status='wait'>Pinned</StatusBadge>}
          {!inActive && !inWait && (
            <StatusBadge status='all'>Alive</StatusBadge>
          )}
        </Td>
        <Td>
          <ActionButtons>
            {inActive && (
              <>
                <ActionButton
                  onClick={() => setKillingMvp(mvp)}
                  title='Kill Now'
                >
                  <Star size={14} />
                </ActionButton>
                <ActionButton onClick={() => setEditingMvp(mvp)} title='Edit'>
                  <Edit2 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={() => moveToAll(mvp.id, mvp.deathMap)}
                  title='Remove'
                >
                  <Trash2 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={() => moveToWait(mvp)}
                  title='Back to Wait'
                >
                  <X size={14} />
                </ActionButton>
              </>
            )}
            {!inActive && inWait && (
              <>
                <ActionButton
                  onClick={() => setKillingMvp(mvp)}
                  title='Kill Now'
                >
                  <Star size={14} />
                </ActionButton>
                <ActionButton onClick={() => setEditingMvp(mvp)} title='Edit'>
                  <Edit2 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={() =>
                    moveToAll(mvp.id, mvp.deathMap || mvp.spawn[0]?.mapname)
                  }
                  title='Remove'
                >
                  <Trash2 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={() => removeFromWait(mvp)}
                  title='Cancel'
                >
                  <X size={14} />
                </ActionButton>
              </>
            )}
            {!inActive && !inWait && zone === 'all' && (
              <ActionButton onClick={() => addToWait(mvp)} title='Pin'>
                <Star size={14} />
              </ActionButton>
            )}
          </ActionButtons>
        </Td>
      </CompactRow>
    );
  };

  const allRows = [...timeGroups.flatMap((g) => g.mvps), ...nonActiveMvps];

  return (
    <TableContainer>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
      >
        <CompactButton
          onClick={() => setCompactMode(!compactMode)}
          title={compactMode ? 'Full View' : 'Compact View'}
          style={{ width: 'auto', padding: '4px 8px', gap: 4 }}
        >
          {compactMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          <span style={{ fontSize: 12, marginLeft: 4 }}>
            {compactMode ? 'Full' : 'Compact'}
          </span>
        </CompactButton>
      </div>
      <StyledTable>
        <thead>
          <tr>
            <Th>#</Th>
            <Th sticky>ID</Th>
            <Th sticky>Name</Th>
            <Th>Map</Th>
            {!compactMode && <Th>Death Time</Th>}
            {!compactMode && <Th>Respawn At</Th>}
            <Th>Time</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {compactMode ? (
            allRows.map((mvp, index) => renderCompactRow(mvp, index))
          ) : (
            <>
              {timeGroups.map((group) => (
                <React.Fragment key={group.label}>
                  <TimeGroupLabel>
                    <TimeGroupTh colSpan={9}>{group.label}</TimeGroupTh>
                  </TimeGroupLabel>
                  {group.mvps.map((mvp, index) => renderFullRow(mvp, index))}
                </React.Fragment>
              ))}
              {nonActiveMvps.map((mvp, index) => renderFullRow(mvp, index))}
            </>
          )}
        </tbody>
        {zone === 'all' && (
          <tfoot>
            <SummaryRow>
              <SummaryCell colSpan={9}>
                Total: {total} | Active: {activeCount} | Pinned: {waitCount} |
                Alive: {aliveCount}
              </SummaryCell>
            </SummaryRow>
          </tfoot>
        )}
      </StyledTable>
    </TableContainer>
  );
}
