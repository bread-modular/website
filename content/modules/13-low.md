---
title: LOW
description: Analog Low Pass Gate with Filtering Support.
image: /images/modules/low.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWqNDOvwMyUDfcjPuGm8OL
  - name: Semi Assembled
    price: 10
    productId: price_1QyWq5DOvwMyUDfcg0HxSomd
size: base
inputs:
  - shortname: "AUDIO"
    description: "Main audio input to be filtered"
  - shortname: "GATE/CV"
    description: "CV or GATE input to trigger the Low Pass Gate"
  - shortname: "V+"
    description: "3.3V outlet (this is not an input, but can be fed to CV input to act as a low pass filter)"
  - shortname: "NC"
    description: "Not connected"
  - shortname: "NC"
    description: "Not connected"
outputs:
  - shortname: "AUDIO"
    description: "Filtered audio output"
  - shortname: "AUDIO"
    description: "Filtered audio output"
  - shortname: "AUDIO"
    description: "Filtered audio output"
  - shortname: "AUDIO"
    description: "Filtered audio output"
  - shortname: "AUDIO"
    description: "Filtered audio output"
---

This is an analog low pass gate incorporating Vactrols. It uses 2nd order RC filter as the core of the circuit.

## Functionality

* Better suited for thick bass sounds.
* Has no resonance.
* Frequency can be modulated via CV.
* A momentary **BLAST** toggle to make the CUTOFF reach the highest frequency (which sounds great.)

Here are some ways to use this module:

### 1. As a Low Pass Gate

* Use a GATE signal as the CV.
* Make sure the GATE is very short.
* Use the CUTOFF control to limit the frequency range.

### 2. As a Low Pass Filter

* Feed a fixed voltage to the CV. (Probably 3.3V from the **+V** in the input section)
* Use the CUTOFF control to set the cutoff frequency.

[io/]

## Controls

* **CUTOFF**: Controls the cutoff frequency of the filter.
* **BLAST**: A momentary toggle to make the cutoff frequency the highest possible.

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 1
* Vactrols - 2
