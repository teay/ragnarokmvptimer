import { HeaderTimer } from '../HeaderTimer';
import { ServerButton } from '../ServerButton';
import { SettingsButton } from '../SettingsButton';
import { useSettings } from '@/contexts/SettingsContext';

import { Eye, EyeOff } from '@styled-icons/feather'; // Import Eye and EyeOff icons

import mvpImg from '@/assets/mvp.png';

import { Container, Customization, Logo, LogoContainer, Title, MapToggleButton } from './styles'; // Add MapToggleButton to imports

export function Header() {
  const { use24HourFormat, showMvpMap, toggleShowMvpMap } = useSettings(); // Destructure showMvpMap and toggleShowMvpMap

  return (
    <Container>
      <LogoContainer>
        <Logo src={mvpImg} alt='mvp' />
        <Title>Ragnarok MVP Timer</Title>
      </LogoContainer>

      <HeaderTimer use24HourFormat={use24HourFormat} />

      <Customization>
        <MapToggleButton onClick={toggleShowMvpMap} title={showMvpMap ? 'Hide MVP Maps' : 'Show MVP Maps'}>
          {showMvpMap ? <Eye /> : <EyeOff />}
        </MapToggleButton>
        <ServerButton />
        <SettingsButton />
      </Customization>
    </Container>
  );
}
