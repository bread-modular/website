export interface FX {
  title: string;
  knobs: string[];
  knobDescriptions?: string[];
}

export const FX_LIBRARY: Record<string, FX> = {
  "noop": {
    title: "Noop",
    knobs: ["N/C", "N/C", "N/C", "N/C"],
    knobDescriptions: [
      "Not Connected",
      "Not Connected",
      "Not Connected",
      "Not Connected"
    ]
  },
  "delay": {
    title: "Delay",
    knobs: ["Beats", "Feedback", "Wet/Dry", "Lowpass Cutoff"],
    knobDescriptions: [
      "Delay beats from 0 to 1/2 beats (requires MIDI clock in the MIDI transport).",
      "Feedback of the delay from 0 to 100%.",
      "Wet/dry mix. 0 is dry and 100% is wet.",
      "Lowpass cutoff. 0 is no lowpass filtering and 100% is full filtering."
    ]
  },
  "metalverb": {
    title: "MetalVerb",
    knobs: ["Shakeness", "Decay", "Wet/Dry", "Lowpass Cutoff"],
    knobDescriptions: [
      "Shakiness. 0 position gives a more metallic sound. Increasing gives a shaky/wobbly sound.",
      "Decay. 0 is no decay and 100% is full decay.",
      "Wet/dry mix. 0 is dry and 100% is wet.",
      "Lowpass cutoff. 0 is no lowpass filtering and 100% is full filtering."
    ]
  },
  "ladder-filter": {
    title: "Ladder Filter (Low Pass)",
    knobs: ["Envelope", "Mod Depth", "Resonance", "Cutoff"],
    knobDescriptions: [
      "Controls both attack and release at once. 0 is very fast and increasing will make it slower.",
      "Modulation depth. 0 is no modulation increasing will use envelope to modulate the filter cutoff.",
      "Resonance. 0 is no resonance and increasing will make it more resonant.",
      "Cutoff. 0 is no lowpass filtering and 100% is full filtering."
    ]
  },
  "rumble": {
    title: "Techno Rumble",
    knobs: ["Decay", "Color", "Volume", "Drive"],
    knobDescriptions: [
      "Decay. Controls the feedback of the delay tail.",
      "Color. Rumble lowpass cutoff. Left is brighter (500Hz), Right is darker (30Hz).",
      "Rumble volume relative to the dry signal.",
      "Drive. Adds distortion and bitcrushing (downsampling) for industrial texture."
    ]
  }
}; 