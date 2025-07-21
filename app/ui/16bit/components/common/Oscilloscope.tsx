"use client";
import React, { useRef, useEffect } from "react";
import styles from "./Oscilloscope.module.css";

export interface OscilloscopeProps {
  data: number[];
  maxVoltage?: number;
  displayPoints?: number;
  width?: number;
  height?: number;
  gridColor?: string;
  waveformColor?: string;
  backgroundColor?: string;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({
  data,
  maxVoltage = 3.3,
  displayPoints = 500,
  width,
  height = 300,
  gridColor = '#e0e0e0',
  waveformColor = '#00ff00',
  backgroundColor = '#000'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Show specified number of points for optimal visibility
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
  }, [data, maxVoltage, displayPoints, gridColor, waveformColor]);

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
      <div className={styles.oscilloscopeInfo}>
        <span>Time scale: ~{Math.round(displayPoints/20)}ms/div</span>
        <span>Voltage scale: {(maxVoltage/10).toFixed(2)}V/div</span>
        <span>Points: {data.length}/{displayPoints}</span>
      </div>
    </div>
  );
};

export default Oscilloscope;
