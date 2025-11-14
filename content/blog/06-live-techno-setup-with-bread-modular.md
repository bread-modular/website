---
title: A Live Techno Setup with Bread Modular
date: 2025-11-14
author: Bread Modular Team
summary: Here we will go through a live techno setup we can build with Bread Modular
image: /images/blog/bread-modular-with-friends.jpg
---

This is how we can use Bread Modular to make a live techno setup. It features the following voices:

* 12-voice drum sampler (for kicks & other samples)
* An analog hi-hat setup
* A supersaw bass voice
* An ACID-like bass voice
* 9-voice polysynth with a Moog-like filter

In addition to the above:

* All these voices go through a dedicated overdrive
* There are 2 digital send effects, which can be customized as needed (Reverb, Delay, Flanger, etc)

## 1. Mixer Setup

First, let's look at how to connect the mixer. For now, we don't set up any sends & returns. We will do it later.

[patch]
4mix:OD_C -> base:L

---knobs
4mix:MIX_GAIN@0.8 This controls the overall volume of all the channels
4mix:DRIVE_SHAPE@0.0 There is no overdrive shaping. So, currently this acts as a soft limiter.
4mix:DRIVE_GAIN@0.5 We add some overdrive (currently this acts as a pre-amp)

[/patch]

## 2. Drum Sampler

Here we use our 16bit module as a drum sampler. We also connect a MCC module for additional parameter control. Do not worry about it for now.

[patch]
midi:MIDI[1] -> mcc:MIDI
mcc:MIDI -> 16bit:MIDI
16bit:A1 -> drive:AUDIO
drive:CLEN -> imix:1
imix:MIXOUT -> 4mix:M

---knobs
16bit:CV1@0.0 This is the highpass filter. Turn clockwise to enable it.
16bit:CV2@0.0 This is the lowpass filter. Turn clockwise to enable it.

drive:OD1@0.0 Tone shaper for the upper half of the waveform; turning it clockwise adds more harmonics.
drive:OD2@0.0 Tone shaper for the lower half of the waveform; turning it clockwise adds more harmonics.
drive:GAIN@0.5 Distortion amount. Increase it to add more drive.

imix:1@0.8 This controls the overall gain of the channel

[/patch]

In this patch, we are not connecting the drum sampler to the `4mix`. Instead, we send it through a simple mixer called `imix`.
Then we feed the output of the `imix` to the `M` input of the `4mix`. This input directly sends to the output without any volume control. This feature allows you to daisy chain multiple mixers.

## 3. Analog Hi-Hat

This is a noise-based analog hi-hat module.

[patch]
midi:MIDI[2] -> noise:MIDI
noise:MIDI -> hihat:MIDI
noise:BLUE -> hihat:NOISE
hihat:AUDIO -> 4mix:1
[/patch]

## 4. Supersaw Bass Voice

[patch]
midi:MIDI[5] -> 8bit:MIDI
8bit:AUDIO -> low:AUDIO
8bit:GATE -> low:GATE/CV
low:AUDIO -> drive:AUDIO
drive:CLEN -> 4mix:2
[/patch]

## 5. ACID Bass Voice

[patch]
midi:MIDI[6] -> mco:MIDI
mco:MIDI -> env:MIDI
mco:OUT -> svf:AUDIO
env:ENV -> svf:CV
svf:LF -> v2ca:IN1
env:ENV -> v2ca:CV1
v2ca:OUT1 -> drive:AUDIO
drive:CLEN -> 4mix:3
[/patch]

## 6. Polysynth

[patch]
midi:MIDI[6] -> mcc:MIDI
mcc:MIDI -> 16bit:MIDI
16bit:A1 -> drive:AUDIO
drive:CLEN -> 4mix:4
[/patch]