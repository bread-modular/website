---
title: MIDI Connectivity
summary: Connect MIDI devices to Bread Modular and make sounds.
---

Most Bread Modular modules accept MIDI and can be controlled via MIDI. To connect a MIDI device, we will use the [MIDI](/modules/midi) module.

You can listen to the final patch below:

[soundcloud 2161173048 /]

## MIDI Device

You can use almost any MIDI device with a DIN or TRS MIDI output. If your device has a TRS socket, use any stereo TRS cable to connect to the MIDI module. If your device has a DIN MIDI output, use a [DIN‑to‑TRS](https://www.amazon.com/s?k=MIDI+to+TRS) converter cable.

> Make sure to check whether your device uses Type A or Type B TRS MIDI. You can check [here](https://minimidi.world) for more details. If your device has a DIN MIDI output, check the converter cable to see whether it is Type A or Type B.
>
> Once you determine the type, set it using the jumper on the MIDI module. It’s located at the bottom‑right of the module.

If you don't have a MIDI device, you can use your DAW (Digital Audio Workstation) to send MIDI. Your audio interface may have a DIN MIDI output; you can use that to connect to the MIDI module.

## MIDI Sequence

For this patch, send a simple MIDI sequence like this:

* It’s on **channel 1**.
* It’s 1 bar long.
* It uses a 4/4 time signature.
* It uses 1/16 notes (16 steps total).
* It has notes on steps 1, 3, 5, 9, and 13 (four‑on‑the‑floor with the 3rd step accented).
* All notes except the 3rd step are **E3**. The 3rd step is **D4**.

> You don't have to use this exact sequence. This is just a simple sequence to demonstrate the patch.

## Initial Patch

Here we use the [MCO](/modules/mco) module as the sound source.

[patch]
midi:MIDI[1] -> mco:MIDI
mco:OUT -> imix:1
imix:MIXOUT -> base:L

---knobs
mco:DETUNE@0.0 In this position, it adds another oscillator detuned by 12 semitones (1 octave).
mco:MIX@1.0 This is the mix level of the detuned oscillator. At 1.0, you will get the full sound.
imix:1@0.2 MCO outputs square waves, which are quite loud, so keep this low.

[/patch]

Check the knob positions and click them to learn what they do.

Now, when you play the MIDI sequence, you should hear a continuous oscillator output: a loud, detuned square wave.

## Let's Make It a Fat Bass

Now we’ll add a low‑pass gate using the [LOW](/modules/low) module and distortion using the [DRIVE](/modules/drive) module.

[patch]
midi:MIDI[1] -> mco:MIDI
mco:OUT -> low:AUDIO
mco:GATE -> low:GATE/CV
low:OUT -> drive:AUDIO
drive:CLEN -> imix:1
imix:MIXOUT -> base:L

---knobs
mco:DETUNE@0.0 In this position, it adds another oscillator detuned by 12 semitones (1 octave).
mco:MIX@1.0 This is the mix level of the detuned oscillator. At 1.0, you will get the full sound.

imix:1@0.4 MCO outputs square waves, which are quite loud, so keep this low.

low:CUTOFF@0.85 This is the cutoff frequency of the low‑pass gate. Increasing it to 1.0 can cause the gate to leak.

drive:OD1@1.0 This is the tone shaper (upper half of the waveform); turning right adds more harmonics.
drive:OD2@0.9 This is the tone shaper (lower half of the waveform); turning right adds more harmonics.
drive:GAIN@0.9 This is the amount of distortion. Increase it to add more drive.

[/patch]

This patch borrows heavily from the [Overdrive / Distortion](/docs/patch-ideas/overdrive-distortion) patch. Give that a try first if you haven’t already.
