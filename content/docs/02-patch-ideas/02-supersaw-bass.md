---
title: Supersaw Bass
summary: Create a supersaw bass with a 8bit oscillator and a Lowpass Gate.
---

Here we are trying to create a fat supersaw bass using a 8bit digital oscillator paired with an analog Lowpass Gate.

> 8bit oscillators are noisy. But it's perfect for this patch since low pass gate will take care of filtering out noise musically.

You can listen to the patch below:

[soundcloud 2154553752 /]

## Supersaw Drone

First let's make a supersaw drone sound. Basically, it's just the 8bit oscillator output. Patch it like this:

[patch]
8bit:AUDIO -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This is the frequency of the oscillator. You can manually change it.
8bit:CV2@1.0 This is mix level of the detuned second oscillator. For a supersaw sound, you can set it to 1.0.
8bit:LOWPASS@0 This is built-in lowpass filter. You can increase it to reduce upper harmonics.
imix:1@0.5 You can control the volume with this knob

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change the mode. LED_OFF means we can control the frequency manually, otherwise it will listen to MIDI notes.
8bit:APP = SAW
[/patch]

> Make sure the 8bit's MODE is off. (which is the LED OFF state). If not hold the MODE button for a second to turn it off. This way you can control the frequency manually with the CV1 knob.

Now try to play with the knobs and listen to the sound.

## Adding the Lowpass Gate

In Bread Modular, our Lowpass Gate is the [LOW](/modules/low) module. Let's patch it:

[patch]
8bit:AUDIO -> low:AUDI0
base:V+ -> low:GATE/CV
low:AUDIO -> imix:1
imix:MIXOUT -> base:L

---knobs
8bit:CV1@0.25 This is the frequency of the oscillator. You can manually change it.
8bit:CV2@1.0 Keep this at 1.0 to get the full supersaw sound.
8bit:LOWPASS@0 Keep this at 0 as we need all the harmonics.
imix:1@0.5 You can control the volume with this knob.
low:CUTOFF@0.85 This is the cutoff frequency of the lowpass gate. Increasing upto 1.0 leads to leaking the gate.
---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change the mode. LED_OFF means we can control the frequency manually, otherwise it will listen to MIDI notes.
8bit:APP = SAW
[/patch]