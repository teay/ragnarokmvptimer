import { useCallback, useState, useEffect, useRef } from 'react';
import { Download, Upload, LogOut } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';
import { ModalConfirm } from '../ModalConfirm';
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

  const { originalAllMvps, activeMvps } = useMvpsContext();

  const [partyNameInput, setPartyNameInput] = useState(currentPartyRoom || '');
  const [nicknameInput, setNicknameInput] = useState(nickname || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [rememberNickname, setRememberNickname] = usePersistedState(
    'rememberNickname',
    true
  );

  const [copyPartyInput, setCopyPartyInput] = useState('');
  const [confirmCopyTarget, setConfirmCopyTarget] = useState<string | null>(null);
  const [pendingImportData, setPendingImportData] = useState<any[] | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [partyHistory, setPartyHistory] = usePersistedState<string[]>(
    'partyHistory',
    []
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const recordPartyName = useCallback(
    (name: string) => {
      const clean = name.trim().toUpperCase();
      if (!clean) return;
      setPartyHistory((prev) =>
        [clean, ...prev.filter((n) => n !== clean)].slice(0, 30)
      );
    },
    [setPartyHistory]
  );

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
        e.target.value = '';
        return;
      }

      setPendingImportData(importData);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Check console for details.');
      e.target.value = '';
    }
  };

  const executeImport = useCallback(async () => {
    if (!pendingImportData) return;
    setIsProcessing(true);
    setPendingImportData(null);

    try {
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
      for (const imported of pendingImportData) {
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
      setResultMessage(`Imported ${pendingImportData.length} record(s) successfully!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      setResultMessage('Import failed. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  }, [pendingImportData, currentPartyRoom, nickname, server]);

  const modalClickEnabled = !confirmCopyTarget && !pendingImportData && !resultMessage;
  const modalRef = useClickOutside(onClose, modalClickEnabled);

  const handleSaveNickname = () => {
    if (!nicknameInput.trim()) return;
    if (rememberNickname) {
      changeNickname(nicknameInput.trim());
    }
  };

  const handlePartyJoin = () => {
    if (!partyNameInput.trim()) return;
    recordPartyName(partyNameInput);
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

  const handleCopyToParty = () => {
    const targetParty = copyPartyInput.trim().toUpperCase();
    if (!targetParty) return;
    recordPartyName(targetParty);
    setConfirmCopyTarget(targetParty);
  };

  const executeCopy = useCallback(async () => {
    const targetParty = confirmCopyTarget;
    if (!targetParty) return;
    setConfirmCopyTarget(null);
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
      setResultMessage(`คัดลอก ${sourceArray.length} MVPs ไปยัง Party: ${targetParty} สำเร็จ!`);
    } catch (error) {
      console.error('[executeCopy] Copy failed:', error);
      setResultMessage('คัดลอกล้มเหลว');
    } finally {
      setIsProcessing(false);
    }
  }, [confirmCopyTarget, currentPartyRoom, nickname, server]);

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
              padding: '10px',
              background: currentPartyRoom
                ? 'rgba(33, 150, 243, 0.2)'
                : 'rgba(76, 175, 80, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
              color: currentPartyRoom ? '#2196F3' : '#4CAF50',
              fontSize: '1.6rem',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            {currentPartyRoom
              ? `👥 Party: ${currentPartyRoom}`
              : '👤 Solo Mode'}
          </div>

          {/* Nickname */}
          <div style={{ width: '100%', marginBottom: '10px' }}>
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
                  fontSize: '1.6rem',
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
          <div style={{ width: '100%', marginBottom: '10px' }}>
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
                list='party-name-history'
                autoComplete='off'
              />
            </InputWrapper>
            <button
              onClick={handlePartyJoin}
              disabled={!partyNameInput.trim()}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '8px',
                fontSize: '1.6rem',
                borderRadius: '6px',
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
                  marginTop: '6px',
                  padding: '8px',
                  fontSize: '1.6rem',
                  borderRadius: '6px',
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '1.6rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={handleImport}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '1.6rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Upload size={14} /> Import
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
          <div style={{ width: '100%' }}>
            <SettingName>คัดลอกไปยัง Party</SettingName>
            <InputWrapper>
              <Input
                id='copy-party-name'
                name='copy-party-name'
                placeholder='ชื่อ Party ปลายทาง'
                value={copyPartyInput}
                onChange={(e) => setCopyPartyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
                list='party-name-history'
                autoComplete='off'
              />
            </InputWrapper>
            <button
              onClick={handleCopyToParty}
              disabled={!copyPartyInput.trim() || isProcessing || activeMvps.length === 0}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '8px',
                fontSize: '1.6rem',
                borderRadius: '6px',
                border: 'none',
                background: copyPartyInput.trim() && !isProcessing && activeMvps.length > 0 ? '#FF9800' : '#555',
                color: copyPartyInput.trim() && !isProcessing && activeMvps.length > 0 ? '#fff' : '#888',
                cursor: copyPartyInput.trim() && !isProcessing && activeMvps.length > 0 ? 'pointer' : 'default',
              }}
            >
              {isProcessing
                ? 'กำลังคัดลอก...'
                : activeMvps.length === 0
                  ? '⚠️ ยังไม่ได้บันทึกเวลาบอส'
                  : '📋 คัดลอกไป Party'}
            </button>
          </div>

          {/* Party name suggestions */}
          <datalist id='party-name-history'>
            {partyHistory.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          {/* Logout */}
          {confirmLogout ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ textAlign: 'center', color: '#f44336', fontSize: '1.6rem' }}>
                ต้องการออกจากระบบจริงหรือไม่?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '1.6rem',
                    background: 'rgba(244, 67, 54, 0.3)',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
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
                    padding: '8px',
                    fontSize: '1.6rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
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
                padding: '8px',
                fontSize: '1.6rem',
                background: 'rgba(244, 67, 54, 0.2)',
                border: '1px solid #f44336',
                borderRadius: '6px',
                color: '#f44336',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={14} /> ออกจากระบบ
            </button>
          )}
        </SettingsContainer>

        {pendingImportData && (
          <ModalConfirm
            title="Import MVPs"
            description={`Import ${pendingImportData.length} MVP record(s) to ${currentPartyRoom ? `Party: ${currentPartyRoom}` : (nickname ? `Solo: ${nickname}` : 'current mode')}?\n\nExisting records with the same MVP + map will be overwritten.`}
            confirmText="ยืนยัน"
            onConfirm={executeImport}
            onCancel={() => {
              setPendingImportData(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
        )}

        {confirmCopyTarget && (
          <ModalConfirm
            title="คัดลอกไปยัง Party"
            description={`คัดลอก MVPs จาก ${currentPartyRoom ? `Party: ${currentPartyRoom}` : `Solo: ${nickname}`} ไปยัง Party: ${confirmCopyTarget}?\n\nข้อมูลเดิมของ Party ${confirmCopyTarget} จะถูกบันทึกไว้ (merge ด้วย id + deathMap)`}
            confirmText="ยืนยัน"
            onConfirm={executeCopy}
            onCancel={() => {
              setConfirmCopyTarget(null);
            }}
          />
        )}

        {resultMessage && (
          <ModalConfirm
            title="ผลลัพธ์"
            description={resultMessage}
            confirmText="ตกลง"
            hideCancel
            onConfirm={() => {
              setResultMessage(null);
              onClose();
            }}
          />
        )}
      </Modal>
    </ModalBase>
  );
}
