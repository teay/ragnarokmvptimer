import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import dayjs from 'dayjs';

import { SegmentedDateTimePicker } from '@/components/DateTimePicker';
import { SegmentedDateTimePickerProps, SegmentedDateTimePickerHandle } from '@/components/DateTimePicker/types';

// --- 1. Mocking dayjs ให้รองรับทั้ง default และ static methods ---
vi.mock('dayjs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('dayjs')>();
  const actual = (mod as any).default || mod;
  
  const mockDayjs = (date?: any) => {
    if (!date) return actual('2023-10-26T10:30:00Z');
    return actual(date);
  };

  return {
    ...mod,
    default: Object.assign(mockDayjs, actual)
  };
});

describe('SegmentedDateTimePicker', () => {
  const onChangeMock = vi.fn();
  
  const defaultProps: SegmentedDateTimePickerProps = {
    value: new Date('2023-10-26T10:30:00Z'),
    onChange: onChangeMock,
    autoFocus: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDateTimePicker = (props: Partial<SegmentedDateTimePickerProps> = {}) => {
    const ref = React.createRef<SegmentedDateTimePickerHandle>();
    const combinedProps = { ...defaultProps, ...props };
    const result = render(<SegmentedDateTimePicker {...combinedProps} ref={ref} />);
    return { ref, ...result };
  };

  test('should render with initial date values', () => {
    renderDateTimePicker();
    expect(screen.getByDisplayValue('26')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  test('should update date and call onChange when arrow keys are pressed', async () => {
    renderDateTimePicker();
    const dayInput = screen.getByDisplayValue('26');

    await act(async () => {
      fireEvent.keyDown(dayInput, { key: 'ArrowUp', keyCode: 38 });
    });

    expect(onChangeMock).toHaveBeenCalled();
    const firstCallDate = onChangeMock.mock.calls[0][0];
    expect(new Date(firstCallDate).getDate()).toBe(27);
  });

  test('should update date and call onChange when typing directly into inputs', async () => {
    renderDateTimePicker();
    const dayInput = screen.getByDisplayValue('26');
    
    await act(async () => {
      fireEvent.change(dayInput, { target: { value: '01' } });
    });
    await waitFor(() => expect(onChangeMock).toHaveBeenCalled());
  });

  test('should handle invalid date inputs gracefully', async () => {
    renderDateTimePicker();
    const dayInput = screen.getByDisplayValue('26');
    
    await act(async () => {
      fireEvent.change(dayInput, { target: { value: '35' } });
    });
    
    await waitFor(() => {
      expect(onChangeMock).not.toHaveBeenCalledTimes(2); 
    });
  });
});