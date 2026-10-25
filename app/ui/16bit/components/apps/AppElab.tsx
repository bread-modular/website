"use client";
import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback, useEffect } from "react";
import styles from "./AppElab.module.css";
import common from "./AppCommon.module.css";
import Oscilloscope from "../common/Oscilloscope";
import { decodeScopeFrame, type ScopeChannels, type ScopePhase } from "../../lib/elab-scope";

export interface AppElabProps {
  isListeningForBinary: boolean;
  onBinaryListeningToggle: () => void;
  sampleIntervalMs?: number;
  channelCount?: ScopeChannels;
  capturePhase?: ScopePhase;
}

export interface AppElabRef {
  onBinaryData: (data: Uint8Array) => void;
  resetCapture: (channels?: ScopeChannels) => void;
}

const AppElab = forwardRef<AppElabRef, AppElabProps>(({
  isListeningForBinary,
  onBinaryListeningToggle,
  sampleIntervalMs = 1,
  channelCount = 1,
  capturePhase = isListeningForBinary ? 'capturing' : 'idle',
}, ref) => {
  // Append, trim and publish both channels as ONE capture snapshot.
  const [voltageData, setVoltageData] = useState<{ a1: number[]; a2?: number[]; total: number }>({ a1: [], total: 0 });
  const voltageDataRef = useRef<{ a1: number[]; a2?: number[]; total: number }>({ a1: [], total: 0 });
  const channelsRef = useRef<ScopeChannels>(channelCount);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef(0);
  const [captureId, setCaptureId] = useState(0);
  const [scopeFullscreen, setScopeFullscreen] = useState(false);
  const toggleScopeFullscreen = useCallback(() => setScopeFullscreen((f) => !f), []);
  const maxBufferSize = Math.max(500, Math.floor(10000 / sampleIntervalMs));

  const resetCapture = useCallback((channels: ScopeChannels = channelCount) => {
    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = null;
    channelsRef.current = channels;
    const empty = { a1: [], a2: channels === 2 ? [] : undefined, total: 0 };
    voltageDataRef.current = empty;
    setVoltageData({ a1: [], a2: channels === 2 ? [] : undefined, total: 0 });
    lastUpdateRef.current = 0;
    setCaptureId((id) => id + 1);
  }, [channelCount]);

  useEffect(() => {
    if (channelsRef.current !== channelCount) resetCapture(channelCount);
  }, [channelCount, resetCapture]);

  useEffect(() => () => {
    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    resetCapture,
    onBinaryData: (bytes: Uint8Array) => {
      const frame = decodeScopeFrame(bytes, channelsRef.current);
      if (!frame) return;
      const buffer = voltageDataRef.current;
      buffer.a1.push(...frame.a1);
      if (frame.a2) {
        buffer.a2 ??= [];
        buffer.a2.push(...frame.a2);
      }
      buffer.total += frame.a1.length; // Paired sample count, not summed channel lengths.
      if (buffer.a1.length > maxBufferSize) {
        buffer.a1 = buffer.a1.slice(-maxBufferSize);
        buffer.a2 = buffer.a2?.slice(-maxBufferSize);
      }
      const publish = () => {
        publishTimerRef.current = null;
        lastUpdateRef.current = Date.now();
        const current = voltageDataRef.current;
        setVoltageData({ a1: [...current.a1], a2: current.a2 ? [...current.a2] : undefined, total: current.total });
      };
      const wait = Math.max(0, 50 - (Date.now() - lastUpdateRef.current));
      if (!publishTimerRef.current) {
        if (wait === 0) publish();
        else publishTimerRef.current = setTimeout(publish, wait);
      }
    },
  }));

  return (
    <div className={common.appContainer}>
      <div className={common.appSection}>        
        <div className={styles.controls}>
          <button 
            onClick={onBinaryListeningToggle}
            disabled={capturePhase === 'stopping'}
            className={`${styles.button} ${isListeningForBinary ? styles.buttonStop : styles.buttonStart}`}
          >
            {isListeningForBinary ? (capturePhase === 'capturing' ? 'Stop Capturing' : 'Cancel Capture') : capturePhase === 'stopping' ? 'Stopping…' : 'Start Capturing'}
          </button>
          
          {isListeningForBinary && (
            <div className={styles.statusIndicator}>
              <div className={styles.pulsingDot}></div>
              <span role="status">{capturePhase === 'probing' ? 'Checking scope channels…' : capturePhase === 'starting' ? 'Starting capture…' : 'Listening for incoming data...'}</span>
            </div>
          )}
          <div className={styles.instructionsHighlight}>
              {channelCount === 2
                ? <>Paired inputs <code>A1</code> and <code>A2</code> · two time-aligned traces.</>
                : <>Send voltage to input <code>A1</code> to see measurements. A1-only capture (legacy compatible).</>}
          </div>
        </div>
      </div>

      <div className={common.appSection}>
        <div className={styles.titleRow}>
          <h2 className={common.appSubTitle}>Oscilloscope</h2>
          <button
            className={`${styles.fullscreenToggle} ${scopeFullscreen ? styles.fullscreenToggleOn : ''}`}
            onClick={toggleScopeFullscreen}
          >
            {scopeFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
        <Oscilloscope 
          captureKey={captureId}
          data={voltageData.a1}
          secondaryData={voltageData.a2}
          channelLabels={['A1', 'A2']}
          totalSamples={voltageData.total}
          maxVoltage={3.3}
          sampleIntervalMs={sampleIntervalMs}
          height={340}
          fullscreen={scopeFullscreen}
          onToggleFullscreen={toggleScopeFullscreen}
          title="Oscilloscope"
        />
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Waveform Generator</h2>
        <div className={common.text}>
          16bit generates saw-tooth waveforms and you can control the frequency using the <b>CV1 knob</b>.
        </div>
        <ul className={common.featureList}>
            <li>
              <strong>Output pin</strong> <code>A1</code>: Saw tooth waveform
            </li>
            <li>
              <strong>Output pin</strong> <code>A2</code>: Supersaw waveform
            </li>
          </ul>
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Pulse Generator</h2>
        <div className={common.text}>
          16bit acts as a pulse generator and you can control the frequency using the <b>CV2 knob</b>. This is ideal for LFOs.
        </div>
        <ul className={common.featureList}>
            <li>
              <strong>Output pin</strong> <code>G1</code>: Pulse output
            </li>
          </ul>
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Button Trigger</h2>
        <div className={common.text}>
          You can trigger something using the <b>MODE</b> button. This will generate a pulse as you press the button.
        </div>
        <ul className={common.featureList}>
            <li>
              <strong>Output pin</strong> <code>G2</code>: Pulse output
            </li>
          </ul>
      </div>

    </div>
  );
});

AppElab.displayName = 'AppElab';

export default AppElab;
