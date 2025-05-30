"use client";
import React from "react";
import styles from "./SampleFX.module.css";

interface SampleFXProps {
  fx1: string;
  fx2: string;
  fx3: string;
  onFxChange: (fxIndex: string, fxValue: string) => Promise<void>;
}

const SampleFX: React.FC<SampleFXProps> = ({
  fx1,
  fx2,
  fx3,
  onFxChange
}) => {
  const fxOptions = ['noop', 'delay', 'metalverb'];

  const handleFXChange = async (fxIndex: string, fxValue: string) => {
    await onFxChange(fxIndex, fxValue);
  };

  const renderFXSelector = (fxIndex: string, fxValue: string, label: string, groupClass: string) => {
    return (
      <div className={`${styles.fxSlot} ${styles[groupClass]}`}>
        <label className={styles.fxLabel}>{label}</label>
        <select
          className={styles.fxSelect}
          value={fxValue}
          onChange={(e) => handleFXChange(fxIndex, e.target.value)}
        >
          {fxOptions.map((fx) => (
            <option key={fx} value={fx}>
              {fx}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className={styles.sampleFxContainer}>
      <h2 className={styles.sampleUploadTitle}>Plugable FX</h2>
      <div className={styles.groupLabelsContainer}>
        <div className={`${styles.groupLabel} ${styles.groupA}`}>
          Group A
        </div>
        <div className={`${styles.groupLabel} ${styles.groupB}`}>
          Group B
        </div>
      </div>
      
      <div className={styles.fxSlotsContainer}>
        <div className={styles.fxGroupContainer}>
          <div className={styles.fxGroupA}>
            {renderFXSelector('fx1', fx1, 'FX1', 'fxSlotGroupA')}
            {renderFXSelector('fx2', fx2, 'FX2', 'fxSlotGroupA')}
          </div>
          <div className={styles.fxGroupB}>
            {renderFXSelector('fx3', fx3, 'FX3', 'fxSlotGroupB')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleFX; 