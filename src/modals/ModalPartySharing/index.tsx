import { useCallback, useState, useEffect, useRef } from 'react';
import { Download, Upload, LogOut } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { useSettings } from '@/contexts/SettingsContext';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { getFirebase } from '@/services/firebaseLazy';
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
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [rememberNickname, setRememberNickname] = usePersistedState(
    'rememberNickname',
    true
  );

  const [copyPartyInput, setCopyPartyInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNicknameInput(nickname || '');
    setPartyNameInput(currentPartyRoom || '');
  }, [nickname, currentPartyRoom]);

  const handleExport = useCallback(async () => {
    try {
      const { database, ref, get } = await getFirebase();
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

      const exportData = Object.values(data as Record<string, IMvp>).map((mvp: IMvp) => {
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
      const importData = JSON.parse(text);

      if (!Array.isArray(importData) || importData.length === 0) {
        alert('Invalid or empty data file.');
        return;
      }

      if (!window.confirm(
        `Import ${importData.length} MVP record(s) to ${currentPartyRoom ? `Party: ${currentPartyRoom}` : (nickname ? `Solo: ${nickname}` : 'current mode')}?\n\nExisting records with the same MVP + map will be overwritten.`
      )) return;

      setIsProcessing(true);

      const { database, ref, get, set } = await getFirebase();
      let path: string;
      if (currentPartyRoom) {
        path = `hunting/party/${currentPartyRoom}/${server}/mvps`;
      } else if (nickname) {
        path = `hunting/solo/${nickname}/${server}/mvps`;
      } else {
        alert('No active party or nickname. Cannot import.');
        return;
      }

      const mvpsRef = ref(database, path);
      const snapshot = await get(mvpsRef);
      const existingData = snapshot.val();
      let existingArray: Record<string, unknown>[] = [];

      if (existingData) {
        existingArray = Object.values(existingData) as Record<string, unknown>[];
      }

      const mergedArray = [...existingArray];
      for (const imported of importData) {
        const idx = mergedArray.findIndex(
          (m: Record<string, unknown>) => m.id === imported.id && m.deathMap === imported.deathMap
        );
        if (idx >= 0) {
          mergedArray[idx] = imported;
        } else {
          mergedArray.push(imported);
        }
      }

      await set(mvpsRef, mergedArray);
      alert(`Imported ${importData.length} record(s) successfully!`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Check console for details.');
    } finally {
      setIsProcessing(false);
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
    localStorage.removeItem('settings');
    localStorage.removeItem('joinState');
    localStorage.removeItem('joinRoomId');
    localStorage.removeItem('joinServer');
    localStorage.removeItem('joinNickname');
    window.location.reload();
  };

  const handleCopyToParty = useCallback(async () => {
    const targetParty = copyPartyInput.trim().toUpperCase();
    if (!targetParty) return;

    if (!window.confirm(
      `คัดลอก MVPs จาก ${currentPartyRoom ? `Party: ${currentPartyRoom}` : `Solo: ${nickname}`} ไปยัง Party: ${targetParty}?\n\nข้อมูลเดิมของ Party ${targetParty} จะถูกบันทึกไว้ (merge ด้วย id + deathMap)`
    )) return;

    setIsProcessing(true);
    try {
      const { database, ref, get, set } = await getFirebase();

      let sourcePath: string;
      if (currentPartyRoom) {
        sourcePath = `hunting/party/${currentPartyRoom}/${server}/mvps`;
      } else if (nickname) {
        sourcePath = `hunting/solo/${nickname}/${server}/mvps`;
      } else {
        alert('ไม่มีข้อมูลต้นทาง');
        return;
      }

      const sourceRef = ref(database, sourcePath);
      const snapshot = await get(sourceRef);
      const sourceData = snapshot.val();

      if (!sourceData) {
        alert('ไม่มีข้อมูล MVPs ที่จะคัดลอก');
        return;
      }

      const sourceArray = Object.values(sourceData as Record<string, unknown>[]);

      const targetPath = `hunting/party/${targetParty}/${server}/mvps`;
      const targetRef = ref(database, targetPath);
      const targetSnapshot = await get(targetRef);
      const targetData = targetSnapshot.val();

      let targetArray: Record<string, unknown>[] = [];
      if (targetData) {
        targetArray = Object.values(targetData) as Record<string, unknown>[];
      }

      const mergedArray = [...targetArray];
      for (const item of sourceArray) {
        const idx = mergedArray.findIndex(
          (m: Record<string, unknown>) => m.id === (item as Record<string, unknown>).id && m.deathMap === (item as Record<string, unknown>).deathMap
        );
        if (idx >= 0) {
          mergedArray[idx] = item;
        } else {
          mergedArray.push(item);
        }
      }

      await set(targetRef, mergedArray);
      alert(`คัดลอก ${sourceArray.length} MVPs ไปยัง Party: ${targetParty} สำเร็จ!`);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('คัดลอกล้มเหลว');
    } finally {
      setIsProcessing(false);
    }
  }, [copyPartyInput, currentPartyRoom, nickname, server]);

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
              fontSize: '2.4rem',
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
                id='nickname'
                name='nickname'
                placeholder='e.g. BOY'
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={12}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#aaa',
                  fontSize: '2.4rem',
                }}
              >
                <input
                  type='checkbox'
                  id='remember-nickname'
                  name='remember-nickname'
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
                id='party-name'
                name='party-name'
                placeholder='ใส่ชื่อ Party เพื่อเข้าร่วม'
                value={partyNameInput}
                onChange={(e) =>
                  setPartyNameInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
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
                fontSize: '2.4rem',
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
                  fontSize: '2.4rem',
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '2.4rem',
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
                fontSize: '2.4rem',
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
              id='import-data'
              name='import-data'
              accept='.json'
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Copy to Party */}
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <SettingName>คัดลอกไปยัง Party</SettingName>
            <InputWrapper>
              <Input
                id='copy-party-name'
                name='copy-party-name'
                placeholder='ชื่อ Party ปลายทาง'
                value={copyPartyInput}
                onChange={(e) => setCopyPartyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
              />
            </InputWrapper>
            <button
              onClick={handleCopyToParty}
              disabled={!copyPartyInput.trim() || isProcessing}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                fontSize: '2.4rem',
                borderRadius: '8px',
                border: 'none',
                background: copyPartyInput.trim() && !isProcessing ? '#FF9800' : '#555',
                color: '#fff',
                cursor: copyPartyInput.trim() && !isProcessing ? 'pointer' : 'default',
              }}
            >
              {isProcessing ? 'กำลังคัดลอก...' : '📋 คัดลอกไป Party'}
            </button>
          </div>

          {/* Logout */}
          {confirmLogout ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ textAlign: 'center', color: '#f44336', fontSize: '2.4rem', marginBottom: '5px' }}>
                ต้องการออกจากระบบจริงหรือไม่?
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '2.4rem',
                    background: 'rgba(244, 67, 54, 0.3)',
                    border: '1px solid #f44336',
                    borderRadius: '8px',
                    color: '#f44336',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ออกจากระบบ
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '2.4rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#aaa',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '2.4rem',
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
          )}
        </SettingsContainer>
      </Modal>
    </ModalBase>
  );
}
