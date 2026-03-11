import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { ModalBase } from '../ModalBase';

import {
  Modal,
  Title,
  Description,
  Content,
  ServerRow,
  ServerName,
  ChoicesGrid,
  ChoiceCard,
  ChoiceHeader,
  ChoiceDetail,
  BrowserIcon,
  FileIcon,
  Footer,
  ConfirmButton,
} from './styles';

interface Props {
  browserData: any;
  fileData: any;
  servers: string[];
  onConfirm: (choices: Record<string, 'browser' | 'file'>) => void;
}

export function ModalSyncData({
  browserData,
  fileData,
  servers,
  onConfirm,
}: Props) {
  const [choices, setChoices] = useState<Record<string, 'browser' | 'file'>>(
    servers.reduce((acc, s) => ({ ...acc, [s]: 'file' }), {})
  );

  const toggleChoice = (server: string, choice: 'browser' | 'file') => {
    setChoices(prev => ({ ...prev, [server]: choice }));
  };

  const getMvpCount = (data: any, server: string) => {
    return data && data[server] ? data[server].length : 0;
  };

  return (
    <ModalBase>
      <Modal>
        <Content>
          <Title>
            <FormattedMessage id="sync_conflict_title" />
          </Title>

          <Description>
            <FormattedMessage id="sync_conflict_description" />
          </Description>

          {servers.map(server => (
            <ServerRow key={server}>
              <ServerName>{server}</ServerName>
              <ChoicesGrid>
                <ChoiceCard 
                  color="#3b82f6"
                  active={choices[server] === 'file'}
                  onClick={() => toggleChoice(server, 'file')}
                >
                  <ChoiceHeader>
                    <FileIcon />
                    <FormattedMessage id="sync_file_option" />
                  </ChoiceHeader>
                  <ChoiceDetail>
                    MVPs: {getMvpCount(fileData, server)}
                  </ChoiceDetail>
                </ChoiceCard>

                <ChoiceCard 
                  color="#10b981"
                  active={choices[server] === 'browser'}
                  onClick={() => toggleChoice(server, 'browser')}
                >
                  <ChoiceHeader>
                    <BrowserIcon />
                    <FormattedMessage id="sync_browser_option" />
                  </ChoiceHeader>
                  <ChoiceDetail>
                    MVPs: {getMvpCount(browserData, server)}
                  </ChoiceDetail>
                </ChoiceCard>
              </ChoicesGrid>
            </ServerRow>
          ))}

          <Footer>
            <ConfirmButton onClick={() => onConfirm(choices)}>
              <FormattedMessage id="sync_confirm_btn" />
            </ConfirmButton>
          </Footer>
        </Content>
      </Modal>
    </ModalBase>
  );
}
