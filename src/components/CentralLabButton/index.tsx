import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from './styles';

export function CentralLabButton() {
  const intl = useIntl();

  return (
    <Button
      as='a'
      href='#/central-lab'
      title={intl.formatMessage({ id: 'central_lab' })}
    >
      🧪 <FormattedMessage id='central_lab' />
    </Button>
  );
}
