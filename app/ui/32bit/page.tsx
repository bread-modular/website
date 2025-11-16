/* eslint-disable react-hooks/rules-of-hooks */
 "use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Header32 from "./components/Header";
import Terminal from "../16bit/components/Terminal";
import styles from "./page.module.css";
import type { MessageObj, MessageType } from "@/app/lib/webserial";

type FirmwareOption = {
  id: string;
  label: string;
  manifestUrl: string;
};

type FlashState = import("esp-web-tools/dist/const").FlashState;

type SerialPortLike = {
  open: (options: { baudRate: number; bufferSize?: number }) => Promise<void>;
  close: () => Promise<void>;
};

export default function Placeholder32UI() {
  const [firmwares, setFirmwares] = useState<FirmwareOption[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [port, setPort] = useState<SerialPortLike | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [flashState, setFlashState] = useState<FlashState | null>(null);
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFirmwares() {
      try {
        const res = await fetch("/api/32bit/firmwares");
        if (!res.ok) {
          throw new Error(`Failed to load firmware list: ${res.status}`);
        }
        const data = (await res.json()) as FirmwareOption[];
        if (!cancelled) {
          setFirmwares(data);
        }
      } catch {
        if (!cancelled) {
          setFirmwares([]);
        }
      }
    }

    loadFirmwares();

    return () => {
      cancelled = true;
    };
  }, []);

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
          // ignore cleanup errors
        });
      }
    };
  }, [port]);

  const appendMessage = useCallback((message: string, type: MessageType = "status") => {
    setMessages((prev) => [...prev, { message, type }]);
  }, []);

  const handleConnect = useCallback(async () => {
    if (typeof navigator === "undefined") return;

    const nav = navigator as any;

    if (!("serial" in nav)) {
      appendMessage("Web Serial is not supported in this browser.", "error");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      appendMessage("Web Serial requires HTTPS or localhost. Please reload this page over a secure context.", "error");
      return;
    }

    setIsConnecting(true);
    appendMessage("Requesting serial port access…", "status");
    try {
      const serialPort: SerialPortLike = await nav.serial.requestPort();
      setPort(serialPort);
      appendMessage("Serial port selected. Ready to install firmware.", "status");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Failed to open serial port: ${message}`, "error");
    } finally {
      setIsConnecting(false);
    }
  }, [appendMessage]);

  const handleDisconnect = useCallback(async () => {
    try {
      await port?.close();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Failed to cleanly close the port: ${message}`, "error");
    } finally {
      setPort(null);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }, [appendMessage, port]);

  const handleInstall = useCallback(async () => {
    if (!port) {
      appendMessage("Please connect to a device first.", "error");
      return;
    }
    if (!firmwares || !firmwares.length) {
      appendMessage("No firmware bundles available.", "error");
      return;
    }

    const current = firmwares[selectedIndex];
    setIsInstalling(true);
    setFlashState(null);
    setMessages([]);
    appendMessage(`Starting installation for: ${current.label}`, "status");
    appendMessage(`Using manifest: ${current.manifestUrl}`, "status");

    try {
      const { downloadManifest } = await import("esp-web-tools/dist/util/manifest.js");
      const { flash } = await import("esp-web-tools/dist/flash.js");

      const manifest = await downloadManifest(current.manifestUrl);

      await flash(
        (state: FlashState) => {
          setFlashState(state);
          if (state.message) {
            appendMessage(state.message, "status");
          }
        },
        port as never,
        current.manifestUrl,
        manifest,
        true,
      );

      appendMessage("Installation finished.", "status");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Installation failed: ${message}`, "error");
    } finally {
      setIsInstalling(false);
    }
  }, [appendMessage, firmwares, port, selectedIndex]);

  if (firmwares === null) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <Image
            src="/images/bread-modular-logo.png"
            alt="BreadModular Logo"
            className={styles.logo}
            width={256}
            height={64}
            priority
          />
          <h1 className={styles.pageTitle}>32bit UI</h1>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.section}>
            <Header32
              connected={Boolean(port)}
              status={port ? "Connected" : "Disconnected"}
              connectTo32bit={handleConnect}
              disconnectFrom32bit={handleDisconnect}
            />
          </div>

          {port && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeader}>Firmware Installer</h2>
              <div className={styles.installerSection}>
                {unsupportedReason && (
                  <div className={styles.unsupportedBox}>
                    <p>{unsupportedReason}</p>
                  </div>
                )}

                <div className={styles.installSection}>
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

              </div>
            </div>
          )}
        </div>
      </div>

      <Terminal
        title="32bit Console"
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={async () => {
          appendMessage("Sending manual commands is not supported in the 32bit flasher UI.", "error");
        }}
        connected={false}
      />
    </>
  );
}

