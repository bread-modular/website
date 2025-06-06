---
title: Introducing 16bit - Our Realtime Audio Computer
date: 2025-06-06
author: Bread Modular Team
summary: Meet our new 16bit module - a powerful real-time audio computer with web-based customization and MIDI integration.
image: /images/docs/16bit-mcc-cascade-patch.png
---

When we first launched Bread Modular, one of the things we lacked was effects and a way to run complex sound sources. [8bit](/modules/8bit) is quite good in its way, but wasn't capable enough.

We tried different options including ESP32, Daisy Seed, and even custom STM32 designs. But everything had its own issues, and we couldn't find the best fit for us.

## Enter Raspberry Pi Pico 2

A couple of months back, our PCB assembly provider JLCPCB launched official support for RP2350, which is the microcontroller behind Raspberry Pi Pico 2. 

It's not as powerful as Daisy Seed or as feature-rich as ESP32. But it's small, not so power-hungry, and most importantly, the development workflow is very smooth so we can iterate extremely fast.

It doesn't come with a DAC or PSRAM. So, we made a module from the ground up that adds those capabilities: Enter [16bit](/modules/16bit).

## The Firmware

Having beefy hardware is not enough; we need good firmware to get the most out of it. From the very beginning, we wanted 16bit to be a customizable tool where the user can change it as needed. But we didn't want you to program 16bit by putting on a developer hat—instead, we want you to use it like a DAW.

![16bit Web UI](/images/docs/16bit-ui.png)

I think we found the perfect middle ground. Our firmware can be customized using a web UI as shown above. Basically, you plug the 16bit into the computer using a USB-C cable, visit a website, click some buttons, and make it your own thing.

Have a look at the following video:

[embed]https://youtu.be/6UWJi1ZfU9w?si=BfytmpkkWM8yMf9Y&t=38[/embed]

Check the [16bit documentation](/docs/16bit/introduction) to learn more about it.

## MIDI & MCC

Since MIDI is routed everywhere in Bread Modular, we want 16bit to be MIDI native. Yes, it can send and receive MIDI. But you can also control effects and other parameters using MIDI CC, just like in a DAW.

To make that smooth, we introduced the [MCC](/modules/mcc) module where you can control up to 12 CCs using physical knobs. This brings 16bit into its own modular setup. Have a look at the following examples:

### Controlling a Ladder Filter with MCC

[embed]https://youtu.be/vCnn0n45Mxw?si=6RmpbzDWV8sMG49F&t=102[/embed]

### Playing with Delay & MetalVerb using MCC

[embed]https://youtu.be/0i2NINsH2Cg?si=oskDDYa6Q_zW7D4F&t=227[/embed]

> If your MIDI controller supports sending MIDI CCs, you can use it to control parameters instead of using MCC.

## Starter Kit

We believe 16bit is an essential part of Bread Modular. So, we replaced the Line-In module of the Starter Kit with the 16bit. We did it even without increasing the price.

[Have a look at our Starter Kit](/modules/starter-kit).

## What's Next

Our firmware has apps that you can load and use. As of today, it has a 12-voice sampler and a 9-voice polysynth. We also have two effects. 

We know this is not enough, but the core system is very stable and flexible. We've already started building more apps and effects, and we're happy to launch them in the coming months as firmware updates.

Finally, keeping with the Bread Modular spirit, everything about 16bit is open source—from the hardware designs to the firmware. And our development is open; check our GitHub [commits](https://github.com/bread-modular/bread-modular/commits/main/).

We hope you'll love [16bit](/modules/16bit).

