"use client";

import React from "react";
import styles from "../../16bit/components/Header.module.css";

interface Header32Props {
  connected: boolean;
  status: string;
  connectTo32bit: () => Promise<void>;
  disconnectFrom32bit: () => Promise<void>;
  unsupported?: boolean;
  firmwareName?: string | null;
  firmwareVersion?: string | null;
}

const Header32: React.FC<Header32Props> = ({
  connected,
  connectTo32bit,
  disconnectFrom32bit,
  unsupported = false,
  firmwareName,
  firmwareVersion,
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
            <div className={styles.statusContainer}>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                Connected
              </div>
              {(firmwareName || firmwareVersion) && (
                <div className={styles.appInfoText}>
                  {firmwareName && <span>{firmwareName}</span>}
                  {firmwareName && firmwareVersion && <span> • </span>}
                  {firmwareVersion && <span>v{firmwareVersion}</span>}
                </div>
              )}
            </div>
          )}
          <div className={styles.buttonRow}>
            {connected ? (
              <>
                <button
                  className={styles.button}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/ui/32bit/install";
                    }
                  }}
                >
                  Install Firmware
                </button>
                <button className={styles.button} onClick={disconnectFrom32bit}>
                  Disconnect
                </button>
              </>
            ) : (
              <button className={styles.button} onClick={connectTo32bit}>
                Connect
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header32;

