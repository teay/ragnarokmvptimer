import { ModalBase } from '../ModalBase';
import { ModalCloseIconButton } from '@/ui/ModalCloseIconButton';

import {
  Modal,
  Title,
  Description,
  Content,
  Footer,
  CancelButton,
  ConfirmButton,
} from './styles';

interface Props {
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel?: () => void;
  hideCancel?: boolean;
}

export function ModalConfirm({
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  hideCancel,
}: Props) {
  return (
    <ModalBase>
      <Modal>
        {onCancel && <ModalCloseIconButton onClick={onCancel} />}

        <Content>
          <Title>{title}</Title>

          <Description>{description}</Description>

          <Footer>
            {!hideCancel && onCancel && (
              <CancelButton onClick={onCancel}>ยกเลิก</CancelButton>
            )}
            <ConfirmButton onClick={onConfirm}>{confirmText}</ConfirmButton>
          </Footer>
        </Content>
      </Modal>
    </ModalBase>
  );
}
