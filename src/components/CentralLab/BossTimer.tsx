import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { styled } from '@linaria/react';

import { BOSS_DURATIONS, DEFAULT_SET_NAMES, DEFAULT_SPEECH_MESSAGES } from '@/data/centralLab';
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

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
`;

const SpeechToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--border);
  background: transparent;
  color: var(--text);
  transition: all 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
  }
`;

const SettingsPanel = styled.div`
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  background: var(--quaternary);
  margin-bottom: 0.8rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SetSettingsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StageRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StageLabel = styled.label`
  font-size: 1.25rem;
  color: var(--text);
  opacity: 0.75;
`;

const SpeechField = styled(NameInput)`
  flex: 1;
  min-width: 0;
  font-size: 1.25rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.65);
    box-shadow: 0 0 6px var(--primary), 0 0 18px rgba(255, 255, 255, 0.22), 0 0 16px var(--primary), 0 2px 6px rgba(0, 0, 0, 0.25);
  }
`;

const SpeechFieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const TestBtn = styled.button`
  flex: 0 0 auto;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  background: transparent;
  color: var(--text);
  transition: all 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 8px var(--primary);
  }
`;

const TimeButton = styled.button`
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
`;

function formatBossTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function BossTimer() {
  const { isNotificationSoundEnabled } = useSettings();
  const intl = useIntl();
  const [setNames, setSetNames] = usePersistedState<string[]>(
    'centralLabSetNames',
    DEFAULT_SET_NAMES
  );
  const [speechEnabled, setSpeechEnabled] = usePersistedState<boolean>(
    'centralLabSpeechEnabled',
    true
  );
  const [speechMessages, setSpeechMessages] = usePersistedState<string[][]>(
    'centralLabSpeechMessages',
    DEFAULT_SPEECH_MESSAGES
  );
  const [sets, setSets] = useState<TTimer[][]>([makeSet(), makeSet(), makeSet()]);
  const [now, setNow] = useState(Date.now());
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [speechSettingsOpen, setSpeechSettingsOpen] = useState(false);
  const [hoveredTimer, setHoveredTimer] = useState<string | null>(null);
  const setNamesRef = useRef(setNames);
  setNamesRef.current = setNames;
  const speechEnabledRef = useRef(speechEnabled);
  speechEnabledRef.current = speechEnabled;
  const speechMessagesRef = useRef(speechMessages);
  speechMessagesRef.current = speechMessages;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handler = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      return () =>
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
    }
    return undefined;
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
          notify(name, si, ti);
        }
      });
    }
    if (changed) setSets(copy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets]);

  const defaultStageSpeech = (ti: number) =>
    intl.formatMessage(
      { id: 'cl_speech_default' },
      { stage: ti + 1, time: formatBossTime(BOSS_DURATIONS[ti]) }
    );

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const thVoice = voices.find((v) => v.lang.toLowerCase().startsWith('th'));
      if (thVoice) {
        const synth = window.speechSynthesis;
        const u = new SpeechSynthesisUtterance(text);
        u.voice = thVoice;
        u.lang = thVoice.lang;
        synth.cancel();
        synth.speak(u);
        return;
      }
    }
    const audio = new Audio(
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(
        text
      )}`
    );
    audio.play().catch(() => undefined);
  };

  const notify = (setName: string, si: number, ti: number) => {
    if (isNotificationSoundEnabled) {
      const audio = new Audio('notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => undefined);
    }
    const title = `✅ ${setName}`;
    const body = `Stage ${ti + 1} (${formatBossTime(BOSS_DURATIONS[ti])})`;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    if (speechEnabledRef.current) {
      const custom =
        speechMessagesRef.current &&
        speechMessagesRef.current[si] &&
        speechMessagesRef.current[si][ti];
      const text = (custom && custom.trim()) || defaultStageSpeech(ti);
      speakText(text);
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

  const getMessage = (si: number, ti: number) =>
    speechMessages && Array.isArray(speechMessages[si]) && speechMessages[si][ti]
      ? speechMessages[si][ti]
      : '';

  const effectiveMessage = (si: number, ti: number) => {
    const custom = getMessage(si, ti);
    return (custom && custom.trim()) || DEFAULT_SPEECH_MESSAGES[si][ti];
  };

  const updateMessage = (si: number, ti: number, msg: string) => {
    setSpeechMessages((prev) => {
      const base =
        Array.isArray(prev) && Array.isArray(prev[0]) ? prev : DEFAULT_SPEECH_MESSAGES;
      const next = base.map((s) => [...s]);
      next[si][ti] = msg;
      return next;
    });
  };

  const speechLabel = (ti: number) =>
    intl.formatMessage(
      { id: 'cl_speech_default' },
      { stage: ti + 1, time: formatBossTime(BOSS_DURATIONS[ti]) }
    );

  return (
    <div>
      <Toolbar>
        <SpeechToggle onClick={() => setSpeechEnabled(!speechEnabled)}>
          {speechEnabled ? '🔊' : '🔇'}{' '}
          <FormattedMessage id='cl_speech' /> (
          <FormattedMessage id={speechEnabled ? 'cl_speech_on' : 'cl_speech_off'} />)
        </SpeechToggle>
        <SpeechToggle onClick={() => setSpeechSettingsOpen(!speechSettingsOpen)}>
          ⚙️ <FormattedMessage id='cl_speech_settings' />
        </SpeechToggle>
      </Toolbar>
      {speechSettingsOpen && (
        <SettingsPanel>
          {[0, 1, 2].map((si) => {
            const name = (setNames && setNames[si]) || DEFAULT_SET_NAMES[si];
            return (
              <SetSettingsCol key={si}>
                <StageLabel style={{ fontWeight: 700, opacity: 0.9 }}>
                  {name}
                </StageLabel>
                {BOSS_DURATIONS.map((_, ti) => (
                  <StageRow key={ti}>
                    <StageLabel htmlFor={`cl-speech-${si}-${ti}`}>
                      {speechLabel(ti)}
                    </StageLabel>
                    <SpeechFieldRow>
                      <SpeechField
                        id={`cl-speech-${si}-${ti}`}
                        name={`cl-speech-${si}-${ti}`}
                        value={effectiveMessage(si, ti)}
                        placeholder={intl.formatMessage({ id: 'cl_speech_placeholder' })}
                        maxLength={80}
                        onChange={(e) => updateMessage(si, ti, e.target.value)}
                      />
                      <TestBtn
                        type='button'
                        title={intl.formatMessage({ id: 'cl_speech_test' })}
                        onClick={() => speakText(effectiveMessage(si, ti))}
                      >
                        🔊
                      </TestBtn>
                    </SpeechFieldRow>
                  </StageRow>
                ))}
              </SetSettingsCol>
            );
          })}
        </SettingsPanel>
      )}
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
                    name={`cl-set-name-${si}`}
                    aria-label={`Rename set ${si + 1}`}
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
                const stateStyle =
                  state === 'running'
                    ? {
                        color: '#ffb74d',
                        borderColor: 'var(--primary)',
                        background: 'rgba(255, 183, 77, 0.1)',
                      }
                    : state === 'done'
                    ? {
                        color: '#4caf50',
                        borderColor: '#4caf50',
                        background: 'rgba(76, 175, 80, 0.1)',
                      }
                    : undefined;
                const isHovered = hoveredTimer === `${si}-${ti}`;
                return (
                  <TimeButton
                    key={ti}
                    onClick={() => startTimer(si, ti)}
                    onMouseEnter={() => setHoveredTimer(`${si}-${ti}`)}
                    onMouseLeave={() => setHoveredTimer(null)}
                    style={{
                      ...(stateStyle || {}),
                      ...(isHovered
                        ? {
                            borderColor: 'rgba(255, 255, 255, 0.65)',
                            boxShadow:
                              '0 0 6px var(--primary), 0 0 18px rgba(255, 255, 255, 0.22), 0 0 16px var(--primary), 0 2px 6px rgba(0, 0, 0, 0.25)',
                            transform: 'translateY(-1px)',
                          }
                        : {}),
                    }}
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