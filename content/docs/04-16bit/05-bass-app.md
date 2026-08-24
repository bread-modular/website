---
title: App - Monosynth
summary: Learn about the monophonic Pulsar-23 "BASS"-style synth with a shape-morphing oscillator.
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

1. **BODY** (CC20) - Controls the harmonic shape (SHAPE) and the tanh drive (WARP) together
2. **CHORUS / DOUBLER** (CC21) - Adds a pitch-stable, two-tap fixed delay
3. **CUTOFF** (CC22) - Controls the low-pass filter cutoff
4. **RESONANCE** (CC23) - Controls the resonance of the filter
