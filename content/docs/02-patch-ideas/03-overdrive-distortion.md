---
title: Overdrive / Distortion
summary: Add warmth and character to your audio by applying analog distortion.
---

Here are trying to add analog distrotion to an audio signal. We will use the same patch we used in the [Supersaw Bass](/docs/patch-ideas/supersaw-bass) patch.

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
8bit:CV1@0.25 This is the frequency of the oscillator. You can manually change it.
8bit:CV2@1.0 Keep this at 1.0 to get the full supersaw sound.
8bit:LOWPASS@0 Keep this at 0 as we need all the harmonics.
imix:1@0.4 You can control the volume with this knob.
low:CUTOFF@0.85 This is the cutoff frequency of the low-pass gate. Increasing it up to 1.0 can cause the gate to leak.

drive:OD1@1.0 This is the tone shaper(for upper half of the waveform), basically turning right will add more harmonics.
drive:OD2@0.9 This is the tone shaper(for lower half of the waveform), basically turning right will add more harmonics.
drive:GAIN@0.9 This is the amount of distortion. Increase it to add more distortion.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change the mode.
[/patch]

If you follow the Supersaw Bass patch, the only new thing here is the [DRIVE](/modules/drive) module. It has three knobs:

- **OD1**: This is the tone shaper for the upper half of the waveform. Turning it to the right will add more harmonics.
- **OD2**: This is the tone shaper for the lower half of the waveform. Turning it to the right will add more harmonics.
- **GAIN**: This is the amount of distortion. Increase it to add more distortion.

The starting points for knobs for this patch is mentioned in the patch above. Feel free to experiment with the knobs and see how it changes the sound. Hover over each knob to learn what it does.

## CLEN vs DIRTY

The DRIVE module has two outputs: **CLEN** and **DIRTY**. CLEN is a milder distortion, while DIRTY is a more aggressive distortion. You can try both and see which one you like more. 

Usually with CLEN, if you set OD1 and OD2 to 0.0 position (left most position), it just an amplifier. But with DIRTY, even at 0.0 position, it adds some distortion.
