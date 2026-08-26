---
title: Crash - 8bit Firmware
summary: Learn about the Crash firmware of 8bit. It's a synthesized TR-808-style crash cymbal.
---

This 8bit firmware generates a TR-808-style crash cymbal. Unlike sample-based drums, the crash is synthesized entirely in real time — rendered inside a timer interrupt and written straight to the 8-bit DAC audio output.

It responds to MIDI note-on messages with a short, self-decaying metallic ring. The crash rings out on its own instead of hanging for the full gate, so even a long held note gives you a short, punchy crash.

## Features

- **Synthesized Crash Cymbal**: TR-808-style crash rendered in real time on the ATtiny1616 — not sample-based
- **Self-Decaying Ring**: The sound rings out on its own instead of sustaining for the length of the gate
- **Velocity Sensitive**: Note velocity controls the loudness of the crash
- **CV Inputs**:
  - CV1 for metallic pitch/brightness/color
  - CV2 for hiss/metal balance
- **CV Motion Recorder**: Record a four-bar CV performance on the MIDI-clock grid and auto-loop it
- **LED Indicator**: Shows the motion recorder state (blinks while recording, solid during playback)

## Installation

8bit contains a ATTINY 1616 MCU. To program & install the firmware follow this [guide](/docs/technical-details/programming-digital-modules).

The firmware is located at [modules/8bit/code/crash](https://github.com/bread-modular/bread-modular/tree/main/modules/8bit/code/crash) in the [code repository](https://github.com/bread-modular/bread-modular).

## Controls

### MIDI Control

The crash is triggered via MIDI:

- **Note On**: Fires the crash cymbal. Every note triggers the same crash (note data is ignored)
- **Velocity**: Controls the loudness of the hit

### CV Inputs

#### CV1 (Metallic Pitch)

- **Function**: Sets the base frequency of the inharmonic partials
- **Range**: 80 Hz to 1200 Hz
- **Behavior**: Shapes the pitch, brightness, and overall color of the metallic ring
- **Always Active**: Changes are applied continuously while playing

#### CV2 (Hiss/Metal Balance)

- **Function**: Blends between the tonal metal ring and sizzle/hiss noise
- **Behavior**:
  - At minimum, you hear a pure tonal metal ring
  - As CV2 increases, more sizzle/hiss noise is blended in
- **Always Active**: Sweep CV2 during playback for evolving cymbal textures

### Audio Output

The synthesized crash is rendered to the single 8-bit DAC audio output.

## CV Motion Recorder

The crash firmware includes the same CV motion recorder as the Monosynth app on 16bit. Click the MODE button to record and loop your CV movements:

1. **LIVE** - The default state. CV1 and CV2 directly control the crash.
2. **RECORDING** - Click MODE once. The LED blinks and a four-bar take of CV1/CV2 values is recorded on the MIDI-clock grid.
3. **PLAYBACK** - When the take completes, the LED turns solid and the recorded CV performance auto-loops. Click MODE again to return to LIVE.

Clicking MODE while still recording discards the partial take. MIDI Start rewinds the active loop. Just like recording, playback requires a running MIDI clock.
