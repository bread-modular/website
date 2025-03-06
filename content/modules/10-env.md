---
title: ENV
description: Envelope Generator with Multiple Algorithm Options (MIDI Controllable).
image: /images/modules/env.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWn9DOvwMyUDfcbXuqDsTq
  - name: Semi Assembled
    price: 10
    productId: price_1QyWmsDOvwMyUDfcuXOxg3k3
size: base
---

This is an envelope generator with 3 different algorithms. It can be controlled via MIDI or CV/Gate.

It has 2 main control knobs named **CV1** and **CV2**. They control parameters of the envelope algorithm. 

## Algorithms

There are 3 different algorithms, and you can cycle through them by holding (~1s) the "ALGO SELECT" toggle button. When you release it, an LED will flash to indicate the current algorithm.

Here are the algorithms:

### 1. Hold Release

* The envelope first reaches the Maximum Value
* It then holds for up to 100ms, controlled by CV1
* Finally, it releases to 0V at a rate controlled by CV2

### 2. Attack Release

* The envelope starts at 0V
* It attacks to the Maximum Value at a rate controlled by CV1
* It then releases to 0V at a rate controlled by CV2

### 3. Attack Sustain Release

* The envelope starts at 0V
* It attacks to the Maximum Value at a rate controlled by CV1
* It sustains at the Maximum Value until the GATE is released
* It then releases to 0V at a rate controlled by CV2

## Inputs

1. MIDI In
2. GATE In
3. CV1
4. CV2
5. Debug pin for the microcontroller
6. Programming pin for the microcontroller

## Outputs

1. MIDI THRU
2. Envelope Output
3. Envelope Output
4. Envelope Output
5. Envelope Output

## Controls

* **CV1**: Controls the CV1 parameter for the selected algorithm. If a CV1 input is provided, this acts as an attenuverter.
* **CV2**: Controls the CV2 parameter for the selected algorithm. If a CV2 input is provided, this acts as an attenuverter.
* **ALGO SELECT** Toggle Button: Cycles between algorithms.
* **MIDI GATE** Toggle Button: Selects the GATE signal source (MIDI or GATE input) for the algorithm.

## MIDI

* Use any MIDI note to trigger a GATE signal
* **CC 22**: Modulates CV1
* **CC 75**: Modulates CV2
