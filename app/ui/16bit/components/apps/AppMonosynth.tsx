"use client";
import React from "react";
import styles from "./AppMonosynth.module.css";
import common from "./AppCommon.module.css";
import MCC from "../common/MCC";
import CV16Bit from "../common/CV16Bit";

const AppMonosynth: React.FC = () => {

  const monosynthKnobs = ["BODY", "UNISON", "RESONANCE", "CUTOFF"];
  const monosynthKnobDescriptions = [
    "Combines SHAPE (harmonics) and WARP (tanh drive).",
    "Lower half stacks 1\u20134 voices; upper half adds detune spread.",
    "Controls the resonance of the filter.",
    "Inverted Polysynth-style taper: clockwise closes the filter down to ~140 Hz."
  ];

  return (
    <div className={common.appContainer + ' ' + styles.monosynthContainer}>
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
          knobs={monosynthKnobs}
          knobDescriptions={monosynthKnobDescriptions}
          bank="A"
          title="Monosynth Controls"
        />
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Motion Recorder</h2>
        <div className={`${styles.text} ${styles.centerText}`}>
          The hardware MODE button cycles LIVE &rarr; RECORDING &rarr; PLAYBACK. While recording (LED blinking), every MIDI-clock tick snapshots the raw CV1/CV2 values plus MCC Bank A into a four-bar loop that auto-loops in playback (LED solid), ignoring manual knob moves; abort mid-take or exit playback by pressing MODE again. Requires a running MIDI clock.
        </div>
      </div>
    </div>
  );
};

export default AppMonosynth;
