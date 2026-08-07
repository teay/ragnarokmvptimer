import { styled } from '@linaria/react';

export const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 5px 0;

  background: var(--warning_header_bg);

  color: var(--warning_header_text);
  font-weight: bold;
`;

export const CloseButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);

  background: none;
  border: none;
  color: inherit;
  font-size: 1.6rem;
  line-height: 1;
  padding: 4px;

  cursor: pointer;
`;
