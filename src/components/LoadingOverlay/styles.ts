import { styled } from '@linaria/react';

export const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000; /* เปลี่ยนเป็นสีดำทึบ */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

export const Spinner = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid var(--primary);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
