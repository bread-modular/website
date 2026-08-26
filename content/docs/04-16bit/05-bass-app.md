---
title: App - Monosynth
summary: Learn about the monophonic Pulsar-23 "BASS"-style synth with a shape-morphing oscillator and a knob-motion recorder.
---

This is a monophonic synth inspired by the Pulsar-23 "BASS" voice in percussion mode. It runs a shape-morphing DCO through a tanh "WARP" drive and a resonant low-pass filter before the amp envelope.

The oscillator has a fixed percussive pitch-drop after each note-on, giving it a driving bass-drum character.

## Envelope & CV Controls

The amp envelope's attack and release are controlled with the CV1 and CV2 knobs of the 16bit module:

1. **CV1** - Attack time (1 - 500 ms)
2. **CV2** - Decay / release time (10 - 1000 ms)

The MIDI gate sustains the note at its peak while the key is held, and MIDI velocity controls the amplitude (there is no volume knob).

## MCC Controls

To access the sound-shaping controls, use the [MCC](/docs/16bit/mcc-module) module and select bank A (CC20 - CC23):

1. **BODY** (CC20) - Raises the harmonic shape (SHAPE) and the tanh drive (WARP) together
2. **UNISON** (CC21) - The lower half of the knob stacks voices 1 → 4, while the upper half adds detune spread. This replaced the old chorus/doubler effect (a fixed two-tap delay)
3. **RESONANCE** (CC22) - Controls the resonance of the filter
4. **CUTOFF** (CC23) - Uses an inverted taper: turning clockwise closes the filter. It sweeps only the usable range and parks at roughly 140 Hz when fully clockwise. The placement matches the Polysynth, so your MCC muscle memory carries over between apps

## Motion Recorder

The app has a hardware motion recorder that records your knob movements and loops them back. It uses the MODE board button and its LED. Click MODE to cycle through the states:

1. **LIVE** - The default state. The knobs drive the sound as usual.
2. **RECORDING** - The LED blinks while every MIDI-clock tick (24 PPQN) records the raw CV1/CV2 values along with bank A CC20 - CC23. The knobs still drive the sound while recording.
3. **PLAYBACK** - When the take completes, the LED turns solid and the loop replays your attack/decay and bank-A parameter movements. Manual CV changes are ignored during playback.

A take is always four bars of 4/4 (384 MIDI-clock frames). Clicking MODE aborts an incomplete take (it is discarded) or stops playback and returns to LIVE, where the knobs take over immediately.

Additional notes:

* MIDI Start rewinds the active take/loop, and MIDI Stop freezes the playhead until the next tick.
* A running MIDI clock is required for recording and playback.
* Takes are stored in RAM only.
