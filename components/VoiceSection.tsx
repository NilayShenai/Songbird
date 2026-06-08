
import React, { useCallback } from 'react';
import { OscillatorParams, EnvelopeParams, SynthState } from '../types';
import { WAVEFORMS, calcPwmPercent, TEXTS, OCTAVE_FOOTAGE } from '../data/constants';
import { mapFreq, mapCutoff, mapAttackTime, mapReleaseTime, mapPortamento } from '../utils/audioMath';
import { Button, ButtonGroup, Fader, Label, Row, Value, SubSectionTitle } from './library/Controls';

type OscUpdateLocal = <K extends keyof OscillatorParams>(key: K, value: OscillatorParams[K]) => void;
type EnvUpdateLocal = <K extends keyof EnvelopeParams>(key: K, value: EnvelopeParams[K]) => void;

interface OscillatorPanelProps {
  id: 1 | 2;
  label: string;
  subLabel: string;
  oscState: OscillatorParams;
  envState: EnvelopeParams;
  isSequencerRunning: boolean;
  activeKeys: boolean;
  isVOctGateActive: boolean;
  updateOsc: OscUpdateLocal;
  updateEnv: EnvUpdateLocal;
  toggleSequencer: () => void;
  toggleVoltOct: () => void;
  toggleDrone: () => void;
  toggleMidi: () => void;
  layoutMode?: 'desktop' | 'mobile';
  hideMidiControl?: boolean;
}

