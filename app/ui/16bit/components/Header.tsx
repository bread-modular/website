"use client";
import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  connected: boolean;
  status: string;
  connectToPico: () => Promise<void>;
  disconnectFromPico: () => Promise<void>;
  selectedApp: string;
  switchingApp: boolean;
  onAppChange: (appName: string) => void;
  unsupported?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  connectToPico,
  disconnectFromPico,
  selectedApp,
  switchingApp,
  onAppChange,
  unsupported = false,
}) => {
  const appOptions = [
    { value: "sampler", label: "Sampler" },
    { value: "polysynth", label: "PolySynth" },
    { value: "noop", label: "Noop" }
  ];

  const handleAppChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const appName = e.target.value;

    const confirmed = window.confirm(
      `Are you sure you want to switch to ${appOptions.find(app => app.value === appName)?.label || appName}?`
    );

    if (!confirmed) {
      return;
    }

    onAppChange(appName);
  };

  return (
    <>
      {unsupported ? (
        <div className={styles.unsupportedMessage}>
          Web Serial API is not supported in this browser.<br />
          Please use <span className={styles.browserHighlight}>Google Chrome</span> on a PC or Mac.
        </div>
      ) : (
        <div className={styles.buttonRow}>
          {connected && (
            <div className={styles.appSwitcher}>
              <label htmlFor="app-select" className={styles.appSwitcherLabel}>
                Current App:
              </label>
              <select
                id="app-select"
                value={selectedApp}
                onChange={handleAppChange}
                disabled={switchingApp}
                className={styles.appSelect}
              >
                <option value="">Select an app...</option>
                {appOptions.map((app) => (
                  <option key={app.value} value={app.value}>
                    {app.label}
                  </option>
                ))}
              </select>
              {switchingApp && (
                <span className={styles.switchingIndicator}>Switching...</span>
              )}
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