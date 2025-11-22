---
title: Firmware - FX Rack
summary: Learn about the FX Rack firmware with delay, reverb, and comb filter effects.
---

FX Rack is a professional-quality effects processor designed to work with the [4mix](/modules/4mix)'s send/return setup. It provides delay, reverb, and comb filter effects with independent processing for two audio channels.

## Features

### Channel A1 (Delay/Reverb)
- **Delay**: Tempo-synced delay with adjustable length and feedback
- **Reverb**: Classic reverb algorithm with adjustable size (RT60)
- **Pipe Delay Mode**: Toggle mode that feeds the delay output into the reverb input for more complex textures
- **Mix Control**: Adjustable mix between delay and reverb outputs

### Channel A2 (Comb Filter)
- **Comb Filter**: Short delay effect (1ms to 50ms) with adjustable delay time and feedback

## Controls

### CV Inputs

#### CV1 (Delay Length)
- Controls the delay length for the delay processor
- Range: 0 to 1/2 beat
- Tempo-synced: Synced to MIDI tempo when MIDI clock is present

#### CV2 (Delay Feedback)
- Controls the feedback amount for the delay
- Range: 0.0 to 1.0

### MIDI CC Controls (Bank A)

To access these controls, you need to use the MCC module and select bank A:

1. **CC 20 (Reverb Size)**: Controls the reverb size (RT60/reverb time)
   - Similar to Room Size, this controls the RT60 (reverb decay time)
   - Range: 0.1 to 3.0 seconds
   - Lower values = shorter decay, higher values = longer decay

2. **CC 21 (Delay/Reverb Mix)**: Controls the mix between delay and reverb for output A1
   - Center position: Mixes delay and reverb equally
   - Turning clockwise: Mixes more reverb
   - Turning counter-clockwise: Mixes more delay
   - This determines the final output mix for the Delay/Reverb channel

3. **CC 22 (Comb Length)**: Controls the delay length for the comb filter
   - Range: 1ms to 50ms
   - Short delay for creating stereo width and modulation effects

4. **CC 23 (Comb Feedback)**: Controls the feedback amount for the comb filter
   - Range: 0.0 to 1.0
   - Higher values create more pronounced delay repeats

### MODE Button

- **Hold for 200ms**: Toggles Pipe Delay Mode
  - When enabled (LED ON): The A1 channel delay output is fed into the reverb input along with the dry signal
  - When disabled (LED OFF): Only the dry signal goes into the reverb
  - The state is saved and persists across power cycles

## Audio Processing

The FX Rack processes audio in the following way:

**Input A1 (Delay/Reverb In):**
- Audio input for both the Delay and Reverb processors
- Signal goes through delay first
- Depending on Pipe Delay Mode:
  - Enabled: Delay output + dry signal → Reverb
  - Disabled: Dry signal → Reverb
- Final output (A1) is a mix of delayed signal and reverb output, controlled by CC 21 (Delay/Reverb Mix)
- Output A1 is 100% wet signal

**Input A2 (Comb In):**
- Audio input for the Comb Filter
- Signal goes through comb filter delay
- Output A2 is the comb filter output (100% wet signal)

This design allows for creative effects processing: delay/reverb on channel A1 and comb filter effects on channel A2, perfect for use with the 4mix's send/return setup.

