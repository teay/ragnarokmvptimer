import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import dayjs from 'dayjs';
import { Container, Segment, Separator, Spacer } from './styles';

/**
 * @typedef {import('./types').SegmentedDateTimePickerProps} SegmentedDateTimePickerProps
 */

/**
 * @type {React.ForwardRefExoticComponent<SegmentedDateTimePickerProps & React.RefAttributes<HTMLDivElement>>}
 */
export const SegmentedDateTimePicker = forwardRef(({
  value,
  onChange,
  autoFocus = true,
}, ref) => {
  const [date, setDate] = useState(dayjs(value));
  
  // Local states for each segment to allow natural typing
  const [displayValues, setDisplayValues] = useState({
    day: date.format('DD'),
    month: date.format('MM'),
    year: date.format('YYYY'),
    hour: date.format('HH'),
    minute: date.format('mm'),
  });

  const containerRef = useRef(null);
  useImperativeHandle(ref, () => containerRef.current);

  const refs = {
    day: useRef(null),
    month: useRef(null),
    year: useRef(null),
    hour: useRef(null),
    minute: useRef(null),
  };

  // Sync with prop value
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

  const updateActualDate = (newDisplayValues) => {
    const { day, month, year, hour, minute } = newDisplayValues;
    
    // Attempt to create a valid date
    let newDate = dayjs(`${year}-${month}-${day} ${hour}:${minute}`, 'YYYY-MM-DD HH:mm');
    
    if (newDate.isValid()) {
      setDate(newDate);
      onChange(newDate.toDate());
    }
  };

  const handleKeyDown = (e, part) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const unit = part === 'day' ? 'date' : part;
      const nextDate = e.key === 'ArrowUp' ? date.add(1, unit) : date.subtract(1, unit);
      
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
    } else if (e.key === 'ArrowLeft' && (e.target.selectionStart === 0 || e.target.value.length === 0)) {
      const prevParts = { month: 'day', year: 'month', hour: 'year', minute: 'hour' };
      if (prevParts[part]) {
        e.preventDefault();
        refs[prevParts[part]].current?.focus();
        refs[prevParts[part]].current?.select();
      }
    } else if (e.key === 'ArrowRight' && (e.target.selectionEnd === e.target.value.length)) {
      const nextParts = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
      if (nextParts[part]) {
        e.preventDefault();
        refs[nextParts[part]].current?.focus();
        refs[nextParts[part]].current?.select();
      }
    }
  };

  const handleInputChange = (e, part) => {
    const val = e.target.value.replace(/\D/g, '');
    const maxLength = part === 'year' ? 4 : 2;

    if (val.length <= maxLength) {
      const newDisplayValues = { ...displayValues, [part]: val };
      setDisplayValues(newDisplayValues);

      if (val.length > 0) {
        updateActualDate(newDisplayValues);
      }
      
      // Auto-jump to next field ONLY when maxLength is reached by typing
      if (val.length === maxLength) {
        const nextParts = { day: 'month', month: 'year', year: 'hour', hour: 'minute' };
        if (nextParts[part]) {
          setTimeout(() => {
            refs[nextParts[part]].current?.focus();
            refs[nextParts[part]].current?.select();
          }, 10);
        }
      }
    }
  };

  const handleBlur = (part) => {
    // Pad with zeros if needed on blur to keep consistent UI
    const maxLength = part === 'year' ? 4 : 2;
    if (displayValues[part].length > 0 && displayValues[part].length < maxLength) {
      const padded = displayValues[part].padStart(maxLength, '0');
      const newValues = { ...displayValues, [part]: padded };
      setDisplayValues(newValues);
      updateActualDate(newValues);
    } else if (displayValues[part].length === 0) {
      // Revert to current date value if empty
      const reverted = date.format(part === 'year' ? 'YYYY' : (part === 'day' ? 'DD' : part === 'month' ? 'MM' : part === 'hour' ? 'HH' : 'mm'));
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
        onFocus={(e) => e.target.select()}
        placeholder="DD"
      />
      <Separator>/</Separator>
      <Segment
        ref={refs.month}
        value={displayValues.month}
        onChange={(e) => handleInputChange(e, 'month')}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        onBlur={() => handleBlur('month')}
        onFocus={(e) => e.target.select()}
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
        onFocus={(e) => e.target.select()}
        placeholder="YYYY"
      />
      <Spacer />
      <Segment
        ref={refs.hour}
        value={displayValues.hour}
        onChange={(e) => handleInputChange(e, 'hour')}
        onKeyDown={(e) => handleKeyDown(e, 'hour')}
        onBlur={() => handleBlur('hour')}
        onFocus={(e) => e.target.select()}
        placeholder="HH"
      />
      <Separator>:</Separator>
      <Segment
        ref={refs.minute}
        value={displayValues.minute}
        onChange={(e) => handleInputChange(e, 'minute')}
        onKeyDown={(e) => handleKeyDown(e, 'minute')}
        onBlur={() => handleBlur('minute')}
        onFocus={(e) => e.target.select()}
        placeholder="mm"
      />
    </Container>
  );
});

SegmentedDateTimePicker.displayName = 'SegmentedDateTimePicker';
