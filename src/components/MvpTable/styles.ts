import { styled } from '@linaria/react';
import { Star } from '@styled-icons/feather';

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: var(--mvpCard_bg);
  border-radius: 8px;
  overflow: hidden;

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  th {
    background-color: rgba(0, 0, 0, 0.6);
    color: #bbb;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  }

  tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }
`;

export const Th = styled.th<{ sticky?: boolean }>`
  white-space: nowrap;
  ${({ sticky }) =>
    sticky &&
    `
    position: sticky;
    left: 0;
    z-index: 11;
    background-color: rgba(0, 0, 0, 0.7);
    border-right: 2px solid rgba(255, 255, 255, 0.12);
  `}
`;

export const Td = styled.td<{ sticky?: boolean }>`
  color: #ddd;
  font-size: 0.9rem;
  vertical-align: middle;
  ${({ sticky }) =>
    sticky &&
    `
    position: sticky;
    left: 0;
    z-index: 5;
    background-color: rgba(40, 40, 40, 0.95);
    border-right: 2px solid rgba(255, 255, 255, 0.12);
  `}
`;

export const RowNumber = styled(Td)`
  color: #666;
  font-size: 0.75rem;
  width: 30px;
  text-align: center;
  font-weight: 600;
`;

export const MvpNameCell = styled(Td)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
`;

export const TimeDisplay = styled.td<{ urgency: 1 | 2 | 3 | 4 | 5 }>`
  vertical-align: middle;
  width: 100px;

  ${({ urgency }) => {
    switch (urgency) {
      case 1:
        return `
          background: linear-gradient(135deg, rgba(231, 76, 60, 0.25) 0%, rgba(192, 57, 43, 0.2) 100%);
          border-left: 4px solid #e74c3c;
        `;
      case 2:
        return `
          background: linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.15) 100%);
          border-left: 3px solid #e67e22;
        `;
      case 3:
        return `
          background: linear-gradient(135deg, rgba(241, 196, 15, 0.15) 0%, rgba(243, 156, 18, 0.1) 100%);
          border-left: 3px solid #f1c40f;
        `;
      case 4:
        return `
          background: rgba(255, 255, 255, 0.03);
          border-left: 2px solid #27ae60;
        `;
      default:
        return `
          border-left: 2px solid transparent;
        `;
    }
  }}
`;

export const TimeLeft = styled.span<{ urgency: 1 | 2 | 3 | 4 | 5 }>`
  display: block;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 0.5px;

  ${({ urgency }) => {
    switch (urgency) {
      case 1:
        return `color: #ff5252; text-shadow: 0 0 10px rgba(255, 82, 82, 0.6);`;
      case 2:
        return `color: #ff9800; text-shadow: 0 0 8px rgba(255, 152, 0, 0.5);`;
      case 3:
        return `color: #ffc107;`;
      case 4:
        return `color: #4caf50;`;
      default:
        return `color: #81c784;`;
    }
  }}
`;

export const CompactRow = styled.tr<{ isFavorite?: boolean }>`
  ${({ isFavorite }) =>
    isFavorite &&
    `
    background: linear-gradient(90deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.1) 50%, transparent 100%) !important;
    border-left: 4px solid #ffc107;
    
    &:hover {
      background: linear-gradient(90deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 152, 0, 0.2) 50%, transparent 100%) !important;
    }
  `}
`;

export const CompactTd = styled.td`
  padding: 6px 10px !important;
  font-size: 0.85rem;
`;

export const CompactTimeDisplay = styled.td<{ urgency: 1 | 2 | 3 | 4 | 5 }>`
  padding: 6px 8px !important;
  width: 80px;

  ${({ urgency }) => {
    switch (urgency) {
      case 1:
        return `background: rgba(231, 76, 60, 0.3); border-left: 3px solid #e74c3c;`;
      case 2:
        return `background: rgba(230, 126, 34, 0.25); border-left: 3px solid #e67e22;`;
      case 3:
        return `background: rgba(241, 196, 15, 0.15); border-left: 2px solid #f1c40f;`;
      case 4:
        return `background: rgba(39, 174, 96, 0.1); border-left: 2px solid #27ae60;`;
      default:
        return `border-left: 2px solid transparent;`;
    }
  }}
`;

export const CompactTimeLeft = styled.span<{ urgency: 1 | 2 | 3 | 4 | 5 }>`
  font-weight: 700;
  font-size: 0.95rem;

  ${({ urgency }) => {
    switch (urgency) {
      case 1:
        return `color: #ff6b6b;`;
      case 2:
        return `color: #ffa502;`;
      case 3:
        return `color: #ffeaa7;`;
      case 4:
        return `color: #55efc4;`;
      default:
        return `color: #81c784;`;
    }
  }}
`;

export const FavoriteStar = styled(Star)<{ active?: boolean }>`
  color: ${({ active }) => (active ? '#ffc107' : '#555')};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #ffc107;
  }
`;

export const CompactActions = styled.div`
  display: flex;
  gap: 2px;
`;

export const CompactButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background-color: #3a3a3a;
  color: #999;
  cursor: pointer;

  &:hover {
    background-color: #555;
    color: white;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const TimeGroupLabel = styled.tr`
  background-color: rgba(0, 0, 0, 0.5) !important;
`;

export const TimeGroupTh = styled.th`
  padding: 8px 12px !important;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #fff;
  background: linear-gradient(
    90deg,
    rgba(52, 152, 219, 0.3) 0%,
    transparent 100%
  ) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const StatusBadge = styled.span<{ status: 'active' | 'wait' | 'all' }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${({ status }) => {
    if (status === 'active') return '#e67e22';
    if (status === 'wait') return '#9b59b6';
    return '#27ae60';
  }};
  color: white;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 3px;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: #3a3a3a;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #555;
    color: white;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const SummaryRow = styled.tr`
  background-color: rgba(0, 0, 0, 0.4) !important;
  border-top: 2px solid rgba(255, 255, 255, 0.15);
`;

export const SummaryCell = styled.td`
  padding: 10px 14px !important;
  font-size: 0.8rem;
  color: #aaa;
  font-weight: 600;
`;

export const SummaryBadge = styled.span<{
  type: 'total' | 'active' | 'wait' | 'alive';
}>`
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  background-color: ${({ type }) => {
    if (type === 'total') return '#3498db';
    if (type === 'active') return '#e67e22';
    if (type === 'wait') return '#9b59b6';
    return '#27ae60';
  }};
  color: white;
`;
