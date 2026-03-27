import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { usePersistedState } from '../../hooks/usePersistedState';
import { Header } from '../Header';
import { Main } from '../../pages/Main';
import { Footer } from '../Footer';
import { WarningHeader } from '../WarningHeader';
import { messages } from '../../locales/messages';
import { IntlProvider } from 'react-intl';

export function WelcomeScreen() {
  const {
    changeNickname,
    changePartyRoom,
    server,
    nickname,
    partyRoom,
    language,
    hideActiveContent,
  } = useSettings();

  // Check for setup param in URL
  const [urlParams] = useState(
    () => new URLSearchParams(window.location.search)
  );
  const shouldSetup = urlParams.get('setup') === 'true';

  const [showModeSelect, setShowModeSelect] = useState(
    shouldSetup || !nickname
  );
  const [mode, setMode] = useState<'solo' | 'party' | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [partyInput, setPartyInput] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [partyError, setPartyError] = useState('');

  const [rememberNickname, setRememberNickname] = usePersistedState(
    'rememberNickname',
    true
  );
  const [rememberParty, setRememberParty] = usePersistedState(
    'rememberParty',
    true
  );

  const handleLogout = () => {
    changeNickname('');
    changePartyRoom(null);
    setMode(null);
    setShowModeSelect(true);
  };

  const handleStart = () => {
    if (!nicknameInput.trim()) {
      setNicknameError('Please enter your nickname');
      return;
    }
    setNicknameError('');

    if (mode === 'party' && !partyInput.trim()) {
      setPartyError('Please enter party name');
      return;
    }
    setPartyError('');

    changeNickname(nicknameInput.trim().toUpperCase());
    if (mode === 'party' && rememberParty) {
      changePartyRoom(partyInput.trim().toUpperCase());
    }
    setShowModeSelect(false);
    setMode(null);
  };

  // If not showing welcome/selection screen, show Main app
  if (!showModeSelect && nickname) {
    return (
      <IntlProvider
        messages={messages[language]}
        locale={language}
        defaultLocale='en'
      >
        {!hideActiveContent && (
          <>
            <Header />
            <Main />
            <Footer />
            <WarningHeader text={messages[language]['under_development']} />
          </>
        )}
      </IntlProvider>
    );
  }

  // If user already has nickname, show current mode with switch option
  if (nickname) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            marginBottom: '20px',
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          Ragnarok MVP Timer
        </h1>
        <p
          style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#4CAF50' }}
        >
          ✅ กรอกชื่อแล้ว
        </p>
        <p style={{ fontSize: '2rem', marginBottom: '30px', color: '#aaa' }}>
          กำลังเล่นในโหมด
        </p>

        <div
          style={{
            padding: '40px 80px',
            fontSize: '2.5rem',
            borderRadius: '25px',
            border: `4px solid ${partyRoom ? '#2196F3' : '#4CAF50'}`,
            background: partyRoom
              ? 'rgba(33, 150, 243, 0.15)'
              : 'rgba(76, 175, 80, 0.15)',
            color: partyRoom ? '#2196F3' : '#4CAF50',
            marginBottom: '30px',
          }}
        >
          {partyRoom ? '👥 Party' : '👤 Solo'}
        </div>

        <p style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff' }}>
          {partyRoom ? `ห้อง: ${partyRoom}` : ''}
        </p>
        <p style={{ fontSize: '1.5rem', marginBottom: '40px', color: '#fff' }}>
          ชื่อ: {nickname}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '25px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setShowModeSelect(true)}
            style={{
              padding: '25px 40px',
              fontSize: '1.6rem',
              borderRadius: '20px',
              border: '3px solid #FF9800',
              background: 'rgba(255, 152, 0, 0.15)',
              color: '#FF9800',
              cursor: 'pointer',
            }}
          >
            🔄 เปลี่ยน Mode
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '25px 40px',
              fontSize: '1.6rem',
              borderRadius: '20px',
              border: '3px solid #f44336',
              background: 'rgba(244, 67, 54, 0.15)',
              color: '#f44336',
              cursor: 'pointer',
            }}
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  // New user - show solo/party selection
  if (!mode) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '5rem',
            marginBottom: '20px',
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          <p
            style={{ fontSize: '2rem', marginBottom: '10px', color: '#f44336' }}
          >
            ⚠️ ยังไม่ได้กรอกชื่อ
          </p>
          Ragnarok MVP Timer
        </h1>
        <p style={{ fontSize: '2.2rem', marginBottom: '80px', color: '#aaa' }}>
          เลือกโหมดการเล่น
        </p>

        <div
          style={{
            display: 'flex',
            gap: '40px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setMode('solo')}
            style={{
              padding: '60px 100px',
              fontSize: '3rem',
              borderRadius: '25px',
              border: '4px solid #4CAF50',
              background: 'rgba(76, 175, 80, 0.15)',
              color: '#4CAF50',
              cursor: 'pointer',
              transition: 'all 0.3s',
              minWidth: '400px',
              fontWeight: 'bold',
            }}
          >
            👤 Solo
            <p style={{ fontSize: '1.6rem', marginTop: '20px', opacity: 0.9 }}>
              เล่นคนเดียว
            </p>
          </button>

          <button
            onClick={() => setMode('party')}
            style={{
              padding: '60px 100px',
              fontSize: '3rem',
              borderRadius: '25px',
              border: '4px solid #2196F3',
              background: 'rgba(33, 150, 243, 0.15)',
              color: '#2196F3',
              cursor: 'pointer',
              transition: 'all 0.3s',
              minWidth: '400px',
              fontWeight: 'bold',
            }}
          >
            👥 Party
            <p style={{ fontSize: '1.6rem', marginTop: '20px', opacity: 0.9 }}>
              เล่นกับเพื่อน
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: '4rem',
          marginBottom: '50px',
          color: '#fff',
          fontWeight: 'bold',
        }}
      >
        {mode === 'solo' ? '👤 Solo Mode' : '👥 Party Mode'}
      </h2>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '15px',
              color: '#fff',
              fontSize: '2rem',
            }}
          >
            1. Your Nickname (ใครเล่น?)
          </label>
          <input
            value={nicknameInput}
            onChange={(e) => {
              setNicknameInput(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              );
              setNicknameError('');
            }}
            placeholder='e.g. BOY, RO99'
            maxLength={12}
            style={{
              width: '100%',
              padding: '25px',
              fontSize: '2rem',
              borderRadius: '20px',
              border: nicknameError ? '4px solid #f44336' : '4px solid #555',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              outline: 'none',
            }}
          />
          {nicknameError && (
            <p
              style={{
                color: '#f44336',
                marginTop: '10px',
                fontSize: '1.4rem',
              }}
            >
              {nicknameError}
            </p>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '20px',
              color: '#aaa',
              fontSize: '1.5rem',
            }}
          >
            <input
              type='checkbox'
              checked={rememberNickname}
              onChange={(e) => setRememberNickname(e.target.checked)}
            />
            จำชื่อนี้ไว้
          </label>
        </div>

        {mode === 'party' && (
          <div style={{ marginBottom: '40px', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '15px',
                color: '#fff',
                fontSize: '2rem',
              }}
            >
              2. Party Name (ชื่อห้อง)
            </label>
            <input
              value={partyInput}
              onChange={(e) => {
                setPartyInput(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                );
                setPartyError('');
              }}
              placeholder='e.g. GUILD99'
              maxLength={20}
              style={{
                width: '100%',
                padding: '25px',
                fontSize: '2rem',
                borderRadius: '20px',
                border: partyError ? '4px solid #f44336' : '4px solid #555',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                outline: 'none',
              }}
            />
            {partyError && (
              <p
                style={{
                  color: '#f44336',
                  marginTop: '10px',
                  fontSize: '1.4rem',
                }}
              >
                {partyError}
              </p>
            )}
            <label
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                color: '#aaa',
                fontSize: '1.5rem',
              }}
            >
              <input
                type='checkbox'
                checked={rememberParty}
                onChange={(e) => setRememberParty(e.target.checked)}
              />
              จำชื่อห้องนี้ไว้
            </label>
          </div>
        )}

        <p
          style={{
            color: '#aaa',
            marginBottom: '40px',
            textAlign: 'left',
            fontSize: '1.5rem',
            lineHeight: '1.6',
          }}
        >
          {mode === 'solo'
            ? 'ข้อมูลการล่าบอสของคุณจะถูกบันทึกไว้เป็นส่วนตัวภายใต้ชื่อเล่น มีเพียงคุณเท่านั้นที่สามารถดูและแก้ไขข้อมูลนี้ได้'
            : 'ข้อมูลการล่าบอสจะถูกแชร์กับทุกคนในห้อง ทุกคนสามารถดูและแก้ไขได้'}
        </p>

        <div style={{ display: 'flex', gap: '25px' }}>
          <button
            onClick={() => setMode(null)}
            style={{
              flex: 1,
              padding: '25px 35px',
              fontSize: '1.6rem',
              borderRadius: '20px',
              border: 'none',
              background: '#555',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ย้อนกลับ
          </button>
          <button
            onClick={handleStart}
            style={{
              flex: 2,
              padding: '25px 35px',
              fontSize: '1.6rem',
              borderRadius: '20px',
              border: 'none',
              background: mode === 'solo' ? '#4CAF50' : '#2196F3',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {mode === 'solo' ? '🎮 Start Solo' : '🎮 Start Party'}
          </button>
        </div>
      </div>
    </div>
  );
}
