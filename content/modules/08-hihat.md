---
title: HiHat
description: MIDI controllable analog hihat module.
image: /images/modules/hihat.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWk9DOvwMyUDfchd0nuXuZ
  - name: Semi Assembled
    price: 10
    productId: price_1QyWkQDOvwMyUDfcTEsuVsye
size: base
inputs:
  - shortname: "MIDI"
    description: "MIDI input to control the hi-hat generator"
  - shortname: "NOISE"
    description: "External noise (audio) input"
  - shortname: "GATE"
    description: "Gate input for triggering the hi-hat"
  - shortname: "ACCENT"
    description: "CV input for accent control"
  - shortname: "OPEN"
    description: "Gate input for open hi-hat"
outputs:
  - shortname: "MIDI"
    description: "MIDI THRU (passthrough) output"
  - shortname: "AUDIO"
    description: "Hi-hat audio output"
  - shortname: "AUDIO"
    description: "Hi-hat audio output"
  - shortname: "CV"
    description: "Envelope CV of the hi-hat"
  - shortname: "CV"
    description: "Envelope CV of the hi-hat"
---

This is a MIDI-controllable analog hi-hat module. You can also control the hi-hat via GATE & CV signals. 

> You need to feed noise into the module to make it work. You may use our [Noise](/modules/noise) module.


## Features

* Open & Close Hi-Hat
* Accent Control
* Full MIDI Control
* Feed Custom Noise Sources
* Get the HiHat Envelope as CV

[io/]

## Controls

* **CUTOFF**: Controls the cutoff frequency of the hi-hat. Left is higher frequency, right is lower.
* **DECAY**: Increases the decay of the hi-hat.

## MIDI

* Use any note up to (and including) Middle C (C4) to trigger the hi-hat
* Any note above Middle C will open the hi-hat
* The velocity of the note will affect the **DECAY** control


## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 2
* Vactrols - 2
