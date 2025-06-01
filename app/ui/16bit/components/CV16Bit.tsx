"use client";
import React from "react";
import styles from "./CV16Bit.module.css";

interface CV16BitProps {
  cv1: string;
  cv2: string;
  title: string;
}

const CV16Bit: React.FC<CV16BitProps> = ({ cv1, cv2, title }) => {
  return (
    <div className={styles.cvContainer}>
      <div className={styles.cvTitle}>{title}</div>
      <div className={styles.cvKnobsContainer}>
        <div className={styles.cvKnob}>
          <div className={styles.cvKnobCircle}></div>
          <div className={styles.cvKnobLabel}>
            <div className={styles.cvKnobLabelType}>CV1</div>
            <div>{cv1}</div>
          </div>
        </div>
        <div className={styles.cvKnob}>
          <div className={styles.cvKnobCircle}></div>
          <div className={styles.cvKnobLabel}>
            <div className={styles.cvKnobLabelType}>CV2</div>
            <div>{cv2}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CV16Bit; 