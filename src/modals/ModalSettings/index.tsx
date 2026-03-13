import { useState, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Trash, Copy, Download } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { Switch } from '../../components/Switch';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ModalWarning } from '../ModalWarning';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { useSettings } from '@/contexts/SettingsContext';
import { useScrollBlock, useClickOutside, useKey, useTheme } from '@/hooks';
import { clearData } from '@/utils';

import {
  Modal,
  Title,
  SettingsContainer,
  Setting,
  SettingName,
  SettingSecondary,
  ThemeContainer,
  ClearButton,
  FontButton,
  ParticleEffectButton,
  ThemeButton,
  ActionButton,
} from './styles';

type Props = {
  onClose: () => void;
};

export function ModalSettings({ onClose }: Props) {
  const { theme, toggleTheme } = useTheme();
  const intl = useIntl();
  const {
    respawnAsCountdown,
    toggleRespawnCountdown,
    hideActiveContent,
    toggleHideActiveContent,
    animatedSprites,
    toggleAnimatedSprites,
    use24HourFormat,
    toggle24HourFormat,
    isNotificationSoundEnabled,
    toggleNotificationSound,
    isGlassUIEnabled,
    toggleGlassUI,
    isAnimatedBackgroundEnabled,
    toggleAnimatedBackground,
    backgroundEffectMode,
    changeBackgroundEffectMode,
    particleDensity,
    changeParticleDensity,
    particleColor,
    changeParticleColor,
    particleOpacity,
    changeParticleOpacity,
    waveAmplitude,
    changeWaveAmplitude,
    waveColor,
    changeWaveColor,
    waveOpacity,
    changeWaveOpacity,
    isMainContentTransparent,
    toggleMainContentTransparency,
    particleEffect,
    changeParticleEffect,
    font,
    changeFont,
    isSparkleEffectEnabled,
    toggleSparkleEffect,
    sparkleDensity,
    changeSparkleDensity,
    animatedBackgroundColor,
    changeAnimatedBackgroundColor,
    animatedBackgroundOpacity,
    changeAnimatedBackgroundOpacity,
    resetColorsToThemeDefaults,
    isFallingElementsEnabled = false,
    toggleFallingElements,
    waveTrailColor, // ตรวจสอบให้แน่ใจว่าได้ดึงตัวแปรนี้มาอย่างถูกต้อง
    changeWaveTrailColor,
    waveTrailOpacity, // ตรวจสอบให้แนใจว่าได้ดึงตัวแปรนี้มาอย่างถูกต้อง
    changeWaveTrailOpacity,
    showMvpMap,
    toggleShowMvpMap,
    simpleGlassUI,
    toggleSimpleGlassUI,
    ultraLite,
    toggleUltraLite,
  } = useSettings();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    resetColorsToThemeDefaults(theme);
  }, [theme, resetColorsToThemeDefaults]);

  useScrollBlock(true);
  useKey('Escape', onClose);

  const modalRef = useClickOutside(
    !isConfirmationModalOpen ? onClose : () => null
  );

  const confirmationTitle = intl.formatMessage({ id: 'clear_data_message' });
  const confirmationDescription = intl.formatMessage({ id: 'clear_data_description' });

  const handleExportData = useCallback(() => {
    const activeMvps = localStorage.getItem('activeMvps');
    if (activeMvps) {
      navigator.clipboard.writeText(activeMvps);
      alert('Data copied to clipboard!');
    } else {
      alert('No active MVP data found.');
    }
  }, []);

  const handleImportData = useCallback(() => {
    const data = prompt('Paste your MVP JSON data here:');
    if (data) {
      try {
        JSON.parse(data); // Validate JSON
        localStorage.setItem('activeMvps', data);
        window.location.reload();
      } catch (e) {
        alert('Invalid JSON data!');
      }
    }
  }, []);

  function handleClearData() {
    clearData();
    setIsConfirmationModalOpen(false);
    window.location.reload();
  }

  const getThemeName = () => {
    if (theme === 'darkest') return intl.formatMessage({ id: 'theme_darkest' });
    if (theme === 'dark') return intl.formatMessage({ id: 'theme_dark' });
    if (theme === 'light') return intl.formatMessage({ id: 'theme_light' });
    return '';
  };

  return (
    <>
      <ModalBase>
        <Modal ref={modalRef}>
          <ModalCloseIconButton onClick={onClose} />

          <Title>
            <FormattedMessage id='settings' />
          </Title>

          <SettingsContainer>
            <Setting>
              <SettingName>
                <FormattedMessage id='ultra_lite' defaultMessage='Ultra Lite Mode (Extreme Performance)' />
              </SettingName>

              <Switch
                id="ultraLite"
                name="ultraLite"
                onChange={toggleUltraLite}
                checked={ultraLite}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='simple_glass_ui' defaultMessage='Simple Glass UI (Best Performance)' />
              </SettingName>

              <Switch
                id="simpleGlassUI"
                name="simpleGlassUI"
                onChange={toggleSimpleGlassUI}
                checked={simpleGlassUI}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='hide_active_content' defaultMessage='Hide Active Content' />
              </SettingName>

              <Switch
                id="hideActiveContent"
                name="hideActiveContent"
                onChange={toggleHideActiveContent}
                checked={hideActiveContent}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='theme_label' />
              </SettingName>

              <ThemeContainer>
                <ThemeButton onClick={toggleTheme}>
                  {getThemeName()}
                </ThemeButton>
              </ThemeContainer>
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='respawn_as_countdown' />
              </SettingName>

              <Switch
                id="respawnAsCountdown"
                name="respawnAsCountdown"
                onChange={toggleRespawnCountdown}
                checked={respawnAsCountdown}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animate_sprites' />
              </SettingName>

              <Switch
                id="animateSprites"
                name="animateSprites"
                onChange={toggleAnimatedSprites}
                checked={animatedSprites}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='show_mvp_map' defaultMessage='Show MVP Map' />
              </SettingName>

              <Switch
                id="showMvpMap"
                name="showMvpMap"
                onChange={toggleShowMvpMap}
                checked={showMvpMap}
              />
            </Setting>

            {/* <Setting>
              <SettingName>
                <FormattedMessage id='use_24_hour_format' />
              </SettingName>

              <Switch onChange={toggle24HourFormat} checked={use24HourFormat} />
            </Setting> */}

            <Setting>
              <SettingName>
                <FormattedMessage id='notification_sound' />
              </SettingName>

              <Switch
                id="notificationSound"
                name="notificationSound"
                onChange={toggleNotificationSound}
                checked={isNotificationSoundEnabled}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='glass_ui' defaultMessage='Glass UI' />
              </SettingName>

              <Switch
                id="glassUI"
                name="glassUI"
                onChange={toggleGlassUI}
                checked={isGlassUIEnabled}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background' defaultMessage='Animated Background' />
              </SettingName>

              <Switch
                id="animatedBackground"
                name="animatedBackground"
                onChange={toggleAnimatedBackground}
                checked={isAnimatedBackgroundEnabled}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background_color' defaultMessage='Animated Background Color' />
              </SettingName>
              <input
                id="animatedBackgroundColor"
                name="animatedBackgroundColor"
                type="color"
                value={animatedBackgroundColor}
                onChange={(e) => changeAnimatedBackgroundColor(e.target.value)}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background_opacity' defaultMessage='Animated Background Color Opacity' />
              </SettingName>
              <input
                id="animatedBackgroundOpacity"
                name="animatedBackgroundOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={animatedBackgroundOpacity}
                onChange={(e) => changeAnimatedBackgroundOpacity(Number(e.target.value))}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='sparkle_effect' defaultMessage='Sparkle Effect' />
              </SettingName>

              <Switch
                id="sparkleEffect"
                name="sparkleEffect"
                onChange={toggleSparkleEffect}
                checked={isSparkleEffectEnabled}
              />
            </Setting>

            {isSparkleEffectEnabled && (
              <Setting>
                <SettingName>
                  <FormattedMessage id='sparkle_density' defaultMessage='Sparkle Density' />
                </SettingName>
                <select
                  id="sparkleDensity"
                  name="sparkleDensity"
                  value={String(sparkleDensity)}
                  onChange={(e) => changeSparkleDensity(Number(e.target.value))}
                >
                  {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 400, 500, 750, 1000].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </Setting>
            )}

            <Setting>
              <SettingName>
                <FormattedMessage id='font' defaultMessage='Font' />
              </SettingName>

              <FontButton onClick={changeFont}>{font}</FontButton>
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='falling_elements' defaultMessage='Falling Elements' />
              </SettingName>

              <Switch
                id="fallingElements"
                name="fallingElements"
                onChange={toggleFallingElements}
                checked={isFallingElementsEnabled}
              />
            </Setting>

            {/* New Background Effect Settings */}
            <Setting>
              <SettingName>
                <FormattedMessage id='background_effect_mode' defaultMessage='Effect Mode' />
              </SettingName>
              <select
                id="backgroundEffectMode"
                name="backgroundEffectMode"
                value={backgroundEffectMode}
                onChange={(e) => changeBackgroundEffectMode(e.target.value as 'full' | 'top' | 'bottom' | 'center')}
              >
                <option value="full">Full Screen</option>
                <option value="top">Top Half</option>
                <option value="bottom">Bottom Half</option>
                <option value="center">Center</option>
              </select>
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='particle_density' defaultMessage='Particle Density' />
              </SettingName>
              <select
                id="particleDensity"
                name="particleDensity"
                value={particleDensity}
                onChange={(e) => changeParticleDensity(e.target.value as 'low' | 'medium' | 'high' | 'Empty')}
              >
                <option value="Empty">Empty</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='particle_color' defaultMessage='Particle Color' />
              </SettingName>
              <input
                id="particleColor"
                name="particleColor"
                type="color"
                value={particleColor}
                onChange={(e) => changeParticleColor(e.target.value)}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='particle_opacity' defaultMessage='Particle Opacity' />
              </SettingName>
              <input
                id="particleOpacity"
                name="particleOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={particleOpacity}
                onChange={(e) => changeParticleOpacity(Number(e.target.value))}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_amplitude' defaultMessage='Wave Amplitude' />
              </SettingName>
              <input
                id="waveAmplitude"
                name="waveAmplitude"
                type="number"
                value={waveAmplitude}
                onChange={(e) => changeWaveAmplitude(Number(e.target.value))}
                min="0"
                max="100"
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_color' defaultMessage='Wave Color' />
              </SettingName>
              <input
                id="waveColor"
                name="waveColor"
                type="color"
                value={waveColor}
                onChange={(e) => changeWaveColor(e.target.value)}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_opacity' defaultMessage='Wave Opacity' />
              </SettingName>
              <input
                id="waveOpacity"
                name="waveOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={waveOpacity}
                onChange={(e) => changeWaveOpacity(Number(e.target.value))}
              />
            </Setting>

            {/* Keep the first set of wave trail settings */}
            <Setting>
              <SettingName>
                <FormattedMessage id='wave_trail_color' defaultMessage='Wave Trail Color' />
              </SettingName>
              <input
                id="waveTrailColor"
                name="waveTrailColor"
                type="color"
                value={waveTrailColor}
                onChange={(e) => changeWaveTrailColor(e.target.value)}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_trail_opacity' defaultMessage='Wave Trail Opacity' />
              </SettingName>
              <input
                id="waveTrailOpacity"
                name="waveTrailOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={waveTrailOpacity}
                onChange={(e) => changeWaveTrailOpacity(Number(e.target.value))}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='main_content_transparency' defaultMessage='Main Content Transparency' />
              </SettingName>
              <Switch
                id="mainContentTransparency"
                name="mainContentTransparency"
                onChange={toggleMainContentTransparency}
                checked={isMainContentTransparent}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='particle_effect' defaultMessage='Particle Effect' />
              </SettingName>
              <div>
                <ParticleEffectButton active onClick={() => changeParticleEffect(particleEffect === 'default' ? 'gravity' : 'default')}>
                  {particleEffect === 'default' ? 'Default' : 'Gravity'}
                </ParticleEffectButton>
              </div>
            </Setting>
            {/* End New Background Effect Settings */}

            <SettingSecondary>
              <SettingName>
                <FormattedMessage id='language' />
              </SettingName>

              <LanguageSelector />
            </SettingSecondary>

            <SettingSecondary>
              <SettingName>
                <FormattedMessage id="data_management" defaultMessage="Data Management" />
              </SettingName>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <ActionButton onClick={handleExportData} title="Copy MVP data to clipboard">
                  <Copy /> Export
                </ActionButton>
                <ActionButton onClick={handleImportData} title="Paste MVP data from clipboard">
                  <Download /> Import
                </ActionButton>
              </div>
            </SettingSecondary>

            <SettingSecondary>
              <SettingName>
                <FormattedMessage id='clear_data' />
              </SettingName>

              <ClearButton onClick={() => setIsConfirmationModalOpen(true)}>
                <FormattedMessage id='clear' />
                <Trash />
              </ClearButton>
            </SettingSecondary>
          </SettingsContainer>
        </Modal>
      </ModalBase>

      {isConfirmationModalOpen && (
        <ModalWarning
          title={confirmationTitle}
          description={confirmationDescription}
          onConfirm={handleClearData}
          onCancel={() => setIsConfirmationModalOpen(false)}
        />
      )}
    </>
  );
}
