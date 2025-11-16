"use client";

import React from "react";
import styles from "../../16bit/components/Header.module.css";

interface Header32Props {
  connected: boolean;
  status: string;
  connectTo32bit: () => Promise<void>;
  disconnectFrom32bit: () => Promise<void>;
   /**
    * Whether the ESP32 log listener is currently active.
    */
  logsListening: boolean;
  /**
   * Toggle the ESP32 log listener on/off.
   */
  onToggleLogs: () => Promise<void> | void;
  /**
   * Whether a firmware installation is currently in progress.
   * Used to disable log listening while esp-web-tools is flashing.
   */
  isInstalling: boolean;
  unsupported?: boolean;
}

const Header32: React.FC<Header32Props> = ({
  connected,
  connectTo32bit,
  disconnectFrom32bit,
  logsListening,
  onToggleLogs,
  isInstalling,
  unsupported = false,
}) => {
  return (
    <>
      {unsupported ? (
        <div className={styles.unsupportedMessage}>
          <strong>Web Serial API Not Supported</strong>
          <br />
          <br />
          {"This browser doesn't support Web Serial, which is required for the 32bit flasher."}
          <br />
          <br />
          Please use <span className={styles.browserHighlight}>Google Chrome</span> on a PC/Mac to access the full
          32bit flashing experience.
        </div>
      ) : (
        <div
          className={`${styles.connectionSection} ${
            connected ? styles.connectionSectionConnected : styles.connectionSectionCenter
          }`}
        >
          {connected && (
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              Connected
            </div>
          )}
          <div className={styles.buttonRow}>
            {connected ? (
              <button className={styles.button} onClick={disconnectFrom32bit}>
                Disconnect
              </button>
            ) : (
              <button className={styles.button} onClick={connectTo32bit}>
                Connect
              </button>
            )}
            <button
              className={styles.button}
              onClick={onToggleLogs}
              disabled={!connected || isInstalling}
            >
              {logsListening ? "Stop Listening" : "Listen to Logs"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header32;

