import { VoiceOscillatorNode } from '../types';

let isPatched = false;

export const installAudioWorkletPatch = () => {
    if (isPatched) return;
    if (typeof window !== 'undefined' && typeof window.AudioNode !== 'undefined') {
        const originalConnect = window.AudioNode.prototype.connect;
        window.AudioNode.prototype.connect = function(
            destination: any,
            outputIndex?: number,
            inputIndex?: number
        ) {
            if (destination && typeof destination === 'object' && destination.__isMockAudioParam) {
                // Do not call native connect for mock AudioParams to prevent TypeErrors
                return destination;
            }
            return originalConnect.apply(this, arguments as any);
        } as any;

        const originalDisconnect = window.AudioNode.prototype.disconnect;
        window.AudioNode.prototype.disconnect = function(
            destination?: any,
            output?: number,
            input?: number
        ) {
            if (destination && typeof destination === 'object' && destination.__isMockAudioParam) {
                // Do not call native disconnect for mock AudioParams
                return;
            }
            try {
                return originalDisconnect.apply(this, arguments as any);
            } catch (e) {
                // Avoid throwing if native node wasn't actually connected
            }
        } as any;
        isPatched = true;
    }
};

// Also call automatically on import
installAudioWorkletPatch();

/**
 * Creates a mock AudioParam that supports the standard scheduling and connection methods.
 * Useful when standard nodes are used as a fallback for AudioWorkletNodes.
 */
export const createMockAudioParam = (
    initialValue: number,
    onChange?: (val: number) => void
): AudioParam => {
    const mock = {
        value: initialValue,
        minValue: -Infinity,
        maxValue: Infinity,
        __isMockAudioParam: true,
        setValueAtTime(val: number, _t: number) {
            mock.value = val;
            if (onChange) onChange(val);
            return mock;
        },
        setTargetAtTime(val: number, _t: number, _tc: number) {
            mock.value = val;
            if (onChange) onChange(val);
            return mock;
        },
        cancelScheduledValues(_t: number) {
            return mock;
        },
        cancelAndHoldAtTime(_t: number) {
            return mock;
        },
        linearRampToValueAtTime(val: number, _t: number) {
            mock.value = val;
            if (onChange) onChange(val);
            return mock;
        },
        exponentialRampToValueAtTime(val: number, _t: number) {
            mock.value = val;
            if (onChange) onChange(val);
            return mock;
        },
        connect() {},
        disconnect() {}
    };
    return mock as any as AudioParam;
};

/**
 * Creates a fallback oscillator using a standard OscillatorNode wrapped to mimic VoiceOscillatorNode.
 */
export const createFallbackOscillator = (
    ctx: AudioContext
): VoiceOscillatorNode => {
    const rawOsc = ctx.createOscillator();
    
    // Start generating immediately since standard OscillatorNodes need start() to play
    rawOsc.start();

    // Default to triangle (analog osc default)
    rawOsc.type = 'triangle';

    const osc = rawOsc as any as VoiceOscillatorNode;

    let currentWaveform = 2; // Default to triangle (mapping: 0: sawtooth, 1: square, 2: triangle, 3: sine)
    const waveformParam = createMockAudioParam(2, (val) => {
        const roundedVal = Math.round(val);
        currentWaveform = roundedVal;
        
        if (roundedVal === 0) rawOsc.type = 'sawtooth';
        else if (roundedVal === 1) rawOsc.type = 'square';
        else if (roundedVal === 2) rawOsc.type = 'triangle';
        else rawOsc.type = 'sine';
    });

    const pulseWidthParam = createMockAudioParam(0);

    Object.defineProperty(osc, 'waveform', {
        get() { return waveformParam; },
        configurable: true
    });

    Object.defineProperty(osc, 'pulseWidth', {
        get() { return pulseWidthParam; },
        configurable: true
    });

    let _waveType: OscillatorType = 'triangle';
    Object.defineProperty(osc, 'waveType', {
        get() { return _waveType; },
        set(val: OscillatorType) {
            _waveType = val;
            rawOsc.type = val;

            // Keep the numeric waveform param in sync
            if (val === 'sawtooth') waveformParam.value = 0;
            else if (val === 'square') waveformParam.value = 1;
            else if (val === 'triangle') waveformParam.value = 2;
            else waveformParam.value = 3;
        },
        configurable: true
    });

    return osc;
};
