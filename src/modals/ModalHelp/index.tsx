import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Star, X, MapPin, MousePointer } from '@styled-icons/feather';
import { ModalBase } from '../ModalBase';
import { useKey } from '@/hooks';
import {
  Container,
  Step,
  StepNumber,
  StepContent,
  StepTitle,
  StepDesc,
  SimulationBox,
  MiniCard,
  DemoButton,
  StatusText,
  Footer,
  CloseButton,
  EscHint,
  FakeCursor,
} from './styles';

interface ModalHelpProps {
  close: () => void;
}

const DEFAULT_FLOW = [
  { id: 1, mvpName: 'Baphomet', status: 'ALREADY RESPAWNED', timer: '00:00:00', button: 'Select to kill', variant: 'primary', icon: <Star size={16} />, cursor: { top: 215, left: 160, click: true }, activeStep: 2 },
  { id: 2, mvpName: 'Baphomet', status: 'WAIT FOR KILL', timer: '00:05:15', button: 'I killed now !', variant: 'primary', secondaryButton: 'CANCEL', secondaryVariant: 'back', cursor: { top: 205, left: 140, click: true }, activeStep: 3 },
  { id: 3, mvpName: 'Drake', status: 'ALREADY RESPAWNED', timer: '00:00:00', button: 'Select to kill', variant: 'primary', icon: <Star size={16} />, cursor: { top: 215, left: 160, click: true }, activeStep: 2 },
  { id: 4, mvpName: 'Drake', status: 'COUNTING DOWN', timer: '02:00:00', button: 'Reset Timer & Position', variant: 'timer', icon: <MapPin size={16} />, cursor: { top: 240, left: 260, click: false }, activeStep: 1 },
];

export function ModalHelp({ close }: ModalHelpProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [flowSteps, setFlowSteps] = useState(DEFAULT_FLOW);

  useKey('Escape', close);

  useEffect(() => {
    // Try to load recorded steps
    const saved = localStorage.getItem('recorded_tutorial_steps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const dynamicFlow = parsed.map((s: any, idx: number) => ({
          id: idx,
          mvpName: s.mvpName,
          status: s.status.toUpperCase(),
          timer: s.action === 'reset' ? '02:00:00' : '00:00:00',
          button: s.action === 'kill' ? 'I killed now !' : s.action === 'pin' ? 'Select to kill' : 'Reset Timer',
          variant: s.action === 'reset' ? 'timer' : 'primary',
          icon: s.action === 'pin' ? <Star size={16} /> : s.action === 'reset' ? <MapPin size={16} /> : undefined,
          cursor: s.action === 'pin' ? { top: 215, left: 160, click: true } : { top: 205, left: 140, click: true },
          activeStep: s.action === 'kill' ? 4 : s.action === 'pin' ? 3 : 1
        }));
        setFlowSteps(dynamicFlow);
      } catch (e) {
        console.error('Failed to parse recorded steps', e);
      }
    }
  }, []);

  useEffect(() => {
    if (flowSteps.length === 0) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % flowSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [flowSteps]);

  const current = flowSteps[stepIndex] || DEFAULT_FLOW[0];
  return (
    <ModalBase close={close}>
      <Container>
        <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: '#8b5a2b', textAlign: 'center' }}>
          <FormattedMessage id="help" />
        </div>
        <SimulationBox>
          <FakeCursor top={current.cursor.top} left={current.cursor.left} active={current.cursor.click}>
            <MousePointer size={30} fill="#fbc02d" />
          </FakeCursor>

          <div style={{ fontSize: '1.2rem', color: '#8b5a2b', fontWeight: 'bold', marginBottom: '10px' }}>
            REAL USAGE SIMULATION
          </div>
          <MiniCard>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{current.mvpName}</div>
            <StatusText>{current.status}</StatusText>
            <div style={{ fontSize: '2rem', fontFamily: 'monospace', color: '#e0e0e0' }}>{current.timer}</div>
            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
              <DemoButton variant={current.variant as any}>
                {current.icon} {current.button}
              </DemoButton>
              {current.secondaryButton && (
                <DemoButton variant={current.secondaryVariant as any} style={{ width: '40px', flexShrink: 0 }}>
                  <X size={16} />
                </DemoButton>
              )}
            </div>
          </MiniCard>
          <div style={{ textAlign: 'center', fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
            Automatically simulating the MVP lifecycle...
          </div>
        </SimulationBox>

        <Step style={{ opacity: current.activeStep === 1 ? 1 : 0.3 }}>
          <StepNumber>1</StepNumber>
          <StepContent>
            <StepTitle><FormattedMessage id="tutorial_step_1_title" /></StepTitle>
            <StepDesc><FormattedMessage id="tutorial_step_1_desc" /></StepDesc>
          </StepContent>
        </Step>
        <Step style={{ opacity: current.activeStep === 2 ? 1 : 0.3 }}>
          <StepNumber>2</StepNumber>
          <StepContent>
            <StepTitle><FormattedMessage id="tutorial_step_2_title" /></StepTitle>
            <StepDesc><FormattedMessage id="tutorial_step_2_desc" /></StepDesc>
          </StepContent>
        </Step>
        <Step style={{ opacity: current.activeStep === 3 ? 1 : 0.3 }}>
          <StepNumber>3</StepNumber>
          <StepContent>
            <StepTitle><FormattedMessage id="tutorial_step_3_title" /></StepTitle>
            <StepDesc><FormattedMessage id="tutorial_step_3_desc" /></StepDesc>
          </StepContent>
        </Step>
        <Step style={{ opacity: current.activeStep === 4 ? 1 : 0.3 }}>
          <StepNumber>4</StepNumber>
          <StepContent>
            <StepTitle><FormattedMessage id="tutorial_step_4_title" /></StepTitle>
            <StepDesc><FormattedMessage id="tutorial_step_4_desc" /></StepDesc>
          </StepContent>
        </Step>

        <Footer>
          <CloseButton onClick={close}>
            <FormattedMessage id="close" />
          </CloseButton>
          <EscHint>
            ( <FormattedMessage id="press_esc_to_close" /> )
          </EscHint>
        </Footer>
      </Container>
    </ModalBase>
  );
}
