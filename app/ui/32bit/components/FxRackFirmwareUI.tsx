"use client";

import React from "react";
import styles from "./FxRackFirmwareUI.module.css";

interface FxRackFirmwareUIProps {
  firmwareVersion?: string | null;
}

const FxRackFirmwareUI: React.FC<FxRackFirmwareUIProps> = ({ firmwareVersion }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>FX Rack</h2>
        {firmwareVersion && (
          <span className={styles.version}>v{firmwareVersion}</span>
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.placeholder}>FX Rack controls will be available here.</p>
      </div>
    </div>
  );
};

export default FxRackFirmwareUI;

