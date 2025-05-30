"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./page.module.css";
import { WebSerialManager, MessageType, MessageObj } from "@/app/lib/webserial";
import Header from "./components/Header";
import Terminal from "./components/Terminal";
import AppSampler from "./components/AppSampler";
import Keyboard from "./components/Keyboard";

const PicoWebSerial = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const [sampleId, setSampleId] = useState(0);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedApp, setSelectedApp] = useState("");
  const [switchingApp, setSwitchingApp] = useState(false);
  const [selectedKey, setSelectedKey] = useState<number | undefined>(undefined);
  
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
      displayMessage("Requesting app info...", "status");
      // Send a command that will return a value in the format ::val::value::val::
      const result = await serialManagerRef.current.sendAndReceive("get-app");
      setSelectedApp(result || "");

    } catch (error) {
      setSelectedApp("");
      displayMessage(`Error getting app info: ${error}`, "error");
    }
  };

  const handleAppChange = async (appName: string) => {
    if (!connected || switchingApp || !appName) {
      return;
    }

    try {
      setSwitchingApp(true);
      setSelectedApp(appName);
      
      if (serialManagerRef.current) {
        await serialManagerRef.current.sendMessage(`set-app ${appName}`);
      }
      
      // Wait a moment for the app to switch, then get the new app info
      setTimeout(async () => {
        await getAppInfo();
        setSwitchingApp(false);
      }, 1000);
    } catch (error) {
      setSwitchingApp(false);
      console.error("Error switching app:", error);
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

  const handleKeyPress = async (keyIndex: number) => {
    setSelectedKey(keyIndex);
    
    // Send key press command via serial
    if (serialManagerRef.current && connected) {
      try {
        await serialManagerRef.current.sendMessage(`key ${keyIndex}`);
      } catch (error) {
        console.error("Error sending key press:", error);
      }
    }
  };

  if (unsupported) {
    return (
      <div className={styles.container}>
        <Header 
          connected={connected}
          status={status}
          connectToPico={connectToPico}
          disconnectFromPico={disconnectFromPico}
          selectedApp={selectedApp}
          switchingApp={switchingApp}
          onAppChange={handleAppChange}
          unsupported={true}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header 
        connected={connected}
        status={status}
        connectToPico={connectToPico}
        disconnectFromPico={disconnectFromPico}
        selectedApp={selectedApp}
        switchingApp={switchingApp}
        onAppChange={handleAppChange}
      />
      
      {selectedApp === "sampler" && (
        <AppSampler 
          sampleId={sampleId}
          setSampleId={setSampleId}
          sampleFile={sampleFile}
          setSampleFile={setSampleFile}
          sendSample={sendSample}
            connected={connected}
            uploading={uploading}
        />
      )}

      <Keyboard 
        selectedKey={selectedKey}
        onKeyPress={handleKeyPress}
        disabled={!connected}
      />

      <Terminal 
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        connected={connected}
      />
    </div>
  );
};

export default PicoWebSerial;