import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.8rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 110px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.75;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--quaternary);
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 600;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(255, 183, 77, 0.35);
  }
`;

const DecimalBox = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: var(--quaternary);
  color: var(--modal_time);
  font-weight: 700;
  font-size: 1.2rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

const SwitchesArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.6rem;
`;

const SwitchesHeading = styled.div`
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.7;
`;

const Switches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  row-gap: 1.1rem;
`;

const ChipItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
`;

const SwitchChip = styled.div`
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(76, 175, 80, 0.25);
  border: 2px solid #4caf50;
  color: #4caf50;
  font-weight: 700;
  font-size: 1.9rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  &:hover {
    transform: translateY(-2px) scale(1.05);
    background: rgba(76, 175, 80, 0.4);
    box-shadow: 0 6px 14px rgba(76, 175, 80, 0.45);
  }
`;

const SwitchOn = styled.span`
  font-size: 1.9rem;
  font-weight: 700;
  color: #4caf50;
  letter-spacing: 0.05em;
`;

const Empty = styled.div`
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.5;
  padding: 0.3rem 0;
`;

const Formula = styled.div`
  font-size: 0.9rem;
  color: var(--text);
  opacity: 0.65;
  margin-bottom: 0.5rem;
`;

export function BinaryCalculator() {
  const [day, setDay] = useState(() => new Date().getDate());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const valid = day >= 1 && day <= 31 && month >= 1 && month <= 12;
  const decimal = valid ? (day + month) * 5 : null;
  const binary = decimal !== null ? decimal.toString(2).padStart(8, '0') : '';
  const onSwitches = binary
    .split('')
    .map((bit, i) => (bit === '1' ? i + 1 : null))
    .filter((v): v is number => v !== null);

  return (
    <div>
      <Formula>
        <FormattedMessage id='cl_binary_formula' />
      </Formula>
      <Row>
        <Field>
          <Label htmlFor='cl-day'>
            <FormattedMessage id='cl_day' />
          </Label>
          <Input
            id='cl-day'
            name='cl-day'
            type='number'
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          />
        </Field>
        <Field>
          <Label htmlFor='cl-month'>
            <FormattedMessage id='cl_month' />
          </Label>
          <Input
            id='cl-month'
            name='cl-month'
            type='number'
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </Field>
        <Field>
          <Label>
            <FormattedMessage id='cl_decimal' />
          </Label>
          <DecimalBox>{decimal !== null ? decimal : '-'}</DecimalBox>
        </Field>
      </Row>
      <SwitchesArea>
        <SwitchesHeading>
          <FormattedMessage id='cl_switches' />
        </SwitchesHeading>
        {decimal === null ? (
          <Empty>...</Empty>
        ) : onSwitches.length ? (
          <Switches>
            {onSwitches.map((s) => (
              <ChipItem key={s}>
                <SwitchChip>{s}</SwitchChip>
                <SwitchOn>ON</SwitchOn>
              </ChipItem>
            ))}
          </Switches>
        ) : (
          <Empty>
            <FormattedMessage id='cl_decimal' />: 0
          </Empty>
        )}
      </SwitchesArea>
    </div>
  );
}