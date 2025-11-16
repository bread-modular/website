/* eslint-disable react-hooks/rules-of-hooks */
 "use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Header32 from "./components/Header";
import Terminal from "../16bit/components/Terminal";
import styles from "./page.module.css";
import { WebSerialManager } from "@/app/lib/webserial";
import type { MessageObj, MessageType, SerialPort } from "@/app/lib/webserial";
import { stat } from "fs";
import { FlashStateType } from "esp-web-tools/dist/const";

type FirmwareOption = {
  id: string;
  label: string;
  manifestUrl: string;
};

type FlashState = import("esp-web-tools/dist/const").FlashState;


export default function Placeholder32UI() {
  const [firmwares, setFirmwares] = useState<FirmwareOption[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [logsListening, setLogsListening] = useState(false);

  const serialManagerRef = useRef<WebSerialManager | null>(null);
  const installationAttemptsRef = useRef(0);

  const appendMessage = useCallback((message: string, type: MessageType = "status") => {
    setMessages((prev) => [...prev, { message, type }]);
  }, []);

  useEffect(() => {
    // Initialise a WebSerialManager instance for log listening
    serialManagerRef.current = new WebSerialManager((message, type) => {
      appendMessage(message, type);
    });

    return () => {
      // Clean up any active serial connection on unmount
      if (serialManagerRef.current) {
        serialManagerRef.current.disconnect().catch(() => {
          // ignore cleanup errors
        });
      }
    };
  }, [appendMessage]);

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

  const handleConnect = useCallback(async () => {
    if (typeof navigator === "undefined") return;

    if (!("serial" in navigator)) {
      appendMessage("Web Serial is not supported in this browser.", "error");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      appendMessage("Web Serial requires HTTPS or localhost. Please reload this page over a secure context.", "error");
      return;
    }

    appendMessage("Requesting serial port access…", "status");
    try {
      const serialPort = await navigator.serial!.requestPort();
      setPort(serialPort);
      appendMessage("Serial port selected. Ready to install firmware.", "status");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Failed to open serial port: ${message}`, "error");
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

  const handleToggleLogs = useCallback(async (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (!serialManagerRef.current) {
      return;
    }

    const shouldListen = event ? event.target.checked : !logsListening;

    // If already listening and we want to stop
    if (logsListening && !shouldListen) {
      try {
        await serialManagerRef.current.disconnect();
        appendMessage("Stopped listening to logs.", "status");
      } finally {
        setLogsListening(false);
      }
      return;
    }

    // If not listening and we want to start
    if (!logsListening && shouldListen) {
      if (!port) {
        appendMessage("Please connect to a device before listening to logs.", "error");
        return;
      }

      try {
        await serialManagerRef.current.connectWithExistingPort(port);
        setLogsListening(true);
        appendMessage("Listening to 32bit logs…", "status");
      } catch {
        // Errors are already reported via the WebSerialManager's callback
        setLogsListening(false);
      }
    }
  }, [appendMessage, logsListening, port]);

  const sendConsoleMessage = async () => {
    if (!logsListening || !serialManagerRef.current) {
      appendMessage("Start 'Listen to Logs' before sending commands.", "error");
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      await serialManagerRef.current.sendMessage(trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Send error: ${message}`, "error");
    } finally {
      setInput("");
    }
  };

  const MAX_INSTALL_ATTEMPTS = 2;

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
    setMessages([]);
    appendMessage(`Starting installation for: ${current.label}`, "status");
    appendMessage(`Using manifest: ${current.manifestUrl}`, "status");

    installationAttemptsRef.current = 0;
    let manifest: Awaited<ReturnType<typeof import("esp-web-tools/dist/util/manifest.js")["downloadManifest"]>> | null = null;
    let flashFn: typeof import("esp-web-tools/dist/flash.js")["flash"] | null = null;

    try {
      const manifestModule = await import("esp-web-tools/dist/util/manifest.js");
      const flashModule = await import("esp-web-tools/dist/flash.js");
      manifest = await manifestModule.downloadManifest(current.manifestUrl);
      flashFn = flashModule.flash;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Installation failed: ${message}`, "error");
      setIsInstalling(false);
      return;
    }

    if (!manifest || !flashFn) {
      appendMessage("Installation failed: unable to prepare flashing tools.", "error");
      setIsInstalling(false);
      return;
    }

    let attempt = 0;
    let shouldRetry = false;

    try {
      while (attempt < MAX_INSTALL_ATTEMPTS) {
        attempt += 1;
        installationAttemptsRef.current = attempt;
        shouldRetry = false;

        try {
          await flashFn(
            (state: FlashState) => {
              if (state.state == "finished") {
                appendMessage("Installation finished.", "status");
                shouldRetry = false;
              }

              if (state.state == "error" && attempt < MAX_INSTALL_ATTEMPTS) {
                shouldRetry = true;
              }

              if (state.message) {
                appendMessage(state.message, "status");
              }
            },
            port as never,
            current.manifestUrl,
            manifest,
            true,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          appendMessage(`Installation failed (attempt ${attempt}): ${message}`, "error");
          if (attempt >= MAX_INSTALL_ATTEMPTS) {
            appendMessage("Maximum retry attempts reached.", "error");
            break;
          }
          appendMessage(`Retrying installation (attempt ${attempt + 1})…`, "status");
          continue;
        }

        if (shouldRetry && attempt < MAX_INSTALL_ATTEMPTS) {
          appendMessage(`Retrying installation (attempt ${attempt + 1})…`, "status");
          continue;
        }

        break;
      }
    } finally {
      setIsInstalling(false);
      installationAttemptsRef.current = 0;
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
              logsListening={logsListening}
              onToggleLogs={handleToggleLogs}
              isInstalling={isInstalling}
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
                      disabled={!port || isInstalling || logsListening}
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
        sendMessage={sendConsoleMessage}
        connected={logsListening}
      />
    </>
  );
}

