"use client";

import React from "react";
import styles from "./Header.module.css";

const UnsupportedBrowser: React.FC = () => {
  return (
    <div className={styles.unsupportedMessage}>
      <div className={styles.unsupportedIcon}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h3 className={styles.unsupportedTitle}>Web Serial API Not Supported</h3>
      <p className={styles.unsupportedText}>
        This browser doesn't support the Web Serial API required to connect to your module.
      </p>
      <p className={styles.unsupportedAction}>
        Please use <span className={styles.browserHighlight}>Google Chrome</span>
      </p>
    </div>
  );
};

export default UnsupportedBrowser;

