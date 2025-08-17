---
title: Sound Check
summary: Create bubbly sounds by modulating noise through a filter.
---

This might be the first thing you patch with Bread Modular. It's easy and sounds interesting too.

Here we modulate a noise source using a filter to create bubbly sounds. Playing with this patch can be fun. You can listen to the patch below:

[soundcloud 2154553752 /]

## Powering Up

You can power the Bread Modular Base using the provided USB-C cable. You can use any USB-C power source. If you are using a PC or laptop USB port it might get noisy sometimes. It's better to use a dedicated USB power socket (we recommend a mobile phone charger).

> Bread Modular uses very little power—usually around 50 mA. That's well below even older USB socket power limits.

You can also use a power bank or your mobile phone as the power source.

![Bread Modular Base Audio IO](/images/docs/base-connections.jpg)

## Listening to Audio

The Bread Modular Base has a 3.5 mm line out and a dedicated headphone output. If you are using headphones there are volume controls for both LEFT and RIGHT channels. The line-out socket is located at the top left.

Let's start building it.

First, let's make some noise (literally).

[patch]
noise:WHITE -> imix:1
imix:MIXOUT -> base:L

---knobs

noise:TONE@0 Turning this left reduces the noise sampling rate, producing different tonality. At the left-most position you can use it as a random gate trigger.
imix:1@0.25 You can control the volume with this knob
[/patch]

> This is a representation of how you need to patch it. You can hover on input/output pins to learn more. It also shows you suggested knob positions.
>
> You can hover on knobs (or tap on mobile) to learn more.
>
> **Pin and knob ordering can be different. Always check the labels.**

Now you can listen to the noise and try changing the TONE position to hear how it behaves. Let's complete the patch.

[patch]
noise:WHITE -> svf:AUDIO
noise:WHITE -> svf:CV
svf:LF -> imix:1
imix:MIXOUT -> base:L

---knobs

noise:TONE@0.7 Changing this changes the speed of the bubbly sound
svf:RESONONCE@0.5 Increasing this adds more whistling-like noise
svf:FREQ CURVE@0 Increasing this limits the range over which the FREQ knob operates
svf:FREQ@0.25 This is the cutoff frequency. Turning it right adds more high-frequency content.
imix:1@0.6 You can control the volume with this knob
[/patch]

Connect all the cables and set the knobs to the suggested positions. You will start to hear bubbly sounds.

Then experiment with the knobs to create different sounds. Enjoy!
