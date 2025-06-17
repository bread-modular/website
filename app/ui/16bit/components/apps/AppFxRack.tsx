"use client";
import React, { useState } from "react";
import styles from "./AppFxRack.module.css";
import common from "./AppCommon.module.css";
import SampleFX from "../common/SampleFX";
import { AppFXRackState } from "../../page";

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
    <div className={common.appContainer}>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Input</h2>
        <div className={common.appDualContainer}>
          <div className={common.appDualLeft}>
            A1
          </div>
          <div className={common.appDualRight}>
            A2
          </div>
        </div>
        <div className={`${styles.text} ${styles.centerText}`}>
            Inputs from A1 and A2 to will be send to Group A and Group B.
        </div>
        <div className={common.appGroupLabelsContainer}>
          <div className={common.appGroupLabel + ' ' + common.appGroupLeft}>
            Group A
          </div>
          <div className={common.appGroupLabel + ' ' + common.appGroupRight}>
            Group B
          </div>
        </div>
      </div>
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>FX</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={common.appGroupLabel + ' ' + common.appGroupLeft}>
            Group A
          </div>
          <div className={common.appGroupLabel + ' ' + common.appGroupRight}>
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
      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Output</h2>
        <div className={common.appGroupLabelsContainer}>
          <div className={common.appGroupLabel + ' ' + common.appGroupLeft}>
            Group A
          </div>
          <div className={common.appGroupLabel + ' ' + common.appGroupRight}>
            Group B
          </div>
        </div>
        <div className={common.appDualContainer}>
          <div className={common.appDualLeft}>
            A1
          </div>
          <div className={common.appDualRight}>
            A2
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFxRack;
