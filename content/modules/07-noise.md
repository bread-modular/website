---
title: Noise
description: Noise Module with Multiple Tone Control Options.
image: /images/modules/noise.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWipDOvwMyUDfcDBgJFULz
  - name: Semi Assembled
    price: 10
    productId: price_1QyWj8DOvwMyUDfcjXNIsEDU
size: base
inputs:
  - shortname: "MIDI In"
    description: "MIDI input for controlling the noise generator"
  - shortname: "N/C"
    description: "Not connected"
  - shortname: "N/C"
    description: "Not connected"
  - shortname: "Debug"
    description: "Debug pin for the microcontroller"
  - shortname: "Programming"
    description: "Programming pin for the microcontroller"
outputs:
  - shortname: "MIDI THRU"
    description: "MIDI passthrough output"
  - shortname: "White Noise"
    description: "White noise output"
  - shortname: "White Noise"
    description: "White noise output (duplicate)"
  - shortname: "Blue Noise"
    description: "Blue noise output with high-frequency emphasis"
  - shortname: "Pink Noise"
    description: "Pink noise output with frequency-balanced characteristics"
---

This a digital noise generator with multiple tone controling options. It also supports MIDI.

> It's quite hard to make noise with analog circuits with a system running at 3.3V. That's why we using a Microcontroller (ATtiny1616) to generate noise.

[io/]

## Controls

* **TONE**: Controls the tone by changing the sampling rate of the noise. Left is higher sampling rate, right is lower.
* **BLUE TONE**: RC Highpass Filter for the blue noise.
* **PINK TONE**: RC Lowpass Filter for the pink noise.

## MIDI

* CC 74: Adds to the **TONE** control value.

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 1 (Tone)
* 1M Potentiometers - 2 (BLUE Tone & PINK Tone)
