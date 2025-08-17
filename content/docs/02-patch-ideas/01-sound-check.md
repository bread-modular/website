---
title: Sound Check
summary: Create bubbly sounds by modulating noise through a filter.
---

This might be the first thing you can do with your Bread Modular Starter Kit. It's a little sound check.

Here we will modulate a noise source using a filter, which creates some bubbly sounds. Playing with this patch can be fun.

[embed]https://youtu.be/xkhb7Yg2KzM?si=0ty_VHwcc5Sf2AO6[/embed]

[patch]
noise:WHITE -> svf:AUDIO
noise:WHITE -> svf:CV
svf:LF -> imix:1
imix:MIXOUT -> base:L

---knobs

noise:TONE@0.6 Change this to sampling frequency of the noise, which results in different tones.
svf:RESONONCE@1.0 Reduce this change the resonance
svf:FREQ CURVE@0
svf:FREQ@ 1.0 Reduce this to change the filter cut-off frequency
imix:1@0.5 You can control the volume with this knob
[/patch]
