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

  // Store more data for zoom functionality (up to 5 seconds of data)
  const voltageBuffer = useRef<number[]>([]);
  const maxBufferSize = Math.floor(5000 / sampleIntervalMs); // 5 seconds worth of samples

  const convertToVoltage = (byteValue: number): number => {
    return (byteValue / 255) * 3.3;
  };

  const updateVoltageStats = (newVoltages: number[]) => {
    if (newVoltages.length === 0) return;

    // Add new voltages to buffer
    voltageBuffer.current.push(...newVoltages);
    
    // Keep only last 5 seconds of data
    if (voltageBuffer.current.length > maxBufferSize) {
      voltageBuffer.current = voltageBuffer.current.slice(-maxBufferSize);
    }

    const buffer = voltageBuffer.current;
    const currentVoltage = newVoltages[newVoltages.length - 1];
    const average = buffer.reduce((sum, v) => sum + v, 0) / buffer.length;
    const min = Math.min(...buffer);
    const max = Math.max(...buffer);

    setVoltageStats({
      current: currentVoltage,
      average: average,
      min: min,
      max: max,
      samples: buffer.length
    });
  };

  const resetVoltageData = () => {
    voltageBuffer.current = [];
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
              <label className={styles.voltageLabel}>Average (5s)</label>
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
          data={voltageBuffer.current}
          maxVoltage={3.3}
          maxDisplayPoints={2000}
          sampleIntervalMs={sampleIntervalMs}
          height={300}
          showZoomControls={true}
        />
      </div>

    </div>
  );
});

export default AppElab;
