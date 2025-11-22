---
title: Using the MCC Module
summary: Learn how to use the MCC module to control MIDI CCs and patch multiple modules together.
---

[MCC](/modules/mcc) is a very simple module that allows you to control four different CCs using knobs. You can choose CCs from three banks:

- **Bank A**: 20-23
- **Bank B**: 27-30
- **Bank C**: 85-88

You can cascade up to 3 MCC modules to control 12 CCs at once.

## Patching MCC

Patching MCC is very simple. You feed MIDI into it and you get a copy of that MIDI data with the CCs that MCC is controlling.

Then you can feed the output MIDI into the 32bit module.

Here's what a basic patch looks like:

![Using MCC with 32bit](/images/docs/32bit-mcc-patch.jpg)

Here's how to cascade 3 MCCs together:

![Cascading 3 MCC modules with 32bit](/images/docs/32bit-mcc-cascade-patch.jpg)

## CC Assignment

The selected CCs don't have predefined meanings. We chose CCs that are not assigned to any particular control like filter cutoff or similar.

It's up to the 32bit firmware to use these CC values as needed. For example, the FX Rack firmware uses MCC bank A to control reverb size, delay/reverb mix, comb filter length, and comb filter feedback. 
