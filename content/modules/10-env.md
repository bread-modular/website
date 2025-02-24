---
title: ENV
description: Envelope Generator with Multiple Algorithm Options (MIDI Controllable).
image: /images/modules/env.jpg
versions:
  - name: Semi Assembled
    price: 10
  - name: Fully Assembled
    price: 20
size: base
---

This is an envelope generator with 3 different algorithms. It can be controlled via MIDI or CV/Gate.

It has 2 main control knobs named **CV1** and **CV2**. They will be used to control parameters of the envelope algorithm. 

## Algorithms

There are 3 different algorithms, and you can cycle through them by doing a long press (~1s) of the "ALGO SELECT" toggle button. When you release it, it will flash a LED to indicate the current algorithm.

Here are the algorithms:

### 1. Hold Release

* At first, the envelope reaches the Maximum Value.
* Then it will hold it up to 100ms & controllable with CV1.
* Then it will release to 0V with a rate controlled by CV2.

### 2. Attack Release

* At first, the envelope reaches the 0V.
* Then it will attack to the Maximum Value with a controllable rate controlled by CV1.
* Then it will release to the 0V with a controllable rate controlled by CV2.

### 3. Attack Sustain Release

* At first, the envelope reaches the 0V.
* Then it will attack to the Maximum Value with a controllable rate controlled by CV1.
* Then it will sustain at the Maximum Value until the GATE is released.
* Then it will release to the 0V with a controllable rate controlled by CV2.

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

* **CV1**: Controls the CV1 for the selected algorithm. If the CV1 input is provided, this will act as an attenuverter.
* **CV2**: Controls the CV2 for the selected algorithm. If the CV2 input is provided, this will act as an attenuverter.
* **ALGO SELECT** Toggle Button: Cycle between algorithms.
* **MIDI GATE** Toggle Button: Choose the GATE signal for the algorithm by MIDI or the GATE input.

## MIDI

* Use any MIDI note to trigger a GATE signal.
* **CC 22**: To modulate the CV1
* **CC 75**: To modulate the CV2
