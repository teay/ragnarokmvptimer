import { useCallback, useState } from 'react';
import { RefreshCw, ZapOff, Play } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useScrollBlock, useClickOutside, useKey } from '@/hooks';

import {
  Modal,
  Title,
  SettingsContainer,
  SettingName,
  ActionButton,
  Input,
  InputWrapper,
  RandomButton,
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalPartySharing({ onClose }: Props) {
  useScrollBlock(true);
  useKey('Escape', onClose);

  const {
    partyRoom: currentPartyRoom,
    changePartyRoom,
    nickname,
    changeNickname,
  } = useSettings();

  const [mode, setMode] = useState<'solo' | 'party'>('party');
  const [partyNameInput, setPartyNameInput] = useState(currentPartyRoom || '');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [partyNameError, setPartyNameError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const modalRef = useClickOutside(onClose);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const trimmed = rawValue.slice(0, 12);
    setNicknameInput(trimmed);
    setNicknameError(trimmed === '' ? 'Nickname is required' : null);
  };

  const handleRandomNickname = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    setNicknameInput(result);
    setNicknameError(null);
  };

  const handleRandomPartyName = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    setPartyNameInput(result);
    setPartyNameError(null);
  };

  const validateForm = () => {
    const nickValid = nicknameInput.trim() !== '';
    setNicknameError(nickValid ? null : 'Nickname is required');
    if (mode === 'party') {
      const partyValid = partyNameInput.trim() !== '';
      setPartyNameError(partyValid ? null : 'Party name is required');
      return nickValid && partyValid;
    }
    return nickValid;
  };

  const handleConnect = useCallback(async () => {
    if (isProcessing) return;
    if (!validateForm()) return;
    setIsProcessing(true);

    changeNickname(nicknameInput.trim());

    if (mode === 'solo') {
      // Solo mode: use a special solo room ID derived from nickname
      changePartyRoom(`solo:${nicknameInput.trim()}`);
    } else {
      // Party mode: use "party:" prefix for clarity
      changePartyRoom(`party:${partyNameInput.trim().toUpperCase()}`);
    }

    setIsProcessing(false);
    onClose();
  }, [
    mode,
    nicknameInput,
    partyNameInput,
    changeNickname,
    changePartyRoom,
    isProcessing,
    onClose,
  ]);

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />
        <Title>Party Settings</Title>
        <SettingsContainer>
          {/* Nickname */}
          <div style={{ width: '100%' }}>
            <SettingName>1. Your Nickname (who is playing?)</SettingName>
            <InputWrapper>
              <Input
                placeholder='e.g. BOY, RO99'
                value={nicknameInput}
                onChange={handleNicknameChange}
                maxLength={12}
                style={
                  nicknameError && nicknameInput.length > 0
                    ? {
                        borderColor: '#d32f2f',
                        background: 'rgba(211, 47, 47, 0.05)',
                      }
                    : {}
                }
              />
              <RandomButton onClick={handleRandomNickname}>
                <RefreshCw />
              </RandomButton>
              {nicknameError && (
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#f44336',
                    marginTop: '-0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  {nicknameError}
                </p>
              )}
            </InputWrapper>
          </div>

          {/* Mode selection buttons */}
          <div
            style={{
              width: '100%',
              marginTop: '1.5rem',
              display: 'flex',
              gap: '1rem',
            }}
          >
            <ActionButton
              onClick={() => setMode('solo')}
              style={{
                flex: 1,
                background: mode === 'solo' ? '#388e3c' : '#555',
                color: 'white',
              }}
            >
              Solo (Me only)
            </ActionButton>
            <ActionButton
              onClick={() => setMode('party')}
              style={{
                flex: 1,
                background: mode === 'party' ? '#388e3c' : '#555',
                color: 'white',
              }}
            >
              Party (Play with friends)
            </ActionButton>
          </div>

          {/* Party Name input shown only in Party mode */}
          {mode === 'party' && (
            <div style={{ width: '100%', marginTop: '1.5rem' }}>
              <SettingName>2. Party Name</SettingName>
              <InputWrapper>
                <Input
                  placeholder='e.g. GUILD99 (blank for solo)'
                  value={partyNameInput}
                  onChange={(e) => {
                    const val = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '');
                    setPartyNameInput(val);
                    // basic validation: not empty
                    setPartyNameError(
                      val === '' ? 'Party name is required' : null
                    );
                  }}
                  maxLength={20}
                  style={
                    partyNameError && partyNameInput.length > 0
                      ? {
                          borderColor: '#d32f2f',
                          background: 'rgba(211, 47, 47, 0.05)',
                        }
                      : {}
                  }
                />
                <RandomButton onClick={handleRandomPartyName}>
                  <RefreshCw />
                </RandomButton>
                {partyNameError && (
                  <p
                    style={{
                      fontSize: '1.1rem',
                      color: '#f44336',
                      marginTop: '-0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {partyNameError}
                  </p>
                )}
              </InputWrapper>
            </div>
          )}

          {/* Explanations - Solo */}
          {mode === 'solo' && (
            <div
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }}
            >
              <p style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>
                Your MVP hunting data is saved privately under your nickname.
                <br />
                Only you can see and edit this data.
              </p>
              <p
                style={{
                  fontSize: '1.2rem',
                  color: '#fff',
                  marginTop: '0.5rem',
                  margin: 0,
                }}
              >
                ข้อมูลการล่าบอสของคุณจะถูกบันทึกไว้เป็นส่วนตัวภายใต้ชื่อเล่น
                <br />
                มีเพียงคุณเท่านั้นที่สามารถดูและแก้ไขข้อมูลนี้ได้
              </p>
            </div>
          )}

          {/* Explanations - Party */}
          {mode === 'party' && (
            <div
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }}
            >
              <p style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>
                Your MVP hunting data is shared with everyone in the Party.
                <br />
                The most recently updated data will be shown to everyone.
              </p>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: '#aaa',
                  marginTop: '0.5rem',
                  margin: 0,
                }}
              >
                *If two people kill the same boss at almost the same time,
                <br />
                whichever Internet is faster, that person will save the data.
              </p>
              <p
                style={{
                  fontSize: '1.2rem',
                  color: '#fff',
                  marginTop: '0.8rem',
                  margin: 0,
                }}
              >
                ข้อมูลการล่าบอสของคุณจะถูกแชร์กับทุกคนในปาร์ตี้
                <br />
                ข้อมูลที่อัปเดตล่าสุดจะแสดงให้ทุกคนเห็น
              </p>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: '#aaa',
                  marginTop: '0.5rem',
                  margin: 0,
                }}
              >
                *ถ้าสองคนฆ่าบอสตัวเดียวกันเกือบเวลาเดียวกัน
                <br />
                Internet คนไหนเร็วกว่า คนนั้นจะบันทึกข้อมูล
              </p>
            </div>
          )}

          {/* Main action button */}
          <ActionButton
            onClick={handleConnect}
            style={{
              width: '100%',
              marginTop: '2rem',
              background: '#388e3c',
              color: 'white',
            }}
          >
            {mode === 'solo' ? (
              <>
                <Play size={18} style={{ marginRight: '8px' }} /> Start Solo
              </>
            ) : (
              <>
                <Play size={18} style={{ marginRight: '8px' }} /> Join &amp;
                Sync!
              </>
            )}
          </ActionButton>

          {/* Leave Party button – only show when in an actual party (not solo) */}
          {mode === 'party' && currentPartyRoom && (
            <ActionButton
              onClick={() => {
                changePartyRoom(null);
                onClose();
              }}
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'transparent',
                border: '1px solid #d32f2f',
                color: '#d32f2f',
              }}
            >
              <ZapOff /> Leave Party
            </ActionButton>
          )}
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
