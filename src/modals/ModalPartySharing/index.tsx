import { useCallback, useState, useEffect, useRef } from 'react';
import { Download, Upload, LogOut } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { database, ref, get } from '@/services/firebase';
import {
  useScrollBlock,
  useClickOutside,
  useKey,
  usePersistedState,
} from '@/hooks';

import {
  Modal,
  Title,
  SettingsContainer,
  SettingName,
  ActionButton,
  Input,
  InputWrapper,
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
    server,
  } = useSettings();

  const { originalAllMvps } = useMvpsContext();

  const [partyNameInput, setPartyNameInput] = useState(currentPartyRoom || '');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const [rememberNickname, setRememberNickname] = usePersistedState(
    'rememberNickname',
    true
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNicknameInput(nickname || '');
    setPartyNameInput(currentPartyRoom || '');
  }, [nickname, currentPartyRoom]);

  const handleExport = useCallback(async () => {
    try {
      let path: string;
      if (currentPartyRoom) {
        path = `hunting/party/${currentPartyRoom}/${server}/mvps`;
      } else if (nickname) {
        path = `hunting/solo/${nickname}/${server}/mvps`;
      } else {
        alert('No data to export. Please set nickname first.');
        return;
      }

      const mvpsRef = ref(database, path);
      const snapshot = await get(mvpsRef);
      const data = snapshot.val();

      if (!data) {
        alert('No MVP data to export.');
        return;
      }

      const exportData = Object.values(data).map((mvp: any) => {
        const bossInfo = originalAllMvps.find((m) => m.id === mvp.id);
        return {
          ...mvp,
          name: bossInfo?.name || `Unknown (${mvp.id})`,
        };
      });

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mvp-timer-${server}-${nickname || 'solo'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    }
  }, [currentPartyRoom, nickname, server, originalAllMvps]);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      alert(`Import ${data.length} records (mock - not implemented)`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Check console for details.');
    }
    e.target.value = '';
  };

  const modalRef = useClickOutside(onClose);

  const handleSaveNickname = () => {
    if (!nicknameInput.trim()) return;
    if (rememberNickname) {
      changeNickname(nicknameInput.trim());
    }
  };

  const handlePartyJoin = () => {
    if (!partyNameInput.trim()) return;
    changePartyRoom(partyNameInput.trim().toUpperCase());
    setPartyNameInput('');
    onClose();
  };

  const handlePartyLeave = () => {
    changePartyRoom(null);
    onClose();
  };

  const handleLogout = () => {
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
      changeNickname('');
      changePartyRoom(null);
      onClose();
    }
  };

  return (
    <ModalBase>
      <Modal ref={modalRef}>
        <ModalCloseIconButton onClick={onClose} />
        <Title>ตั้งค่า</Title>
        <SettingsContainer>
          {/* Current Status */}
          <div
            style={{
              width: '100%',
              padding: '20px',
              background: currentPartyRoom
                ? 'rgba(33, 150, 243, 0.2)'
                : 'rgba(76, 175, 80, 0.2)',
              borderRadius: '10px',
              textAlign: 'center',
              color: currentPartyRoom ? '#2196F3' : '#4CAF50',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '20px',
            }}
          >
            {currentPartyRoom
              ? `👥 Party: ${currentPartyRoom}`
              : '👤 Solo Mode'}
          </div>

          {/* Nickname */}
          <div style={{ width: '100%', marginBottom: '15px' }}>
            <SettingName>ชื่อของคุณ</SettingName>
            <InputWrapper>
              <Input
                placeholder='e.g. BOY'
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value.toUpperCase())}
                maxLength={12}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#aaa',
                }}
              >
                <input
                  type='checkbox'
                  checked={rememberNickname}
                  onChange={(e) => setRememberNickname(e.target.checked)}
                />
                จำ
              </label>
            </InputWrapper>
          </div>

          {/* Party Name */}
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <SettingName>ชื่อ Party</SettingName>
            <InputWrapper>
              <Input
                placeholder='ใส่ชื่อ Party เพื่อเข้าร่วม'
                value={partyNameInput}
                onChange={(e) =>
                  setPartyNameInput(e.target.value.toUpperCase())
                }
                maxLength={20}
              />
            </InputWrapper>
            <button
              onClick={handlePartyJoin}
              disabled={!partyNameInput.trim()}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                fontSize: '1rem',
                borderRadius: '8px',
                border: 'none',
                background: partyNameInput.trim() ? '#2196F3' : '#555',
                color: '#fff',
                cursor: partyNameInput.trim() ? 'pointer' : 'default',
              }}
            >
              🎮 เข้า Party
            </button>
            {currentPartyRoom && (
              <button
                onClick={handlePartyLeave}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '12px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #f44336',
                  background: 'transparent',
                  color: '#f44336',
                  cursor: 'pointer',
                }}
              >
                🚪 ออกจาก Party
              </button>
            )}
          </div>

          {/* Export / Import */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Download size={16} /> Export
            </button>
            <button
              onClick={handleImport}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Upload size={16} /> Import
            </button>
            <input
              type='file'
              accept='.json'
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid #f44336',
              borderRadius: '8px',
              color: '#f44336',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