const OscillatorPanel: React.FC<OscillatorPanelProps> = React.memo(({
  oscState, envState, isSequencerRunning, activeKeys, isVOctGateActive,
  updateOsc, updateEnv, toggleSequencer, toggleVoltOct, toggleDrone, toggleMidi, label, subLabel, layoutMode = 'desktop', hideMidiControl = false
}) => {
  const isActive = activeKeys || oscState.drone || isSequencerRunning || isVOctGateActive;
  const currentFootage = OCTAVE_FOOTAGE.find(o => o.value === oscState.octave)?.label || "8'";
  const isControlsVisible = oscState.voltOct || oscState.midi || isSequencerRunning;

  const isMobile = layoutMode === 'mobile';
  return (
    <div className={`transition-colors w-full h-full ${isMobile ? '_b-panel border p-4' : ''} ${isActive && !isMobile ? 'bg-white/[0.01]' : ''}`}>
      <div className="flex justify-between items-end border-b border-zinc-800 pb-2 mb-4 _b-widget">
        <div className="_t-panel-title">{label}</div>
        {layoutMode !== 'mobile' && <div className="_t-panel-desc">{subLabel}</div>}
      </div>
      
      <div className={`flex ${isMobile ? 'flex-row justify-between items-center' : 'flex-col gap-2'} mb-6`}>
        <ButtonGroup className={isMobile ? '' : 'w-full justify-between'}>
          {WAVEFORMS.map(w => (
            <Button key={w.value} onClick={() => updateOsc('wave', w.value)} active={oscState.wave === w.value} className={isMobile ? '' : 'flex-1 text-center'}>
              {w.label === 'SQR' ? TEXTS.osc.sqr : w.label}
            </Button>
          ))}
        </ButtonGroup>
        <div className={`flex ${isMobile ? 'flex-row gap-2' : 'flex-col gap-2'} ${isMobile ? '' : 'w-full'}`}>
          <ButtonGroup className={isMobile ? '' : 'w-full justify-between'}>
            <Button onClick={toggleMidi} active={oscState.midi} className={isMobile ? '' : 'flex-1 text-center'}>{TEXTS.osc.midi}</Button>
            <Button onClick={toggleVoltOct} active={oscState.voltOct} className={isMobile ? '' : 'flex-1 text-center'}>{TEXTS.osc.voltOct}</Button>
            <Button onClick={toggleDrone} active={oscState.drone} animate={oscState.drone} className={isMobile ? '' : 'flex-1 text-center'}>{TEXTS.osc.drone}</Button>
          </ButtonGroup>
          <Button onClick={toggleSequencer} active={isSequencerRunning} animate={isSequencerRunning} className={isMobile ? '' : 'w-full text-center'}>{TEXTS.seq.title}</Button>
        </div>
      </div>

      <div className={`grid gap-4 mb-6 ${layoutMode === 'mobile' ? 'pt-4 border-t border-zinc-800' : ''}`}>
        <div>
          <Row><Label>{TEXTS.osc.freq}</Label><Value>{mapFreq(oscState.freq).toFixed(0)} Hz</Value></Row>
          <Fader value={oscState.freq} onChange={v => updateOsc('freq', v)} />
        </div>
        <div>
          <Row><Label>{TEXTS.osc.octave}</Label><Value>{currentFootage}</Value></Row>
          <ButtonGroup className="justify-between">
            {OCTAVE_FOOTAGE.map(opt => (
                <Button key={opt.value} onClick={() => updateOsc('octave', opt.value)} active={oscState.octave === opt.value} className="flex-1">
                    {opt.label}
                </Button>
            ))}
          </ButtonGroup>
        </div>
        <div>
          <Row><Label>{TEXTS.osc.fine}</Label><Value>{((oscState.fineTune - 512) / 5.12).toFixed(1)}%</Value></Row>
          <Fader 
              value={oscState.fineTune} 
              onChange={v => {
                  const snapped = Math.abs(v - 512) < 8 ? 512 : v;
                  updateOsc('fineTune', snapped);
              }} 
          />
        </div>
        <div>
          <Row><Label>{TEXTS.osc.glide}</Label><Value>{mapPortamento(oscState.portamento).toFixed(2)} s</Value></Row>
          <Fader value={oscState.portamento} onChange={v => updateOsc('portamento', v)} />
        </div>
        <div>
          <Row>
            <Label>{TEXTS.osc.width}</Label>
            <Value>{calcPwmPercent(oscState.pwm)}%</Value>
          </Row>
          <Fader value={oscState.pwm} onChange={v => updateOsc('pwm', v)} />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 mb-6 _b-widget">
        <SubSectionTitle className="mb-6">{TEXTS.osc.filter}</SubSectionTitle>
        <div className="grid gap-4">
          <div>
            <Row><Label>{TEXTS.osc.hpCutoff}</Label><Value>{mapCutoff(oscState.hpCutoff).toFixed(0)} Hz</Value></Row>
            <Fader value={oscState.hpCutoff} onChange={v => updateOsc('hpCutoff', v)} />
          </div>
          <div>
            <Row><Label>{TEXTS.osc.hpResonance}</Label><Value>{Math.round(oscState.hpResonance / 10.24)}%</Value></Row>
            <Fader value={oscState.hpResonance} onChange={v => updateOsc('hpResonance', v)} />
          </div>
          <div>
            <Row><Label>{TEXTS.osc.cutoff}</Label><Value>{mapCutoff(oscState.cutoff).toFixed(0)} Hz</Value></Row>
            <Fader value={oscState.cutoff} onChange={v => updateOsc('cutoff', v)} />
          </div>
          <div>
            <Row><Label>{TEXTS.osc.resonance}</Label><Value>{Math.round(oscState.resonance / 10.24)}%</Value></Row>
            <Fader value={oscState.resonance} onChange={v => updateOsc('resonance', v)} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 _b-widget">
        <SubSectionTitle className="mb-6">{TEXTS.osc.env}</SubSectionTitle>
        <div className="grid gap-4">
          <div>
              <Row><Label>{TEXTS.osc.attack}</Label><Value>{mapAttackTime(envState.attack).toFixed(2)} s</Value></Row>
              <Fader value={envState.attack} onChange={v => updateEnv('attack', v)} />
          </div>
          <div>
              <Row><Label>{TEXTS.osc.release}</Label><Value>{mapReleaseTime(envState.release).toFixed(2)} s</Value></Row>
              <Fader value={envState.release} onChange={v => updateEnv('release', v)} />
          </div>
        </div>
      </div>
    </div>
  );
});

