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
  const [unsupported, setUnsupported] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const readLoopActive = useRef(false);
  const readPipePromise = useRef<Promise<void> | null>(null);
  const writePipePromise = useRef<Promise<void> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const [sampleId, setSampleId] = useState(0);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    // Check for Web Serial API support
    if (typeof navigator !== 'undefined' && !("serial" in navigator)) {
      setUnsupported(true);
    }
  }, []);

  if (unsupported) {
    return (
      <div className={styles.container}>
        <h1 className={styles.header}>Raspberry Pi Pico Web Interface</h1>
        <div style={{ color: '#b00', fontWeight: 'bold', fontSize: 18, marginTop: 32 }}>
          Web Serial API is not supported in this browser.<br />
          Please use <span style={{ color: '#0070f3' }}>Google Chrome</span> on a PC or Mac.
        </div>
      </div>
    );
  }

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
    abortController.current = new AbortController();

    const textDecoder = new (window as any).TextDecoderStream();
    readPipePromise.current = portRef.current.readable.pipeTo(
      textDecoder.writable,
      { signal: abortController.current.signal }
    );
    readerRef.current = textDecoder.readable.getReader();

    const textEncoder = new (window as any).TextEncoderStream();
    writerRef.current = textEncoder.writable.getWriter();
    writePipePromise.current = textEncoder.readable.pipeTo(
      portRef.current.writable,
      { signal: abortController.current.signal }
    );
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

  // Helper function to convert binary data to base64
  function encodeBinaryBase64(data: Uint8Array): string {
    // Browser btoa works on strings, so we need to convert the bytes to a string
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  // CRC32 implementation (same polynomial as firmware)
  function crc32(buf: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (~crc) >>> 0;
  }

  const sendSample = async () => {
    if (!portRef.current || !writerRef.current || sampleFile == null || uploading) return;
    setUploading(true);
    try {
      // Convert file to binary
      const arrayBuffer = await sampleFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Calculate CRC32 and prepend (little-endian)
      const crc = crc32(uint8Array);
      const withCrc = new Uint8Array(uint8Array.length + 4);
      withCrc[0] = crc & 0xFF;
      withCrc[1] = (crc >> 8) & 0xFF;
      withCrc[2] = (crc >> 16) & 0xFF;
      withCrc[3] = (crc >> 24) & 0xFF;
      withCrc.set(uint8Array, 4);

      // Base64 encode
      const base64Data = encodeBinaryBase64(withCrc);
      const length = base64Data.length;

      // Send the write-sample-base64 command
      await writerRef.current.write(`write-sample-base64 ${sampleId} ${arrayBuffer.byteLength} ${length}\n`);
      displayMessage(`Sent: write-sample-base64 ${sampleId} ${arrayBuffer.byteLength} ${length}`, "sent");

      // Wait for Pico to respond with 'Ready to receive ...'
      await new Promise((res) => setTimeout(res, 300));

      // Send base64 data in chunks
      const chunkSize = 1024;
      let sent = 0;
      displayMessage("Sending base64 data...", "status");
      while (sent < length) {
        const end = Math.min(sent + chunkSize, length);
        const chunk = base64Data.substring(sent, end);
        await writerRef.current.write(chunk);
        sent = end;
        if (Math.floor((sent / length) * 10) > Math.floor(((sent - chunk.length) / length) * 10)) {
          const percent = Math.floor((sent / length) * 100);
          displayMessage(`Sending: ${percent}% (${sent}/${length} chars)`, "status");
        }
        await new Promise(res => setTimeout(res, 5));
      }
      // Send end marker
      await writerRef.current.write("\n");
      displayMessage(`Sample file sent (${arrayBuffer.byteLength} bytes as ${length} base64 chars)`, "sent");
      setSampleFile(null);
    } catch (error: any) {
      displayMessage("Sample upload error: " + (error?.message || String(error)), "error");
    } finally {
      setUploading(false);
    }
  };

  const disconnectFromPico = async () => {
    window.location.reload();
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
      {/* Write Sample UI */}
      <div style={{ marginTop: 32, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fcfcfc' }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Upload Sample</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label htmlFor="sample-id">Sample Number:</label>
          <select
            id="sample-id"
            value={sampleId}
            onChange={e => setSampleId(Number(e.target.value))}
            disabled={!connected || uploading}
            style={{ fontSize: 16, padding: 4 }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <input
            type="file"
            accept="audio/*,.raw"
            onChange={e => setSampleFile(e.target.files?.[0] || null)}
            disabled={!connected || uploading}
            style={{ fontSize: 16 }}
          />
          <button
            className={styles.sendButton}
            onClick={sendSample}
            disabled={!connected || !sampleFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Send Sample'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>
          Select a sample number (0-11) and upload a file to send to the Pico.<br />
          The file will be sent as binary after issuing the <code>write-sample</code> command.
        </div>
      </div>
    </div>
  );
};

export default PicoWebSerial;