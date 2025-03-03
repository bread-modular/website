---
title: MIDI
description: MIDI host module and 8 channel MIDI router.
image: /images/modules/midi.jpg
versions:
  - name: Semi Assembled
    price: 10
  - name: Fully Assembled
    price: 20
size: base
--- 

Bread Modular [adopts MIDI](/docs/technical-details/modular-midi) as a communication protocol between modules. While using MIDI, we can replace multiple wires with a single wire, which is very important for a smaller system like Bread Modular.
(We still support CV and Gate communication as well)

## MIDI Host

This module acts as a host for external MIDI devices using a 3.5mm TRS jack. It supports both TRS [Type A and Type B](https://minimidi.world). You can easily switch between them by changing the jumper in the bottom right.

> This module only accepts MIDI input from external devices. It does not produce any MIDI output.

## MIDI Router

Inside the module, it splits incoming MIDI data into 8 different MIDI streams, respectively from channel 1 to 8. For each channel, there's a GATE and MIDI output. 

* GATE Output: Can be used to trigger modules which does not support MIDI.
* MIDI Output: Contains standard MIDI data from the selected channel.

## Single Wire MIDI

Between the modules in Bread Modular, you only need a single wire to communicate with MIDI. That's because Bread Modular uses a common ground connection. So, you can connect the channel's MIDI output directly into a MIDI input of another module.

## Supported Cables

This module does not come with any cables. Here's a guide on cables for you to source:

* **3.5mm TRS to TRS** - If your MIDI device supports TRS MIDI, you can use a "3.5mm stereo cable". It can be easily found at any local or online audio store.
* **MIDI DIN to TRS MIDI** - If your MIDI device uses a DIN connector, you can use [this adapter](https://www.amazon.com/s?k=MIDI+to+TRS) along with a [MIDI DIN cable](https://www.amazon.com/s?k=MIDI+DIN+cable).