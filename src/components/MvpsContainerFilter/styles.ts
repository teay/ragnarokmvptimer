import { styled } from '@linaria/react';
import { Search, ArrowUp, ArrowDown, XCircle } from '@styled-icons/feather';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 40rem; /* Set max-width */
  margin: 0 auto; /* Center horizontally */
  width: 100%;
  align-items: center;
`;

export const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px; /* Increased padding */
  gap: 8px; /* Increased gap */
  border-radius: 8px;
  background-color: var(--filterSearch_bg);
  border: 1px solid var(--filterSearch_border);
  width: 100%; /* Make it full width */

  &:focus-within {
    border-color: var(--filterSearch_border_focus);
  }
`;

export const SearchInput = styled.input`
  color: var(--filterSearch_text);
  font-size: 1.6rem; /* Increased font size */
  background: none;
  width: 100%;
`;

export const SearchIcon = styled(Search)`
  width: 24px;
  height: 24px;
  padding: 1px;
  color: var(--filterSearch_text);
  stroke-width: 2px;
`;

export const ClearButton = styled(XCircle)`
  width: 20px; /* Increased size */
  height: 20px; /* Increased size */
  stroke-width: 2px;
  color: var(--filterSearch_text);
  cursor: pointer;
`;

export const SortContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  background-color: var(--filterSearch_bg);
  border: 1px solid var(--filterSearch_border);
  width: 100%; /* Make it full width */
  padding: 4px 8px; /* Added padding */
`;

export const Reverse = styled.button`
  border-left: thin solid var(--filterSearch_text);
  margin: 5px 0;
  padding: 0 8px;
  background: none;
`;

export const UpArrow = styled(ArrowUp)`
  width: 24px;
  height: 24px;
  color: var(--filterSearch_text);
  stroke-width: 1.5px;
`;

export const DownArrow = styled(ArrowDown)`
  width: 24px;
  height: 24px;
  color: var(--filterSearch_text);
  stroke-width: 1.5px;
`;