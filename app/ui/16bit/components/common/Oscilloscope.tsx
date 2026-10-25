"use client";
import React, { useRef, useEffect, useState, useCallback, useId } from "react";
import styles from "./Oscilloscope.module.css";
import { buildScopeCapture, freezeScopeFrame, type ScopeFrame as Frame, type FrozenScopeFrame as Frozen, type TriggerMode, type TriggerEdge, type ScopeStatus as Status } from "./scope-capture";

export interface OscilloscopeProps {
  data: number[];
  // Optional synchronized second channel. Same sample count/origin as data.
  secondaryData?: number[];
  channelLabels?: readonly [string, string];
  // Reset acquisition state without discarding timebase/cursor/channel controls.
  captureKey?: number;
  // Total number of samples received so far (used to tell new triggers apart from old ones)
  totalSamples?: number;
  maxVoltage?: number;
  sampleIntervalMs?: number;
  height?: number;
  triggerVoltage?: number;
  // Fullscreen is controlled by the parent so the toggle can live next to the section title
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  title?: string;
}

type DragKind = 'level' | 'pos' | 'pan' | 'x0' | 'x1' | 'y0' | 'y1';

interface Measurements {
  vmax: number;
  vmin: number;
  vavg: number;
  freq: number | null;
}

const H_DIVS = 10;
const V_DIVS = 8;
const TIME_DIVS_MS = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
const VOLT_DIVS = [0.05, 0.1, 0.2, 0.5, 1];
const HYSTERESIS = 0.04;

const TRACE_COLOR = '#ffd23f';
const SECONDARY_COLOR = '#7ea6ff';
const DEFAULT_CHANNEL_LABELS = ['CH1', 'CH2'] as const;
const DEFAULT_CHANNEL_COLORS: [string, string] = [TRACE_COLOR, SECONDARY_COLOR];
const CHANNEL_COLORS_KEY = 'oscilloscope.channelColors';
const TRIG_COLOR = '#ff8a3d';
const GRID_COLOR = 'rgba(160, 200, 180, 0.06)';
const AXIS_COLOR = 'rgba(160, 200, 180, 0.11)';
const SCALE_LABEL_COLOR = 'rgba(160, 200, 180, 0.32)';
const X_CURSOR_COLOR = '#4fd1ff';
const Y_CURSOR_COLOR = '#ff6bd6';
const GRAB_PX = 7;

const formatTime = (ms: number) => {
  const abs = Math.abs(ms);
  if (abs >= 1000) return `${+(ms / 1000).toFixed(2)}s`;
  if (abs >= 1) return `${+ms.toFixed(2)}ms`;
  return `${+(ms * 1000).toFixed(0)}µs`;
};

const formatVolt = (v: number) => Math.abs(v) < 1 ? `${(v * 1000).toFixed(0)}mV` : `${v.toFixed(2)}V`;

const formatFreq = (hz: number) => hz >= 1000 ? `${(hz / 1000).toFixed(2)}kHz` : `${hz.toFixed(hz < 10 ? 2 : 1)}Hz`;

