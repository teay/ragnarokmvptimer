import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Trash } from '@styled-icons/feather';

import { ModalBase } from '../ModalBase';
import { Switch } from '../../components/Switch';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ModalWarning } from '../ModalWarning';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import { useSettings } from '@/contexts/SettingsContext';
import { useScrollBlock, useClickOutside, useKey, useTheme } from '@/hooks';
import { clearData } from '@/utils';
import { GetTranslateText } from '@/utils/GetTranslateText';

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
    waveAmplitude,
    changeWaveAmplitude,
    waveColor,
    changeWaveColor,
    isMainContentTransparent, // New setting
    toggleMainContentTransparency, // New toggle
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
    isFallingElementsEnabled = false,
    toggleFallingElements,
  } = useSettings();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useScrollBlock(true);
  useKey('Escape', onClose);

  const modalRef = useClickOutside(
    !isConfirmationModalOpen ? onClose : () => null
  );

  const confirmationTitle = GetTranslateText('clear_data_message');
  const confirmationDescription = GetTranslateText('clear_data_description');

  function handleClearData() {
    clearData();
    setIsConfirmationModalOpen(false);
    window.location.reload();
  }

  const getThemeName = () => {
    if (theme === 'dark') return intl.formatMessage({ id: 'theme_darkest' });
    if (theme === 'light') return intl.formatMessage({ id: 'theme_dark' });
    if (theme === 'light-mode') return intl.formatMessage({ id: 'theme_light' });
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
                <FormattedMessage id='hide_active_content' defaultMessage='Hide Active Content' />
              </SettingName>

              <Switch
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
                onChange={toggleRespawnCountdown}
                checked={respawnAsCountdown}
              />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animate_sprites' />
              </SettingName>

              <Switch
                onChange={toggleAnimatedSprites}
                checked={animatedSprites}
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
                onChange={toggleNotificationSound}
                checked={isNotificationSoundEnabled}
              />
            </Setting>

            

            <Setting>
              <SettingName>
                <FormattedMessage id='glass_ui' defaultMessage='Glass UI' />
              </SettingName>

              <Switch onChange={toggleGlassUI} checked={isGlassUIEnabled} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background' defaultMessage='Animated Background' />
              </SettingName>

              <Switch onChange={toggleAnimatedBackground} checked={isAnimatedBackgroundEnabled} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background_color' defaultMessage='Animated Background Color' />
              </SettingName>
              <input type="color" value={animatedBackgroundColor} onChange={(e) => changeAnimatedBackgroundColor(e.target.value)} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='animated_background_opacity' defaultMessage='Background Opacity' />
              </SettingName>
              <input type="range" min="0" max="1" step="0.01" value={animatedBackgroundOpacity} onChange={(e) => changeAnimatedBackgroundOpacity(Number(e.target.value))} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='sparkle_effect' defaultMessage='Sparkle Effect' />
              </SettingName>

              <Switch onChange={toggleSparkleEffect} checked={isSparkleEffectEnabled} />
            </Setting>

            {isSparkleEffectEnabled && (
              <Setting>
                <SettingName>
                  <FormattedMessage id='sparkle_density' defaultMessage='Sparkle Density' />
                </SettingName>
                <select
                  value={String(sparkleDensity)}
                  onChange={(e) => changeSparkleDensity(Number(e.target.value))}
                >
                  {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 400, 500, 750, 1000].map((value) => (
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

              <Switch onChange={toggleFallingElements} checked={isFallingElementsEnabled} />
            </Setting>

            {/* New Background Effect Settings */}
            <Setting>
              <SettingName>
                <FormattedMessage id='background_effect_mode' defaultMessage='Effect Mode' />
              </SettingName>
              <select value={backgroundEffectMode} onChange={(e) => changeBackgroundEffectMode(e.target.value as 'full' | 'top' | 'bottom' | 'center')}>
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
              <select value={particleDensity} onChange={(e) => changeParticleDensity(e.target.value as 'low' | 'medium' | 'high')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='particle_color' defaultMessage='Particle Color' />
              </SettingName>
              <input type="color" value={particleColor} onChange={(e) => changeParticleColor(e.target.value)} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_amplitude' defaultMessage='Wave Amplitude' />
              </SettingName>
              <input type="number" value={waveAmplitude} onChange={(e) => changeWaveAmplitude(Number(e.target.value))} min="0" max="100" />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='wave_color' defaultMessage='Wave Color' />
              </SettingName>
              <input type="color" value={waveColor} onChange={(e) => changeWaveColor(e.target.value)} />
            </Setting>

            <Setting>
              <SettingName>
                <FormattedMessage id='main_content_transparency' defaultMessage='Main Content Transparency' />
              </SettingName>
              <Switch onChange={toggleMainContentTransparency} checked={isMainContentTransparent} />
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