"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Terminal from "../../16bit/components/Terminal";
import UnsupportedBrowser from "../../16bit/components/UnsupportedBrowser";
import styles from "../page.module.css";
import headerStyles from "../../16bit/components/Header.module.css";
import type { MessageObj, MessageType, SerialPort } from "@/app/lib/webserial";

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
  const [installationCompleted, setInstallationCompleted] = useState(false);
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupported, setUnsupported] = useState(false);

  const appendMessage = useCallback((message: string, type: MessageType = "status") => {
    setMessages((prev) => [...prev, { message, type }]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFirmwares() {
      try {
        const baseUrl = "https://gmeozbt7rg290j7h.public.blob.vercel-storage.com";
        // Add cache-busting query parameter to ensure we get the latest version
        // This bypasses both browser and Vercel Blobs CDN caching
        const indexRes = await fetch(`${baseUrl}/index.txt?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!indexRes.ok) {
          throw new Error(`Failed to load firmware index: ${indexRes.status}`);
        }
        const indexText = await indexRes.text();
        const directories = indexText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const options: FirmwareOption[] = directories.map((dir) => ({
          id: dir,
          label: dir.replace(/_/g, " "),
          manifestUrl: `${baseUrl}/${dir}/manifest.json`,
        }));

        // Sort by label descending (newest first)
        const sorted = options.sort((a, b) => b.label.localeCompare(a.label));

        if (!cancelled) {
          setFirmwares(sorted);
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
      setUnsupported(true);
    } else if (!window.isSecureContext) {
      setUnsupported(true);
    } else {
      setUnsupported(false);
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

  const requestSerialPort = useCallback(async (): Promise<SerialPort | null> => {
    if (typeof navigator === "undefined") return null;

    if (!("serial" in navigator)) {
      return null;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      return null;
    }

    appendMessage("Requesting serial port access…", "status");
    try {
      const serialPort = await navigator.serial!.requestPort();
      appendMessage("Serial port selected.", "status");
      return serialPort;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Failed to open serial port: ${message}`, "error");
      return null;
    }
  }, [appendMessage]);

  const handleInstall = useCallback(async () => {
    if (!firmwares || !firmwares.length) {
      appendMessage("No firmware bundles available.", "error");
      return;
    }

    // Request serial port if not already selected
    let currentPort = port;
    if (!currentPort) {
      currentPort = await requestSerialPort();
      if (!currentPort) {
        return;
      }
      setPort(currentPort);
    }

    const current = firmwares[selectedIndex];

    setIsInstalling(true);
    setMessages([]);
    appendMessage(`Starting installation for: ${current.label}`, "status");
    appendMessage(`Using manifest: ${current.manifestUrl}`, "status");

    let manifest: Awaited<ReturnType<typeof import("esp-web-tools/dist/util/manifest.js")["downloadManifest"]>> | null = null;
    let flashFn: typeof import("esp-web-tools/dist/flash.js")["flash"] | null = null;

    try {
      const manifestModule = await import("esp-web-tools/dist/util/manifest.js");
      const flashModule = await import("esp-web-tools/dist/flash.js");
      manifest = await manifestModule.downloadManifest(current.manifestUrl);
      flashFn = flashModule.flash;

      if (!manifest || !flashFn) {
        appendMessage("Installation failed: unable to prepare flashing tools.", "error");
        return;
      }

      await flashFn(
        (state: FlashState) => {
          if (state.state == "finished") {
            appendMessage("Installation finished.", "status");
            setInstallationCompleted(true);
          }

          if (state.message) {
            appendMessage(state.message, "status");
          }
        },
        currentPort as never,
        current.manifestUrl,
        manifest,
        true,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendMessage(`Installation failed: ${message}`, "error");
    } finally {
      setIsInstalling(false);
    }
  }, [appendMessage, firmwares, port, selectedIndex, requestSerialPort]);

  const sendConsoleMessage = async () => {
    // No-op: Terminal input is disabled for install page
    setInput("");
  };

  if (firmwares === null) {
    return null;
  }

  if (unsupported) {
    return (
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
            <h2 className={styles.sectionHeader}>Firmware Installer</h2>
            <div className={styles.installerSection}>
              <UnsupportedBrowser />
            </div>
          </div>
        </div>
      </div>
    );
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
            <h2 className={styles.sectionHeader}>Firmware Installer</h2>
            <div className={styles.installerSection}>
              <div className={styles.bootloaderInstructions}>
                <h3 className={styles.bootloaderTitle}>Enter Bootloader Mode</h3>
                <p className={styles.bootloaderText}>
                  Before installing firmware, put your device into bootloader mode:
                </p>
                <ol className={styles.bootloaderSteps}>
                  <li>Press and hold the <strong>BOOT</strong> button</li>
                  <li>While holding BOOT, press and hold the <strong>RESET</strong> button</li>
                  <li>Release both buttons</li>
                </ol>
                <p className={styles.bootloaderNote}>
                  Your device is now in bootloader mode and ready for firmware installation.
                </p>
              </div>
              <div className={styles.installSection}>
                {!installationCompleted && (
                  <>
                    <div className={styles.installControlsRow}>
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
                      <button
                        type="button"
                        className={headerStyles.buttonPrimary}
                        onClick={handleInstall}
                        disabled={isInstalling}
                      >
                        {isInstalling ? "Installing…" : "Install"}
                      </button>
                    </div>
                  </>
                )}

                {installationCompleted && (
                  <div style={{ textAlign: "left", marginTop: "4px" }}>
                    <p style={{ marginBottom: "8px", fontSize: "0.875rem" }}>
                      Installation Completed.{" "}
                      <a
                        href="/ui/32bit"
                        onClick={(e) => {
                          e.preventDefault();
                          if (typeof window !== "undefined") {
                            window.location.href = "/ui/32bit";
                          }
                        }}
                        style={{ color: "#2563eb", fontWeight: "bold", textDecoration: "none", cursor: "pointer" }}
                      >
                        Connect to 32bit
                      </a>
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <Terminal
        title="32bit Console"
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendConsoleMessage}
        connected={false}
      />
    </>
  );
}