interface VoiceSectionProps {
    params: SynthState;
    activeGateKeys: { osc1: boolean; osc2: boolean };
    isVOctGateActive1: boolean;
    isVOctGateActive2: boolean;
    updateOsc: <K extends keyof OscillatorParams>(osc: 'osc1' | 'osc2', key: K, value: OscillatorParams[K]) => void;
    updateEnv: <K extends keyof EnvelopeParams>(env: 'env1' | 'env2', key: K, value: EnvelopeParams[K]) => void;
    toggleSequencer: () => void;
    toggleVoltOct: (id: 1 | 2) => void;
    toggleDrone: (id: 1 | 2) => void;
    toggleMidi: (id: 1 | 2) => void;
    layoutMode?: 'desktop' | 'mobile';
    hideMidiControls?: boolean;
}

const VoiceSection: React.FC<VoiceSectionProps> = React.memo(({
    params,
    activeGateKeys,
    isVOctGateActive1,
    isVOctGateActive2,
    updateOsc,
    updateEnv,
    toggleSequencer,
    toggleVoltOct,
    toggleDrone,
    toggleMidi,
    layoutMode = 'desktop',
    hideMidiControls = false
}) => {
    const updateOsc1 = useCallback<OscUpdateLocal>((k, v) => updateOsc('osc1', k, v), [updateOsc]);
    const updateEnv1 = useCallback<EnvUpdateLocal>((k, v) => updateEnv('env1', k, v), [updateEnv]);
    const toggleVoltOct1 = useCallback(() => toggleVoltOct(1), [toggleVoltOct]);
    const toggleDrone1 = useCallback(() => toggleDrone(1), [toggleDrone]);
    const toggleMidi1 = useCallback(() => toggleMidi(1), [toggleMidi]);

    const updateOsc2 = useCallback<OscUpdateLocal>((k, v) => updateOsc('osc2', k, v), [updateOsc]);
    const updateEnv2 = useCallback<EnvUpdateLocal>((k, v) => updateEnv('env2', k, v), [updateEnv]);
    const toggleVoltOct2 = useCallback(() => toggleVoltOct(2), [toggleVoltOct]);
    const toggleDrone2 = useCallback(() => toggleDrone(2), [toggleDrone]);
    const toggleMidi2 = useCallback(() => toggleMidi(2), [toggleMidi]);

    return (
        <div className={layoutMode === 'mobile' ? 'grid grid-cols-1 gap-6 mb-0' : 'grid grid-cols-2 gap-0 divide-x divide-zinc-800/80 h-full w-full'}>
            <div className={layoutMode === 'mobile' ? '' : 'pr-6'}>
                <OscillatorPanel
                    id={1}
                    label={`${TEXTS.osc.title} A`}
                    subLabel={TEXTS.osc.keys1}
                    oscState={params.osc1}
                    envState={params.env1}
                    isSequencerRunning={params.seq1.isRunning}
                    activeKeys={activeGateKeys.osc1}
                    isVOctGateActive={isVOctGateActive1}
                    updateOsc={updateOsc1}
                    updateEnv={updateEnv1}
                    toggleSequencer={toggleSequencer}
                    toggleVoltOct={toggleVoltOct1}
                    toggleDrone={toggleDrone1}
                    toggleMidi={toggleMidi1}
                    layoutMode={layoutMode}
                    hideMidiControl={hideMidiControls}
                />
            </div>
            <div className={layoutMode === 'mobile' ? '' : 'pl-6'}>
                <OscillatorPanel
                    id={2}
                    label={`${TEXTS.osc.title} B`}
                    subLabel={TEXTS.osc.keys2}
                    oscState={params.osc2}
                    envState={params.env2}
                    isSequencerRunning={params.seq2.isRunning}
                    activeKeys={activeGateKeys.osc2}
                    isVOctGateActive={isVOctGateActive2}
                    updateOsc={updateOsc2}
                    updateEnv={updateEnv2}
                    toggleSequencer={toggleSequencer}
                    toggleVoltOct={toggleVoltOct2}
                    toggleDrone={toggleDrone2}
                    toggleMidi={toggleMidi2}
                    layoutMode={layoutMode}
                    hideMidiControl={hideMidiControls}
                />
            </div>
        </div>
    );
});

export default VoiceSection;

