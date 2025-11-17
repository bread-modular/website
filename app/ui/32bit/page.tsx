"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Header32 from "./components/Header";
import Terminal from "../16bit/components/Terminal";
import styles from "./page.module.css";
import { WebSerialManager } from "@/app/lib/webserial";
import type { MessageObj, MessageType, SerialPort } from "@/app/lib/webserial";

const LOG_LISTENING_START_MESSAGE = "Listening to 32bit logs…";

export default function Placeholder32UI() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [logsListening, setLogsListening] = useState(false);

  const serialManagerRef = useRef<WebSerialManager | null>(null);

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
      appendMessage("Serial port selected.", "status");
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

  const startLogListening = useCallback(async () => {
    if (!serialManagerRef.current) {
      return false;
    }

    if (!port) {
      return false;
    }

    try {
      await serialManagerRef.current.connectWithExistingPort(port);
      setLogsListening(true);
      appendMessage(LOG_LISTENING_START_MESSAGE, "status");
      return true;
    } catch {
      setLogsListening(false);
      return false;
    }
  }, [appendMessage, port]);

  // Automatically start log listening when port is connected
  useEffect(() => {
    if (port && !logsListening) {
      void startLogListening();
    }
  }, [port, logsListening, startLogListening]);

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

