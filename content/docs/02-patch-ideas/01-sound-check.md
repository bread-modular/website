---
title: Sound Check
summary: Create bubbly sounds by modulating noise through a filter.
---

This might be the first thing you can patch with Bread Modular. It's easy and sounds interesting too.

Here we will modulate a noise source using a filter, which creates some bubbly sounds. Playing with this patch can be fun. You can listen to the patch below:


## Powering Up

You can power the bread modular base using the provided USB-C cable. You can any USB-C power source. If you are using a PC or Laptop's USB connection, it might get noisy some times. Better if you can use a dedicated USB power socket. (We recommend a mobile phone charger)

Bread Modular uses very little power usually around 50 mA. It's way below even older USB socket's power limits. 

You can also use a power bank or your mobile phone as the power source.

## Listening to Audio

Bread Modular base has a 3.5mm Line Out and Dedicated Headphone out. If you are using the headphone there are volime controls for both LEFT and RIGHT ears. The line-out socket located in top-left.


Let's start building it:

First, let's make some noise(literally).

[patch]
noise:WHITE -> imix: 1
imix:MIXOUT -> base:L

---knobs

noise:TONE@0 As you turn left this will turn the noise sampling rate. Which makes different tonality. In left most positions, you can use this as a random gate trigger.
imix:1@0.25 You can control the volume with this knob
[/patch]

> This is a representation of how you need to patch it. You can hover on input/output pins to learn more about it. Also, this also shows you what kind of values you need to set of knobs. 
>
> You can hover on knobs(or tap in mobile) to learn more.
>
> **Also, pins and knob ordering can be wrong. Always check pin/knob labels.**

Now you will can listen to the noise and try to change tone position and how it behaves. Let's complete the patch.

[patch]
noise:WHITE -> svf:AUDIO
noise:WHITE -> svf:CV
noise:LF -> imix:1
imix:MIXOUT -> base:L

---knobs

noise:TONE@0.7 Changing this change the speed of the bubble sound
svf:RESONONCE@0.5 Increasing this adds more wistling like noise
svf:FREQ CURVE@0 Increasing this limits the range the FREQ knob operates
svf:FREQ@0.25 This is the cut-off frequency. Turning right includes more higher frequency content.
imix:1@0.6 You can control the volume with this knob
[/patch]

Connect all the cables and set the knobs into the correct position as suggested. Now you can change knob positions and try to make different sounds.