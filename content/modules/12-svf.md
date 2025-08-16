---
title: SVF
description: Analog State Variable Filter with 3 Frequency Bands.
image: /images/modules/svf.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWpIDOvwMyUDfcdTQ63jbE
  - name: Semi Assembled
    price: 10
    productId: price_1QyWp3DOvwMyUDfcYwTnbJW0
size: base
inputs:
  - shortname: "Audio In"
    description: "Main audio input to be filtered"
  - shortname: "CV IN"
    description: "Control voltage input for cutoff frequency modulation"
  - shortname: "MULT"
    description: "Multiple input/output connection point"
  - shortname: "MULT"
    description: "Multiple input/output connection point"
  - shortname: "MULT"
    description: "Multiple input/output connection point"
outputs:
  - shortname: "LOWPASS"
    description: "Low-pass filtered output"
  - shortname: "LOWPASS"
    description: "Low-pass filtered output (duplicate)"
  - shortname: "HIGHPASS"
    description: "High-pass filtered output"
  - shortname: "HIGHPASS"
    description: "High-pass filtered output (duplicate)"
  - shortname: "BANDPASS"
    description: "Band-pass filtered output"
---

This is a traditional analog State Variable Filter (SVF) implementation that incorporates Vactrols.

## Functionality

* Ideal for creating ACID and LEAD sounds
* Features resonance control
* Simultaneously provides LOWPASS, HIGHPASS, and BANDPASS outputs
* CUTOFF frequency control via CV input
* Supports GATE signals as CV input thanks to Vactrol integration

[io/]

## Controls

* **RESONANCE**: Adjusts the filter's resonance level
* **FREQ**: Sets the CUTOFF frequency of the filter (CV input is limited to this maximum value)
* **FREQ CURV**: Reduces the filter's frequency range for more precise control (turn clockwise to decrease range)

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 1 (FREQ CURVE)
* 500K Potentiometers - 1 (RESONANCE)
* 1M Potentiometers - (FREQ)
* Vactrols - 2