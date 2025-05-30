"use client";
import React from "react";
import styles from "./SampleFX.module.css";

interface SampleFXProps {
  fx1: string;
  fx2: string;
  fx3: string;
  onFxChange: (fxIndex: string, fxValue: string) => Promise<void>;
  loading: boolean;
}

const SampleFX: React.FC<SampleFXProps> = ({
  fx1,
  fx2,
  fx3,
  onFxChange,
  loading
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
          disabled={loading}
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
    <div className={`${styles.sampleFxContainer} ${loading ? styles.loadingContainer : ''}`}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingText}>Loading...</div>
        </div>
      )}
      
      <div className={styles.fxSlotsContainer}>
        <div className={styles.fxGroupContainer}>
          <div className={styles.fxGroupA}>
            {renderFXSelector('fx1', fx1, 'FX1 (MCC: A)', 'fxSlotGroupA')}
            {renderFXSelector('fx2', fx2, 'FX2 (MCC: B)', 'fxSlotGroupA')}
          </div>
          <div className={styles.fxGroupB}>
            {renderFXSelector('fx3', fx3, 'FX3 (MCC: C)', 'fxSlotGroupB')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleFX; 