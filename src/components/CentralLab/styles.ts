import { styled } from '@linaria/react';

export const Modal = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 3vh 16px;
`;

export const Title = styled.span`
  color: var(--modal_name);
  font-size: 2.4rem;
  font-weight: 600;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 1.2rem;
  border-radius: 12px;
  background: var(--modal_bg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow-y: auto;
  max-height: 92vh;
  height: 88vh;
`;

export const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 1rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const Section = styled.section`
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  background: var(--tertiary);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    border-color: var(--primary);
    box-shadow: 0 0 6px var(--primary), 0 0 18px var(--primary), 0 2px 8px rgba(0, 0, 0, 0.25);
  }
`;

export const SectionTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--modal_name);
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const OpenLink = styled.a`
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--primary);
  text-decoration: none;
  opacity: 0.85;
  white-space: nowrap;
  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

export const Hint = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.65;
`;