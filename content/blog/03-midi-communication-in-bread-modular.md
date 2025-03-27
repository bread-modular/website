---
title: MIDI Communication in Bread Modular
date: 2024-03-31
author: Sarah Chen
summary: An in-depth look at how Bread Modular uses MIDI for inter-module communication and what this means for your setups.
---

One of the most innovative aspects of Bread Modular is our use of MIDI for communication between modules. This approach offers several advantages over traditional CV/Gate systems while maintaining compatibility with existing gear.

![Bread Modular Base Module](/images/modules/base.jpg)

## Why MIDI?

Traditional modular synthesizers use Control Voltage (CV) and Gate signals to communicate between modules. While this approach works well, it requires a lot of patch cables and can be limiting. Here's why we chose MIDI:

1. **Simplified Wiring**: By using MIDI, we reduce the number of cables needed between modules
2. **Rich Information**: MIDI can transmit notes, velocity, aftertouch, and CC data in a single connection
3. **Universal Standard**: MIDI is understood by virtually all electronic music equipment
4. **Digital Precision**: No need to worry about voltage calibration issues

![Bread Modular System Overview](/images/home-slide/03.jpg)

## How It Works in Bread Modular

In the Bread Modular system, each module can communicate with others through a simple single-wire MIDI connection:

```
Module A (Sequencer) → Module B (Oscillator) → Module C (Filter)
```

This single-wire approach is possible because we use a common ground plane across all modules. Data flows in one direction, creating a chain of modules that process and pass MIDI information.

![Drive Module](/images/modules/drive.jpg)

## Real-World Example

A common setup might look like this:

1. The sequencer module generates MIDI note data
2. The oscillator module receives note data and generates the corresponding frequencies
3. The filter module receives MIDI CC data to control cutoff and resonance
4. The envelope module receives note-on/off data to trigger amplitude changes

## Working with External Gear

Bread Modular isn't an island - it's designed to work with your existing gear:

- Use the MIDI-to-CV module to control external analog gear
- The USB-to-MIDI module lets you sequence Bread Modular from your computer
- Our MIDI Thru module splits MIDI signals to multiple chains of modules

![Env Module](/images/modules/env.jpg)

## Future Developments

We're continuing to expand MIDI capabilities in Bread Modular:

- More MIDI processing modules for advanced transformations
- Support for MIDI Polyphonic Expression (MPE)
- MIDI clock sync for tempo-based effects

By embracing MIDI as our primary communication protocol, Bread Modular offers a simplified yet powerful approach to modular synthesis that works well with both modern and classic equipment. 