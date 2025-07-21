"use client";
import React, { useRef, useState, useEffect } from "react";
import styles from "./page.module.css";
import { WebSerialManager, MessageType, MessageObj } from "@/app/lib/webserial";
import Header from "./components/Header";
import Terminal from "./components/Terminal";
import AppSampler from "./components/apps/AppSampler";
import AppFxRack from "./components/apps/AppFxRack";
import AppPolysynth from "./components/apps/AppPolysynth";
import AppElab, { AppElabRef } from "./components/apps/AppElab";
import Image from "next/image";

export interface AppSamplerState {
  fx1: string;
  fx2: string;
  fx3: string;
}

export interface AppPolysynthState {
  waveform: string;
}

export interface AppFXRackState {
  fx1: string;
  fx2: string;
  fx3: string;
}

const PicoWebSerial = () => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<MessageObj[]>([]);
  const [input, setInput] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const [selectedApp, setSelectedApp] = useState("");
  const [switchingApp, setSwitchingApp] = useState(false);
  const [samplerState, setSamplerState] = useState<AppSamplerState>({
    fx1: "noop",
    fx2: "noop",
    fx3: "noop",
  });
  const [polysynthState, setPolysynthState] = useState<AppPolysynthState>({
    waveform: "saw",
  });
  const [fxrackState, setFXRackState] = useState<AppFXRackState>({
    fx1: "noop",
    fx2: "noop",
    fx3: "noop",
  });
  const [isListeningForBinary, setIsListeningForBinary] = useState(false);
  
  const serialManagerRef = useRef<WebSerialManager | null>(null);
  const stopBinaryListenerRef = useRef<(() => void) | null>(null);
  const appElabRef = useRef<AppElabRef | null>(null);

  useEffect(() => {
    // Initialize the WebSerialManager
    serialManagerRef.current = new WebSerialManager(displayMessage);
    
    // Check for Web Serial API support
    if (!serialManagerRef.current.isWebSerialSupported()) {
      setUnsupported(true);
    }
    
    // Cleanup on unmount
    return () => {
      if (stopBinaryListenerRef.current) {
        stopBinaryListenerRef.current();
        stopBinaryListenerRef.current = null;
      }
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

      if (result === "sampler") {
        // Get the FX values
        const fx1 = await serialManagerRef.current.sendAndReceive("get-fx1") || "noop";
        const fx2 = await serialManagerRef.current.sendAndReceive("get-fx2") || "noop";
        const fx3 = await serialManagerRef.current.sendAndReceive("get-fx3") || "noop";
        setSamplerState({ fx1, fx2, fx3 });
      }

      if (result === "polysynth") {
        const waveform = await serialManagerRef.current.sendAndReceive("get-waveform") || "saw";
        setPolysynthState({ waveform });
      }

      if (result === "fxrack") {
        const fx1 = await serialManagerRef.current.sendAndReceive("get-fx1") || "noop";
        const fx2 = await serialManagerRef.current.sendAndReceive("get-fx2") || "noop";
        const fx3 = await serialManagerRef.current.sendAndReceive("get-fx3") || "noop";
        setFXRackState({ fx1, fx2, fx3 });
      }

      if (result === "elab") {
        // No specific state needed for elab app currently
      }
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
    } catch {
      setConnected(false);
      setStatus("Disconnected");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !serialManagerRef.current) return;
    try {
      await serialManagerRef.current.sendMessage(input);
    } finally {
      setInput("");
    }
  };

  const handleUploadSample = async (key: number, file: File) => {
    if (!serialManagerRef.current) return;
    await serialManagerRef.current.sendSampleFile(key, file);
  };

  const handleFxChange = async (fxIndex: string, fxValue: string) => {
    if (!serialManagerRef.current) return;
    try {
      console.log(`set-${fxIndex} ${fxValue}`);
      await serialManagerRef.current.sendMessage(`set-${fxIndex} ${fxValue}`);
      await getAppInfo();
    } catch (error) {
      console.error("Error changing FX:", error);
    }
  };

  const handleWaveformChange = async (waveform: string) => {
    if (!serialManagerRef.current) return;
    try {
      await serialManagerRef.current.sendMessage(`set-waveform ${waveform}`);
      await getAppInfo();
    } catch (error) {
      console.error("Error changing waveform:", error); 
    }
  };

  const disconnectFromPico = async () => {
    if (serialManagerRef.current) {
      // Stop binary listening if active
      if (stopBinaryListenerRef.current) {
        stopBinaryListenerRef.current();
        stopBinaryListenerRef.current = null;
      }
      setIsListeningForBinary(false);
      
      // Reload the page after disconnection
      window.location.reload();
    }
  };

  const handleKeyPress = async (key: number) => {    
    // Send key press command via serial
    if (serialManagerRef.current && connected) {
      try {
        await serialManagerRef.current.sendMessage(`play-sample ${key}`);
      } catch (error) {
        console.error("Error sending keyboard press:", error);
      }
    }
  };

  const handleBinaryListening = () => {
    if (!serialManagerRef.current || !connected) return;

    if (isListeningForBinary) {
      // Stop listening
      if (stopBinaryListenerRef.current) {
        stopBinaryListenerRef.current();
        stopBinaryListenerRef.current = null;
      }
      setIsListeningForBinary(false);
      displayMessage("Stopped listening for binary data", "status");
      serialManagerRef.current.sendMessage("stop-send");
    } else {
      // Start listening
      try {
        const stopFunction = serialManagerRef.current.listenForBinary((binaryData: Uint8Array) => {
          // Pass data to AppElab component if it's the selected app and ref is available
          if (selectedApp === "elab" && appElabRef.current) {
            appElabRef.current.onBinaryData(binaryData);
          }
        });
        stopBinaryListenerRef.current = stopFunction;
        setIsListeningForBinary(true);
        displayMessage("Started listening for binary data", "status");
        serialManagerRef.current.sendMessage("start-send");
      } catch (error) {
        console.error("Error starting binary listener:", error);
        displayMessage("Error starting binary listener: " + error, "error");
      }
    }
  };

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
          <h1 className={styles.pageTitle}>16bit UI</h1>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.section}>
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
        </div>
      </div>
    );
  }

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
        <h1 className={styles.pageTitle}>16bit UI</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.section}>
          <Header 
            connected={connected}
            status={status}
            connectToPico={connectToPico}
            disconnectFromPico={disconnectFromPico}
            selectedApp={selectedApp}
            switchingApp={switchingApp}
            onAppChange={handleAppChange}
          />
        </div>


        
        {selectedApp === "sampler" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>App: Sampler</h2>
            <p className={styles.sectionDescription}>
              A 12-voice sampler that is ideal for drums. It features two groups of samples and three FX slots.
            </p>
            <AppSampler 
              onKeySelect={handleKeyPress}
              uploadSample={handleUploadSample}
              appState={samplerState}
              onFxChange={handleFxChange}
            />
          </div>
        )}

        {selectedApp === "fxrack" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>App: FX Rack</h2>
            <p className={styles.sectionDescription}>
              A versatile FX rack with pluggable effects.
            </p>
            <AppFxRack
              appState={fxrackState}
              onFxChange={handleFxChange}
            />
          </div>
        )}

        {selectedApp === "polysynth" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>App: PolySynth</h2>
            <p className={styles.sectionDescription}>
              A 9-voice polyphonic synthesizer with a ladder filter.
            </p>
            <AppPolysynth 
              appState={polysynthState}
              onWaveformChange={handleWaveformChange}
            />
          </div>
        )}

        {selectedApp === "elab" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>App: Elab</h2>
            <p className={styles.sectionDescription}>
              Electronic Lab tool with data capturing and waveform generation.
            </p>
            <AppElab 
              ref={appElabRef}
              isListeningForBinary={isListeningForBinary}
              onBinaryListeningToggle={handleBinaryListening}
            />
          </div>
        )}

        {selectedApp === "noop" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>App: Noop</h2>
            <p className={styles.sectionDescription}>
              This is just an empty app. It does literally nothing.
            </p>
          </div>
        )}

        {/* Empty space at the end of the page */}
        <div style={{ height: '100px' }}></div>
      </div>

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