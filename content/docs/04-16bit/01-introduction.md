---
title: Introduction to 16bit
summary: Learn about 16bit, BreadModular's realtime audio computer for effects and complex sound sources.
---

![16bit](/images/modules/16bit.jpg#max-width=300px)

[16bit](/modules/16bit) is a realtime audio computer, which is BreadModular's go-to choice for effects and complex sound sources. It features:

* Raspberry Pi RP2350A Microcontroller (dual-core)
* Floating-point calculation support (for enhanced DSP capabilities)
* 16MB of Flash Memory
* 8MB of PSRAM (+ 520KB of High-Speed SRAM)
* 2 x 16-bit DAC
* 2 x 12-bit ADC
* MIDI In/Out
* 2 x CV Input with Attenuators
* 2 x Gate Outputs
* MODE switch with LED indicator
* USB for PC Connectivity (or other USB uses)

## Modular Design

16bit itself is designed in a modular way where you can customize it to do anything. For example, it can be used as a drum sampler, polysynth, or as an effects rack. 

We achieve this using our [MCC](/docs/16bit/mcc-module) module and [modular firmware](/docs/16bit/firmware-and-apps) where you can load apps and effects using a [web UI](/ui/16bit).

This is how the 16bit ui looks like:

![16bit ui sampler](/images/docs/16bit-ui-sampler.png)
![16bit ui polysynth](/images/docs/16bit-ui-polysynth.png)
![16bit ui effects](/images/docs/16bit-ui-effects.png)

## Usage

Using 16bit is very simple. Just plug your module into the Bread Modular base. Send MIDI data in and get the audio from the output. 

You may also need to plug it into the computer via the USB-C socket and load an app using our [web UI](/ui/16bit). 

16bit has two knobs(CV1 & CV2) and you can control it a bit using those. But for accessing effects, you can either send MIDI CCs or use our [MCC modules](/docs/16bit/mcc-module).