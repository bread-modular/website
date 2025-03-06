---
title: MCO
description: MIDI Controllable Oscillator with Detune Support.
image: /images/modules/mco.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWlNDOvwMyUDfcw3i6VQua
  - name: Semi Assembled
    price: 10
    productId: price_1QyWlbDOvwMyUDfcdoWGc97i
size: base
---

This is a MIDI Controllable Oscillator (MCO) that generates two square waves. One is the main oscillator, and the other is a detuned oscillator that can be tuned up to 12 semitones down.

Square waves are generated digitally and then mixed together using analog circuitry.

## Functionality

Here are some ideas:

* Use [SVF](/modules/svf) and [ENV](/modules/env) with a short pulse envelope to create ACID sounds.
* Use [LOW](/modules/low) with a gate input to produce solid bass sounds.
* Use [SVF](/modules/svf) and [ENV](/modules/env) with a sustained envelope for lead sounds.
* Use [Drive](/modules/drive) for more aggressive sounds.

## Inputs

1. MIDI In
2. N/C
3. N/C
4. Debug pin for the microcontroller
5. Programming pin for the microcontroller

## Outputs

1. MIDI THRU
2. Oscillator Output
3. Oscillator Output
4. GATE from the MIDI
5. Velocity from the MIDI

## Controls

* **DETUNE**: Controls the detune amount. Left is detuned up to 12 semitones down, and right is almost in sync.
* **MIX**: Mixes the detune oscillator with the main oscillator. Left is no mix, and right is full mix.

## MIDI

* Use any MIDI note to trigger the oscillator (this is a monophonic oscillator).
* Accept velocity and output it as a CV signal. (Velocity does not affect the oscillator.)