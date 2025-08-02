import { styled } from '@linaria/react';

export const FooterContainer = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  width: 100%;
  height: 150px; /* Increased height */
  margin-top: 2rem;

  background-color: var(--footer_bg);
  backdrop-filter: var(--footer_backdrop_filter);
  box-shadow: var(--footer_box_shadow);
`;

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

export const Text = styled.span`
  font-size: 1.8rem; /* Increased font size */
  color: var(--footer_text);
`;

export const Bold = styled.span`
  font-weight: bold;
`;

export const Link = styled.a`
  font-size: 1.8rem; /* Increased font size */
  color: var(--footer_link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
