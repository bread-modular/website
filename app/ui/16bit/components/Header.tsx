"use client";
import React from "react";
import styles from "./Header.module.css";
import UnsupportedBrowser from "./UnsupportedBrowser";

interface HeaderProps {
  connected: boolean;
  status: string;
  connectToPico: () => Promise<void>;
  disconnectFromPico: () => Promise<void>;
  selectedApp: string;
  unsupported?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  connectToPico,
  disconnectFromPico,
  selectedApp,
  unsupported = false,
}) => {
  const appOptions = [
    { value: "sampler", label: "Sampler" },
    { value: "polysynth", label: "PolySynth" },
    { value: "monosynth", label: "Monosynth" },
    { value: "fxrack", label: "FX Rack" },
    { value: "elab", label: "Elab" },
    { value: "noop", label: "Noop" }
  ];

  const firmwareLabel =
    appOptions.find((app) => app.value === selectedApp)?.label || selectedApp;

  return (
    <>
      {unsupported ? (
        <UnsupportedBrowser />
      ) : (
        <div className={styles.buttonRow}>
          {connected && (
            <div className={styles.appSwitcher}>
              <span className={styles.appSwitcherLabel}>
                Firmware: {firmwareLabel}
              </span>
              <span className={styles.appSwitcherNote}>
                This firmware runs a single app. To use a different one, flash the matching firmware.
              </span>
            </div>
          )}

          <div className={styles.connectionSection}>
            {connected && (
              <button
                className={styles.button}
                onClick={disconnectFromPico}  
              >
                Disconnect
              </button>
            )}
            {!connected && (
              <button
                className={styles.button}
                onClick={connectToPico}
              >
                Connect
              </button>
            )}    
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 
