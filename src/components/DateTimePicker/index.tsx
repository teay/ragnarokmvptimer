import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import dayjs from 'dayjs';
import { Container, Segment, Separator, Spacer } from './styles';

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

export const SegmentedDateTimePicker = forwardRef<HTMLDivElement, SegmentedDateTimePickerProps>(({
  value,
  onChange,
  autoFocus = true,
}, ref) => {
  const [date, setDate] = useState(dayjs(value));
  const containerRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

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
      const timeout = setTimeout(() => {
        refs.day.current?.focus();
        refs.day.current?.select();
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, []);

  const updateDatePart = (part: any, val: number) => {
    let newDate = date.set(part, val);
    
    // Validate days in month
    if (part === 'month' || part === 'year' || part === 'date') {
      const daysInMonth = newDate.daysInMonth();
      if (newDate.date() > daysInMonth) {
        newDate = newDate.date(daysInMonth);
      }
    }
    
    setDate(newDate);
    onChange(newDate.toDate());
  };

  const handleKeyDown = (e: React.KeyboardEvent, part: DateSegment['name']) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const unit = part === 'day' ? 'date' : part;
      const nextVal = date.get(unit) + 1;
      updateDatePart(unit, nextVal);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const unit = part === 'day' ? 'date' : part;
      const prevVal = date.get(unit) - 1;
      updateDatePart(unit, prevVal);
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
    } else if (e.key === 'Enter') {
      // Allow enter to be handled by the form/modal
    } else if (e.key !== 'Tab' && e.key !== 'Backspace' && e.key !== 'Delete' && !/^\d$/.test(e.key)) {
       // Stop other keys but allow essential ones
       // e.stopPropagation(); // Be careful with this
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, part: DateSegment['name']) => {
    const val = e.target.value.replace(/\D/g, '');
    const maxLength = part === 'year' ? 4 : 2;

    if (val.length <= maxLength) {
      if (val.length > 0) {
        const numVal = parseInt(val, 10);
        updateDatePart(part === 'day' ? 'date' : part, numVal);
      }
      
      // Auto-jump to next field
      if (val.length === maxLength) {
        const nextParts: Record<string, any> = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
        if (nextParts[part]) {
          setTimeout(() => {
            refs[nextParts[part] as keyof typeof refs].current?.focus();
            refs[nextParts[part] as keyof typeof refs].current?.select();
          }, 10);
        }
      }
    }
  };

  return (
    <Container ref={containerRef}>
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
});

SegmentedDateTimePicker.displayName = 'SegmentedDateTimePicker';
