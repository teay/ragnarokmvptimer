// import { ModalPrimaryButton } from '@/ui/ModalPrimaryButton';
// import { styled } from '@linaria/react';

// src/modals/ModalEditMvp/styles.ts
import { styled } from "@linaria/react";
// Don't import ModalPrimaryButton here if it causes issues
// import { ModalPrimaryButton } from "@/ui/ModalPrimaryButton";
export const Modal = styled.div`
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 95vh;

  overflow-y: auto;

  padding: 2rem;
  gap: 8px;

  border-radius: 6px;

  display: flex;
  align-items: center;
  flex-direction: column;

  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.1),
      transparent 50%,
      rgba(255, 255, 255, 0.05)
    );
    pointer-events: none;
    border-radius: 6px;
  }
  box-shadow: 5px 5px 15px 0px rgba(0, 0, 0, 0.5), inset 0 0 10px 0px rgba(0, 0, 0, 0.3);
  border: none;

  @media (max-width: ${1000 / 16}em) {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }
`;

export const SpriteWrapper = styled.div`
  > img {
    width: auto;
    height: auto;
    max-width: 150px;
    max-height: 150px;
  }
`;

export const Name = styled.span`
  color: var(--modal_name);
  margin-top: -25px;

  font-size: 2.4rem;
  font-weight: 600;
`;

export const Question = styled.span`
  color: var(---modal_text);

  font-size: 1.8rem;
  font-weight: 700;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Optional = styled.span`
  color: var(---modal_text);
  font-size: 1.2rem;
`;

export const DateTimePicker = styled.input`
  text-align: center;
  font-size: 1.7rem;
  border-radius: 4px;
  border: 1px solid var(--modal_datePicker_border);
`;

export const Footer = styled.footer`
  display: flex;
  max-width: 100%;
  gap: 2rem;

  @media (max-width: ${1000 / 16}em) {
    flex-direction: column;
    gap: 1rem;
  }
`;

// export const ChangeMapButton = styled.button`
//   font-weight: 500;
//   background-color: transparent;
//   border: 3px solid var(--modal_changeMap_border);
//   color: var(--modal_changeMap_text);
// `;

// อัพเดท definition ของ ChangeMapButton ให้รับ prop size
export const ChangeMapButton = styled.button<{ size?: 'sm' | 'md' | 'lg' }>`
  min-width: 100px;
  padding: ${({ size }) => 
    size === 'sm' ? '8px 12px' : 
    size === 'lg' ? '12px 24px' : 
    '10px 20px'};
  font-size: ${({ size }) => 
    size === 'sm' ? '0.9rem' : 
    size === 'lg' ? '1.2rem' : 
    '1.1rem'};
  border: none;
  border-radius: 5px;
  background-color: #6c757d;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(0.9);
  }
`;