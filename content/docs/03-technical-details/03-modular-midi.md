---
title: Modular MIDI
summary: Learn what Modular MIDI is and how we use it at Bread Modular.
---

With Modular MIDI, you can directly communicate with a module using standard MIDI, bypassing CV and GATE signals.
<br/>
This gives us more flexibility to control modules using a single cable rather than using multiple CV & GATE cables. You can even use multiple CC commands.

> The way MIDI is handled is up to individual modules. Check the documentation of [each module](#list-of-midi-supported-modules) for supported MIDI features.
> 

## What is MIDI

Having a good foundation in MIDI will help you understand how modular MIDI works.

At its core, MIDI is a standard set of messages communicated via a transport medium. There are two common transport mediums:

1. TTL Serial
2. USB

Here we will focus on Serial MIDI. It uses a commonly used digital serial protocol with a baud rate (oscillation frequency) of 31250. This is a fairly low frequency in digital communication; hence, most Arduino-compatible microcontrollers are capable of handling serial MIDI.

### Serial MIDI Connectivity

There are two major connectivity options:

- 5 pin DIN
- 3.5mm TRS

We use 3.5mm TRS MIDI as it just uses a stereo aux cable. Although type-A TRS MIDI is the standard, the synth world is [divided](https://minimidi.world) between type-A and type-B. We support both types. Just change the jumper in the [MIDI](/modules/midi) module.

## Single Cable Communication

Even though a TRS socket has three pins, only one pin is used for serial MIDI communication.

> TRS MIDI is one-directional. We only support accepting (receiving) MIDI but do not send MIDI out of Bread Modular.

Since Bread Modular uses a common ground, we just need a single cable to send MIDI TRS into a module.

## Module Structure

This is how we accept TRS MIDI and route it between modules.

### MIDI Host Module

The [MIDI](/modules/midi) module accepts MIDI via a TRS cable(either type A or B). Then it splits MIDI data from channels 1 to 8 into separate MIDI streams. You can send one of these MIDI streams to a given module via a single patch cable.

It also has GATE output for each channel to trigger any module that does not support MIDI but is willing to accept a GATE signal.

> This module is implemented via a microcontroller costing less than $1, and it's fairly straightforward. To extend the functionality or learn more, have a [look at the schematics and code](https://github.com/bread-modular/bread-modular/tree/main/modules/midi).

### Accepting MIDI

Handling MIDI is up to individual modules. Most of the voice modules in Bread Modular are MIDI-supported. Check the individual [module docs](/modules) for supported MIDI features.

Since we use standard serial MIDI, you can use any existing Arduino (or similar) code to accept MIDI. You just need to forward the incoming MIDI signal into a serial RX pin of your microcontroller.

If your module is digital, you can process MIDI internally and apply changes accordingly. If your module is analog, you can convert incoming MIDI into GATE and CV signals and feed them into your analog components. To learn more, have a look at the following modules:

- [8bit](https://github.com/bread-modular/bread-modular/tree/main/modules/8bit) (digital)
- [hihat](https://github.com/bread-modular/bread-modular/tree/main/modules/hihat) (analog)
- [mco](https://github.com/bread-modular/bread-modular/tree/main/modules/mco) (hybrid)

## List of MIDI Supported Modules

We categorize modules based on how they process MIDI.

- digital - processes MIDI inside a microcontroller and outputs either audio or CV signals from the module.
- analog - The microcontroller only processes MIDI messages and converts them into CV and GATE signals. Then the analog circuitry in the module uses those signals as inputs.
- hybrid - the microcontroller processes MIDI messages and generates audio or CV. Additionally, it will output additional CV and GATE signals for either internal or external use.

### Current Modules

- [8bit](/modules/8bit) (digital)
- [hihat](/modules/hihat) (analog)
- [mco](/modules/mco) (hybrid)
- [env](/modules/env) (digital)
- [noise](/modules/noise) (digital)

### Planned Modules

- svf - analog
- low - analog
- 16bit - digital