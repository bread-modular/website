"use client";
import React, { useRef, useEffect, useState } from "react";
import styles from "./Oscilloscope.module.css";

export interface OscilloscopeProps {
  data: number[];
  maxVoltage?: number;
  maxDisplayPoints?: number;
  sampleIntervalMs?: number;
  width?: number;
  height?: number;
  gridColor?: string;
  waveformColor?: string;
  backgroundColor?: string;
  showZoomControls?: boolean;
  triggerVoltage?: number;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({
  data,
  maxVoltage = 3.3,
  maxDisplayPoints = 10000,
  sampleIntervalMs = 1,
  width,
  height = 300,
  gridColor = '#e0e0e0',
  waveformColor = '#00ff00',
  backgroundColor = '#000',
  showZoomControls = true,
  triggerVoltage = 1.65
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Start at 100% to show all available data
  const [triggerMode, setTriggerMode] = useState(false);
  const [currentTriggerVoltage, setCurrentTriggerVoltage] = useState(triggerVoltage);
  const [capturedData, setCapturedData] = useState<number[]>([]);
  const [isTriggered, setIsTriggered] = useState(false);
  
  // Sync internal trigger voltage with prop when it changes
  useEffect(() => {
    setCurrentTriggerVoltage(triggerVoltage);
  }, [triggerVoltage]);

  // Calculate actual display points based on zoom level
  const getDisplayPoints = () => {
    const minPoints = 50; // Minimum zoom shows 50 points
    const maxPoints = Math.min(data.length, maxDisplayPoints);
    return Math.floor(minPoints + (maxPoints - minPoints) * (zoomLevel / 100));
  };

  // Calculate time per division based on sample interval
  const getTimePerDiv = () => {
    const points = getDisplayPoints();
    const totalTimeMs = points * sampleIntervalMs;
    const timePerDiv = totalTimeMs / 20; // 20 divisions horizontally
    return timePerDiv;
  };

  // Format time value for display
  const formatTime = (timeMs: number) => {
    if (timeMs >= 1000) {
      return `${(timeMs / 1000).toFixed(1)}s`;
    } else if (timeMs >= 1) {
      return `${timeMs.toFixed(1)}ms`;
    } else {
      return `${(timeMs * 1000).toFixed(0)}μs`;
    }
  };

  // Calculate total time span being displayed
  const getTotalTimeSpan = () => {
    return getDisplayPoints() * sampleIntervalMs;
  };

  // Find trigger point (rising edge crossing trigger voltage)
  const findTriggerPoint = (data: number[]) => {
    if (!triggerMode || data.length < 2) return -1;
    
    // Search backwards from the end to find the most recent trigger
    for (let i = data.length - 2; i >= 1; i--) {
      const prev = data[i - 1];
      const curr = data[i];
      
      // Rising edge trigger: previous value below trigger, current value above
      if (prev < currentTriggerVoltage && curr >= currentTriggerVoltage) {
        return i;
      }
    }
    
    return -1; // No trigger found
  };

  // Get trigger status for debugging
  const getTriggerStatus = () => {
    if (!triggerMode) return null;
    const triggerIndex = findTriggerPoint(data);
    const recentVoltages = data.slice(-5); // Last 5 values for debugging
    return {
      triggered: triggerIndex !== -1,
      triggerIndex,
      recentVoltages,
      dataLength: data.length
    };
  };

  // Get the data range to display based on trigger mode
  const getDisplayRange = () => {
    const displayPoints = getDisplayPoints();
    
    // Use captured data if triggered, otherwise use live data
    const dataToUse = (triggerMode && isTriggered) ? capturedData : data;
    
    if (!triggerMode || !isTriggered) {
      // Normal mode: show most recent data
      const pointsToShow = Math.min(dataToUse.length, displayPoints);
      const startIndex = Math.max(0, dataToUse.length - pointsToShow);
      return { startIndex, pointsToShow, dataToUse };
    }
    
    // Triggered mode: find trigger point and center display around it
    const triggerIndex = findTriggerPoint(dataToUse);
    
    if (triggerIndex === -1) {
      // No trigger found, show most recent data
      const pointsToShow = Math.min(dataToUse.length, displayPoints);
      const startIndex = Math.max(0, dataToUse.length - pointsToShow);
      return { startIndex, pointsToShow, dataToUse };
    }
    
    // Center the display around the trigger point
    const preBuffer = Math.floor(displayPoints * 0.2); // Show 20% before trigger
    const startIndex = Math.max(0, triggerIndex - preBuffer);
    const pointsToShow = Math.min(displayPoints, dataToUse.length - startIndex);
    
    return { startIndex, pointsToShow, dataToUse };
  };

  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    
    // Get display range based on trigger mode
    const { startIndex, pointsToShow, dataToUse } = getDisplayRange();
    
    if (!canvas || dataToUse.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = height;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (voltage levels)
    for (let i = 0; i <= 10; i++) {
      const y = (canvasHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 20; i++) {
      const x = (canvasWidth / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Draw voltage labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    for (let i = 0; i <= 10; i++) {
      const voltage = maxVoltage - (maxVoltage / 10) * i;
      const y = (canvasHeight / 10) * i;
      ctx.fillText(`${voltage.toFixed(1)}V`, 5, y + 12);
    }

    // Draw trigger level line if trigger mode is enabled
    if (triggerMode) {
      const triggerY = canvasHeight - (currentTriggerVoltage / maxVoltage) * canvasHeight;
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, triggerY);
      ctx.lineTo(canvasWidth, triggerY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
      
      // Draw trigger voltage label
      ctx.fillStyle = '#ff6600';
      ctx.font = '10px monospace';
      ctx.fillText(`${currentTriggerVoltage.toFixed(2)}V (Trigger)`, canvasWidth - 100, triggerY - 5);
    }

    // Draw waveform
    if (dataToUse.length < 2) return;

    ctx.strokeStyle = waveformColor;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < pointsToShow; i++) {
      const voltage = dataToUse[startIndex + i];
      const x = (canvasWidth / pointsToShow) * i;
      const y = canvasHeight - (voltage / maxVoltage) * canvasHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  };

  // Simple trigger capture logic
  useEffect(() => {
    if (!triggerMode || isTriggered || data.length < 2) return;
    
    // Look for rising edge trigger
    for (let i = data.length - 2; i >= 1; i--) {
      const prev = data[i - 1];
      const curr = data[i];
      
      // Rising edge trigger: previous value below trigger, current value above
      if (prev < currentTriggerVoltage && curr >= currentTriggerVoltage) {
        // Capture current data and freeze display
        setCapturedData([...data]);
        setIsTriggered(true);
        break;
      }
    }
  }, [data, triggerMode, currentTriggerVoltage, isTriggered]);

  // Reset trigger when mode is disabled
  useEffect(() => {
    if (!triggerMode) {
      setIsTriggered(false);
      setCapturedData([]);
    }
  }, [triggerMode]);

  useEffect(() => {
    drawOscilloscope();
  }, [data, maxVoltage, zoomLevel, gridColor, waveformColor, triggerMode, currentTriggerVoltage, isTriggered, capturedData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      
      drawOscilloscope();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [height]);

  return (
    <div className={styles.oscilloscope} style={{ backgroundColor }}>
      <canvas 
        ref={canvasRef}
        className={styles.oscilloscopeCanvas}
        style={{ backgroundColor }}
      />
      {showZoomControls && (
        <div className={styles.zoomControls}>
          <label className={styles.zoomLabel}>
            Time Scale:
            <input
              type="range"
              min="1"
              max="100"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className={styles.zoomSlider}
            />
            <span className={styles.zoomValue}>
              {zoomLevel === 100 ? 'Max' : formatTime(getTotalTimeSpan())}
            </span>
          </label>
          <div className={styles.triggerControls}>
            <button
              onClick={() => {
                if (triggerMode && isTriggered) {
                  // Reset trigger if already triggered
                  setIsTriggered(false);
                  setCapturedData([]);
                } else {
                  // Toggle trigger mode
                  setTriggerMode(!triggerMode);
                }
              }}
              className={`${styles.triggerButton} ${triggerMode ? styles.triggerActive : ''}`}
            >
              {triggerMode ? (isTriggered ? 'RESET' : 'TRIG ON') : 'SNAPSHOT'}
            </button>
            {triggerMode && (
              <>
                <label className={styles.triggerVoltageLabel}>
                  Trigger V:
                  <input
                    type="number"
                    min="0"
                    max={maxVoltage}
                    step="0.01"
                    value={currentTriggerVoltage}
                    onChange={(e) => setCurrentTriggerVoltage(Number(e.target.value))}
                    className={styles.triggerVoltageInput}
                  />
                </label>
                <button
                  onClick={() => setTriggerMode(false)}
                  className={styles.triggerButton}
                >
                  GO BACK
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Oscilloscope;
