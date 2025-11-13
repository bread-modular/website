---
title: Introduction to Modular with Bread Modular
date: 2025-11-13
author: Bread Modular Team
summary: An introduction to Bread Modular with some example patches.
image: /images/blog/bread-modular-with-friends.jpg
---

Bread Modular is a modular synth platform built from scratch. Unlike VCV Rack, which is based on the Eurorack standard, Bread Modular takes a completely different approach. However, the core concepts you've learned still apply.

This guide will help you map your modular knowledge to Bread Modular.

## 0. About Bread Modular

1. You can power a Bread Modular case over USB-C, making it truly portable.
2. Both headphone and line-level outputs are built into the base.
3. You can host up to 12 modules in a single base.
4. Most modules accept MIDI, giving you more control with fewer cables.
5. The platform runs on 3.3 V, so analog circuits such as Moog-style filters and noise generators are harder to implement; we often rely on digital solutions instead.
6. It is more affordable than Eurorack, though it is still expensive.

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

## 4. Using Overdrive

This patch builds on the previous one, but the SVF output now runs through an overdrive module.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
drive:CLEN -> 4mix:1
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

4mix:CH1@0.8 This controls the channel 1 (8bit) volume.
4mix:MIX_GAIN@0.8 This controls the master volume of the mixer.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

drive:OD1@0.0 Tone shaper for the upper half of the waveform; turning it clockwise adds more harmonics.
drive:OD2@0.0 Tone shaper for the lower half of the waveform; turning it clockwise adds more harmonics.
drive:GAIN@0.5 Distortion amount. Increase it to add more drive.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

> Increase OD1, OD2, and GAIN to hear how the overdrive reshapes the sound.

## 5. Let's Use an LFO

This patch is similar to the previous one, but the SVF cutoff frequency is modulated by an LFO.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
lfo:AUDIO -> svf:CV
drive:CLEN -> 4mix:1
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

4mix:CH1@0.8 This controls the channel 1 (8bit) volume.
4mix:MIX_GAIN@0.8 This controls the master volume of the mixer.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

drive:OD1@0.0 Tone shaper for the upper half of the waveform; turning it clockwise adds more harmonics.
drive:OD2@0.0 Tone shaper for the lower half of the waveform; turning it clockwise adds more harmonics.
drive:GAIN@0.5 Distortion amount. Increase it to add more drive.

lfo:CV1@0.3 LFO frequency, ranging from 0.1 Hz to 20 Hz.
lfo:CV2@0.0 LFO waveform shaper. At 0.0 it’s a sine wave; turning it clockwise morphs it into triangle, sawtooth, complex, and random waveforms.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

> Here, the LFO is an 8bit module running the LFO firmware.

## 6. Using a VCA

Here we control a VCA with an LFO.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
lfo:AUDIO -> v2ca:CV1
drive:CLEN -> v2ca:IN1
v2ca:OUT1 -> 4mix:1
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

4mix:CH1@0.8 This controls the channel 1 (8bit) volume.
4mix:MIX_GAIN@0.8 This controls the master volume of the mixer.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

drive:OD1@0.0 Tone shaper for the upper half of the waveform; turning it clockwise adds more harmonics.
drive:OD2@0.0 Tone shaper for the lower half of the waveform; turning it clockwise adds more harmonics.
drive:GAIN@0.5 Distortion amount. Increase it to add more drive.

lfo:CV1@0.3 LFO frequency, ranging from 0.1 Hz to 20 Hz.
lfo:CV2@0.0 LFO waveform shaper. At 0.0 it’s a sine wave; turning it clockwise morphs it into triangle, sawtooth, complex, and random waveforms.

v2ca:CURVE1@0.0 This controls the VCA response curve. At 0.0 the VCA stays snappy; turning it clockwise softens the shape.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]


## 7. Using an Envelope

Here we use an envelope to control the VCA, with MIDI triggering the articulation.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
drive:CLEN -> v2ca:IN1
v2ca:OUT1 -> 4mix:1
midi:MIDI[1] -> env:MIDI
env:ENV -> v2ca:CV1
4mix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

4mix:CH1@0.8 This controls the channel 1 (8bit) volume.
4mix:MIX_GAIN@0.8 This controls the master volume of the mixer.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

drive:OD1@0.0 Tone shaper for the upper half of the waveform; turning it clockwise adds more harmonics.
drive:OD2@0.0 Tone shaper for the lower half of the waveform; turning it clockwise adds more harmonics.
drive:GAIN@0.5 Distortion amount. Increase it to add more drive.

env:CV1@0.0 In this algorithm, this knob sets the hold time. Try increasing it.
env:CV2@0.0 In this algorithm, this knob sets the release time. Try increasing it.

v2ca:CURVE1@0.0 This controls the VCA response curve. At 0.0 the VCA stays snappy; turning it clockwise softens the shape.


---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.

env:MIDI_GATE = LED_ON; hold the MIDI_GATE button for 500 ms so the ENV module accepts MIDI.
env:ALGO_SELECT = BLINK_ONCE(ON RESET); press the ALGO_SELECT button for 500 ms to change the algorithm. Set it to the first algorithm (HOLD-RELEASE).
[/patch]

> The LFO isn’t part of this patch, so try routing it to the SVF cutoff for additional movement.

With these building blocks, you can translate your modular experience to Bread Modular and start exploring more advanced combinations. Happy patching!