"use client";
import React from "react";
import styles from "./Keyboard.module.css";

interface KeyboardProps {
  selectedKey?: number;
  onKeyPress: (keyIndex: number) => void;
  disabled?: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({
  selectedKey,
  onKeyPress,
  disabled = false,
}) => {
  // Define the 12 keys in an octave with their properties
  const keys = [
    { index: 0, note: "C", type: "white", position: 0 },
    { index: 1, note: "C#", type: "black", position: 0.5 },
    { index: 2, note: "D", type: "white", position: 1 },
    { index: 3, note: "D#", type: "black", position: 1.5 },
    { index: 4, note: "E", type: "white", position: 2 },
    { index: 5, note: "F", type: "white", position: 3 },
    { index: 6, note: "F#", type: "black", position: 3.5 },
    { index: 7, note: "G", type: "white", position: 4 },
    { index: 8, note: "G#", type: "black", position: 4.5 },
    { index: 9, note: "A", type: "white", position: 5 },
    { index: 10, note: "A#", type: "black", position: 5.5 },
    { index: 11, note: "B", type: "white", position: 6 },
  ];

  const whiteKeys = keys.filter(key => key.type === "white");
  const blackKeys = keys.filter(key => key.type === "black");

  const handleKeyClick = (keyIndex: number) => {
    if (!disabled) {
      onKeyPress(keyIndex);
    }
  };

  return (
    <div className={styles.keyboard}>
      {/* Group background boxes */}
      <div className={styles.groupBackgrounds}>
        <div className={styles.groupABackground}></div>
        <div className={styles.groupBBackground}></div>
      </div>
      
      {/* White keys */}
      <div className={styles.whiteKeysContainer}>
        {whiteKeys.map((key) => (
          <button
            key={key.index}
            className={`${styles.whiteKey} ${
              selectedKey === key.index ? styles.selected : ""
            } ${disabled ? styles.disabled : ""}`}
            onClick={() => handleKeyClick(key.index)}
            disabled={disabled}
            title={key.note}
          >
            <span className={styles.keyLabel}>{key.note}</span>
          </button>
        ))}
      </div>

      {/* Black keys */}
      <div className={styles.blackKeysContainer}>
        {blackKeys.map((key) => (
          <button
            key={key.index}
            className={`${styles.blackKey} ${
              selectedKey === key.index ? styles.selected : ""
            } ${disabled ? styles.disabled : ""}`}
            onClick={() => handleKeyClick(key.index)}
            disabled={disabled}
            style={{ left: `${key.position * (100 / 7)}%` }}
            title={key.note}
          >
            <span className={styles.keyLabel}>{key.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Keyboard; 