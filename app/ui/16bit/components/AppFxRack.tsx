"use client";
import React, { useState } from "react";
import styles from "./AppFxRack.module.css";
import SampleFX from "./SampleFX";
import CV16Bit from "./CV16Bit";
import { AppFXRackState } from "../page";

export interface AppFxRackProps {
  appState: AppFXRackState;
  onFxChange?: (fxIndex: string, fxValue: string) => Promise<void>;
}

const AppFxRack: React.FC<AppFxRackProps> = ({ appState, onFxChange }) => {
  const [settingFx, setSettingFx] = useState<boolean>(false);

  const handleFxChange = async (fxIndex: string, fxValue: string) => {
    if (onFxChange) {
      try {
        setSettingFx(true);
        await onFxChange(fxIndex, fxValue);
      } catch (error) {
        console.error("Error changing FX:", error);
      } finally {
        setSettingFx(false);
      }
    }
  };

  return (
    <div className={styles.fxrackContainer}>
      <div className={styles.fxrackSection}>
        <h2 className={styles.fxrackSubTitle}>Input</h2>
        <div className={styles.fxrackFilterInfoContainer}>
          <div className={styles.fxrackFilterInfoLeft}>
            A1
          </div>
          <div className={styles.fxrackFilterInfoRight}>
            A2
          </div>
        </div>
        <div className={`${styles.text} ${styles.centerText}`}>
            Inputs from A1 and A2 to will be send to Group A and Group B.
        </div>
        <div className={styles.fxrackGroupLabelsContainer}>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupLeft}`}>
            Group A
          </div>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupRight}`}>
            Group B
          </div>
        </div>
      </div>
      <div className={styles.fxrackSection}>
        <h2 className={styles.fxrackSubTitle}>FX</h2>
        <div className={styles.fxrackGroupLabelsContainer}>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupLeft}`}>
            Group A
          </div>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupRight}`}>
            Group B
          </div>
        </div>
        <SampleFX
          fx1={appState.fx1}
          fx2={appState.fx2}
          fx3={appState.fx3}
          onFxChange={handleFxChange}
          loading={settingFx}
        />
      </div>
      <div className={styles.fxrackSection}>
        <h2 className={styles.fxrackSubTitle}>Output</h2>
        <div className={styles.fxrackGroupLabelsContainer}>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupLeft}`}>
            Group A
          </div>
          <div className={`${styles.fxrackGroupLabel} ${styles.fxrackGroupRight}`}>
            Group B
          </div>
        </div>
        <div className={styles.fxrackFilterInfoContainer}>
          <div className={styles.fxrackFilterInfoLeft}>
            A1
          </div>
          <div className={styles.fxrackFilterInfoRight}>
            A2
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFxRack;
