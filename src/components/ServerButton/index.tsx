import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useSettings } from '@/contexts/SettingsContext';
import { ModalSelectServer } from '@/modals';

import { Button } from './styles';

export function ServerButton() {
  const { server } = useSettings();
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const intl = useIntl();

  return (
    <>
      <Button
        onClick={() => setIsSelectionOpen((prev) => !prev)}
        title={intl.formatMessage({ id: 'select_server_btn_title' })}
      >
        {server}
      </Button>

      {isSelectionOpen && (
        <ModalSelectServer close={() => setIsSelectionOpen(false)} />
      )}
    </>
  );
}
