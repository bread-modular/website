"use client";
import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  connected: boolean;
  status: string;
  appInfo: string | null;
  loadingAppInfo: boolean;
  connectToPico: () => Promise<void>;
  disconnectFromPico: () => Promise<void>;
  getAppInfo: () => Promise<void>;
  unsupported?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  status,
  appInfo,
  loadingAppInfo,
  connectToPico,
  disconnectFromPico,
  getAppInfo,
  unsupported = false,
}) => {
  return (
    <>
      <h1 className={styles.header}>Raspberry Pi Pico Web Interface</h1>
      {unsupported ? (
        <div className={styles.unsupportedMessage}>
          Web Serial API is not supported in this browser.<br />
          Please use <span className={styles.browserHighlight}>Google Chrome</span> on a PC or Mac.
        </div>
      ) : (
        <div className={styles.buttonRow}>
          <button
            className={styles.button}
            onClick={connectToPico}
            disabled={connected}
          >
            Connect
          </button>
          <button
            className={styles.button}
            onClick={disconnectFromPico}
            disabled={!connected}
          >
            Disconnect
          </button>
          <span className={styles.status}>{status}</span>
          {connected && (
            <span className={styles.appInfoContainer}>
              {loadingAppInfo ? (
                <span className={styles.loadingAppInfo}>Loading app info...</span>
              ) : appInfo ? (
                <span className={styles.appInfoText}>
                  App: {appInfo}
                  <button 
                    onClick={getAppInfo} 
                    className={styles.refreshButton}
                  >
                    ↻
                  </button>
                </span>
              ) : (
                <span className={styles.noAppInfo}>
                  No app info
                  <button 
                    onClick={getAppInfo} 
                    className={styles.refreshButton}
                  >
                    ↻
                  </button>
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default Header; 