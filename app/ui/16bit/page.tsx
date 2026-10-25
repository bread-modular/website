"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import { WebSerialManager, MessageType, MessageObj } from "@/app/lib/webserial";
import Header from "./components/Header";
import Terminal from "./components/Terminal";
import AppSampler from "./components/apps/AppSampler";
import AppFxRack from "./components/apps/AppFxRack";
import AppPolysynth from "./components/apps/AppPolysynth";
import AppElab, { AppElabRef } from "./components/apps/AppElab";
import AppMonosynth from "./components/apps/AppMonosynth";
import Image from "next/image";
import { ElabScopeSession, type ScopeChannels, type ScopePhase } from "./lib/elab-scope";

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
  const scopeSessionRef = useRef<ElabScopeSession | null>(null);
  const connectionEpochRef = useRef(0);
  const connectingRef = useRef(false);
  const mountedRef = useRef(false);
  const [scopeChannels, setScopeChannels] = useState<ScopeChannels>(1);
  const [capturePhase, setCapturePhase] = useState<ScopePhase>('idle');
  const appElabRef = useRef<AppElabRef | null>(null);

  const displayMessage = useCallback((message: string, type: MessageType) => {
    if (!mountedRef.current) return;
    setMessages((msgs) => [...msgs, { message, type }]);
    if (type === 'status' && message === 'Disconnected') {
      connectionEpochRef.current++;
      void scopeSessionRef.current?.dispose();
      scopeSessionRef.current = null;
      appElabRef.current?.resetCapture(1);
      setScopeChannels(1);
      setCapturePhase('idle');
      setIsListeningForBinary(false);
      setConnected(false);
      setSelectedApp('');
      setStatus('Disconnected');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const manager: WebSerialManager = new WebSerialManager((message, type) => {
      if (serialManagerRef.current === manager) displayMessage(message, type);
    });
    serialManagerRef.current = manager;
    setUnsupported(!manager.isWebSerialSupported());
    return () => {
      mountedRef.current = false;
      // Invalidate asynchronous connection work on unmount (not a DOM ref).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      connectionEpochRef.current++;
      const session = scopeSessionRef.current;
      scopeSessionRef.current = null;
      void (async () => {
        await session?.dispose();
        await manager.disconnect();
      })();
    };
  }, [displayMessage]);

  const getAppInfo = async (manager = serialManagerRef.current, epoch = connectionEpochRef.current) => {
    if (!manager?.isConnected()) return;
    const current = () => mountedRef.current && manager === serialManagerRef.current && epoch === connectionEpochRef.current && manager.isConnected();
    
    try {
      displayMessage("Requesting app info...", "status");
      // Send a command that will return a value in the format ::val::value::val::
      const result = await manager.sendAndReceive("get-app");
      if (!current()) return;
      setSelectedApp(result || "");
      if (result !== 'elab' && scopeSessionRef.current) {
        await scopeSessionRef.current.dispose();
        scopeSessionRef.current = null;
        if (!current()) return;
        setScopeChannels(1);
        setCapturePhase('idle');
        setIsListeningForBinary(false);
      }

      if (result === "sampler") {
        // Get the FX values
        const fx1 = await manager.sendAndReceive("get-fx1") || "noop";
        const fx2 = await manager.sendAndReceive("get-fx2") || "noop";
        const fx3 = await manager.sendAndReceive("get-fx3") || "noop";
        if (!current()) return;
        setSamplerState({ fx1, fx2, fx3 });
      }

      if (result === "polysynth") {
        const waveform = await manager.sendAndReceive("get-waveform") || "saw";
        if (!current()) return;
        setPolysynthState({ waveform });
      }

      if (result === "fxrack") {
        const fx1 = await manager.sendAndReceive("get-fx1") || "noop";
        const fx2 = await manager.sendAndReceive("get-fx2") || "noop";
        const fx3 = await manager.sendAndReceive("get-fx3") || "noop";
        if (!current()) return;
        setFXRackState({ fx1, fx2, fx3 });
      }

      if (result === "elab") {
        if (!scopeSessionRef.current) scopeSessionRef.current = new ElabScopeSession(manager, {
          onState: ({ channels, phase, wanted }) => {
            if (!current()) return;
            setScopeChannels(channels);
            setCapturePhase(phase);
            setIsListeningForBinary(wanted);
          },
          onReset: (channels) => {
            if (current()) {
              setScopeChannels(channels);
              appElabRef.current?.resetCapture(channels);
            }
          },
          onFrame: (bytes) => { if (current()) appElabRef.current?.onBinaryData(bytes); },
          onError: (message) => { if (current()) displayMessage(message, 'error'); },
        });
      }

      if (result === "monosynth") {
        // Monosynth is controlled by hardware CV knobs and the MCC; no serial state to load.
      }
    } catch (error) {
      if (!current()) return;
      setSelectedApp("");
      displayMessage(`Error getting app info: ${error}`, "error");
    }
  };

  const connectToPico = async () => {
    const manager = serialManagerRef.current;
    if (!manager || connectingRef.current || manager.isConnected()) return;
    connectingRef.current = true;
    const epoch = ++connectionEpochRef.current;
    setStatus('Connecting…');
    setScopeChannels(1);
    setCapturePhase('idle');
    setIsListeningForBinary(false);
    try {
      await manager.connect();
      if (!mountedRef.current || epoch !== connectionEpochRef.current) {
        await manager.disconnect();
        return;
      }
      setConnected(true);
      setStatus('Connected');
      // Preserve the existing firmware startup grace period, but never retry a
      // disconnected/stale connection or let a delayed callback resurrect its UI.
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!mountedRef.current || epoch !== connectionEpochRef.current) return;
      await getAppInfo(manager, epoch);
    } catch {
      if (mountedRef.current && epoch === connectionEpochRef.current) {
        setConnected(false);
        setStatus('Disconnected');
      }
    } finally {
      connectingRef.current = false;
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
    const manager = serialManagerRef.current;
    if (!manager) return;
    connectionEpochRef.current++;
    setStatus('Disconnecting…');
    setConnected(false);
    setSelectedApp('');
    setIsListeningForBinary(false);
    setScopeChannels(1);
    setCapturePhase('idle');
    const session = scopeSessionRef.current;
    scopeSessionRef.current = null;
    await session?.dispose();
    await manager.disconnect();
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
    const session = scopeSessionRef.current;
    if (!session || !serialManagerRef.current?.isConnected()) return;
    void session.setCapturing(!session.wantsCapture());
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
          />
        </div>


        
        {selectedApp === "sampler" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>Firmware: Sampler</h2>
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
            <h2 className={styles.sectionHeader}>Firmware: FX Rack</h2>
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
            <h2 className={styles.sectionHeader}>Firmware: PolySynth</h2>
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
            <h2 className={styles.sectionHeader}>Firmware: Elab</h2>
            <p className={styles.sectionDescription}>
              Electronic Lab tool with data capturing and waveform generation.
            </p>
            <AppElab 
              ref={appElabRef}
              isListeningForBinary={isListeningForBinary}
              onBinaryListeningToggle={handleBinaryListening}
              sampleIntervalMs={0.1}
              channelCount={scopeChannels}
              capturePhase={capturePhase}
            />
          </div>
        )}

        {selectedApp === "noop" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>Firmware: Noop</h2>
            <p className={styles.sectionDescription}>
              This is just an empty app. It does literally nothing.
            </p>
          </div>
        )}

        {selectedApp === "monosynth" && (
          <div className={styles.section}>
            <h2 className={styles.sectionHeader}>Firmware: Monosynth</h2>
            <p className={styles.sectionDescription}>
              A monophonic Pulsar-23 style bass synth in percussion mode, with a shape-morphing oscillator, WARP drive and resonant low-pass filter. It also features a hardware motion recorder that captures knob and CV movements into a four-bar loop.
            </p>
            <AppMonosynth />
          </div>
        )}

        {/* Empty space at the end of the page */}
        <div style={{ height: '100px' }}></div>
      </div>

      <Terminal
        title="16bit Console"
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