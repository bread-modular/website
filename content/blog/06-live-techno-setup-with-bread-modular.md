---
title: A Live Techno Setup with Bread Modular
date: 2025-11-14
author: Bread Modular Team
summary: Here we will go through a live Techno setup we can build with Bread Modular
image: /images/blog/bread-modular-with-friends.jpg
---

This is how we can use Bread Modular to make a Live Techno setup. It features following voices:

* 12 voice drum sampler (for kicks & other samples)
* An analog hithat setup
* A supersaw bass voice
* An ACID like bass voice
* 9 voice polysynth with a Moog like filter

In addition to above:

* All these voices go through a dedicated overdrive
* There are 2 digital send effects, which can customized as needed (Reverb, Delay, Flanger, etc)

## 1. Mixer Setup

First let's look at the how connect the mixer. For right now, we don't setup any sends & returns. We will do it later.

[patch]
4mix:OD_C -> base:L

---knobs
4mix:MIX_GAIN@0.8 This controls the overall volume of all the channels
4mix:DRIVE_SHAPE@0.0 There is no overdrive shaping. So, currently this is act as a soft limiter.
4mix:DRIVE_GAIN@0.5 We add some overdrive (currently this is act as a pre-amp)

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

In this patch, we are not connecting the drum sampler into the `4mix`. But instead, we send it through a simple mixer called `imix`.
Then we feed the output of the `imix` to the `M` input of the `4mix`. This input directly send to the output without any volume control. This feature allow to daisy chain multiple mixers.