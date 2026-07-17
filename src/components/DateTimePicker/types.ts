export interface SegmentedDateTimePickerHandle {
  focusFirst: () => void;
}

export interface SegmentedDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  autoFocus?: boolean;
  use24HourFormat?: boolean;
}

export interface DateSegment {
  value: string;
  max: number;
  min: number;
  length: number;
  name: 'day' | 'month' | 'year' | 'hour' | 'minute';
}
