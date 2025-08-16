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
inputs:
  - shortname: "MIDI"
    description: "MIDI input for triggering and controlling the envelope"
  - shortname: "GATE"
    description: "Gate input for triggering the envelope manually"
  - shortname: "CV1"
    description: "Control voltage input for CV1 parameter modulation"
  - shortname: "CV2"
    description: "Control voltage input for CV2 parameter modulation"
  - shortname: "TX"
    description: "Debug pin for the microcontroller"
  - shortname: "UPDI"
    description: "Programming pin for the microcontroller"
outputs:
  - shortname: "MIDI"
    description: "MIDI THRU (passthrough) output"
  - shortname: "ENV"
    description: "Main envelope output signal"
  - shortname: "ENV"
    description: "Envelope output signal (duplicate)"
  - shortname: "ENV"
    description: "Envelope output signal (duplicate)"
  - shortname: "ENV"
    description: "Envelope output signal (duplicate)"
---

This is an envelope generator with three different algorithms. It can be controlled via MIDI or CV/Gate.

It has two main control knobs, named **CV1** and **CV2**. They control parameters of the envelope algorithm.

[io/]

## Algorithms

There are three different algorithms, and you can cycle through them by holding (about 1 second) the "ALGO SELECT" toggle button. When you release it, an LED will flash to indicate the current algorithm.

Here are the algorithms:

### 1. Hold Release

* The envelope first reaches the maximum value.
* It then holds for up to 100 ms, controlled by CV1.
* Finally, it releases to 0V at a rate controlled by CV2.

### 2. Attack Release

* The envelope starts at 0V.
* It attacks to the maximum value at a rate controlled by CV1.
* It then releases to 0V at a rate controlled by CV2.

### 3. Attack Sustain Release

* The envelope starts at 0V.
* It attacks to the maximum value at a rate controlled by CV1.
* It sustains at the maximum value until the GATE is released.
* It then releases to 0V at a rate controlled by CV2.

## Gate Modes

You can trigger the envelope via manual GATE trigger or via MIDI. There are three modes, including a special MIDI mode. You can select them by holding the **MIDI GATE** button for at least 500 ms.

### 1. GATE MODE
The envelope will be triggered using the signal passed to the GATE In input pin.

### 2. MIDI MODE
The envelope will be triggered using the MIDI Gate signal.

### 3. MIDI_VELOCITY MODE
This is the same as MIDI MODE, but it will also modulate CV2 using the velocity. If you are using this mode, make sure to start with velocity = 0; otherwise, CV2 will be open regardless of the physical CV2 knob position.

## Controls

* **CV1**: Controls the CV1 parameter for the selected algorithm. If a CV1 input is provided, this acts as an attenuverter.
* **CV2**: Controls the CV2 parameter for the selected algorithm. If a CV2 input is provided, this acts as an attenuverter.
* **ALGO SELECT** toggle button: Cycles between algorithms.
* **MIDI GATE** toggle button: Selects Gate Modes.

## MIDI

* Use any MIDI note to trigger a GATE signal.
* **CC 22**: Modulates CV1.
* **CC 75**: Modulates CV2.

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source and solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54 mm header pins (5-pin) - 2
* Circular pin header sockets (5-pin) - 2
* 1M potentiometers - 2