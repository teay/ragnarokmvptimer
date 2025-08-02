import { styled } from '@linaria/react';

export const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding-bottom: 30px;
  background-color: var(--secondary);
  width: 100%;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  gap: 15px;
  width: 100%;
`;

export const SectionTitle = styled.span`
  font-weight: bold;
  color: var(--text);
  font-size: 2.4rem;
`;

export const MvpsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 2.5rem;
  width: 100%;
  justify-items: center;
  max-width: 130rem;
  padding: 1rem;
  

  @media (max-width: 75em) { /* ~1200px */
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 56.25em) { /* ~900px */
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 37.5em) { /* ~600px */
    grid-template-columns: 1fr;
  }
`;