function measure(buf: number[], start: number, count: number, sampleIntervalMs: number): Measurements | null {
  const from = Math.max(0, start);
  const to = Math.min(buf.length, start + count);
  if (to - from < 2) return null;

  let vmax = -Infinity, vmin = Infinity, sum = 0;
  for (let i = from; i < to; i++) {
    const v = buf[i];
    if (v > vmax) vmax = v;
    if (v < vmin) vmin = v;
    sum += v;
  }

  // Frequency from rising crossings of the mid level
  let freq: number | null = null;
  if (vmax - vmin > HYSTERESIS * 2) {
    const mid = (vmax + vmin) / 2;
    const hyst = Math.min(HYSTERESIS, (vmax - vmin) / 4);
    let armed = false, first = -1, last = -1, crossings = 0;
    for (let i = from; i < to; i++) {
      const v = buf[i];
      if (v < mid - hyst) armed = true;
      else if (armed && v >= mid) {
        armed = false;
        if (first === -1) first = i;
        last = i;
        crossings++;
      }
    }
    if (crossings >= 2) freq = 1000 / (((last - first) / (crossings - 1)) * sampleIntervalMs);
  }

  return { vmax, vmin, vavg: sum / (to - from), freq };
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({
  data,
  secondaryData,
  channelLabels = DEFAULT_CHANNEL_LABELS,
  captureKey = 0,
  totalSamples,
  maxVoltage = 3.3,
  sampleIntervalMs = 1,
  height = 340,
  triggerVoltage = 1.65,
  fullscreen = false,
  onToggleFullscreen,
  title = 'Oscilloscope',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelId = useId();

  const [timeDivIndex, setTimeDivIndex] = useState(TIME_DIVS_MS.indexOf(10));
  const [voltDivIndex, setVoltDivIndex] = useState(VOLT_DIVS.indexOf(0.5));
  const [vCenter, setVCenter] = useState(2); // voltage at the vertical center of the screen
  const [channelVisible, setChannelVisible] = useState<[boolean, boolean]>([true, true]);
  const [triggerSource, setTriggerSource] = useState<0 | 1>(0);
  const [channelColors, setChannelColors] = useState<[string, string]>(DEFAULT_CHANNEL_COLORS);
  const [trigMode, setTrigMode] = useState<TriggerMode>('auto');
  const [trigEdge, setTrigEdge] = useState<TriggerEdge>('rising');
  const [trigLevel, setTrigLevel] = useState(triggerVoltage);
  const [trigPos, setTrigPos] = useState(0.5); // horizontal trigger position (0..1 of screen)
  const [frozen, setFrozen] = useState<Frozen | null>(null);
  const [singleArmedAt, setSingleArmedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('RUN');
  const [measurements, setMeasurements] = useState<[Measurements | null, Measurements | null]>([null, null]);
  const [xCursorsOn, setXCursorsOn] = useState(false);
  const [yCursorsOn, setYCursorsOn] = useState(false);
  const [xCursors, setXCursors] = useState<[number, number]>([0.3, 0.7]); // fraction of screen width
  const [yCursors, setYCursors] = useState<[number, number]>([1, 2.3]);   // volts
  // Control panel is hidden in the inline view and shown in fullscreen; reset whenever fullscreen toggles
  const [panelOpen, setPanelOpen] = useState(fullscreen);
  const [panelFullscreen, setPanelFullscreen] = useState(fullscreen);
  if (panelFullscreen !== fullscreen) {
    setPanelFullscreen(fullscreen);
    setPanelOpen(fullscreen);
  }

  const frameRef = useRef<Frame | null>(null);
  const lastCaptureKeyRef = useRef(captureKey);
  const lastTrigFrameRef = useRef<Frame | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ kind: DragKind; lastX: number } | null>(null);
  // Which trigger handle is being adjusted; its dashed guide line only shows meanwhile
  const adjustingRef = useRef<'level' | 'pos' | null>(null);

  useEffect(() => {
    setTrigLevel(triggerVoltage);
  }, [triggerVoltage]);

  // Restore channel colours picked in a previous session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHANNEL_COLORS_KEY) ?? 'null');
      if (Array.isArray(saved) && saved.length === 2 && saved.every((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))) {
        setChannelColors([saved[0], saved[1]]);
      }
    } catch { /* ignore unreadable storage */ }
  }, []);

  const changeChannelColor = (channel: 0 | 1, color: string) => {
    setChannelColors((colors) => {
      const next: [string, string] = channel === 0 ? [color, colors[1]] : [colors[0], color];
      try { localStorage.setItem(CHANNEL_COLORS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const timeDiv = TIME_DIVS_MS[timeDivIndex];
  const voltDiv = VOLT_DIVS[voltDivIndex];
  const windowSamples = Math.max(2, Math.round((timeDiv * H_DIVS) / sampleIntervalMs));
  const preSamples = Math.round(windowSamples * trigPos);
  const vMin = vCenter - (voltDiv * V_DIVS) / 2;
  const vMax = vCenter + (voltDiv * V_DIVS) / 2;
  const total = totalSamples ?? data.length;
  const dual = secondaryData !== undefined;
  const activeTriggerSource = dual ? triggerSource : 0;
  const channels: (0 | 1)[] = dual ? [0, 1] : [0];

  // Screen fraction of the trigger point, used as t = 0 for time readouts
  const trigFrac = (frame: Frame | null) =>
    frame && frame.trigIndex >= 0 ? (frame.trigIndex - frame.start) / windowSamples : trigPos;
  const fracToMs = (f: number, frame: Frame | null) => (f - trigFrac(frame)) * windowSamples * sampleIntervalMs;
  const sampleAt = (f: number, frame: Frame | null, channel: 0 | 1) => {
    if (!frame) return null;
    const idx = frame.start + Math.round(f * windowSamples);
    const buf = channel === 1 ? frame.secondary : frame.buf;
    return buf && idx >= 0 && idx < buf.length ? buf[idx] : null;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const voltToY = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;

    // Screen background with a subtle phosphor vignette
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, '#0c1a14');
    bg.addColorStop(1, '#040806');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Dotted graticule
    const dx = w / H_DIVS;
    const dy = h / V_DIVS;
    ctx.fillStyle = GRID_COLOR;
    for (let i = 1; i < H_DIVS; i++) {
      const x = Math.round(i * dx);
      for (let y = 0; y < h; y += 4) ctx.fillRect(x, y, 1, 1);
    }
    for (let j = 1; j < V_DIVS; j++) {
      const y = Math.round(j * dy);
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, y, 1, 1);
    }

    ctx.strokeStyle = AXIS_COLOR;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const frame = frameRef.current;

    // Dim scale labels: volts on each horizontal division, time from the trigger on each vertical one
    ctx.fillStyle = SCALE_LABEL_COLOR;
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    for (let j = 1; j < V_DIVS; j++) {
      const v = vMax - (j * (vMax - vMin)) / V_DIVS;
      ctx.fillText(`${v > 0 ? '+' : ''}${+v.toFixed(3)}V`, 3, Math.round(j * dy) - 2);
    }
    ctx.textAlign = 'center';
    const timeStep = dx < 48 ? 2 : 1;
    for (let i = timeStep; i < H_DIVS; i += timeStep) {
      const ms = fracToMs(i / H_DIVS, frame);
      ctx.fillText(`${ms > 0 ? '+' : ''}${formatTime(Math.abs(ms) < 1e-9 ? 0 : ms)}`, Math.round(i * dx), h - 3);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    // Waveform
    if (frame) {
      const { start } = frame;
      const traces = [frame.buf, dual ? frame.secondary : undefined];
      traces.forEach((buf, channel) => {
        if (!buf || buf.length < 2 || !channelVisible[channel]) return;
        const color = channelColors[channel];
        const samplesPerPx = windowSamples / w;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();

        if (samplesPerPx <= 1) {
          // Fewer samples than pixels: connect the dots
          let started = false;
          for (let i = 0; i <= windowSamples; i++) {
            const idx = start + i;
            if (idx < 0 || idx >= buf.length) continue;
            const x = (i / windowSamples) * w;
            const y = voltToY(buf[idx]);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
        } else {
          // More samples than pixels: draw a min/max envelope per pixel column
          let started = false;
          for (let px = 0; px < w; px++) {
            const a = Math.max(0, Math.floor(start + px * samplesPerPx));
            const b = Math.min(buf.length, Math.floor(start + (px + 1) * samplesPerPx));
            if (b <= a) continue;
            let lo = Infinity, hi = -Infinity;
            for (let i = a; i < b; i++) {
              const v = buf[i];
              if (v < lo) lo = v;
              if (v > hi) hi = v;
            }
            const yHi = voltToY(hi);
            const yLo = voltToY(lo);
            if (!started) { ctx.moveTo(px, yHi); started = true; } else ctx.lineTo(px, yHi);
            if (yLo - yHi > 1) ctx.lineTo(px, yLo);
          }
        }
        ctx.stroke();
        ctx.restore();
      });
    }

    // Trigger level marker; the dashed line only shows while the level is being adjusted
    if (trigMode !== 'off') {
      const ty = voltToY(trigLevel);
      if (ty >= 0 && ty <= h && adjustingRef.current === 'level') {
        ctx.strokeStyle = TRIG_COLOR;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, ty + 0.5);
        ctx.lineTo(w, ty + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      if (ty >= 0 && ty <= h) {
        ctx.fillStyle = TRIG_COLOR;
        ctx.beginPath();
        ctx.moveTo(w, ty - 7);
        ctx.lineTo(w - 12, ty);
        ctx.lineTo(w, ty + 7);
        ctx.fill();
      }
    }

    // Trigger position marker on the top edge
    const tx = frame && frame.trigIndex >= 0
      ? ((frame.trigIndex - frame.start) / windowSamples) * w
      : trigPos * w;
    if (tx >= 0 && tx <= w) {
      if (adjustingRef.current === 'pos') {
        ctx.strokeStyle = TRIG_COLOR;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tx + 0.5, 0);
        ctx.lineTo(tx + 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = TRIG_COLOR;
      ctx.beginPath();
      ctx.moveTo(tx - 6, 0);
      ctx.lineTo(tx + 6, 0);
      ctx.lineTo(tx, 9);
      ctx.fill();
    }

    // Measurement cursors
    const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
    // Solid-colour tag, e.g. "Y2 (1.680V)", kept inside the screen
    const label = (text: string, x: number, y: number, color: string) => {
      ctx.font = 'bold 10px monospace';
      const tw = ctx.measureText(text).width + 6;
      const lx = clamp(x, 0, w - tw);
      const ly = clamp(y, 0, h - 13);
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly, tw, 13);
      ctx.fillStyle = '#000';
      ctx.fillText(text, lx + 3, ly + 10);
    };
    // Delta readout box, centred on (cx, cy) and kept inside the screen
    const deltaBox = (lines: string[], cx: number, cy: number, color: string) => {
      ctx.font = 'bold 11px monospace';
      const tw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
      const th = lines.length * 14 + 6;
      const bx = clamp(cx - tw / 2, 2, w - tw - 2);
      const by = clamp(cy - th / 2, 2, h - th - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(bx, by, tw, th);
      ctx.strokeStyle = color;
      ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, th - 1);
      ctx.fillStyle = color;
      lines.forEach((l, i) => ctx.fillText(l, bx + 6, by + 15 + i * 14));
    };
    // Double-headed arrow between two points
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (len < 14) return;
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const head = (px: number, py: number, dir: number) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - dir * (ux * 7 - uy * 4), py - dir * (uy * 7 + ux * 4));
        ctx.lineTo(px - dir * (ux * 7 + uy * 4), py - dir * (uy * 7 - ux * 4));
        ctx.fill();
      };
      head(x2, y2, 1);
      head(x1, y1, -1);
    };
    const signedTime = (ms: number) => `${ms >= 0 ? '+' : ''}${formatTime(ms)}`;

    ctx.lineWidth = 1;
    if (xCursorsOn) {
      ctx.setLineDash([6, 4]);
      xCursors.forEach((f) => {
        const x = Math.round(f * w) + 0.5;
        ctx.strokeStyle = X_CURSOR_COLOR;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        channels.forEach((channel) => {
          if (!channelVisible[channel]) return;
          const v = sampleAt(f, frame, channel);
          if (v === null) return;
          ctx.fillStyle = channelColors[channel];
          ctx.fillRect(x - 3, voltToY(v) - 3, 6, 6);
        });
      });
      ctx.setLineDash([]);
      xCursors.forEach((f, i) => {
        const x = Math.round(f * w) + 0.5;
        label(`X${i + 1} (${signedTime(fracToMs(f, frame))})`, x + 2, h - 16, X_CURSOR_COLOR);
      });

      const [xa, xb] = xCursors.map((f) => Math.round(f * w) + 0.5);
      const ay = 30;
      arrow(xa, ay, xb, ay, X_CURSOR_COLOR);
      const dxMs = Math.abs(xCursors[1] - xCursors[0]) * windowSamples * sampleIntervalMs;
      deltaBox(
        [`ΔX ${formatTime(dxMs)}`, `1/ΔX ${dxMs > 0 ? formatFreq(1000 / dxMs) : '--'}`],
        (xa + xb) / 2, ay + 24, X_CURSOR_COLOR
      );
    }
    if (yCursorsOn) {
      ctx.setLineDash([6, 4]);
      yCursors.forEach((v) => {
        const y = Math.round(voltToY(v)) + 0.5;
        ctx.strokeStyle = Y_CURSOR_COLOR;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      yCursors.forEach((v, i) => {
        const y = Math.round(voltToY(v)) + 0.5;
        label(`Y${i + 1} (${v.toFixed(3)}V)`, 14, y - 14, Y_CURSOR_COLOR);
      });

      const [ya, yb] = yCursors.map((v) => Math.round(voltToY(v)) + 0.5);
      const axX = Math.round(w * 0.82) + 0.5;
      arrow(axX, ya, axX, yb, Y_CURSOR_COLOR);
      deltaBox([`ΔY ${Math.abs(yCursors[1] - yCursors[0]).toFixed(3)}V`], axX - 50, (ya + yb) / 2, Y_CURSOR_COLOR);
    }

    // Hover cursor readout
    const hover = hoverRef.current;
    if (hover && !dragRef.current) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(hover.x + 0.5, 0);
      ctx.lineTo(hover.x + 0.5, h);
      ctx.moveTo(0, hover.y + 0.5);
      ctx.lineTo(w, hover.y + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      const volts = vMax - (hover.y / h) * (vMax - vMin);
      const timeMs = fracToMs(hover.x / w, frame);
      const text = `${timeMs >= 0 ? '+' : ''}${formatTime(timeMs)}  ${volts.toFixed(3)}V`;
      ctx.font = '11px monospace';
      const tw = ctx.measureText(text).width + 10;
      const lx = Math.min(hover.x + 8, w - tw - 4);
      const ly = hover.y > 24 ? hover.y - 22 : hover.y + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(lx, ly, tw, 16);
      ctx.fillStyle = '#e8f5ee';
      ctx.fillText(text, lx + 5, ly + 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vMin, vMax, windowSamples, trigMode, trigLevel, trigPos, sampleIntervalMs, xCursorsOn, yCursorsOn, xCursors, yCursors, channelVisible, channelColors, dual]);

  // Build the frame to display (live or frozen) and handle triggering
  useEffect(() => {
    const reset = lastCaptureKeyRef.current !== captureKey;
    if (reset) {
      lastCaptureKeyRef.current = captureKey;
      frameRef.current = null;
      lastTrigFrameRef.current = null;
      hoverRef.current = null;
      dragRef.current = null;
      setFrozen(null);
      setSingleArmedAt(null);
    }
    const result = buildScopeCapture({
      data, secondaryData, total, windowSamples, preSamples, sampleIntervalMs,
      mode: trigMode, edge: trigEdge, level: trigLevel, triggerSource: activeTriggerSource,
      armedAt: reset ? null : singleArmedAt, frozen: reset ? null : frozen,
      previousFrame: frameRef.current, lastTrigger: lastTrigFrameRef.current,
    });
    const { frame } = result;
    if (result.triggered) lastTrigFrameRef.current = result.triggered;
    if (result.captured) {
      setFrozen(result.captured);
      setSingleArmedAt(null);
    }
    frameRef.current = frame;
    setStatus(result.status);
    const measureChannel = (buf: number[] | undefined) =>
      frame && buf ? measure(buf, frame.start, windowSamples, sampleIntervalMs) : null;
    setMeasurements([measureChannel(frame?.buf), measureChannel(dual ? frame?.secondary : undefined)]);
    draw();
  }, [data, secondaryData, captureKey, total, frozen, singleArmedAt, trigMode, trigEdge, trigLevel, activeTriggerSource, dual, windowSamples, preSamples, sampleIntervalMs, draw]);

  // Keep the canvas sized to its container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  // Fullscreen: lock page scroll and close with Escape
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleFullscreen?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen, onToggleFullscreen]);

  // ---- Actions ----

  const run = () => {
    setFrozen(null);
    setSingleArmedAt(null);
  };

  const freeze = () => {
    if (!frameRef.current) return;
    setFrozen(freezeScopeFrame(frameRef.current, preSamples));
    setSingleArmedAt(null);
  };

  const changeTriggerSource = (source: 0 | 1) => {
    setTriggerSource(source);
    lastTrigFrameRef.current = null;
    if (!frozen) frameRef.current = null;
    if (singleArmedAt !== null) setSingleArmedAt(total);
  };

  const single = () => {
    setFrozen(null);
    setSingleArmedAt(total);
    if (trigMode === 'off') setTrigMode('auto');
  };

  const autoSet = () => {
    if (data.length < 2) return;
    const source = activeTriggerSource === 1 ? secondaryData ?? data : data;
    const recent = source.slice(-Math.round(1000 / sampleIntervalMs));
    const m = measure(recent, 0, recent.length, sampleIntervalMs);
    if (!m) return;

    const span = Math.max(m.vmax - m.vmin, 0.05);
    let vi = VOLT_DIVS.findIndex((d) => d * V_DIVS >= span * 1.25);
    if (vi === -1) vi = VOLT_DIVS.length - 1;
    setVoltDivIndex(vi);
    setVCenter(+((m.vmax + m.vmin) / 2).toFixed(2));

    if (m.freq) {
      // Aim for roughly 3 periods on screen
      const target = (3 * 1000) / m.freq / H_DIVS;
      let ti = TIME_DIVS_MS.findIndex((d) => d >= target);
      if (ti === -1) ti = TIME_DIVS_MS.length - 1;
      setTimeDivIndex(ti);
    }

    setTrigLevel(+((m.vmax + m.vmin) / 2).toFixed(2));
    setTrigMode('auto');
    setTrigPos(0.5);
    run();
  };

  const toggleXCursors = () => setXCursorsOn((on) => !on);
  const toggleYCursors = () => {
    // Bring the Y cursors onto the current screen when turning them on
    if (!yCursorsOn) setYCursors([+(vCenter - voltDiv * 2).toFixed(3), +(vCenter + voltDiv * 2).toFixed(3)]);
    setYCursorsOn((on) => !on);
  };

  const savePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `scope-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ---- Canvas interaction: drag trigger level, pan when stopped, hover readout ----

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
  };

  const yToVolt = (y: number, h: number) => vMax - (y / h) * (vMax - vMin);

  // Which draggable item (cursor or trigger handle) is under the pointer
  const hitTest = (x: number, y: number, w: number, h: number): DragKind | null => {
    const tx = trigFrac(frameRef.current) * w;
    if (y < 16 && Math.abs(x - tx) < 10) return 'pos';
    if (xCursorsOn) {
      if (Math.abs(x - xCursors[0] * w) < GRAB_PX) return 'x0';
      if (Math.abs(x - xCursors[1] * w) < GRAB_PX) return 'x1';
    }
    if (yCursorsOn) {
      const toY = (v: number) => h - ((v - vMin) / (vMax - vMin)) * h;
      if (Math.abs(y - toY(yCursors[0])) < GRAB_PX) return 'y0';
      if (Math.abs(y - toY(yCursors[1])) < GRAB_PX) return 'y1';
    }
    const ty = h - ((trigLevel - vMin) / (vMax - vMin)) * h;
    if (trigMode !== 'off' && x > w - 24 && Math.abs(y - ty) < 14) return 'level';
    return null;
  };

  const applyDrag = (kind: DragKind, x: number, y: number, w: number, h: number) => {
    if (kind === 'level') {
      setTrigLevel(+Math.min(maxVoltage, Math.max(0, yToVolt(y, h))).toFixed(2));
    } else if (kind === 'pos') {
      setTrigPos(+Math.min(1, Math.max(0, x / w)).toFixed(2));
    } else if (kind === 'x0' || kind === 'x1') {
      const f = Math.min(1, Math.max(0, x / w));
      setXCursors(([a, b]) => (kind === 'x0' ? [f, b] : [a, f]));
    } else if (kind === 'y0' || kind === 'y1') {
      const v = +yToVolt(Math.min(h, Math.max(0, y)), h).toFixed(3);
      setYCursors(([a, b]) => (kind === 'y0' ? [v, b] : [a, v]));
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, w, h } = pointerPos(e);
    const hit = hitTest(x, y, w, h);
    if (hit) {
      dragRef.current = { kind: hit, lastX: x };
      if (hit === 'level' || hit === 'pos') adjustingRef.current = hit;
      applyDrag(hit, x, y, w, h);
    } else if (frozen) {
      dragRef.current = { kind: 'pan', lastX: x };
    } else {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, w, h } = pointerPos(e);
    hoverRef.current = { x, y };
    const drag = dragRef.current;
    if (drag?.kind === 'pan' && frozen) {
      const deltaSamples = Math.round(((x - drag.lastX) / w) * windowSamples);
      if (deltaSamples !== 0) {
        drag.lastX = x;
        const anchor = Math.min(frozen.buf.length, Math.max(0, frozen.anchor - deltaSamples));
        setFrozen({ ...frozen, anchor });
      }
    } else if (drag) {
      applyDrag(drag.kind, x, y, w, h);
    } else {
      const hit = hitTest(x, y, w, h);
      e.currentTarget.style.cursor =
        hit === 'x0' || hit === 'x1' || hit === 'pos' ? 'ew-resize' : hit ? 'ns-resize' : '';
      draw();
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    if (adjustingRef.current) {
      adjustingRef.current = null;
      draw();
    }
  };

  const onPointerLeave = () => {
    hoverRef.current = null;
    draw();
  };

  const stepTimeDiv = (delta: number) =>
    setTimeDivIndex((i) => Math.min(TIME_DIVS_MS.length - 1, Math.max(0, i + delta)));
  const stepVoltDiv = (delta: number) =>
    setVoltDivIndex((i) => Math.min(VOLT_DIVS.length - 1, Math.max(0, i + delta)));
  const stepCenter = (delta: number) =>
    setVCenter((c) => +(c + delta * voltDiv).toFixed(3));

  const statusClass = {
    'RUN': styles.statusRun,
    "TRIG'D": styles.statusRun,
    'AUTO': styles.statusAuto,
    'WAIT': styles.statusWait,
    'STOP': styles.statusStop,
  }[status];

  return (
    <div className={fullscreen ? styles.fullscreen : undefined}>
      {fullscreen && (
        <div className={styles.fullscreenHeader}>
          <span className={styles.fullscreenTitle}>{title}</span>
          <button className={styles.closeButton} onClick={onToggleFullscreen} title="Exit fullscreen (Esc)">
            ✕ Close
          </button>
        </div>
      )}
      <div className={styles.scope}>
      <div className={styles.screenArea}>
        <div className={styles.topBar}>
          <span className={`${styles.statusBadge} ${statusClass}`}>{singleArmedAt !== null ? 'ARMED' : status}</span>
          <span className={styles.traceLabel} style={{ color: channelColors[0] }}>{channelLabels[0]}{!channelVisible[0] ? ' OFF' : ''}</span>
          {dual && <span className={styles.traceLabel} style={{ color: channelColors[1] }}>{channelLabels[1]}{!channelVisible[1] ? ' OFF' : ''}</span>}
          <span className={styles.barItem}>
            {trigMode === 'off' ? (
              <span className={styles.dim}>TRIG OFF</span>
            ) : (
              <span className={styles.trigText}>
                T {channelLabels[activeTriggerSource]} {trigEdge === 'rising' ? '↑' : '↓'} {trigLevel.toFixed(2)}V {trigMode.toUpperCase()}
              </span>
            )}
          </span>
          <button className={`${styles.statusBadge} ${styles.panelToggle} ${panelOpen ? styles.panelToggleOn : ''}`}
            aria-expanded={panelOpen} aria-controls={panelId}
            title={panelOpen ? 'Hide controls' : 'Show controls'} onClick={() => setPanelOpen((open) => !open)}>
            CONTROLS
          </button>
        </div>

        <div className={styles.canvasWrap} style={fullscreen ? undefined : { height }}>
          <canvas
            ref={canvasRef}
            aria-label={`${title}: ${channelLabels[0]}${dual ? ` and ${channelLabels[1]}, time-aligned` : ''}`}
            className={`${styles.canvas} ${frozen ? styles.canvasPannable : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
          />
        </div>

        {channels.filter((channel) => channelVisible[channel]).map((channel) => {
          const m = measurements[channel];
          return (
            <div key={channel} className={`${styles.bottomBar} ${styles.readoutRow}`}>
              <label className={styles.channelBadge} style={{ background: channelColors[channel] }} title={`Change ${channelLabels[channel]} color`}>
                {channelLabels[channel]}
                <input type="color" className={styles.badgeColorInput} aria-label={`${channelLabels[channel]} color`}
                  value={channelColors[channel]} onChange={(event) => changeChannelColor(channel, event.target.value)} />
              </label>
              <span className={styles.measure}>Max <b>{m ? m.vmax.toFixed(2) + 'V' : '--'}</b></span>
              <span className={styles.measure}>Min <b>{m ? m.vmin.toFixed(2) + 'V' : '--'}</b></span>
              <span className={styles.measure}>Vpp <b>{m ? (m.vmax - m.vmin).toFixed(2) + 'V' : '--'}</b></span>
              <span className={styles.measure}>Avg <b>{m ? m.vavg.toFixed(2) + 'V' : '--'}</b></span>
              <span className={styles.measure}>Freq <b>{m?.freq ? formatFreq(m.freq) : '--'}</b></span>
            </div>
          );
        })}
        {frozen && (
          <div className={styles.hint}>Stopped — drag the screen to scroll through the capture, change H/div to zoom.</div>
        )}
      </div>

      <div id={panelId} className={`${styles.panel} ${panelOpen ? '' : styles.panelHidden}`}>
        <div className={styles.group}>
          <div className={styles.groupTitle}>{dual ? 'Channels · shared timebase' : 'Channel'}</div>
          {dual && (
            <div className={styles.buttonRow}>
              {channels.map((channel) => (
                <button key={channel} aria-label={`Show ${channelLabels[channel]}`} aria-pressed={channelVisible[channel]}
                  className={`${styles.key} ${styles.channelKey}`}
                  style={{ color: channelColors[channel], opacity: channelVisible[channel] ? 1 : 0.5 }}
                  onClick={() => setChannelVisible((visible) => channel === 0 ? [!visible[0], visible[1]] : [visible[0], !visible[1]])}>
                  {channelLabels[channel]} {channelVisible[channel] ? 'ON' : 'OFF'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.group}>
          <div className={styles.groupTitle}>Acquire</div>
          <div className={styles.buttonRow}>
            <button className={`${styles.key} ${!frozen && singleArmedAt === null ? styles.keyRun : ''}`} onClick={run}>RUN</button>
            <button className={`${styles.key} ${frozen ? styles.keyStop : ''}`} onClick={freeze}>FREEZE</button>
            <button
              className={`${styles.key} ${singleArmedAt !== null ? styles.keyArmed : frozen ? styles.keyStop : ''}`}
              onClick={single}
            >
              SINGLE
            </button>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.key} onClick={autoSet}>AUTOSET</button>
            <button className={styles.key} onClick={savePng}>SAVE PNG</button>
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.groupTitle}>Cursors</div>
          <div className={styles.buttonRow}>
            <button className={`${styles.key} ${xCursorsOn ? styles.keyCursorX : ''}`} onClick={toggleXCursors}>X · TIME</button>
            <button className={`${styles.key} ${yCursorsOn ? styles.keyCursorY : ''}`} onClick={toggleYCursors}>Y · VOLT</button>
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.groupTitle}>Horizontal</div>
          <div className={styles.stepper}>
            <button className={styles.stepBtn} onClick={() => stepTimeDiv(-1)} disabled={timeDivIndex === 0}>−</button>
            <span className={styles.stepValue}>{formatTime(timeDiv)}/div</span>
            <button className={styles.stepBtn} onClick={() => stepTimeDiv(1)} disabled={timeDivIndex === TIME_DIVS_MS.length - 1}>+</button>
          </div>
          <label className={styles.sliderLabel}>
            <span>Trig pos</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(trigPos * 100)}
              onChange={(e) => setTrigPos(Number(e.target.value) / 100)}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{Math.round(trigPos * 100)}%</span>
          </label>
        </div>

        <div className={styles.group}>
          <div className={styles.groupTitle}>Vertical</div>
          <div className={styles.stepper}>
            <button className={styles.stepBtn} onClick={() => stepVoltDiv(-1)} disabled={voltDivIndex === 0}>−</button>
            <span className={styles.stepValue}>{formatVolt(voltDiv)}/div</span>
            <button className={styles.stepBtn} onClick={() => stepVoltDiv(1)} disabled={voltDivIndex === VOLT_DIVS.length - 1}>+</button>
          </div>
          <div className={styles.stepper}>
            <button className={styles.stepBtn} onClick={() => stepCenter(-1)}>▼</button>
            <span className={styles.stepValue}>pos {vCenter.toFixed(2)}V</span>
            <button className={styles.stepBtn} onClick={() => stepCenter(1)}>▲</button>
          </div>
        </div>

        <div className={styles.group}>
          <div className={styles.groupTitle}>Trigger</div>
          {dual && <div className={styles.sourceLabel}>Source
            <div className={styles.sourceChips} role="group" aria-label="Trigger source">
              {([0, 1] as const).map((source) => (
                <button
                  key={source}
                  className={styles.sourceChip}
                  style={activeTriggerSource === source ? { background: channelColors[source], borderColor: channelColors[source], color: '#0a0d0c' } : { color: channelColors[source] }}
                  aria-pressed={activeTriggerSource === source}
                  onClick={() => changeTriggerSource(source)}
                >
                  {channelLabels[source]}
                </button>
              ))}
            </div>
          </div>}
          <div className={styles.segmented}>
            {(['off', 'auto', 'normal'] as TriggerMode[]).map((mode) => (
              <button
                key={mode}
                className={`${styles.segment} ${trigMode === mode ? styles.segmentActive : ''}`}
                onClick={() => setTrigMode(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <div className={styles.segmented}>
            <button
              className={`${styles.segment} ${trigEdge === 'rising' ? styles.segmentActive : ''}`}
              onClick={() => setTrigEdge('rising')}
            >
              ↑ RISE
            </button>
            <button
              className={`${styles.segment} ${trigEdge === 'falling' ? styles.segmentActive : ''}`}
              onClick={() => setTrigEdge('falling')}
            >
              ↓ FALL
            </button>
          </div>
          <label className={styles.sliderLabel}>
            <span>Level</span>
            <input
              type="range"
              min={0}
              max={maxVoltage}
              step={0.01}
              value={trigLevel}
              onChange={(e) => setTrigLevel(Number(e.target.value))}
              onPointerDown={() => { adjustingRef.current = 'level'; draw(); }}
              onPointerUp={onPointerUp}
              className={`${styles.slider} ${styles.sliderTrig}`}
            />
            <span className={styles.sliderValue}>{trigLevel.toFixed(2)}V</span>
          </label>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Oscilloscope;
