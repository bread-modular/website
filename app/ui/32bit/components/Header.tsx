"use client";

import React from "react";
import styles from "../../16bit/components/Header.module.css";
import UnsupportedBrowser from "../../16bit/components/UnsupportedBrowser";

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
        <UnsupportedBrowser />
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

