---
title: Drive
description: Analog Distortion & Saturation Module.
image: /images/modules/drive.jpg
versions:
  - name: Fully Assembled
    price: 20
    productId: price_1QyWPVDOvwMyUDfcdbSDCxRZ
  - name: Semi Assembled
    price: 10
    productId: price_1QyWPoDOvwMyUDfcjX9KKPOg
size: base
inputs:
  - shortname: "AUDIO"
    description: "Audio input for the Drive"
  - shortname: "MULT"
    description: "A socket of the multiplier for either audio or signal"
  - shortname: "MULT"
    description: "A socket of the multiplier for either audio or signal"
  - shortname: "MULT"
    description: "A socket of the multiplier for either audio or signal"
  - shortname: "MULT"
    description: "A socket of the multiplier for either audio or signal"
outputs:
  - shortname: "DIRTY"
    description: "An output of the Drive which is always overdriven"
  - shortname: "DIRTY"
    description: "An output of the Drive which is always overdriven"
  - shortname: "DIRTY"
    description: "An output of the Drive which is always overdriven"
  - shortname: "CLEN"
    description: "An output of the Drive which is clean by default and overdriven only if controls are engaged"
  - shortname: "CLEN"
    description: "An output of the Drive which is clean by default and overdriven only if controls are engaged"
---

This is a quite capable analog distortion module with multiple modes. 

> You can use this as a saturator, overdrive, or as a fuzz module depending on how you use it and define those terms.

## Saturation

We use opamps and diodes to add harmonics to the waveform. Using the controls **OD1** and **OD2**, you can add distortion to the upper half or lower half of the waveform.

You can increase the control **GAIN** to increase the overall distortion.

## Overdrive

Turning both **OD1** and **OD2** to the right will turn this module into an overdrive.

## Fuzz

Output sockets labeled as **DIRTY** go through another diode-based drive circuit to add more harmonics. You can use the output socket labeled as **CLEAN** to bypass this circuit.

[io/]

## Additional Parts

> This section is only relevant if you are buying the semi-assembled module. You have to source & solder the following parts. You can check our guide on [common parts](/docs/technical-details/common-parts) for where to source these components.

* 2.54mm Header Pins (5-pin) - 2
* Circular Pin Header Sockets (5-pin) - 2
* 50K Potentiometers - 1 (Gain)
* 500K Potentiometers - 1 (OD1 & OD2)
