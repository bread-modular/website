"use client";
import React, { useState } from "react";
import styles from "./MCC.module.css";

interface MCCProps {
  knobs: string[];
  knobDescriptions?: string[];
  bank: "A" | "B" | "C";
  title: string;
}

const MCC: React.FC<MCCProps> = ({ knobs, knobDescriptions, bank, title }) => {
  const [showCCs, setShowCCs] = useState(false);
  const [hoveredKnob, setHoveredKnob] = useState<number | null>(null);

  const getBankCCRange = (bank: string) => {
    switch (bank) {
      case "A": return 20;
      case "B": return 27;
      case "C": return 85;
      default: return 20;
    }
  };

  const baseCCValue = getBankCCRange(bank);

  return (
    <div className={styles.mccBox}>
      <div className={styles.mccHeader}>
        <div className={styles.mccTitle}>{title}</div>
      </div>
      <div className={styles.knobsContainer}>
        {knobs.map((knobName, index) => (
          <div 
            key={index} 
            className={styles.knob}
            onMouseEnter={() => setHoveredKnob(index)}
            onMouseLeave={() => setHoveredKnob(null)}
          >
            <div className={styles.knobCircle}></div>
            <div className={styles.knobLabelContainer}>
              <div className={styles.knobLabel}>{knobName}</div>
              {showCCs && (
                <div className={styles.ccValue}>CC {baseCCValue + index}</div>
              )}
            </div>
            {hoveredKnob === index && knobDescriptions && knobDescriptions[index] && (
              <div className={styles.tooltip}>
                {knobDescriptions[index]}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.mccFooter}>
        <div className={styles.bankSelector}>
          <span className={styles.bankLabel}>MCC:</span>
          <div className={styles.bankBoxes}>
            {["A", "B", "C"].map((bankLetter) => (
              <div 
                key={bankLetter}
                className={`${styles.bankBox} ${bank === bankLetter ? styles.bankBoxActive : ''}`}
              >
                {bankLetter}
              </div>
            ))}
          </div>
        </div>
        <button 
          className={styles.ccToggle}
          onClick={() => setShowCCs(!showCCs)}
          title={showCCs ? "Hide CC values" : "Show CC values"}
        >
          CC
        </button>
      </div>
    </div>
  );
};

export default MCC; 