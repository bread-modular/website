"use client";
import React from "react";
import styles from "./SampleFX.module.css";
import { FX_LIBRARY } from "../data/fxLibrary";
import MCC from "./MCC";

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

  const renderFXSelector = (fxIndex: string, fxValue: string, label: string) => {
    return (
      <div className={styles.fxSelectorSimple}>
        <label className={styles.fxLabelSimple}>{label}</label>
        <select
          className={styles.fxSelectSimple}
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

  const renderMCCForFX = (fxValue: string, bank: "A" | "B" | "C") => {
    const fxData = FX_LIBRARY[fxValue];
    if (!fxData) return null;

    return (
      <MCC
        title={fxData.title}
        knobs={fxData.knobs}
        knobDescriptions={fxData.knobDescriptions}
        bank={bank}
      />
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
            <div className={styles.fxUnit}>
              {renderFXSelector('fx1', fx1, 'FX1')}
              {renderMCCForFX(fx1, 'A')}
            </div>
            <div className={styles.fxUnit}>
              {renderFXSelector('fx2', fx2, 'FX2')}
              {renderMCCForFX(fx2, 'B')}
            </div>
          </div>
          <div className={styles.fxGroupB}>
            <div className={styles.fxUnit}>
              {renderFXSelector('fx3', fx3, 'FX3')}
              {renderMCCForFX(fx3, 'C')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleFX; 