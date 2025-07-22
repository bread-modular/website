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
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({
  data,
  maxVoltage = 3.3,
  maxDisplayPoints = 2000,
  sampleIntervalMs = 1,
  width,
  height = 300,
  gridColor = '#e0e0e0',
  waveformColor = '#00ff00',
  backgroundColor = '#000',
  showZoomControls = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(50); // 1-100, where 100 shows all available points
  
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

  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

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

    // Draw waveform
    if (data.length < 2) return;

    ctx.strokeStyle = waveformColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Show specified number of points based on zoom level
    const displayPoints = getDisplayPoints();
    const pointsToShow = Math.min(data.length, displayPoints);
    const startIndex = Math.max(0, data.length - pointsToShow);
    
    for (let i = 0; i < pointsToShow; i++) {
      const voltage = data[startIndex + i];
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

  useEffect(() => {
    drawOscilloscope();
  }, [data, maxVoltage, zoomLevel, gridColor, waveformColor]);

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
        </div>
      )}
    </div>
  );
};

export default Oscilloscope;
