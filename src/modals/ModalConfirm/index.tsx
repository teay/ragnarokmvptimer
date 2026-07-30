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
  onCancel: () => void;
}

export function ModalConfirm({
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ModalBase>
      <Modal>
        <ModalCloseIconButton onClick={onCancel} />

        <Content>
          <Title>{title}</Title>

          <Description>{description}</Description>

          <Footer>
            <CancelButton onClick={onCancel}>ยกเลิก</CancelButton>
            <ConfirmButton onClick={onConfirm}>{confirmText}</ConfirmButton>
          </Footer>
        </Content>
      </Modal>
    </ModalBase>
  );
}
