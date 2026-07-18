import { FormattedMessage } from 'react-intl';
import { Option, Select } from './styles';

interface SortSwitchProps {
  id?: string;
  name?: string;
  value?: string;
  onChange: (id: string) => void;
}

const OPTIONS = [
  { id: 'id', name: 'ID' },
  { id: 'level', name: 'Level' },
  { id: 'name', name: 'Name' },
  { id: 'respawnTime', name: 'Respawn' },
  { id: 'health', name: 'Health' },
  { id: 'baseExperience', name: 'Base EXP' },
  { id: 'jobExperience', name: 'Job EXP' },
];

export function SortSelect({ id, name, value = 'id', onChange }: SortSwitchProps) {
  return (
    <Select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label='Sort mvps by his properties'
      title='Sort mvps by his properties'
    >
      {OPTIONS.map(({ id, name }) => (
        <Option key={id} value={id} aria-label={name}>
          <FormattedMessage id={id} defaultMessage={name} />
        </Option>
      ))}
    </Select>
  );
}
