"use client";
import React from "react";
import styles from "./Keyboard.module.css";

interface KeyboardProps {
  selectedKey?: number;
  onKeyPress: (keyIndex: number) => void;
  disabled?: boolean;
}

interface WhiteKey {
  index: number;
  note: string;
  type: "white";
  position: number;
}

interface BlackKey {
  index: number;
  note: string;
  type: "black";
  whiteKeyIndex: number;
}

type Key = WhiteKey | BlackKey;

const Keyboard: React.FC<KeyboardProps> = ({
  selectedKey,
  onKeyPress,
  disabled = false,
}) => {
  // Define the 12 keys in an octave with their properties
  const keys = [
    { index: 0, note: "C", type: "white", position: 0 },
    { index: 1, note: "C#", type: "black", whiteKeyIndex: 0 }, // Between C and D
    { index: 2, note: "D", type: "white", position: 1 },
    { index: 3, note: "D#", type: "black", whiteKeyIndex: 1 }, // Between D and E
    { index: 4, note: "E", type: "white", position: 2 },
    { index: 5, note: "F", type: "white", position: 3 },
    { index: 6, note: "F#", type: "black", whiteKeyIndex: 3 }, // Between F and G
    { index: 7, note: "G", type: "white", position: 4 },
    { index: 8, note: "G#", type: "black", whiteKeyIndex: 4 }, // Between G and A
    { index: 9, note: "A", type: "white", position: 5 },
    { index: 10, note: "A#", type: "black", whiteKeyIndex: 5 }, // Between A and B
    { index: 11, note: "B", type: "white", position: 6 },
  ];

  const whiteKeys = keys.filter(key => key.type === "white") as WhiteKey[];
  const blackKeys = keys.filter(key => key.type === "black") as BlackKey[];

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
        {blackKeys.map((key) => {
          // Calculate position at the boundary between white keys
          // Since CSS has translateX(-50%), we position at the right edge of the white key
          const whiteKeyWidth = 100 / 7; // Each white key takes 1/7 of the width
          const leftPosition = (key.whiteKeyIndex + 1) * whiteKeyWidth;
          
          return (
            <button
              key={key.index}
              className={`${styles.blackKey} ${
                selectedKey === key.index ? styles.selected : ""
              } ${disabled ? styles.disabled : ""}`}
              onClick={() => handleKeyClick(key.index)}
              disabled={disabled}
              style={{ left: `${leftPosition}%` }}
              title={key.note}
            >
              <span className={styles.keyLabel}>{key.note}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Keyboard; 