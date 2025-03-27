---
title: Building Your First Bread Modular Module
date: 2024-03-29
author: Alex Johnson
summary: A step-by-step guide to building your first Bread Modular module from scratch.
---

One of the greatest advantages of Bread Modular is how easy it is to build your own modules. In this guide, we'll walk through the process of creating your first module from start to finish.

![Module PCB](/images/docs/hithat-pcb-module.png)

## What You'll Need

Before getting started, gather these tools and components:

- Soldering iron and solder
- PCB for your chosen module (you can order this from [PCB manufacturing services](https://youtu.be/eTam3B5scmY))
- Components specified in the BOM (Bill of Materials)
- Basic electronics tools (wire cutters, tweezers, etc.)
- Multimeter for testing

![HiHat Module](/images/modules/hihat.jpg)

## Step 1: Understanding Your Module

Each Bread Modular module consists of a simple PCB with all components soldered directly onto it. Before beginning assembly, take some time to understand the circuit design and how the module works.

@https://youtu.be/eTam3B5scmY

## Step 2: Preparing Your Workspace

Create a clean, well-lit workspace with good ventilation for soldering. Organize your components in a logical manner to avoid confusion during assembly.

![UPDI Programmer in Action](/images/docs/updi_programmer_in_action.jpg)

## Step 3: Component Assembly

Follow these general steps for component assembly:

1. Start with the smallest components (resistors, capacitors)
2. Move to larger components (ICs, sockets)
3. Finish with the largest components (potentiometers, jacks)

Always check polarity for components like diodes and electrolytic capacitors!

![Power Rails](/images/docs/power-rails.png)

## Step 4: Testing

Once assembly is complete, perform basic continuity tests before powering on your module. This preventative step can save components from damage due to assembly errors.

## Step 5: First Power-Up

When connecting power for the first time, use a current-limited power supply if possible. This provides an extra layer of protection in case of any issues.

![UPDI Flash Process](/images/docs/updi-flash.png)

## Next Steps

After successfully building your first module, explore our other designs or consider creating your own variations. The open-source nature of Bread Modular means you can modify and expand upon the existing designs.

Be sure to share your builds on our Discord channel and tag us on Instagram with #BreadModular! 