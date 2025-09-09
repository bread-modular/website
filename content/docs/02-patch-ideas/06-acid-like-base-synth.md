---
title: ACID‑Like Bass Synth
summary: Build an acid‑style bass synth using the SVF filter and friends
---

In this patch, we’ll build a classic acid bass synth using the [SVF](/modules/svf) filter (especially its resonance), along with the [8bit](/modules/8bit) and [ENV](/modules/env) modules.

Hear how it sounds:

[soundcloud 2167369494 /]

> This patch assumes you’ve built the rest of the [patches](/docs/patch-ideas), as we derive some ideas from them.

## Initial Patch

Let’s patch it:

[patch]

midi:MIDI[1] -> 8bit:MIDI
8bit:MIDI -> env:MIDI
8bit:AUDIO -> svf:AUDIO
env:ENV -> svf:CV
svf:LF -> imix:1
imix:MIXOUT -> base:L

---knobs

8bit:CV1@0.2 This knob has no effect in MIDI mode (MODE = LED_ON).
8bit:CV2@1.0 So, it mixes the second oscillator (OSC2) in full.
8bit:LOWPASS@0.0 Low‑pass filter is off.

env:CV1@0.0 In this mode, this controls hold. Try increasing it.
env:CV2@0.0 In this mode, this controls release. Try increasing it.

svf:RESONANCE@0.2 Resonance amount. Increase for a more pronounced effect.
svf:FREQ_CURVE@0.0 Frequency curve (range) of the cutoff. At this setting, it has the full range.
svf:CUTOFF@0.3 Cutoff frequency. Increase to hear more high frequencies.

imix:1@0.9 The SVF output is relatively low, so increase the mix level.


---states
8bit:MODE = LED_ON; enables receiving MIDI notes
env:MIDI_GATE = LED_ON; hold the MIDI_GATE button for 500 ms so the ENV module accepts MIDI
env:ALGO_SELECT = BLINK_ONCE; press the ALGO_SELECT button for 500 ms to change the algorithm. Set to the 1st algorithm (HOLD‑RELEASE).

[/patch]

> Send some MIDI notes. Use a common acid pattern, or place notes on the odd steps of a 16‑step sequence (1, 3, 5, 7, 9, 11, 13, 15) — or on all steps. Add accents by changing the notes on selected steps.

Try adjusting the ENV and SVF knobs to hear how they affect the sound. Hover over knobs to see their functions.

## Extra Tweaks

This is the basic patch. Try these tweaks to make it more interesting:

* Use the HF (high‑pass) and BP (band‑pass) outputs instead of the LF (low‑pass) output of the SVF module.
* Add the [DRIVE](/modules/drive) after the SVF to introduce distortion.
* Use the [MCO](/modules/mco) module instead of 8bit for the basic sound source.
* Add the [V2CA](/modules/v2ca) after the SVF for VCA control (use the same envelope for the V2CA).
* Use a different envelope for the ENV module (try a second ENV or a GATE).

