---
title: Community Updates - March 2025
date: 2025-03-27
author: Bread Modular Team
summary: So far we have shipped about 10 starter kits & people are happy with them. Here's a summary of what happened in the Bread Modular community in March 2025.
image: /images/blog/digital-twin-2.png
---

So far we have shipped about 10 starter kits & people are happy with them. Let me share some of the images & updates that have been shared in our [Discord](https://discord.gg/W72YQKU7mq).

![First Bread Modular Order We Shipped](/images/blog/first_order.jpg)

This is one of the first Bread Modular orders we shipped. Unfortunately, it was delayed in shipping due to some mechanical failure and we were checking the tracking details every day until it was delivered.
---

![Bread Modular with Friends](/images/blog/bread-modular-with-friends.jpg)

Here you can see a Bread Modular kit used with some other gear. We are in the top right.

---

![Bread Modular Digital Twin](/images/blog/digital-twin-1.png)
![Bread Modular Digital Twin](/images/blog/digital-twin-2.png)

This is a very interesting project. This is a digital twin of the Bread Modular. With this, a community member is trying to design & build custom panels for Bread Modular modules.

Here's a very early prototype & we are very excited about this project.

![Custom Panel Prototype](/images/blog/custom-panels.jpg)

---

![Short Circuit Bug](/images/blog/short-circuit.jpg)

This is the first bug reported & we have already made a design change. This was the result of an accidental short-circuit when [attaching](/docs/technical-details/programming-digital-modules) the UPDI programmer to the power socket. Basically, they connected the ground pins to power.

As a result, this transistor was damaged & the power reset functionality was broken.

As a quick fix, we added a load control resistor to the [UPDI programmer](/modules/updi-programmer). As a proper fix, we are now working on a short-circuit detection & prevention circuit for the power supply.

---

These are the key events in the community in March 2025. We hope things will be even better in April.