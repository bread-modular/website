'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export type FirmwareOption = {
  id: string;
  label: string;
  manifestUrl: string;
};

type SerialPortLike = {
  open: (options: { baudRate: number; bufferSize?: number }) => Promise<void>;
  close: () => Promise<void>;
};

type FlashStateLike = {
  state?: string;
  message?: string;
  details?: {
    percentage?: number;
    bytesWritten?: number;
    bytesTotal?: number;
  };
};

type FirmwareInstallerSectionProps = {
  firmwares: FirmwareOption[];
};

export default function FirmwareInstallerSection({ firmwares }: FirmwareInstallerSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [port, setPort] = useState<SerialPortLike | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [flashState, setFlashState] = useState<FlashStateLike | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serial" in navigator)) {
      setUnsupportedReason(
        "Your browser does not support Web Serial. Please use a Chromium-based browser like Chrome or Edge.",
      );
    } else if (!window.isSecureContext) {
      setUnsupportedReason("ESP flashing only works on HTTPS or localhost due to browser security restrictions.");
    } else {
      setUnsupportedReason(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (port) {
        port.close().catch(() => {
          // ignore
        });
      }
    };
  }, [port]);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleConnect = useCallback(async () => {
    if (typeof navigator === "undefined") {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;

    if (!("serial" in nav)) {
      appendLog("Web Serial is not supported in this browser.");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      appendLog("Web Serial requires HTTPS or localhost. Please reload this page over a secure context.");
      return;
    }

    setIsConnecting(true);
    appendLog("Requesting serial port access…");
    try {
      const serialPort: SerialPortLike = await nav.serial.requestPort();
      setPort(serialPort);
      appendLog("Serial port selected. Ready to install firmware.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendLog(`Failed to open serial port: ${message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [appendLog]);

  const handleInstall = useCallback(async () => {
    if (!port) {
      appendLog("Please connect to a device first.");
      return;
    }
    if (!firmwares.length) {
      appendLog("No firmware bundles available.");
      return;
    }

    const current = firmwares[selectedIndex];
    setIsInstalling(true);
    setFlashState(null);
    setLogs([]);
    appendLog(`Starting installation for: ${current.label}`);
    appendLog(`Using manifest: ${current.manifestUrl}`);

    try {
      const { downloadManifest } = await import("esp-web-tools/dist/util/manifest.js");
      const { flash } = await import("esp-web-tools/dist/flash.js");

      const manifest = await downloadManifest(current.manifestUrl);

      await flash(
        (state: FlashStateLike) => {
          setFlashState(state);
          if (state.message) {
            appendLog(state.message);
          }
        },
        port as never,
        current.manifestUrl,
        manifest,
        true, // erase first to match default esp-web-tools behavior
      );

      appendLog("Installation finished.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendLog(`Installation failed: ${message}`);
    } finally {
      setIsInstalling(false);
    }
  }, [appendLog, firmwares, port, selectedIndex]);

  if (!firmwares.length) {
    return <p className={styles.sectionDescription}>No firmware bundles were found in /public/32bit.</p>;
  }

  const current = firmwares[selectedIndex];
  const progress =
    flashState?.details?.percentage ??
    (flashState?.details && flashState.details.bytesTotal
      ? Math.round(((flashState.details.bytesWritten ?? 0) / flashState.details.bytesTotal) * 100)
      : undefined);

  return (
    <div className={styles.installerSection}>
      {unsupportedReason && (
        <div className={styles.unsupportedBox}>
          <p>{unsupportedReason}</p>
        </div>
      )}

      <div className={styles.controlsRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleConnect}
          disabled={isConnecting || !!port}
        >
          {port ? "Connected" : isConnecting ? "Connecting…" : "Connect"}
        </button>
      </div>
      {port && (
        <div className={styles.installSection}>
          <h3 className={styles.installHeader}>Firmware installation</h3>
          <div className={styles.fieldGroup}>
            <label htmlFor="firmware-select" className={styles.fieldLabel}>
              Firmware build
            </label>
            <select
              id="firmware-select"
              className={styles.firmwareSelect}
              value={String(selectedIndex)}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
              disabled={isInstalling}
            >
              {firmwares.map((firmware, index) => (
                <option key={firmware.id} value={index}>
                  {firmware.label}
                </option>
              ))}
            </select>

            <p className={styles.manifestHint}>
              Manifest: <span>{current.manifestUrl}</span>
            </p>
          </div>

          <div className={styles.installButtonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleInstall}
              disabled={!port || isInstalling}
            >
              {isInstalling ? "Installing…" : "Install"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.statusRow}>
        <span className={styles.statusDot} data-connected={!!port} />
        <span className={styles.statusText}>
          {port ? "Device connected" : "Device not connected"}
          {progress !== undefined && progress >= 0 && progress <= 100 && (
            <span className={styles.statusProgress}> · {progress}%</span>
          )}
        </span>
      </div>

      <div className={styles.logContainer}>
        <div className={styles.logHeader}>
          <span>Install log</span>
          <button
            type="button"
            className={styles.logClearButton}
            onClick={() => setLogs([])}
            disabled={!logs.length}
          >
            Clear
          </button>
        </div>
        <pre ref={logRef} className={styles.logOutput}>
          {logs.length ? logs.join("\n") : "Logs will appear here."}
        </pre>
      </div>
    </div>
  );
}
