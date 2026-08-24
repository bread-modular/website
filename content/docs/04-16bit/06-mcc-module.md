---
title: Using the MCC Module
summary: Learn how to use the MCC module to control MIDI CCs and patch multiple modules together.
---

[MCC](/modules/mcc) is a very simple module where you can control four different CCs using knobs. You can choose CCs from three banks:

- **Bank A**: 20-24
- **Bank B**: 27-30
- **Bank C**: 85-88

You can cascade up to 3 MCC modules to control 12 CCs at once.

## Patching MCC

Patching MCC is very simple. You feed MIDI into it and you get a copy of that MIDI data with the CCs that MCC is controlling.

Then you can feed the output MIDI into the 16bit module.

Here's how a basic patch looks like:

![Using MCC with 16bit](/images/docs/16bit-mcc-patch.png)

Here's how to cascade 3 MCCs together:

![Cascading 3 MCC modules with 16bit](/images/docs/16bit-mcc-cascade-patch.png)

## CC Assignment

There are no specific meanings for any of the selected CCs. We selected CCs that are not assigned to any particular control like filter cutoff or similar.

It's up to the app to use these CC values as needed. For example, the polysynth app uses MCC bank A to control its ladder filter, while in the sampler app, you can assign an effect to an MCC bank. 