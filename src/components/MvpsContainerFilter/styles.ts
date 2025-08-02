import { styled } from '@linaria/react';
import { Search, XCircle, ArrowUp, ArrowDown } from '@styled-icons/feather';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;

  width: 100%;
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;

  border-radius: 8px;

  background-color: var(--mvpCard_bg); /* Reusing mvpCard_bg for consistency */
  backdrop-filter: var(--mvpCard_backdrop_filter); /* Reusing mvpCard_backdrop_filter */
  box-shadow: 0px 8px 20px 5px rgba(0, 0, 0, 0.2); /* Floating effect */
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
`;

export const SearchIcon = styled(Search)`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--filterSearch_text);
  width: 20px;
  height: 20px;
`;

export const SearchInput = styled.input`
  width: 100%;
  max-width: 300px;
  padding: 1rem 1rem 1rem 40px; /* Adjusted padding for icon */
  border-radius: 4px;
  border: 1px solid var(--filterSearch_border);
  background-color: var(--filterSearch_bg);
  color: var(--filterSearch_text);
  transition: all 0.2s ease-in-out;

  &:focus {
    border-color: var(--filterSearch_border_focus);
  }
`;

export const ClearButton = styled(XCircle)<{ visibility: string }>`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--filterSearch_text);
  width: 20px;
  height: 20px;
  cursor: pointer;
  visibility: ${({ visibility }) => visibility};
`;

export const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
`;

export const SortSelect = styled.select`
  flex: 1;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--filterSearch_border);
  background-color: var(--filterSearch_bg);
  color: var(--filterSearch_text);
  transition: all 0.2s ease-in-out;

  &:focus {
    border-color: var(--filterSearch_border_focus);
  }
`;

export const Reverse = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-color: var(--primary);
  color: var(--header_text);
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

export const UpArrow = styled(ArrowUp)`
  width: 20px;
  height: 20px;
`;

export const DownArrow = styled(ArrowDown)`
  width: 20px;
  height: 20px;
`;
