"use client";
import React from "react";
import styles from "./AppPolysynth.module.css";
import { AppPolysynthState } from "../page";
import MCC from "./MCC";

interface AppPolysynthProps {
  appState: AppPolysynthState;
  onWaveformChange?: (waveform: string) => void;
}

const AppPolysynth: React.FC<AppPolysynthProps> = ({ 
  appState, 
  onWaveformChange 
}) => {

  const handleWaveformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWaveform = event.target.value;
    onWaveformChange?.(selectedWaveform);
  };

  return (
    <div className={styles.polysynthContainer}>
      <div className={styles.polysynthSection}>
        <h2 className={styles.polysynthSubTitle}>Voices</h2>
        <div className={styles.voicesInfo}>
          <div className={styles.waveformSelector}>
            <label htmlFor="waveform-select" className={styles.waveformLabel}>
              Waveform:
            </label>
            <select
              id="waveform-select"
              value={appState.waveform}
              onChange={handleWaveformChange}
              className={styles.waveformDropdown}
            >
              <option value="saw">Saw</option>
              <option value="square">Square</option>
              <option value="tri">Triangle</option>
            </select>
          </div>
          <div className={styles.cvLabels}>
            <div className={styles.cvLabel}>CV1: Amp Attack</div>
            <div className={styles.cvLabel}>CV2: Amp Release</div>
          </div>
        </div>
      </div>

      <div className={styles.polysynthSection}>
        <h2 className={styles.polysynthSubTitle}>Ladder Filter</h2>
        <MCC 
          knobs={["Envelope", "Mod Depth", "Resonance", "CutOff"]}
          bank="A"
          title="Moog Style Ladder Filter"
        />
      </div>

      <div className={styles.polysynthSection}>
        <h2 className={styles.polysynthSubTitle}>Output</h2>
        <div className={styles.outputInfo}>
          <div className={styles.outputLabel}>A1: With filter</div>
          <div className={styles.outputLabel}>A2: Without filter</div>
        </div>
      </div>
    </div>
  );
};

export default AppPolysynth; 