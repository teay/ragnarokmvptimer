import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import dayjs from 'dayjs';
import { Container, Segment, Separator, Spacer } from './styles';
import { SegmentedDateTimePickerProps } from './types';

export const SegmentedDateTimePicker = forwardRef<HTMLDivElement, SegmentedDateTimePickerProps>((props, ref) => {
  const { value, onChange, autoFocus = true } = props;
  const [date, setDate] = useState(dayjs(value));
  
  const currentYear = dayjs().year();
  const MIN_YEAR = currentYear - 100;
  const MAX_YEAR = currentYear + 100;

  const [displayValues, setDisplayValues] = useState({
    day: dayjs(value).format('DD'),
    month: dayjs(value).format('MM'),
    year: dayjs(value).format('YYYY'),
    hour: dayjs(value).format('HH'),
    minute: dayjs(value).format('mm'),
  });

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
    const newDate = dayjs(value);
    if (!newDate.isSame(date)) {
      setDate(newDate);
      setDisplayValues({
        day: newDate.format('DD'),
        month: newDate.format('MM'),
        year: newDate.format('YYYY'),
        hour: newDate.format('HH'),
        minute: newDate.format('mm'),
      });
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      const timeout = setTimeout(() => {
        if (refs.day.current) {
          refs.day.current.focus();
          refs.day.current.select();
        }
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, []);

  const validateAndClamp = (part: string, val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) return val;

    switch (part) {
      case 'month':
        if (num > 12) num = 12;
        if (num < 1 && val.length === 2) num = 1;
        break;
      case 'day':
        const maxDays = date.daysInMonth();
        if (num > maxDays) num = maxDays;
        if (num < 1 && val.length === 2) num = 1;
        break;
      case 'hour':
        if (num > 23) num = 23;
        break;
      case 'minute':
        if (num > 59) num = 59;
        break;
      case 'year':
        // Prevent typing year way outside the range immediately
        if (val.length >= 4) {
          if (num > MAX_YEAR) {
            alert(`Year cannot be more than ${MAX_YEAR}`);
            num = MAX_YEAR;
          } else if (num < MIN_YEAR) {
            // Only alert if they finished typing 4 digits and it's too low
            alert(`Year cannot be less than ${MIN_YEAR}`);
            num = MIN_YEAR;
          }
        }
        break;
    }
    
    return num.toString();
  };

  const updateActualDate = (newDisplayValues: typeof displayValues) => {
    const { day, month, year, hour, minute } = newDisplayValues;
    
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    const h = hour.padStart(2, '0');
    const min = minute.padStart(2, '0');
    
    let newDate = dayjs(`${year}-${m}-${d} ${h}:${min}`, 'YYYY-MM-DD HH:mm');
    
    if (newDate.isValid()) {
      setDate(newDate);
      onChange(newDate.toDate());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, part: keyof typeof displayValues) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const unit = part === 'day' ? 'day' : part;
      const nextDate = e.key === 'ArrowUp' ? date.add(1, unit as any) : date.subtract(1, unit as any);
      
      if (nextDate.year() > MAX_YEAR || nextDate.year() < MIN_YEAR) return;

      const newValues = {
        day: nextDate.format('DD'),
        month: nextDate.format('MM'),
        year: nextDate.format('YYYY'),
        hour: nextDate.format('HH'),
        minute: nextDate.format('mm'),
      };
      
      setDate(nextDate);
      setDisplayValues(newValues);
      onChange(nextDate.toDate());
    } else if (e.key === 'ArrowLeft' && ((e.target as HTMLInputElement).selectionStart === 0 || (e.target as HTMLInputElement).value.length === 0)) {
      const prevParts: Record<string, keyof typeof refs> = { month: 'day', year: 'month', hour: 'year', minute: 'hour' };
      if (prevParts[part]) {
        e.preventDefault();
        refs[prevParts[part]].current?.focus();
        refs[prevParts[part]].current?.select();
      }
    } else if (e.key === 'ArrowRight' && ((e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length)) {
      const nextParts: Record<string, keyof typeof refs> = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
      if (nextParts[part]) {
        e.preventDefault();
        refs[nextParts[part]].current?.focus();
        refs[nextParts[part]].current?.select();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, part: keyof typeof displayValues) => {
    let val = e.target.value.replace(/\D/g, '');
    const maxLength = part === 'year' ? 4 : 2;

    if (val.length <= maxLength) {
      if (val.length > 0) {
        val = validateAndClamp(part, val);
      }

      const newDisplayValues = { ...displayValues, [part]: val };
      setDisplayValues(newDisplayValues);

      if (val.length > 0) {
        updateActualDate(newDisplayValues);
      }
      
      if (val.length === maxLength) {
        const nextParts: Record<string, keyof typeof refs> = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
        if (nextParts[part]) {
          setTimeout(() => {
            refs[nextParts[part]].current?.focus();
            refs[nextParts[part]].current?.select();
          }, 10);
        }
      }
    }
  };

  const handleBlur = (part: keyof typeof displayValues) => {
    const maxLength = part === 'year' ? 4 : 2;
    let val = displayValues[part];

    if (val.length > 0) {
      let num = parseInt(val, 10);
      
      if (part === 'day') {
        const maxDays = dayjs(`${displayValues.year}-${displayValues.month}-01`).daysInMonth();
        if (num > maxDays) num = maxDays;
        if (num < 1) num = 1;
      } else if (part === 'month') {
        if (num > 12) num = 12;
        if (num < 1) num = 1;
      } else if (part === 'year') {
        if (num < MIN_YEAR) {
          alert(`Year cannot be less than ${MIN_YEAR}`);
          num = MIN_YEAR;
        } else if (num > MAX_YEAR) {
          alert(`Year cannot be more than ${MAX_YEAR}`);
          num = MAX_YEAR;
        }
      }

      const finalVal = num.toString().padStart(maxLength, '0');
      const newValues = { ...displayValues, [part]: finalVal };
      setDisplayValues(newValues);
      updateActualDate(newValues);
    } else {
      const format = part === 'year' ? 'YYYY' : (part === 'day' ? 'DD' : part === 'month' ? 'MM' : part === 'hour' ? 'HH' : 'mm');
      const reverted = date.format(format);
      setDisplayValues({ ...displayValues, [part]: reverted });
    }
  };

  return (
    <Container ref={containerRef}>
      <Segment
        ref={refs.day}
        value={displayValues.day}
        onChange={(e) => handleInputChange(e, 'day')}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        onBlur={() => handleBlur('day')}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        placeholder="DD"
      />
      <Separator>/</Separator>
      <Segment
        ref={refs.month}
        value={displayValues.month}
        onChange={(e) => handleInputChange(e, 'month')}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        onBlur={() => handleBlur('month')}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        placeholder="MM"
      />
      <Separator>/</Separator>
      <Segment
        ref={refs.year}
        className="year"
        value={displayValues.year}
        onChange={(e) => handleInputChange(e, 'year')}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        onBlur={() => handleBlur('year')}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        placeholder="YYYY"
      />
      <Spacer />
      <Segment
        ref={refs.hour}
        value={displayValues.hour}
        onChange={(e) => handleInputChange(e, 'hour')}
        onKeyDown={(e) => handleKeyDown(e, 'hour')}
        onBlur={() => handleBlur('hour')}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        placeholder="HH"
      />
      <Separator>:</Separator>
      <Segment
        ref={refs.minute}
        value={displayValues.minute}
        onChange={(e) => handleInputChange(e, 'minute')}
        onKeyDown={(e) => handleKeyDown(e, 'minute')}
        onBlur={() => handleBlur('minute')}
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        placeholder="mm"
      />
    </Container>
  );
});

SegmentedDateTimePicker.displayName = 'SegmentedDateTimePicker';
