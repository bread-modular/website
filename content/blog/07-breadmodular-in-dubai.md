---
title: Bread Modular Introduction; Dubai Edition
date: 2025-12-25
author: Bread Modular Team
summary: This is an introduction to Bread Modular tutorial we created for the Dubai 2025 workshop.
image: /images/home-slide/03.jpg
---

Bread Modular follows core Eurorack Modular concepts but takes a completely different approach. This guide will help you map your modular synth knowledge to Bread Modular.

## 0. About Bread Modular

1. You can power a Bread Modular case over USB-C, making it truly portable.
2. Both headphone and line-level outputs are built into the base.
3. You can host up to 12 modules in a single base.
4. Most modules accept MIDI, giving you more control with fewer cables.
5. The platform runs on 3.3 V, so analog circuits such as Moog-style filters and noise generators are harder to implement; we often rely on digital solutions instead.
6. It is more affordable than Eurorack, though it is still somewhat pricey.

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


## 2. Using a Filter

Here we use a filter to shape the Supersaw sound.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

imix:1@0.5 This controls the channel 1 (8bit) volume.

svf:RESONANCE@0.5 Resonance amount. Increase it for a more pronounced effect.
svf:FREQ_CURVE@0.5 Cutoff frequency range. Turning it clockwise narrows the range.
svf:CUTOFF@0.5 Cutoff frequency. Adjust it to hear how the tone changes.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

## 3. Using Overdrive

This patch builds on the previous one, but the SVF output now runs through an overdrive module.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
drive:CLEN -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

imix:CH1@0.8 This controls the channel 1 (8bit) volume.

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

## 4. Let's Use an LFO

This patch is similar to the previous one, but the SVF cutoff frequency is modulated by an LFO. For the LFO, we use the WAVE module configured with the LFO range.

> Here we need to connect the LFO column in the WAVE module config with a short patch cable to activate the LFO range of the waveform generator.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
wave:TRI -> svf:CV
drive:CLEN -> 4mix:1
4mix:MIXOUT -> base:L

wave:CONFIG -> wave:LFO

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

wave:FREQ@0.6 LFO frequency
wave:FINE@1.0 Fine tune the LFO frequency

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

## 5. Using an Envelope Generator

Currently, we use a Triangle waveform for the SVF CV. We can shape it further with an envelope generator. Now we feed the square wave output of the WAVE module into the ENV module.

[patch]

8bit:AUDIO -> svf:AUDIO
svf:LF -> drive:AUDIO
wave:SQR -> env:GATE
env:ENV -> svf:CV
drive:CLEN -> 4mix:1
4mix:MIXOUT -> base:L

wave:CONFIG -> wave:LFO

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

wave:FREQ@0.6 LFO frequency
wave:FINE@1.0 Fine tune the LFO frequency

env:CV1@0.2 In this algorithm, this knob sets the attack time. Try increasing it.
env:CV2@0.0 In this algorithm, this knob sets the release time. Try increasing it.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.

env:MIDI_GATE = LED_OFF; hold the MIDI_GATE button for 500 ms so the ENV module accepts MIDI.
env:ALGO_SELECT = BLINK_TWICE; Power reset the board to see the blink. Press the ALGO_SELECT button for 500 ms to change the algorithm. Set it to the second algorithm (ATTACK-RELEASE).
[/patch]

## 6. Using a VCA

Additionally, we can use a VCA to shape the sound further. Currently, the `SVF` module turns off the volume because of the cutoff frequency modulation. But we can use a VCA to add more control. We can use the `V2CA` module for that.

[patch]

8bit:AUDIO -> svf:AUDIO
wave:SQR -> env:GATE
env:ENV -> svf:CV
svf:LF -> v2ca:IN1
wave:SQR -> v2ca:CV1
v2ca:OUT1 -> drive:AUDIO
drive:CLEN -> 4mix:1
4mix:MIXOUT -> base:L

wave:CONFIG -> wave:LFO

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

wave:FREQ@0.6 LFO frequency
wave:FINE@1.0 Fine tune the LFO frequency

env:CV1@0.2 In this algorithm, this knob sets the attack time. Try increasing it.
env:CV2@0.0 In this algorithm, this knob sets the release time. Try increasing it.

v2ca:CURVE1@0.0 This controls the VCA response curve. At 0.0 the VCA stays snappy; turning it clockwise softens the shape.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.

env:MIDI_GATE = LED_OFF; hold the MIDI_GATE button for 500 ms so the ENV module accepts MIDI.
env:ALGO_SELECT = BLINK_TWICE; Power reset the board to see the blink. Press the ALGO_SELECT button for 500 ms to change the algorithm. Set it to the second algorithm (ATTACK-RELEASE).
[/patch]

## 7. Adding Noise into the Input Sound

We can add noise to the input sound of the `SVF` module to make it more interesting. We can use another mixer to mix 8bit and noise sounds. But for now, we will use a `MULT` as a passive mixer.

There's a `MULT` available in the `SVF` module's input section.

This is how you can do it:

[patch]
8bit:AUDIO -> svf:MULT
noise:PINK -> svf:MULT
svf:MULT -> svf:AUDIO

---knobs
noise:TONE@0.1 This controls the core tone of the noise. Turning it clockwise increases the sampling interval, which changes the character of the noise.
noise:PINK_TONE@0.1 You can use this as an attenuator for the noise. Turning it clockwise reduces the noise (or technically low pass it.)

[/patch]


Happy patching!