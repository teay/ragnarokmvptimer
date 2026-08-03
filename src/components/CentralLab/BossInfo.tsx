import { FormattedMessage } from 'react-intl';
import { styled } from '@linaria/react';

import { BOSS_DATA } from '@/data/centralLab';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
  color: #cbd5e1;
  tbody tr {
    transition: background 0.15s ease;
  }
  tbody tr:hover {
    background: rgba(2, 6, 23, 0.4);
  }
`;

const Head = styled.thead`
  color: #64748b;
  text-transform: uppercase;
`;

const Th = styled.th`
  padding: 0.4rem 0.6rem;
  border: 1px solid #475569;
  font-size: 1.05rem;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ThRight = styled(Th)`
  text-align: right;
`;

const Td = styled.td`
  padding: 0.4rem 0.6rem;
  border: 1px solid #475569;
  white-space: nowrap;
  font-size: 1.1rem;
`;

const Hp = styled(Td)`
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #94a3b8;
`;

const BossLink = styled.a`
  color: #f1f5f9;
  font-size: 1.35rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
  &:hover {
    color: #fbbf24;
    text-decoration: underline;
  }
`;

const StageLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.6rem;
`;

export function BossInfo() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3].map((stage) => (
          <div key={stage}>
            <StageLabel>
              <FormattedMessage id='cl_stage' /> {stage}
            </StageLabel>
            <Table>
              <Head>
                <tr>
                  <Th>
                    <FormattedMessage id='cl_name' />
                  </Th>
                  <ThRight>
                    <FormattedMessage id='cl_hp' />
                  </ThRight>
                  <Th>
                    <FormattedMessage id='cl_race' />
                  </Th>
                  <Th>
                    <FormattedMessage id='cl_element' />
                  </Th>
                  <Th>
                    <FormattedMessage id='cl_weak' />
                  </Th>
                </tr>
              </Head>
              <tbody>
                {(BOSS_DATA[stage] || []).map((b) => (
                  <tr key={b.id}>
                    <Td>
                      <BossLink href={`https://www.divine-pride.net/database/monster/${b.id}/`} target='_blank' rel='noopener noreferrer'>
                        {b.name} ↗
                      </BossLink>
                    </Td>
                    <Hp>{b.hp}</Hp>
                    <Td style={{ color: '#94a3b8' }}>{b.raceName}</Td>
                    <Td>{b.elemName}</Td>
                    <Td style={{ color: '#fbbf24', fontWeight: 600 }}>{b.weakName}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}