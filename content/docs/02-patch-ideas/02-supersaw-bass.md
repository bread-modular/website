---
title: Supersaw Bass
summary: Create a supersaw bass with an 8-bit oscillator and a low-pass gate.
---

Here we are going to create a fat supersaw bass using an 8-bit digital oscillator paired with an analog low-pass gate.

> 8-bit oscillators are noisy, but that's perfect for this patch since the low-pass gate will musically filter out the noise.

You can listen to the patch below:

[soundcloud 2154642363 /]

## Supersaw Drone

First, let's make a supersaw drone.

[patch]
8bit:AUDIO -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This is the frequency of the oscillator. You can manually change it.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.
imix:1@0.5 You can control the volume with this knob.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change the mode. LED_OFF means you can control the frequency manually; otherwise it will listen to MIDI notes.
[/patch]

> Make sure the 8bit's MODE is off (the LED OFF state). If not, hold the MODE button for a second to turn it off. This lets you control the frequency manually with the CV1 knob.

Now play with the knobs and listen to the sound.

## Adding the Low-pass Gate

In Bread Modular, the low-pass gate is the [LOW](/modules/low) module. Let's patch it:

[patch]
8bit:AUDIO -> low:AUDIO
NONE:NONE -> low:GATE/CV
low:AUDIO -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This is the frequency of the oscillator. You can manually change it.
8bit:CV2@1.0 Keep this at 1.0 to get the full supersaw sound.
8bit:LOWPASS@0 Keep this at 0 as we need all the harmonics.
imix:1@0.5 You can control the volume with this knob.
low:CUTOFF@0.85 This is the cutoff frequency of the low-pass gate. Increasing it up to 1.0 can cause the gate to leak.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change the mode.
[/patch]

**Here's the fun part:** there's a patch cable connected to the LOW module's GATE/CV input, but it's not connected to anything. That's intentional.

Touch it and you can now hear the bass sound. It needs some voltage to open the gate. You can tap into the 3.3V source located at the bottom left of the base. It's a 5-pin socket labeled +3V3.

> If it doesn't make a sound while you touch the cable, seems like your power outlet is grounding properly. In such case, connect another cable to 3.3V socket and touch that cable while holding the first cable.

Now experiment with the knobs and see how you can change the sound. Hover over each knob to learn what it does.
