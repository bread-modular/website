---
title: Programming Digital Modules
summary: How to program Bread Modular's digital modules using ATTiny 1616 microcontrollers via UPDI.
---

Most of the digital and hybrid modules of bread Modular including 8bit and MIDI use a microcontroller called ATTiny 1616. This guide shows you how to program those modules with our provided firmware (from source code) or customize them as you want. 

[embed]https://youtu.be/7ViV-pzMLu0?si=iYhmWURk8hgzpm2r[/embed]

## Programmer

In order to program these modules, we need an interface between the computer and the module. That's a programmer. In this case we use a programmer with a protocol called UPDI (hence UPDI programmer).

If you need the easiest way, you can get our [updi-programmer](/modules/UPDI-programmar) or you can [convert](https://youtu.be/YOGeoW_QySs?si=nZRVHnHZheLrTDw1&t=47) any Arduino into such a programmer. 

## Interfacing

Now connect your UPDI programmer to the computer via USB. Then get the single UPDI wire and connect it to the correct socket (or hole) in your module. 

> Usually the UPDI socket is named as "U" or "UPDI" and generally it's the last socket in the input section.
> 
> But in our hi-hat module, it's located in the bottom middle.

![Bread Modular UPDI Programmer In Action](/images/docs/updi_programmer_in_action.jpg)

## Related Software

We don't provide pre-built firmware but we provide the source code. Don't worry, it only takes about 10 seconds to program your module once connected. 

These are the software tools we need: 

- [VS Code](https://code.visualstudio.com) (or Cursor)
- Install the [Platform IO](https://platformio.org/platformio-ide) extension from the "VS Code Marketplace"
- Go to Platform IO's "Platform" section and select & install "Atmel megaAVR"


## Source Code

Now you need the source code which contains the firmware of your module. 

- For that download our GitHub [repository](https://github.com/bread-modular/bread-modular).
- Then go to your [module](https://github.com/bread-modular/bread-modular/tree/main/modules).
- Visit the directory called [code](https://github.com/bread-modular/bread-modular/tree/main/modules/8bit) and there will be one or many directories.
- Select one of those and that's the source code of your firmware.

Once you select the firmware, open it using VSCode. 

## Flashing

The process of sending the firmware into the microcontroller is known as flashing. 

### Selecting the Programmer

You need to select the correct UPDI programmer in PlatformIO. 

For that, click the dropdown in the VS Code footer as shown below and pick your programmer. 

![Select the correct UPDI Programmer](/images/docs/select-updi-programmar.png)

If you don't know the name of your programmer, just unplug it from the USB. Check the list. Plug it back in and find the new one on the list. 

To flash, you can click the following button on the bottom of VSCode. 

![Select the correct UPDI Programmer](/images/docs/updi-flash.png)                                                                                                                                              

It will take about 10-20 seconds to complete the process.

If you have a MacBook with Apple Silicon chip, you may have to install Rosetta with the following command in the terminal:

~~~
softwareupdate --install-rosetta --agree-to-license
~~~

Yeah! You have successfully programmed your module. 

## Experimentation

Here's the fun part. Just don't stop here. Experiment with the source code and customize it. Especially firmwares for modules like [8bit](/modules/8bit). 

If you are new to programming, use an IDE like [Cursor](https://www.cursor.com) to help you with the use of AI. 

> Fun Fact: 80% of our firmware codebase is written by AI. We simply guide it to do what we want to do.