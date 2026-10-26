---
title: The Voltage-Controlled Filter
summary: Replace the resistors with Vactrols to control the cutoff frequency with a voltage, and drive them properly with an opamp.
---

In the previous course, we used a Vactrol as a resistor controlled by a voltage. In the RC filter, R decides the cutoff frequency. So, if we use a Vactrol as R, we get a filter whose cutoff frequency is controlled by a voltage: a **VCF**.

## 1. A Single Vactrol Filter

Let's start with a single stage:

![Vactrol low pass filter](/images/courses/rc-filters/sch-vactrol-low-pass.png)

- The resistor side of the Vactrol replaces R1.
- The LED side is wired the same way as in the previous course (with a 1k resistor).
- U2A buffers the output.

The audio (a sawtooth wave) goes into the resistor side of the Vactrol. For CV_IN, use the 16bit's pulse generator. Connect the scope like this:

- The pulse (CV_IN) goes to the 16bit's A2 input (blue).
- The probe goes to the 16bit's A1 input through the buffered oscilloscope probe (yellow).

![Vactrol filter with a pulse as the CV](/images/courses/rc-filters/scope-vcf-pulse.png)

*Blue: the pulse (CV_IN). Yellow: the filtered sawtooth wave.*

- When the LED is off, the Vactrol is around 10M ohms. With 10nF, the cutoff frequency is below 2Hz. So, almost no sound (just a tiny ripple).
- When the pulse arrives, the LED lights up, the resistance drops to a few kilohms, and the filter opens up.
- After the pulse, the filter doesn't close immediately. Vactrols are slow, so the resistance rises gradually and the sound fades out smoothly. The pulse lasts less than 100ms, but the sound keeps fading for about half a second.

Now listen to the output. Each pulse gives you a short, plucky sound.

> 🛠 Use the pulse generator → envelope generator setup (from the first lesson of the previous course) as CV_IN. Now you have an envelope-controlled filter.

## 2. The Problem with the LED Resistor

Now, let's replace the pulse with a potentiometer, so we can set the CV by hand:

![Vactrol filter with a potentiometer as the CV](/images/courses/rc-filters/sch-vactrol-pot-cv.png)

- RV1 is the first potentiometer of the 50k pots module.
- Pin 1 of the pot goes to GND.
- Pin 3 goes to 3.3V through R3 (1k). This resistor limits the current through the LED.
- The wiper (pin 2) is our CV_IN. It goes directly into the Vactrol's LED (no resistor this time).

Move the blue probe (A2) to CV_IN, so we can see the voltage at the LED's input. Keep the yellow probe on the output.

Turn the knob slowly from 0 and watch the scope:

- At first, the blue trace rises with the knob, but nothing happens to the sound. The LED needs about 1.5V before it starts to light up. Below that, there's no current and the Vactrol stays dark.
- Once the LED turns on, the filter starts to open. By about 1.7V, it's almost fully open.
- But the blue trace never goes higher than about 1.9V. Once the LED is on, it holds its own voltage at around 1.9V, and the rest of the 3.3V drops across R3 (1k).

[video /images/courses/rc-filters/scope-vcf-pot-cv.mp4 /]

*As the knob goes up, the filtered sawtooth (yellow) gets bigger, but the CV (blue) stops at around 1.9V.*

So, the CV range is very limited. The useful part of the knob is a small region near the top, and all of it is squeezed into a tiny range of voltages, from about 1.5V to 1.7V.

Also, the brightness of an LED depends on the **current** through it, not the voltage. With a resistor, the current depends on the LED's forward voltage, which changes from LED to LED and with temperature.

What we really want is: **CV in → current out**.

## 3. The Opamp Current Driver

Here's the trick used in the LOW module:

![Opamp driving the LED with the LED in the feedback loop](/images/courses/rc-filters/sch-low-cv-driver.png)

Let's ignore U5B and the R3/R4 divider for now and focus on U5A:

- The Vactrol LEDs sit between the opamp output (VAC_POS) and the "-" input (VAC_NEG). So, the LED is inside the feedback loop.
- An opamp always tries to make the "-" input equal to the "+" input. So, VAC_NEG has the same voltage as the "+" input.
- From VAC_NEG, the current goes to ground through RV1 (the CUTOFF pot) and R6.
- So, the current through the LED is: `I = V+ / (RV1 + R6)`

Notice what's missing: the LED's forward voltage. The opamp raises its output to whatever voltage the LED needs. Even a tiny CV gives a tiny current. Now the whole CV range is useful.

> 💡 This is called a **voltage-controlled current source**. It's a very common circuit, and it's the proper way to drive an LED (or a Vactrol) from a CV.

Now, the other parts:

- **R3 and R4** halve the CV. The opamp output needs to reach `V+ + LED voltage`. By halving the CV, we keep enough headroom inside our 3.3V supply.
- **RV1 (CUTOFF)** sets how much current a given CV produces. A lower resistance means more current, a brighter LED and a higher cutoff frequency. So, this knob sets the maximum cutoff frequency.
- **R6 (330)** limits the maximum current. Even if RV1 is at 0 ohms, the current is at most `1.65V / 330 ≈ 5mA`.
- **SW1 (BLAST)** connects R7 (330) in parallel with the pot. It instantly opens the filter, no matter where the CUTOFF knob is.

Build U5A, R3, R4, R6 and the potentiometer on the breadboard (use the 50k pots module as RV1, using pins 2 and 3 only). For now, feed the CV directly into R3.

> 🛠 Turn the CV knob slowly again. The filter now starts opening almost immediately and follows the knob much more smoothly.

## 4. Driving Two Vactrols

For the second-order filter, we need two Vactrols, and both need to change together. In the LOW module, both LEDs are connected in parallel:

- Both "+" pins → VAC_POS
- Both "-" pins → VAC_NEG

The opamp now supplies the total current, and it gets shared between the two LEDs.

> 💡 Vactrols are not perfectly matched. One might be a bit brighter (or faster) than the other. For audio, this is totally fine. In fact, small imperfections like this are part of why Vactrol circuits sound so organic.

In the next lesson, we put everything together.
