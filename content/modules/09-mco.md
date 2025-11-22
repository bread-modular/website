---
title: MCO
description: MIDI controllable oscillator with detune support.
image: /images/modules/mco.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWlNDOvwMyUDfcw3i6VQua
  - name: Semi Assembled
    price: 10
    productId: price_1QyWlbDOvwMyUDfcdoWGc97i
size: base
inputs:
  - shortname: "MIDI"
    description: "MIDI input to control the oscillator"
  - shortname: "NC"
    description: "Not connected"
  - shortname: "NC"
    description: "Not connected"
  - shortname: "TX"
    description: "Debug pin for the microcontroller"
  - shortname: "UPDI"
    description: "Programming pin for the microcontroller"
outputs:
  - shortname: "MIDI"
    description: "MIDI THRU (passthrough) output"
  - shortname: "OUT"
    description: "Oscillator Output"
  - shortname: "OUT"
    description: "Oscillator Output"
  - shortname: "GATE"
    description: "Gate trigger from the MIDI input"
  - shortname: "VEL"
    description: "Velocity CV from the MIDI input"
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

[io/]

## Controls

* **DETUNE**: Controls the detune amount. Left is detuned up to 12 semitones down, and right is almost in sync.
* **MIX**: Mixes the detune oscillator with the main oscillator. Left is no mix, and right is full mix.

## MIDI

* Use any MIDI note to trigger the oscillator (this is a monophonic oscillator).
* Accept velocity and output it as a CV signal. (Velocity does not affect the oscillator.)

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 2