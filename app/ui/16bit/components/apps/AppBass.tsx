"use client";
import React from "react";
import styles from "./AppBass.module.css";
import common from "./AppCommon.module.css";
import MCC from "../common/MCC";
import CV16Bit from "../common/CV16Bit";

interface AppBassProps {}

const AppBass: React.FC<AppBassProps> = () => {

  const bassKnobs = ["BODY", "CHORUS", "CUTOFF", "RESONANCE"];
  const bassKnobDescriptions = [
    "Combines SHAPE (harmonics) and WARP (tanh drive).",
    "Pitch-stable two-tap fixed delay that doubles the voice.",
    "Controls the low-pass filter cutoff.",
    "Controls the resonance of the filter."
  ];

  return (
    <div className={common.appContainer + ' ' + styles.bassContainer}>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Amp Envelope</h2>
        <div className={common.appGroupLabelsContainer}>
          <CV16Bit cv1="Attack" cv2="Decay" title="Amp Envelope" />
        </div>
        <div className={`${styles.text} ${styles.centerText}`}>
          MIDI gate sustains the note at its peak while held, and MIDI velocity controls amplitude (there is no volume knob).
        </div>
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Shape & Filter (MCC)</h2>
        <MCC
          knobs={bassKnobs}
          knobDescriptions={bassKnobDescriptions}
          bank="A"
          title="Monosynth Controls"
        />
      </div>
    </div>
  );
};

export default AppBass;
