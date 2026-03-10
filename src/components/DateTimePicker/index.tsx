import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { styled } from '@linaria/react';

interface SegmentedDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  autoFocus?: boolean;
}

interface DateSegment {
  value: string;
  max: number;
  min: number;
  length: number;
  name: 'day' | 'month' | 'year' | 'hour' | 'minute';
}

export const SegmentedDateTimePicker: React.FC<SegmentedDateTimePickerProps> = ({
  value,
  onChange,
  autoFocus = true,
}) => {
  const [date, setDate] = useState(dayjs(value));
  const refs = {
    day: useRef<HTMLInputElement>(null),
    month: useRef<HTMLInputElement>(null),
    year: useRef<HTMLInputElement>(null),
    hour: useRef<HTMLInputElement>(null),
    minute: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    setDate(dayjs(value));
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        refs.day.current?.focus();
        refs.day.current?.select();
      }, 100);
    }
  }, []);

  const updateDatePart = (part: keyof DateSegment['name'] | any, val: number) => {
    let newDate = date.set(part, val);
    
    // Validate days in month
    if (part === 'month' || part === 'year') {
      const daysInMonth = newDate.daysInMonth();
      if (date.date() > daysInMonth) {
        newDate = newDate.date(daysInMonth);
      }
    }
    
    setDate(newDate);
    onChange(newDate.toDate());
  };

  const handleKeyDown = (e: React.KeyboardEvent, part: DateSegment['name']) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextVal = date.get(part === 'day' ? 'date' : part) + 1;
      updateDatePart(part === 'day' ? 'date' : part, nextVal);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const prevVal = date.get(part === 'day' ? 'date' : part) - 1;
      updateDatePart(part === 'day' ? 'date' : part, prevVal);
    } else if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
      const prevParts: Record<string, any> = { month: 'day', year: 'month', hour: 'year', minute: 'hour' };
      if (prevParts[part]) {
        e.preventDefault();
        const prevRef = refs[prevParts[part] as keyof typeof refs];
        prevRef.current?.focus();
        prevRef.current?.select();
      }
    } else if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length) {
      const nextParts: Record<string, any> = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
      if (nextParts[part]) {
        e.preventDefault();
        const nextRef = refs[nextParts[part] as keyof typeof refs];
        nextRef.current?.focus();
        nextRef.current?.select();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, part: DateSegment['name']) => {
    const val = e.target.value.replace(/\D/g, '');
    const numVal = parseInt(val, 10);
    const maxLength = part === 'year' ? 4 : 2;

    if (val.length <= maxLength) {
      if (!isNaN(numVal)) {
        updateDatePart(part === 'day' ? 'date' : part, numVal);
      }
      
      // Auto-jump to next field
      if (val.length === maxLength) {
        const nextParts: Record<string, any> = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
        if (nextParts[part]) {
          refs[nextParts[part] as keyof typeof refs].current?.focus();
          refs[nextParts[part] as keyof typeof refs].current?.select();
        }
      }
    }
  };

  return (
    <Container>
      <Segment
        ref={refs.day}
        value={date.format('DD')}
        onChange={(e) => handleInputChange(e, 'day')}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="DD"
      />
      <Separator>/</Separator>
      <Segment
        ref={refs.month}
        value={date.format('MM')}
        onChange={(e) => handleInputChange(e, 'month')}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="MM"
      />
      <Separator>/</Separator>
      <Segment
        ref={refs.year}
        className="year"
        value={date.format('YYYY')}
        onChange={(e) => handleInputChange(e, 'year')}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="YYYY"
      />
      <Spacer />
      <Segment
        ref={refs.hour}
        value={date.format('HH')}
        onChange={(e) => handleInputChange(e, 'hour')}
        onKeyDown={(e) => handleKeyDown(e, 'hour')}
        placeholder="HH"
      />
      <Separator>:</Separator>
      <Segment
        ref={refs.minute}
        value={date.format('mm')}
        onChange={(e) => handleInputChange(e, 'minute')}
        onKeyDown={(e) => handleKeyDown(e, 'minute')}
        placeholder="mm"
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--filterSearch_bg);
  border: 1px solid var(--modal_datePicker_border);
  border-radius: 4px;
  padding: 10px;
  width: 100%;
  color: var(--text);
  font-family: inherit;
  font-size: 1.8rem;

  &:focus-within {
    border-color: var(--filterSearch_border_focus);
  }
`;

const Segment = styled.input`
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: center;
  width: 2.5rem;
  padding: 0;
  outline: none;

  &.year {
    width: 4.5rem;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Separator = styled.span`
  margin: 0 2px;
  opacity: 0.6;
`;

const Spacer = styled.div`
  width: 15px;
`;
