"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./page.module.css";
import Layout from "@/app/components/Layout";
import { WebSerialManager, MessageType, MessageObj } from "@/app/lib/webserial";

const PicoWebSerial = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const [sampleId, setSampleId] = useState(0);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [appInfo, setAppInfo] = useState<string | null>(null);
  const [loadingAppInfo, setLoadingAppInfo] = useState(false);
  
  const serialManagerRef = useRef<WebSerialManager | null>(null);

  useEffect(() => {
    // Initialize the WebSerialManager
    serialManagerRef.current = new WebSerialManager(displayMessage);
    
    // Check for Web Serial API support
    if (!serialManagerRef.current.isWebSerialSupported()) {
      setUnsupported(true);
    }
    
    // Cleanup on unmount
    return () => {
      if (serialManagerRef.current && connected) {
        serialManagerRef.current.disconnect();
      }
    };
  }, []);

  const displayMessage = (message: string, type: MessageType) => {
    setMessages((msgs) => [...msgs, { message, type }]);
  };

  const getAppInfo = async () => {
    if (!serialManagerRef.current || !serialManagerRef.current.isConnected()) {
      return;
    }
    
    try {
      setLoadingAppInfo(true);
      displayMessage("Requesting app info...", "status");
      // Send a command that will return a value in the format ::val::value::val::
      const result = await serialManagerRef.current.sendAndReceive("get-app");
      setAppInfo(result);
      
      if (result !== null) {
        displayMessage(`App info: ${result}`, "status");
      } else {
        displayMessage("Failed to get app info (timeout or no match)", "error");
      }
    } catch (error) {
      displayMessage(`Error getting app info: ${error}`, "error");
    } finally {
      setLoadingAppInfo(false);
    }
  };

  const connectToPico = async () => {
    try {
      if (!serialManagerRef.current) return;
      
      await serialManagerRef.current.connect();
      setConnected(true);
      setStatus("Connected");
      
      // Wait for the WebSerialManager to be fully ready before getting app info
      const waitForConnection = () => {
        if (serialManagerRef.current?.isConnected()) {
          getAppInfo();
        } else {
          console.log("Connection not ready yet, waiting...");
          setTimeout(waitForConnection, 500);
        }
      };
      
      setTimeout(waitForConnection, 500);
    } catch (error: any) {
      setConnected(false);
      setStatus("Disconnected");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !serialManagerRef.current) return;
    try {
      await serialManagerRef.current.sendMessage(input);
      setInput("");
    } catch (error) {
      // Error is already handled in the WebSerialManager
    }
  };

  const sendSample = async () => {
    if (!serialManagerRef.current || !sampleFile || uploading) return;
    setUploading(true);
    try {
      await serialManagerRef.current.sendSampleFile(sampleId, sampleFile);
      setSampleFile(null);
    } catch (error) {
      // Error is already handled in the WebSerialManager
    } finally {
      setUploading(false);
    }
  };

  const disconnectFromPico = async () => {
    if (serialManagerRef.current) {      
      // Reload the page after disconnection
      window.location.reload();
    }
  };

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
        {connected && (
          <span style={{ marginLeft: 16, fontSize: 14 }}>
            {loadingAppInfo ? (
              <span style={{ color: '#666' }}>Loading app info...</span>
            ) : appInfo ? (
              <span style={{ color: '#0070f3', fontWeight: 'bold' }}>
                App: {appInfo}
                <button 
                  onClick={getAppInfo} 
                  style={{ 
                    marginLeft: 8, 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#666',
                    fontSize: 12
                  }}
                >
                  ↻
                </button>
              </span>
            ) : (
              <span style={{ color: '#888' }}>
                No app info
                <button 
                  onClick={getAppInfo} 
                  style={{ 
                    marginLeft: 8, 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#666',
                    fontSize: 12
                  }}
                >
                  ↻
                </button>
              </span>
            )}
          </span>
        )}
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