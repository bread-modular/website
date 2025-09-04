---
title: Overdrive / Distortion
summary: Add warmth and character to your audio by applying analog distortion.
---

Here we’re adding analog distortion to an audio signal. We’ll start from the same setup used in the [Supersaw Bass](/docs/patch-ideas/supersaw-bass) patch.

You can listen to the patch below:

[soundcloud 2161127550 /]

## Adding Distortion

[patch]
8bit:AUDIO -> low:AUDIO
NONE:NONE -> low:GATE/CV
low:AUDIO -> drive:AUDIO
drive:CLEN -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This is the oscillator frequency. You can change it manually.
8bit:CV2@1.0 Keep this at 1.0 to get the full supersaw sound.
8bit:LOWPASS@0 Keep this at 0; we need all the harmonics.
imix:1@0.4 You can control the volume with this knob.
low:CUTOFF@0.85 This is the cutoff frequency of the low‑pass gate. Increasing it to 1.0 can cause the gate to leak.

drive:OD1@1.0 This is the tone shaper (upper half of the waveform); turning right adds more harmonics.
drive:OD2@0.9 This is the tone shaper (lower half of the waveform); turning right adds more harmonics.
drive:GAIN@0.9 This is the amount of distortion. Increase it to add more drive.

[/patch]

If you followed the Supersaw Bass patch, the only new thing here is the [DRIVE](/modules/drive) module. It has three knobs:

- **OD1**: This is the tone shaper for the upper half of the waveform. Turning it to the right will add more harmonics.
- **OD2**: This is the tone shaper for the lower half of the waveform. Turning it to the right will add more harmonics.
- **GAIN**: This is the amount of distortion. Increase it to add more distortion.

The starting points for the knobs are listed in the patch above. Feel free to experiment and hear how each control changes the sound. Hover over any knob to learn what it does.

## CLEN vs DIRTY

The DRIVE module has two outputs: **CLEN** and **DIRTY**. CLEN is milder; DIRTY is more aggressive. Try both and pick what you prefer.

Usually with CLEN, if you set OD1 and OD2 to 0.0 (leftmost), it’s just an amplifier. With DIRTY, even at 0.0, it adds some distortion.
