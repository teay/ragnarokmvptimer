import { useEffect, useRef, useState } from 'react';
import { styled } from '@linaria/react';

import { BOSS_DURATIONS, DEFAULT_SET_NAMES } from '@/data/centralLab';
import { usePersistedState } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';

interface TTimer {
  remaining: number;
  started: boolean;
  startedAt: number | null;
  done: boolean;
  notified: boolean;
}

const makeSet = (): TTimer[] =>
  BOSS_DURATIONS.map((d) => ({
    remaining: d,
    started: false,
    startedAt: null,
    done: false,
    notified: false,
  }));

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SetPanel = styled.div`
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem;
  background: var(--quaternary);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.45);
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.3), 0 0 16px rgba(255, 255, 255, 0.15), 0 2px 6px rgba(0, 0, 0, 0.25);
  }
`;

const SetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
`;

const SetName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RenameBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  opacity: 0.5;
  font-size: 1rem;
  padding: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  &:hover {
    opacity: 1;
    transform: translateY(-1px);
  }
`;

const NameInput = styled.input`
  width: 100%;
  padding: 0.25rem 0.4rem;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: var(--quaternary);
  color: var(--text);
  font-size: 1rem;
  font-weight: 600;
  &:focus {
    outline: none;
  }
`;

const TimeButton = styled.button<{ state: 'idle' | 'running' | 'done' }>`
  width: 100%;
  padding: 0.6rem 0;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  border: 2px solid var(--border);
  background: transparent;
  color: var(--text);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

  ${(p) =>
    p.state === 'running' &&
    `
      color: #ffb74d;
      border-color: var(--primary);
      background: rgba(255, 183, 77, 0.1);
    `}
  ${(p) =>
    p.state === 'done' &&
    `
      color: #4caf50;
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
    `}
  &:hover {
    border-color: rgba(255, 255, 255, 0.65);
    box-shadow: 0 0 6px var(--primary), 0 0 18px rgba(255, 255, 255, 0.22), 0 0 16px var(--primary), 0 2px 6px rgba(0, 0, 0, 0.25);
    transform: translateY(-1px);
  }
`;

function formatBossTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function BossTimer() {
  const { isNotificationSoundEnabled } = useSettings();
  const [setNames, setSetNames] = usePersistedState<string[]>(
    'centralLabSetNames',
    DEFAULT_SET_NAMES
  );
  const [sets, setSets] = useState<TTimer[][]>([makeSet(), makeSet(), makeSet()]);
  const [now, setNow] = useState(Date.now());
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [hoveredTimer, setHoveredTimer] = useState<string | null>(null);
  const setNamesRef = useRef(setNames);
  setNamesRef.current = setNames;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fire notification once per timer upon completion
  useEffect(() => {
    let changed = false;
    const copy = sets.map((s) => s.map((x) => ({ ...x })));
    for (let si = 0; si < 3; si++) {
      copy[si].forEach((t) => {
        if (t.done && !t.notified) {
          const name = (setNamesRef.current && setNamesRef.current[si]) || DEFAULT_SET_NAMES[si];
          t.notified = true;
          changed = true;
          const ti = copy[si].indexOf(t);
          notify(name, ti);
        }
      });
    }
    if (changed) setSets(copy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets]);

  const notify = (setName: string, ti: number) => {
    if (isNotificationSoundEnabled) {
      const audio = new Audio('notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
    const title = `✅ ${setName}`;
    const body = `Stage ${ti + 1} (${formatBossTime(BOSS_DURATIONS[ti])})`;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Stage ${ti + 1} done, ${setName}`);
      u.lang = 'th-TH';
      window.speechSynthesis.speak(u);
    }
  };

  const startTimer = (si: number, ti: number) => {
    setSets((prev) => {
      const copy = prev.map((s) => s.map((x) => ({ ...x })));
      copy[si].forEach((t, i) => {
        if (i !== ti) {
          t.started = false;
          t.startedAt = null;
          t.remaining = BOSS_DURATIONS[i];
          t.done = false;
          t.notified = false;
        }
      });
      const t = copy[si][ti];
      t.started = true;
      t.startedAt = Date.now();
      t.remaining = BOSS_DURATIONS[ti];
      t.done = false;
      t.notified = false;
      return copy;
    });
  };

  const commitRename = (name: string) => {
    if (editingSet !== null) {
      const si = editingSet;
      const next = (setNames || []).map((n, i) => (i === si ? name.trim() || DEFAULT_SET_NAMES[si] : n));
      setSetNames(next);
      setEditingSet(null);
    }
  };

  return (
    <div>
      <Grid>
        {[0, 1, 2].map((si) => {
          const set = sets[si];
          const name = (setNames && setNames[si]) || DEFAULT_SET_NAMES[si];
          return (
            <SetPanel key={si}>
              <SetHeader>
                {editingSet === si ? (
                  <NameInput
                    autoFocus
                    defaultValue={name}
                    maxLength={30}
                    onBlur={(e) => commitRename(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitRename((e.target as HTMLInputElement).value);
                      } else if (e.key === 'Escape') {
                        e.stopPropagation();
                        setEditingSet(null);
                      }
                    }}
                  />
                ) : (
                  <>
                    <SetName title={''}>{name}</SetName>
                    <RenameBtn onClick={() => setEditingSet(si)}>✏️</RenameBtn>
                  </>
                )}
              </SetHeader>
              {set.map((t, ti) => {
                let remaining = t.remaining;
                if (t.started && t.startedAt) {
                  remaining = Math.max(0, BOSS_DURATIONS[ti] - (now - t.startedAt) / 1000);
                }
                const doneNow = t.done || (t.started && remaining <= 0);
                const state: 'idle' | 'running' | 'done' = doneNow
                  ? 'done'
                  : t.started
                  ? 'running'
                  : 'idle';
                return (
                  <TimeButton
                    key={ti}
                    state={state}
                    onClick={() => startTimer(si, ti)}
                    onMouseEnter={() => setHoveredTimer(`${si}-${ti}`)}
                    onMouseLeave={() => setHoveredTimer(null)}
                    style={
                      hoveredTimer === `${si}-${ti}`
                        ? {
                            borderColor: 'rgba(255, 255, 255, 0.65)',
                            boxShadow:
                              '0 0 6px var(--primary), 0 0 18px rgba(255, 255, 255, 0.22), 0 0 16px var(--primary), 0 2px 6px rgba(0, 0, 0, 0.25)',
                            transform: 'translateY(-1px)',
                          }
                        : undefined
                    }
                  >
                    {formatBossTime(doneNow ? 0 : remaining)}
                  </TimeButton>
                );
              })}
            </SetPanel>
          );
        })}
      </Grid>
    </div>
  );
}