---
title: Introduction to Modular with Bread Modular
date: 2025-11-13
author: Bread Modular Team
summary: An introduction to Bread Modular with some example patches.
image: /images/blog/bread-modular-with-friends.jpg
---

Bread Modular is a modular synth platform built from scratch. Unlike VCVRack, which is based on the Eurorack standard, Bread Modular takes a completely different approach. However, the core concepts you've learned still apply.

This guide will help you map your modular knowledge to Bread Modular.

## 1. Supersaw Oscillator

The 8bit Supersaw oscillator is a good starting point. It has two sawtooth oscillators running one octave apart.

[patch]
8bit:AUDIO -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

> The diagram above shows how to patch modules in Bread Modular and the recommended knob positions for this setup. Hover over a knob to see how changing it affects the sound.
>
> It also indicates any available mode states. In this patch, it highlights the MODE LED.

## 2. Mixing with Noise

Here we mix noise with the Supersaw oscillator to create a more complex waveform.

[patch]

8bit:AUDIO -> 4mix:1
noise:WHITE -> 4mix:2
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

noise:TONE@0.0 This controls the core tone of the noise. Turning it clockwise increases the sampling interval, which changes the character of the noise.

4mix:CH1@0.5 This controls the channel 1 (8bit) volume.
4mix:CH2@0.5 This controls the channel 2 (noise) volume.
4mix:MIX_GAIN@0.8 This is the master volume control for the mixer.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

## 3. Using a Filter

Here we use a filter to shape the Supersaw sound.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> 4mix:1
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

4mix:CH1@0.5 This controls the channel 1 (8bit) volume.
4mix:MIX_GAIN@0.8 This controls the master volume of the mixer.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]