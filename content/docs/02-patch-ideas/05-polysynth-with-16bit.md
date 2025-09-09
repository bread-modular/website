---
title: Polysynth with 16bit
summary: A 9 voice polysynth patch using the 16bit & MCC module. It features a moog like filter.
---

16bit is our versatile digital module that can load different apps using a simple Web UI. You can pair it with MCC modules to control parameters with additional knobs. 

In this patch, we’ll use the Polysynth app, which features 9 voices of polyphony with a Moog‑style filter.

This is how it sounds like:

[soundcloud 2164849566 /]

## Initial Requirements

* We are using MIDI to send notes. Make sure you know how MIDI works with Bread Modular, or follow the [MIDI Connectivity](/docs/02-patch-ideas/04-midi-connectivity) patch first.
* Make sure you are [familiar](/docs/16bit/introduction) with the 16bit module.
* Then [load](/docs/16bit/firmware-and-apps) the Polysynth app onto the 16bit module.

## Initial Patch

Let's patch it:

[patch]

midi:MIDI[1] -> mcc:MIDI
mcc:MIDI -> 16bit:MIDI
16bit:A1 -> imix:1
imix:MIXOUT -> base:L

---knobs

mcc:cv1@0.0 Envelope amount for the filter. At this setting it’s very fast.
mcc:cv2@0.0 Modulation amount for the filter. At this setting it’s not modulating.
mcc:cv3@0.0 Filter resonance. At this setting there is no resonance.
mcc:cv4@0.7 Low‑pass filter cutoff frequency. Turning left makes it brighter (more high frequencies).

16bit:cv1@0.0 Attack of the amp envelope. At this position it’s a fast attack.
16bit:cv2@0.4 Release of the amp envelope. At this position it’s a medium release.

imix:1@0.9 The 16bit output is relatively low, so increase the mix level.

---states
16bit:app = polysynth; Load the Polysynth app on the 16bit module.
mcc:bank = A; Filter controls are in bank A for the 16bit Polysynth app.

[/patch]

> Now send MIDI notes to channel 1 and the 16bit will receive them. Send chords or multiple notes at once to hear the polyphony and the filter in action.
>
> * In our demo, we send notes on the odd steps of a 16‑step sequence (1, 3, 5, 7, 9, 11, 13, 15).
> * For each step we play three notes: the current note, one octave down, and one octave up (e.g., for C4 we play C3, C4, and C5 together).
> * We use A3 on all steps except the 13th step, where we use G3 for emphasis.
> * Tempo: 138 BPM.

With this patch you’ll get a mellow sound due to the low cutoff frequency. Try changing CV4 on the MCC module to hear how it affects the sound.

## Filter Envelope

This Moog‑style filter has a performance envelope that modulates the cutoff frequency. The envelope triggers on every NOTE ON event.

[patch]

---knobs

mcc:cv1@0.5 Envelope amount for the filter. This controls both attack and release together. Adjust to hear how it changes the sound.
mcc:cv2@0.5 Modulation amount for the filter cutoff from the envelope.
mcc:cv3@0.3 Filter resonance. The envelope effect is more pronounced with higher resonance.
mcc:cv4@0.7 Low‑pass filter cutoff frequency. Turning left makes it brighter (more high frequencies).

---states
mcc:bank = A; Filter controls are in bank A for the 16bit Polysynth app.

[/patch]

> Here we increase the resonance (CV3) slightly so the filter envelope is more pronounced.

MCC CV1 controls the envelope amount. Here it controls both attack and release at once. Adjust it to hear how the sound changes.

MCC CV2 controls the modulation amount of the filter cutoff from the envelope.

## Using Drive

The 16bit output is relatively low, so you can use the Drive module to increase the volume. Increasing OD1 and OD2 adds harmonics to the sound too, which can be interesting.

[patch]

midi:MIDI[1] -> mcc:MIDI
mcc:MIDI -> 16bit:MIDI
16bit:A1 -> drive:AUDIO
drive:CLEN -> imix:1
imix:MIXOUT -> base:L

---knobs

mcc:cv1@0.0 Envelope amount for the filter. At this setting it’s very fast.
mcc:cv2@0.0 Modulation amount for the filter. At this setting it’s not modulating.
mcc:cv3@0.0 Filter resonance. At this setting there is no resonance.
mcc:cv4@0.7 Low‑pass filter cutoff frequency. Turning left makes it brighter (more high frequencies).

16bit:cv1@0.0 Attack of the amp envelope. At this position it’s a fast attack.
16bit:cv2@0.4 Release of the amp envelope. At this position it’s a medium release.

drive:OD1@0.0 Tone shaper (upper half of the waveform); turning right adds more harmonics.
drive:OD2@0.0 Tone shaper (lower half of the waveform); turning right adds more harmonics.
drive:GAIN@0.3 Amount of distortion. Increase to add more gain.

imix:1@0.9 The 16bit output is relatively low, so increase the mix level.

---states
16bit:app = polysynth; Load the Polysynth app on the 16bit module.
mcc:bank = A; Filter controls are in bank A for the 16bit Polysynth app.

[/patch]