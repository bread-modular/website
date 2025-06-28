---
title: Drums - 8bit Firmware
summary: Learn about the Drums firmware of 8bit. It's a 7-voice low-fi drum sampler. 
---

This is a 7-voice low-fi drum sampler. It comes with 909-like samples.

## Installation

8bit contains an ATTINY 1616 MCU. To program and install the firmware follow this [guide](/docs/technical-details/programming-digital-modules).

The firmware is located at [modules/8bit/code/drums](https://github.com/bread-modular/bread-modular/tree/main/modules/8bit/code/drums) in the [code repository](https://github.com/bread-modular/bread-modular).

### MIDI Control

You can trigger these drum voices via MIDI by playing or triggering white notes on any octave. Here are the sounds pre-assigned for each key:

* C - Snare
* D - Clap
* E - Perc
* F - Rim Shot
* G - Closed Hat
* A - Open Hat
* B - Ride

You can also send velocity for each note to add accent.

> Changing octaves **does not** do anything like pitch changes.

## Controls

### Mode Button (TOGGLE_PIN)

No functionality is implemented.

### CV Inputs

#### CV1 (Frequency)

No functionality is implemented.

#### CV2 (Octave-Down Volume)

No functionality is implemented.

