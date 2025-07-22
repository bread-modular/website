"use client";
import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";
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

interface VoltageStats {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number;
}

const AppElab = forwardRef<AppElabRef, AppElabProps>(({
  isListeningForBinary,
  onBinaryListeningToggle,
  sampleIntervalMs = 1,
}, ref) => {
  const [voltageStats, setVoltageStats] = useState<VoltageStats>({
    current: 0,
    average: 0,
    min: 3.3,
    max: 0,
    samples: 0
  });

  // Store voltage data in state so React can detect changes for the oscilloscope
  const [voltageData, setVoltageData] = useState<number[]>([]);
  const voltageDataRef = useRef<number[]>([]);
  const maxBufferSize = Math.floor(10000 / sampleIntervalMs); // 10 seconds worth of samples
  const lastStatsUpdate = useRef<number>(0);
  const lastOscilloscopeUpdate = useRef<number>(0);

  const convertToVoltage = (byteValue: number): number => {
    return (byteValue / 255) * 3.3;
  };

  const updateVoltageStats = (newVoltages: number[]) => {
    if (newVoltages.length === 0) return;

    // Update ref immediately
    voltageDataRef.current.push(...newVoltages);
    
    // Keep only last 10 seconds of data
    if (voltageDataRef.current.length > maxBufferSize) {
      voltageDataRef.current = voltageDataRef.current.slice(-maxBufferSize);
    }

    const now = Date.now();
    
    // Update oscilloscope more frequently but still throttled (every 50ms for smooth animation)
    if (now - lastOscilloscopeUpdate.current > 50) {
      lastOscilloscopeUpdate.current = now;
      setVoltageData([...voltageDataRef.current]);
    }

    // Throttle stats updates to avoid infinite loops (update max once every 100ms)
    if (now - lastStatsUpdate.current > 100) {
      lastStatsUpdate.current = now;
      
      const trimmedData = voltageDataRef.current;
      const currentVoltage = newVoltages[newVoltages.length - 1];
      
      // Calculate 1-second average
      const oneSecondSamples = Math.floor(1000 / sampleIntervalMs);
      const recentSamples = trimmedData.slice(-oneSecondSamples);
      const average = recentSamples.length > 0 
        ? recentSamples.reduce((sum: number, v: number) => sum + v, 0) / recentSamples.length 
        : currentVoltage;
      
      const min = trimmedData.length > 0 ? Math.min(...trimmedData) : currentVoltage;
      const max = trimmedData.length > 0 ? Math.max(...trimmedData) : currentVoltage;

      setVoltageStats({
        current: currentVoltage,
        average: average,
        min: min,
        max: max,
        samples: trimmedData.length
      });
    }
  };

  const resetVoltageData = () => {
    voltageDataRef.current = [];
    setVoltageData([]);
    setVoltageStats({
      current: 0,
      average: 0,
      min: 3.3,
      max: 0,
      samples: 0
    });
  };

  useImperativeHandle(ref, () => ({
    onBinaryData: (data: Uint8Array) => {      
      // Convert byte data to voltage values
      const voltages = Array.from(data).map(convertToVoltage);
      updateVoltageStats(voltages);
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
        <h2 className={common.appSubTitle}>Voltmeter</h2>
        
        <div className={styles.voltmeter}>
          <div className={styles.voltageDisplay}>
            <div className={styles.voltageItem}>
              <label className={styles.voltageLabel}>Current</label>
              <span className={styles.voltageValue}>
                {voltageStats.current.toFixed(3)}V
              </span>
            </div>
            
            <div className={styles.voltageItem}>
              <label className={styles.voltageLabel}>Average (1s)</label>
              <span className={styles.voltageValue}>
                {voltageStats.average.toFixed(3)}V
              </span>
            </div>
            
            <div className={styles.voltageItem}>
              <label className={styles.voltageLabel}>Minimum</label>
              <span className={styles.voltageValue}>
                {voltageStats.min.toFixed(3)}V
              </span>
            </div>
            
            <div className={styles.voltageItem}>
              <label className={styles.voltageLabel}>Maximum</label>
              <span className={styles.voltageValue}>
                {voltageStats.max.toFixed(3)}V
              </span>
            </div>
          </div>
          
        </div>
      </div>

      <div className={common.appSection}>
        <h2 className={common.appSubTitle}>Oscilloscope</h2>        
        <Oscilloscope 
          data={voltageData}
          maxVoltage={3.3}
          maxDisplayPoints={10000}
          sampleIntervalMs={sampleIntervalMs}
          height={300}
          showZoomControls={true}
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

export default AppElab;
