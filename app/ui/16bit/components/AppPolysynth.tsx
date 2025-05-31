"use client";
import React from "react";
import styles from "./AppPolysynth.module.css";

interface AppPolysynthProps {
  // No props needed for now
}

const AppPolysynth: React.FC<AppPolysynthProps> = () => {

  return (
    <div className={styles.polysynthContainer}>
      <div className={styles.polysynthSection}>
        <h2 className={styles.polysynthSubTitle}>Voices</h2>
        <div className={styles.voicesInfo}>
          <div className={styles.voiceCount}>9 voices</div>
          <div className={styles.cvLabels}>
            <div className={styles.cvLabel}>CV1: Amp Attack</div>
            <div className={styles.cvLabel}>CV2: Amp Release</div>
          </div>
        </div>
      </div>

      <div className={styles.polysynthSection}>
        <h2 className={styles.polysynthSubTitle}>Ladder Filter (MCC A)</h2>
        <div className={styles.filterInfo}>
          <div className={styles.filterLabel}>Ladder Filter controlled by MCC A</div>
        </div>
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