"use client";
import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback } from "react";
import styles from "./AppElab.module.css";
import common from "./AppCommon.module.css";
import Oscilloscope from "../common/Oscilloscope";

export interface AppElabProps {
  isListeningForBinary: boolean;
  onBinaryListeningToggle: () => void;
  sampleIntervalMs?: number;
}

export interface AppElabRef {
  onBinaryData: (data: Uint8Array) => void;
}

const AppElab = forwardRef<AppElabRef, AppElabProps>(({
  isListeningForBinary,
  onBinaryListeningToggle,
  sampleIntervalMs = 1,
}, ref) => {
  // Store voltage data in state so React can detect changes for the oscilloscope
  const [voltageData, setVoltageData] = useState<{ samples: number[]; total: number }>({ samples: [], total: 0 });
  const voltageDataRef = useRef<number[]>([]);
  const totalSamplesRef = useRef<number>(0);
  const maxBufferSize = Math.floor(10000 / sampleIntervalMs); // 10 seconds worth of samples
  const lastOscilloscopeUpdate = useRef<number>(0);
  const [scopeFullscreen, setScopeFullscreen] = useState(false);
  const toggleScopeFullscreen = useCallback(() => setScopeFullscreen((f) => !f), []);

  const convertToVoltage = (byteValue: number): number => {
    return (byteValue / 255) * 3.3;
  };

  const appendVoltages = (newVoltages: number[]) => {
    if (newVoltages.length === 0) return;

    // Update ref immediately
    voltageDataRef.current.push(...newVoltages);
    totalSamplesRef.current += newVoltages.length;
    
    // Keep only last 10 seconds of data
    if (voltageDataRef.current.length > maxBufferSize) {
      voltageDataRef.current = voltageDataRef.current.slice(-maxBufferSize);
    }

    const now = Date.now();
    
    // Update oscilloscope more frequently but still throttled (every 50ms for smooth animation)
    if (now - lastOscilloscopeUpdate.current > 50) {
      lastOscilloscopeUpdate.current = now;
      setVoltageData({ samples: [...voltageDataRef.current], total: totalSamplesRef.current });
    }
  };

  useImperativeHandle(ref, () => ({
    onBinaryData: (data: Uint8Array) => {      
      // Convert byte data to voltage values
      const voltages = Array.from(data).map(convertToVoltage);
      appendVoltages(voltages);
    }
  }));

  return (
    <div className={common.appContainer}>
      <div className={common.appSection}>        
        <div className={styles.controls}>
          <button 
            onClick={onBinaryListeningToggle}
            className={`${styles.button} ${isListeningForBinary ? styles.buttonStop : styles.buttonStart}`}
          >
            {isListeningForBinary ? 'Stop Capturing' : 'Start Capturing'}
          </button>
          
          {isListeningForBinary && (
            <div className={styles.statusIndicator}>
              <div className={styles.pulsingDot}></div>
              <span>Listening for incoming data...</span>
            </div>
          )}
          <div className={styles.instructionsHighlight}>
              Send voltage to the Input pin <code>A1</code> to see measurements.
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
          data={voltageData.samples}
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
