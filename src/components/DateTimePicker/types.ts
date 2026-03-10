export interface SegmentedDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  autoFocus?: boolean;
}

export interface DateSegment {
  value: string;
  max: number;
  min: number;
  length: number;
  name: 'day' | 'month' | 'year' | 'hour' | 'minute';
}
