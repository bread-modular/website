---
title: Build It Yourself
summary: Here's how you can build Bread Modular by yourself
---

If you have a decent understanding of Basic Electronics and enjoy experimenting, this guide is for you. Here, we will show you how to build Bread Modular modules from scratch.

## Open Source

Bread Modular is open source under the MIT license, and we share [everything](https://github.com/bread-modular/bread-modular) with the public. This includes schematics, PCB layouts, and code. We also show you how to [source parts](/docs/technical-details/common-parts) so you can get the optimal components.

## PCB Assembly

We design our modules to use SMT components to save space and cost. We typically use components with the size "0402", which can be a bit difficult to solder by hand.

> Since you have access to KiCad files, feel free to change PCB footprints and layouts as you wish.

We recommend using a PCB assembly service like [JLCPCB](https://jlcpcb.com) to fabricate and assemble modules. Watch the following tutorial on how to do that:

[embed]https://youtu.be/eTam3B5scmY?si=9jCixBRlZ3itq972[/embed]

## Base 

We recommend using our [base](/modules/base) to stack modules and patch them, as it handles power and audio output. However, you don't need to use it. You can use a simple breadboard as a primitive base. Make sure to power it as follows:

* +3.3V - Use the top rail + 
* 0V - Use the bottom rail +

(The "-" of none of the rails contains either +3.3V or 0V.)

> Sometimes, we have Vactrols at the bottom of the module. In such cases, stacking a module on a breadboard can be challenging. But we think you'll figure something out.

If you find any issues or need feedback, feel free to join our [Discord](https://discord.gg/W72YQKU7mq) and chat. 