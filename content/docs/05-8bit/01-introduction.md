---
title: Introduction to 8bit
summary: Learn about 8bit, BreadModular's 8bit audio computer
---

![8bit](/images/modules/8bit.jpg#max-width=300px)

This is a programmable computer with 8-bit audio output.

## Functionality

* It uses AtTiny1616 microcontroller which runs at 20Mhz.
* It's quite limited in terms of RAM, but it can be useful for creating audio sources and effects requires very little memory.
* Has two CV inputs with attenuators.
* Built-in low pass filter to smooth out the audio output if needed.
* MODE switch with LED indicator for implementing custom modes.

## Inputs

1. MIDI In
2. CV1 In
3. CV2 In
4. Debug pin for the microcontroller
5. Programming pin for the microcontroller

## Outputs

1. MIDI THRU
2. Audio Out
3. Audio Out
4. GATE Out
5. GATE Out

## Controls

* **CV1**: Attenuate the CV1 input if provided, if not CV1 input is normalized to 3.3V.
* **CV2**: Attenuate the CV2 input if provided, if not CV2 input is normalized to 3.3V.
* **MODE**: Toggle button to select the mode.


## Programming

This module can be programmed via an UPDI interface. Check out our guide on [programming](/docs/technical-details/programming-digital-modules) the 8bit and similar modules.