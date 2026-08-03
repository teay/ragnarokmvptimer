import { FormattedMessage } from 'react-intl';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BinaryCalculator } from '@/components/CentralLab/BinaryCalculator';
import { BossTimer } from '@/components/CentralLab/BossTimer';
import { BossInfo } from '@/components/CentralLab/BossInfo';
import { Section, SectionTitle, Hint, TwoCol } from '@/components/CentralLab/styles';

export function CentralLabPage() {
  return (
    <>
      <Header />
      <div
        style={{
          width: '100%',
          maxWidth: 1400,
          margin: '0 auto',
          padding: '2rem 1.5rem 3rem',
          zoom: 1.25,
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--modal_name)',
            marginBottom: '1.5rem',
          }}
        >
          🧪 <FormattedMessage id='central_lab' />
        </h1>

        <TwoCol>
          <Section>
            <SectionTitle>
              <FormattedMessage id='cl_binary' />
            </SectionTitle>
            <BinaryCalculator />
          </Section>

          <Section>
            <SectionTitle>
              <FormattedMessage id='cl_boss_timer' />
            </SectionTitle>
            <Hint>
              <FormattedMessage id='cl_timer_hint' />
            </Hint>
            <BossTimer />
          </Section>
        </TwoCol>

        <Section style={{ marginTop: '1rem' }}>
          <SectionTitle>
            <FormattedMessage id='cl_boss_info' />
          </SectionTitle>
          <BossInfo />
        </Section>
      </div>
      <Footer />
    </>
  );
}
