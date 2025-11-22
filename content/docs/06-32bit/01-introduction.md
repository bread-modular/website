---
title: Introduction to 32bit
summary: Learn about 32bit, BreadModular's high-quality audio computer for professional effects processing.
---

![32bit](/images/modules/32bit.jpg#max-width=300px)

[32bit](/modules/32bit) is a realtime audio computer designed for high-quality audio effects processing. It features:

* ESP32-S3 Microcontroller (dual-core)
* Floating-point calculation support (for enhanced DSP capabilities)
* ES8388 Audio Codec with 16-bit audio processing
* 2 x 16-bit Audio Inputs
* 2 x 16-bit Audio Outputs
* MIDI In/Out
* 2 x CV Input with Attenuators
* MODE switch with LED indicator
* USB Serial for PC connectivity and firmware updates

## Modular Design

32bit is designed in a modular way where you can customize it with different firmwares. Currently, it supports the FX Rack firmware, which provides effects designed for use with the [4mix](/modules/4mix)'s send/return setup.

We achieve modularity using our [MCC](/docs/32bit/mcc-module) module, which allows you to control effects via MIDI CCs. You can load different firmwares using the [32bit Web UI](/ui/32bit).

![32bit UI](/images/docs/32bit-ui.png)

## Usage

Using 32bit is very simple. Just plug your module into the Bread Modular base, send audio signals to the inputs, and get processed audio from the outputs.

You may also need to plug it into your computer via the USB-C socket and load a firmware using the [32bit Web UI](/ui/32bit).

The 32bit features two knobs (CV1 & CV2) for direct control, and you can also control effects using MIDI CCs or our [MCC modules](/docs/32bit/mcc-module).

