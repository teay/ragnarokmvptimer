import { styled } from '@linaria/react';
import { Database, Monitor, ChevronRight } from '@styled-icons/feather';

export const Modal = styled.div`
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;

  padding: 2rem;
  gap: 8px;
  margin: 0 1rem;

  border-radius: 6px;
  display: flex;
  flex-direction: column;

  position: relative;
  background-color: var(--modal_bg);

  box-shadow: 0px 8px 20px 5px rgba(0, 0, 0, 0.2);
  border: none;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

export const Title = styled.h3`
  font-size: 2.2rem;
  font-weight: 600;
  color: var(--modal_name);
  text-align: center;
`;

export const Description = styled.p`
  font-size: 1.4rem;
  color: var(--modal_text);
  text-align: center;
  opacity: 0.9;
`;

export const ServerRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const ServerName = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const ChoiceCard = styled.button<{ active?: boolean; color: string }>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 0.8rem;
  border: 2px solid ${props => props.active ? props.color : 'rgba(255, 255, 255, 0.1)'};
  background-color: ${props => props.active ? `${props.color}22` : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    border-color: ${props => props.color};
  }
`;

export const ChoiceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
`;

export const ChoiceDetail = styled.div`
  font-size: 1.2rem;
  color: var(--modal_text);
  opacity: 0.8;
`;

export const BrowserIcon = styled(Monitor)`
  width: 1.6rem;
  height: 1.6rem;
`;

export const FileIcon = styled(Database)`
  width: 1.6rem;
  height: 1.6rem;
`;

export const Footer = styled.footer`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

export const ConfirmButton = styled.button`
  color: #fff;
  background-color: #3b82f6;
  border-radius: 0.8rem;
  border: none;
  padding: 1rem 4rem;
  font-size: 1.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }
`;
