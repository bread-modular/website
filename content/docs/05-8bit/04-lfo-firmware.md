---
title: LFO - 8bit Firmware
summary: Learn about the LFO firmware of 8bit. It's a low-frequency oscillator with morphing waveform support.
---

This 8bit firmware provides a low-frequency oscillator (LFO) with morphing waveform capabilities. It offers smooth modulation from 0.1 Hz to 20 Hz with continuous waveform blending between multiple shapes.

The LFO continuously generates modulation signals that can be used for controlling other modules, creating evolving textures, and adding movement to your patches.

## Features

- **Wide Frequency Range**: 0.1 Hz to 20 Hz LFO rate
- **Morphing Waveforms**: Continuous blending between sine, triangle, saw, Custom 1, Custom 2, and random waveforms
- **CV Inputs**: 
  - CV1 for LFO rate/frequency control
  - CV2 for waveform morphing
- **LED Indicator**: Visual feedback showing the current LFO output level
- **Curved Frequency Response**: Exponential frequency mapping for musical control
- **Dual Outputs**: AUDIO output for analog waveform modulation and GATE output for digital gate signals

## Installation

8bit contains a ATTINY 1616 MCU. To program & install the firmware follow this [guide](/docs/technical-details/programming-digital-modules).

The firmware is located at [modules/8bit/code/lfo](https://github.com/bread-modular/bread-modular/tree/main/modules/8bit/code/lfo) in the [code repository](https://github.com/bread-modular/bread-modular).

## Controls

### CV Inputs

#### CV1 (Rate)

- **Function**: Sets the LFO frequency/rate
- **Range**: 0.1 Hz to 20 Hz; the firmware clamps anything outside this span
- **Behavior**: Uses a curved mapping (cubic interpolation) for musical control, providing more resolution in the lower frequency range
- **Always Active**: The LFO rate updates continuously based on CV1 input

#### CV2 (Waveform Morph)

- **Function**: Selects and blends LFO waveforms including sine, triangle, saw, Custom 1, Custom 2, and random
- **Behavior**: 
  - When CV2 is at minimum (0V), the waveform is pure sine
  - As CV2 increases, it morphs through triangle, saw, Custom 1, Custom 2
  - When CV2 is at maximum, it becomes random
  - Smooth blending between adjacent waveforms provides continuous morphing
- **Always Active**: Waveform changes are applied continuously, so you can sweep CV2 for evolving modulation shapes

### LED Indicator

The LED provides visual feedback of the current LFO output level, pulsing and changing brightness as the waveform cycles. This gives you immediate visual confirmation of the LFO's activity and waveform shape.

## Outputs

### AUDIO

- **Function**: Outputs the LFO waveform as an analog voltage signal
- **Behavior**: Continuously outputs the current waveform shape (sine, triangle, saw, etc.) based on CV2 settings. Use this output to modulate other modules like filters, VCAs, or oscillators

### GATE

- **Function**: Outputs a digital gate signal based on the LFO waveform level
- **Behavior**: Goes HIGH when the waveform is above its midpoint, and LOW when below. This creates a gate signal that pulses at the LFO frequency, useful for triggering envelopes, sequencers, or other gate-driven modules

