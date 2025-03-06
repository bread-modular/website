---
title: HiHat
description: MIDI Controllable Analog HiHat Module.
image: /images/modules/hihat.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWk9DOvwMyUDfchd0nuXuZ
  - name: Semi Assembled
    price: 10
    productId: price_1QyWj8DOvwMyUDfcjXNIsEDU
size: base
---

This is a MIDI-controllable analog hi-hat module. You can also control the hi-hat via GATE & CV signals. 

> You need to feed noise into the module to make it work. You may use our [Noise](/modules/noise) module.


## Features

* Open & Close Hi-Hat
* Accent Control
* Full MIDI Control
* Feed Custom Noise Sources
* Get the HiHat Envelope as CV

## Inputs

1. MIDI In
2. Noise Source
3. Gate Input (If not provided via MIDI)
4. CV Input for the Accent Control
5. Gate Input for the Open HiHat

## Outputs

1. MIDI THRU
2. HiHat Output
3. HiHat Output
4. Envelope CV of the HiHat
5. Envelope CV of the HiHat

## Controls

* **CUTOFF**: Controls the cutoff frequency of the hi-hat. Left is higher frequency, right is lower.
* **DECAY**: Increases the decay of the hi-hat.

## MIDI

* Use any note up to (and including) Middle C (C4) to trigger the hi-hat
* Any note above Middle C will open the hi-hat
* The velocity of the note will affect the **DECAY** control


