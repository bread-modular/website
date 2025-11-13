---
title: Introduction to Modular with Bread Modular
date: 2025-11-13
author: Bread Modular Team
summary: An introduction to Bread Modular with some example patches.
image: /images/blog/bread-modular-with-friends.jpg
---

Bread Modular is a modular synth platform built from scratch. Unlike VCVRack, which is based on the Eurorack standard, Bread Modular takes a completely different approach. However, the core concepts you've learned still apply.

This guide will help you map your modular knowledge to Bread Modular.

## 1. Supersaw Oscillator

The 8bit Supersaw oscillator is a good starting point. It has two sawtooth oscillators running one octave apart.

[patch]
8bit:AUDIO -> base:L

---knobs
8bit:CV1@0.25 This controls the oscillator frequency, which you can adjust manually.
8bit:CV2@1.0 This is the mix level of the detuned second oscillator. For a supersaw sound, set it to 1.0.
8bit:LOWPASS@0 This is the built-in low-pass filter. Increase it to reduce upper harmonics.

---states
8bit:MODE = LED_OFF; Hold the MODE button for a second to change modes. LED_OFF means you can control the frequency manually; otherwise, it listens only to MIDI notes.
[/patch]

> The diagram above shows how to patch modules in Bread Modular and the recommended knob positions for this setup. Hover over a knob to see how changing it affects the sound.
>
> It also indicates any available mode states. In this patch, it highlights the MODE LED.

