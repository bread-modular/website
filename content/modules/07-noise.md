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
---

This a digital noise generator with multiple tone controling options. It also supports MIDI.

> It's quite hard to make noise with analog circuits with a system running at 3.3V. That's why we using a Microcontroller (ATtiny1616) to generate noise.

## Inputs

1. MIDI In
2. N/C
3. N/C
4. Debug pin for the microcontroller
5. Programming pin for the microcontroller

## Outputs

1. MIDI THRU
2. White Noise
3. White Noise
4. Blue Noise
5. Pink Noise

## Controls

* **TONE**: Controls the tone by changing the sampling rate of the noise. Left is higher sampling rate, right is lower.
* **BLUE TONE**: RC Highpass Filter for the blue noise.
* **PINK TONE**: RC Lowpass Filter for the pink noise.

## MIDI

* CC 74: Adds to the **TONE** control value.