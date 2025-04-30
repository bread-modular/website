"use client";
import React, { useRef, useState } from "react";
import styles from "./page.module.css";
import Layout from "@/app/components/Layout";

// Minimal SerialPort type for TS
interface SerialPort {
  open(options: any): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<any>;
  writable: WritableStream<any>;
}

type MessageType = "received" | "sent" | "status" | "error";
type MessageObj = { message: string; type: MessageType };

const PicoWebSerial = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const readLoopActive = useRef(false);

  const displayMessage = (message: string, type: MessageType) => {
    setMessages((msgs) => [...msgs, { message, type }]);
  };

  const connectToPico = async () => {
    try {
      // @ts-ignore
      const port = await (navigator as any).serial.requestPort();
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
      portRef.current = port;
      setConnected(true);
      setStatus("Connected");
      displayMessage("Connected to Pico device", "status");
      setupCommunication();
      readLoop();
    } catch (error: any) {
      displayMessage("Connection error: " + (error?.message || String(error)), "error");
      setConnected(false);
      setStatus("Disconnected");
    }
  };

  const setupCommunication = () => {
    if (!portRef.current) return;
    const textDecoder = new (window as any).TextDecoderStream();
    portRef.current.readable.pipeTo(textDecoder.writable);
    readerRef.current = textDecoder.readable.getReader();

    const textEncoder = new (window as any).TextEncoderStream();
    writerRef.current = textEncoder.writable.getWriter();
    textEncoder.readable.pipeTo(portRef.current.writable);
  };

  const readLoop = async () => {
    readLoopActive.current = true;
    try {
      while (portRef.current && readLoopActive.current) {
        if (!readerRef.current) break;
        const { value, done } = await readerRef.current.read();
        if (done) break;
        if (value) displayMessage(value, "received");
      }
    } catch (error: any) {
      displayMessage("Read error: " + (error?.message || String(error)), "error");
      if (portRef.current) disconnectFromPico();
    } finally {
      readLoopActive.current = false;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !writerRef.current) return;
    try {
      await writerRef.current.write(input + "\n");
      displayMessage("Sent: " + input, "sent");
      setInput("");
    } catch (error: any) {
      displayMessage("Send error: " + (error?.message || String(error)), "error");
    }
  };

  const disconnectFromPico = async () => {
    if (!portRef.current) return;
    try {
      readLoopActive.current = false;
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (writerRef.current) {
        writerRef.current.releaseLock();
        writerRef.current = null;
      }
      await portRef.current.close();
      portRef.current = null;
      setConnected(false);
      setStatus("Disconnected");
      displayMessage("Disconnected from Pico device", "status");
    } catch (error: any) {
      displayMessage("Disconnect error: " + (error?.message || String(error)), "error");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Raspberry Pi Pico Web Interface</h1>
      <div className={styles.buttonRow}>
        <button
          className={styles.button}
          onClick={connectToPico}
          disabled={connected}
        >
          Connect
        </button>
        <button
          className={styles.button}
          onClick={disconnectFromPico}
          disabled={!connected}
        >
          Disconnect
        </button>
        <span className={styles.status}>{status}</span>
      </div>
      <div className={styles.messageContainer}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              styles.message +
              " " +
              (msg.type === "received"
                ? styles.received
                : msg.type === "sent"
                ? styles.sent
                : msg.type === "status"
                ? styles.status
                : msg.type === "error"
                ? styles.error
                : "")
            }
          >
            {msg.message}
          </div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type a command..."
          disabled={!connected}
        />
        <button
          className={styles.sendButton}
          onClick={sendMessage}
          disabled={!connected || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <Layout>
      <PicoWebSerial />
    </Layout>
  );
} 