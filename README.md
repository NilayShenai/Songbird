# SONGBIRD // HYBRID POLYPHONIC WORKSTATION

Songbird is a browser-based, 6-voice hybrid polyphonic workstation built on the **Web Audio API** using React, TypeScript, and Tailwind CSS. Originally designed as a rapid prototyping tool for physical modeling and drone synthesis, it has evolved into a complete sound design environment focused on dense textures, cinematic atmospheres, industrial noise, and lo-fi dungeon-synth pads.

---

## Table of Contents
1. [Core Synthesis Theory & Concepts](#1-core-synthesis-theory--concepts)
   - [Oscillators & Waveforms](#oscillators--waveform-geometry)
   - [Filters & Subtractive Synthesis](#filters--subtractive-synthesis)
   - [Modulators (LFOs & Envelopes)](#modulators-lfos--envelopes)
   - [Cross-Modulation (FM, AM, Ring Mod)](#cross-modulation-theory)
   - [Step Sequencers & Gates](#step-sequencers--gates)
2. [Songbird Interface & Signal Flow](#2-songbird-interface--signal-flow)
   - [Voice Architecture (Per-Voice Flow)](#voice-architecture)
   - [The Floating Workspace (Miscellaneous Rack)](#the-floating-workspace)
   - [Effects Chain (FX Routing)](#effects-chain-fx-routing)
   - [Master Bus & Tape Recorder](#master-bus--tape-recorder)
3. [Codebase Architecture & File Map](#3-codebase-architecture--file-map)
   - [Audio Processing & DSP Logic](#audio-processing--dsp-logic)
   - [UI Components & Orchestration](#ui-components--orchestration)
4. [Getting Started & Development](#4-getting-started--development)
   - [Local Installation](#local-installation)
   - [Production Build & Deployment](#production-build--deployment)
5. [License](#5-license)

---

## 1. Core Synthesis Theory & Concepts

To design sounds effectively in Songbird, it is important to understand the underlying physical and mathematical concepts of digital synthesis.

### Oscillators & Waveform Geometry

Oscillators are the primary sound generators in a synthesizer. They produce a repeating, periodic voltage (or digital signal) at a specific frequency measured in Hertz (Hz), representing cycles per second.

Songbird's voice engine utilizes two oscillators per voice (**OSC A** and **OSC B**) supporting four classic geometric waveforms:

```
SINE          TRIANGLE        SAWTOOTH        SQUARE
   /\            /\             /|            +--+
  /  \          /  \           / |            |  |
 /    \        /    \         /  |            |  |
~      ~      /      \       /   |            +  +
             /        \     /    |               |
```

1. **Sine Wave**: Contains only the fundamental frequency and no upper harmonics. It produces a clean, pure, sub-bass tone.
2. **Triangle Wave**: Contains only odd harmonics, but their amplitude drops off rapidly ($1/h^2$). It produces a soft, flute-like tone.
3. **Sawtooth Wave**: Contains all integer harmonics (both odd and even) dropping off linearly ($1/h$). It produces a bright, buzzy tone, ideal for modeling brass, leads, and heavy basses.
4. **Square/Pulse Wave**: Contains only odd harmonics ($1/h$). It has a hollow, clarinet-like character. 
   - **Pulse Width (PW)**: Refers to the ratio of the waveform's positive cycle duration to its total period. 
   - **Pulse Width Modulation (PWM)**: Dynamically modulates the pulse width over time. This produces a rich, chorusing sound that simulates multiple detuned oscillators.

### Filters & Subtractive Synthesis

Subtractive synthesis starts with a harmonic-rich source (like a Sawtooth or Square wave) and uses a **Filter** to "subtract" unwanted frequencies, sculpting the timbre.

Songbird features a dedicated resonant Low-Pass filter per voice:

```
Amplitude
   ^
   |  ======================\     <- Cutoff Frequency
   |                         \
   |                          \    <- Slope (Roll-off)
   |                           \
   +----------------------------+---> Frequency
```

- **Cutoff Frequency**: The threshold frequency where the filter begins to attenuate the signal. Frequencies above this limit are rolled off.
- **Resonance (Q Factor)**: Boosts frequencies around the cutoff point, creating a narrow spike or "peak." High resonance values make the filter sound sweeping, nasal, or whistle-like.
- **Drive**: Introduces soft clipping and non-linear saturation directly into the filter circuit, adding harmonic thickness and warmth to the sound.

### Modulators (LFOs & Envelopes)

Modulators do not make sound themselves. Instead, they output slow-moving signals that change other parameters (like cutoff, pitch, or gain) automatically.

#### Low-Frequency Oscillators (LFO)
An LFO is an oscillator that runs below the human hearing threshold (typically $0.1\text{ Hz} - 20\text{ Hz}$). Instead of being routed to your speakers, its output is mapped to parameters (e.g., modulating pitch to create *vibrato*, or modulating amplitude to create *tremolo*).

#### Envelope Generators (AHDSR)
Envelopes shape how a parameter changes over time in response to a key trigger (gate). Songbird utilizes two modulation envelopes per voice:

```
Amplitude / Value
   ^
   |        Decay
   |       /\_____ Sustain
   |      /       \
   |     /         \
   |    /           \ Release
   +---+-------------+--------> Time
     Attack
```

- **Attack**: The time it takes for the envelope value to rise from zero to its peak once a note is triggered.
- **Decay**: The time it takes to drop from the peak to the sustain level.
- **Sustain**: The steady-state level maintained while the key remains held down.
- **Release**: The time it takes for the value to decay back to zero after the key is released.

### Cross-Modulation Theory

Cross-modulation occurs when the output of one audio-rate oscillator modulates a parameter of another audio-rate oscillator. This produces complex sideband frequencies, resulting in metallic, industrial, bell-like, or harsh noise timbres.

1. **Frequency Modulation (FM)**: The output frequency of the carrier (OSC A) is modulated by the output of the modulator (OSC B). This generates a wide series of sidebands:
   $$f_{\text{sidebands}} = f_{\text{carrier}} \pm n \cdot f_{\text{modulator}}$$
2. **Amplitude Modulation (AM)**: The amplitude of OSC A is multiplied by the unipolar output of OSC B.
3. **Ring Modulation (RM)**: The bipolar output signals of OSC A and OSC B are multiplied together. This cancels out both original carrier and modulator frequencies, leaving only their sum and difference frequencies:
   $$f_{\text{out}} = f_{\text{carrier}} + f_{\text{modulator}} \quad \text{and} \quad f_{\text{carrier}} - f_{\text{modulator}}$$

### Step Sequencers & Gates

A **Step Sequencer** loops through a series of discrete values (steps) synchronized to a master clock (tempo). 
- **Pitch Sequencers**: Output specific note offsets on each step, allowing you to create automatic melodies.
- **Modulation Sequencers**: Output control values to modulate parameters like filter cutoff, decay times, or FX depth rhythmically.
- **Gate**: A binary signal (ON/OFF). An active gate triggers envelopes, while an inactive gate starts their release phase.

---

## 2. Songbird Interface & Signal Flow

Songbird is divided into distinct sections that route signals from voice generation to global master processing.

### Voice Architecture

Each of Songbird's 6 independent voices runs a parallel DSP chain:

```
+-------+      +-------------+      +--------+      +------+      +-----+
| OSC A | ---> |             | ---> | Res.   | ---> | Voice| ---> | VCA | ---> Pan/Mix
+-------+      | Cross-Mod   |      | Filter |      | Drive|      | Gain|
               | (FM/AM/Ring)|      +--------+      +------+      +-----+
+-------+ ---> |             |          ^
| OSC B |      +-------------+          |
+-------+                               |
                                  Mod Envelopes
                                     & LFOs
```

- **Oscillator A & B**: Dual sound generators. OSC B can be set to "Free" mode, decoupling it from keyboard pitch track to act as a constant drone source.
- **Cross-Modulation**: Controls the amount of FM, AM, or Ring modulation applied from OSC B to OSC A.
- **Noise Generator**: Injects White, Pink, or Brown noise into the audio path, complete with a dedicated noise bandpass/lowpass filter.
- **Filter Section**: Per-voice 12dB/octave resonant lowpass filter.
- **Amp Envelope**: Controls the master VCA (Voltage Controlled Amplifier) level of the voice.

### The Floating Workspace (Miscellaneous Rack)

The **MISCELLANEOUS** button in the app header opens a resizable floating panel. This panel contains four tabs for modulation, sequencing, routing, and effects:

1. **MODULATION**: Features control knobs for global LFOs and Envelopes.
2. **SEQUENCERS**:
   - **Voice Sequencers**: Two 16-step sequencers driving note pitches and gates.
   - **Modulation Sequencers**: Two 16-step sequencers routing custom value offsets to target destinations.
3. **MATRIX**: An assignable 4-pad coordinate grid. You can link parameters to the X and Y coordinates of each pad to modulate multiple settings simultaneously with your mouse or touch interface.
4. **EFFECTS**: Configures the master insert effects chain.

### Effects Chain (FX Routing)

The master effects chain processes the combined sum of all 6 active voices. You can click and drag the tab nodes in the UI to dynamically rearrange the effects routing order:

```
[ SUMMED VOICES ] 
       │
       ▼
┌──────────────┐
│  1. DELAY    │  (Tape style delay with wow/flutter pitch modulation)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  2. CRUSHER  │  (Sample-rate reduction and bit-depth degradation)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  3. FUZZ     │  (Multi-stage waveshaping distortion)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  4. REVERB   │  (Spring-style convolution reverb)
└──────┬───────┘
       │
       ▼
[ MASTER OUT ]
```

### Master Bus & Tape Recorder

The master output section applies final polish to the signal before it reaches your speakers:
- **7-Band EQ**: Custom graphic equalizer to balance frequencies.
- **Bus Compressor**: Compels overall dynamic range for cohesive sound.
- **Master Drive & Limiter**: Adds soft saturation and prevents digital clipping.
- **Ambience Injector**: Synthesizes authentic vintage hum and record crackle to sit underneath the audio.
- **Tape Recorder**: An in-memory stereo recorder.
  - Features a **varispeed** dial ($0.2\text{x} - 1.8\text{x}$ playback speed), tape loops, and reverse playback.
  - Allows exporting your recording as a 32-bit floating-point **WAV file**.

---

## 3. Codebase Architecture & File Map

Songbird is structured logically, separating DSP audio calculations from the React UI render cycle.

### Audio Processing & DSP Logic

All audio routing is built around a single, unified audio graph in [utils/audioGraph.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/audioGraph.ts).

- **DSP Core**:
  - [utils/analogOscWorklet.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/analogOscWorklet.ts): Contains the compiled DSP code for the custom analog-modeled VCO.
  - [utils/bitcrusherWorklet.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/bitcrusherWorklet.ts): Custom audio processor for sample-rate reduction.
  - [utils/recorderWorklet.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/recorderWorklet.ts): Processes real-time audio writing for tape loops.
- **Fallback Architecture**:
  - [utils/audioWorkletFallback.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/audioWorkletFallback.ts): If a browser does not support `AudioWorklet` (such as Firefox under non-secure contexts), this module intercepts instantiation calls and wraps standard browser `OscilloscopeNode` and `BiquadFilterNode` modules, ensuring the app still runs smoothly.
- **Voice Generation & Audio Graphs**:
  - [utils/graph-builders/voice.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/graph-builders/voice.ts): Builds the per-voice Web Audio nodes (oscillators, filters, noise, gains).
  - [utils/graph-builders/effects.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/graph-builders/effects.ts): Builds the master delay, bitcrusher, fuzz, and reverb audio graph inserts.
  - [utils/nodeUpdater.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/utils/nodeUpdater.ts): Dynamically maps user UI updates and sequencer steps to target Web Audio `AudioParam` inputs.

### UI Components & Orchestration

- **Main Views**:
  - [App.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/App.tsx): Main application viewport. Manages layout, overlays, and renders the widescreen grid.
  - [index.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/index.tsx): Application mounting and entry point.
- **Controllers & State Hooks**:
  - [hooks/useSynth.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/hooks/useSynth.tsx): Coordinates voice allocation, midi note triggers, and UI-to-DSP parameters.
  - [hooks/useSequencerSystem.ts](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/hooks/useSequencerSystem.ts): Precision timer scheduler driving step sequencer ticks.
  - [hooks/useRecorder.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/hooks/useRecorder.tsx): Handles tape recording state and exports.
- **UI Modular Layouts**:
  - [components/FloatingWindow.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/components/FloatingWindow.tsx): Custom draggable, resizable wrapper panel with focus bounds check.
  - [components/RackSection.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/components/RackSection.tsx): Tab-controller managing Modulation, Sequencer, Matrix, and Effects subviews.
  - [components/VisualizerSection.tsx](file:///c:/Users/nilay/Documents/repo/nn/tether-synth/components/VisualizerSection.tsx): Draws real-time canvas visualizers for the Oscilloscope and Spectrum Analyzer.

---

## 4. Getting Started & Development

### Local Installation

1. Clone this repository to your local machine.
2. Install the project dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

### Production Build & Deployment

To build the project for production distribution:

1. Run the compilation script:
   ```bash
   npm run build
   ```
2. The production bundle is outputted to the `dist/` directory.
3. You can preview the compiled build locally:
   ```bash
   npm run preview
   ```

---

## 5. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
