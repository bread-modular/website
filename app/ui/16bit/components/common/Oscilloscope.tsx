"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import styles from "./Oscilloscope.module.css";

export interface OscilloscopeProps {
  data: number[];
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

type TriggerMode = 'off' | 'auto' | 'normal';
type TriggerEdge = 'rising' | 'falling';
type Status = 'RUN' | "TRIG'D" | 'AUTO' | 'WAIT' | 'STOP';
type DragKind = 'level' | 'pan' | 'x0' | 'x1' | 'y0' | 'y1';

interface Frame {
  buf: number[];
  start: number;      // index in buf of the left edge of the screen
  trigIndex: number;  // index in buf of the trigger point (-1 if none)
}

interface Frozen {
  buf: number[];
  anchor: number;     // index in buf placed at the trigger position on screen
  trigIndex: number;
}

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
const AUTO_TIMEOUT_MS = 200;

const TRACE_COLOR = '#ffd23f';
const TRIG_COLOR = '#ff8a3d';
const GRID_COLOR = 'rgba(160, 200, 180, 0.06)';
const AXIS_COLOR = 'rgba(160, 200, 180, 0.11)';
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

// Find the most recent edge crossing the level (with hysteresis) in buf[from..to].
function findTrigger(buf: number[], level: number, edge: TriggerEdge, from: number, to: number): number {
  const s = edge === 'rising' ? 1 : -1;
  const lvl = level * s;
  let candidate = -1;
  for (let j = Math.min(to, buf.length - 1); j >= Math.max(from, 1); j--) {
    const v = buf[j] * s;
    if (candidate !== -1) {
      if (v <= lvl - HYSTERESIS) return candidate;
      if (v >= lvl) candidate = -1;
    }
    if (candidate === -1 && v >= lvl && buf[j - 1] * s < lvl) candidate = j;
  }
  return -1;
}

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

  const [timeDivIndex, setTimeDivIndex] = useState(TIME_DIVS_MS.indexOf(10));
  const [voltDivIndex, setVoltDivIndex] = useState(VOLT_DIVS.indexOf(0.5));
  const [vCenter, setVCenter] = useState(2); // voltage at the vertical center of the screen
  const [trigMode, setTrigMode] = useState<TriggerMode>('auto');
  const [trigEdge, setTrigEdge] = useState<TriggerEdge>('rising');
  const [trigLevel, setTrigLevel] = useState(triggerVoltage);
  const [trigPos, setTrigPos] = useState(0.5); // horizontal trigger position (0..1 of screen)
  const [frozen, setFrozen] = useState<Frozen | null>(null);
  const [singleArmedAt, setSingleArmedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('RUN');
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [xCursorsOn, setXCursorsOn] = useState(false);
  const [yCursorsOn, setYCursorsOn] = useState(false);
  const [xCursors, setXCursors] = useState<[number, number]>([0.3, 0.7]); // fraction of screen width
  const [yCursors, setYCursors] = useState<[number, number]>([1, 2.3]);   // volts

  const frameRef = useRef<Frame | null>(null);
  const lastTrigFrameRef = useRef<Frame | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ kind: DragKind; lastX: number } | null>(null);
  const levelAdjustingRef = useRef(false);

  useEffect(() => {
    setTrigLevel(triggerVoltage);
  }, [triggerVoltage]);

  const timeDiv = TIME_DIVS_MS[timeDivIndex];
  const voltDiv = VOLT_DIVS[voltDivIndex];
  const windowSamples = Math.max(2, Math.round((timeDiv * H_DIVS) / sampleIntervalMs));
  const preSamples = Math.round(windowSamples * trigPos);
  const vMin = vCenter - (voltDiv * V_DIVS) / 2;
  const vMax = vCenter + (voltDiv * V_DIVS) / 2;
  const total = totalSamples ?? data.length;

  // Screen fraction of the trigger point, used as t = 0 for time readouts
  const trigFrac = (frame: Frame | null) =>
    frame && frame.trigIndex >= 0 ? (frame.trigIndex - frame.start) / windowSamples : trigPos;
  const fracToMs = (f: number, frame: Frame | null) => (f - trigFrac(frame)) * windowSamples * sampleIntervalMs;
  const sampleAt = (f: number, frame: Frame | null) => {
    if (!frame) return null;
    const idx = frame.start + Math.round(f * windowSamples);
    return idx >= 0 && idx < frame.buf.length ? frame.buf[idx] : null;
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

    // Waveform
    if (frame && frame.buf.length > 1) {
      const { buf, start } = frame;
      const samplesPerPx = windowSamples / w;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      ctx.strokeStyle = TRACE_COLOR;
      ctx.fillStyle = TRACE_COLOR;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.shadowColor = TRACE_COLOR;
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
    }

    // Ground (0V) marker on the left edge
    const gy = voltToY(0);
    if (gy >= 0 && gy <= h) {
      ctx.fillStyle = TRACE_COLOR;
      ctx.beginPath();
      ctx.moveTo(0, gy - 6);
      ctx.lineTo(10, gy);
      ctx.lineTo(0, gy + 6);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('1', 1, gy + 3);
    }

    // Trigger level marker; the dashed line only shows while the level is being adjusted
    if (trigMode !== 'off') {
      const ty = voltToY(trigLevel);
      if (ty >= 0 && ty <= h && levelAdjustingRef.current) {
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
        const v = sampleAt(f, frame);
        if (v !== null) {
          ctx.fillStyle = X_CURSOR_COLOR;
          ctx.fillRect(x - 3, voltToY(v) - 3, 6, 6);
        }
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
  }, [vMin, vMax, windowSamples, trigMode, trigLevel, trigPos, sampleIntervalMs, xCursorsOn, yCursorsOn, xCursors, yCursors]);

  // Build the frame to display (live or frozen) and handle triggering
  useEffect(() => {
    let frame: Frame | null = null;
    let nextStatus: Status = 'RUN';

    if (frozen) {
      frame = { buf: frozen.buf, start: frozen.anchor - preSamples, trigIndex: frozen.trigIndex };
      nextStatus = 'STOP';
    } else if (data.length > 0) {
      const len = data.length;
      const postSamples = windowSamples - preSamples;
      const firstAbs = total - len; // absolute sample number of data[0]
      const isSingle = singleArmedAt !== null;

      if (trigMode === 'off' && !isSingle) {
        frame = { buf: data, start: len - windowSamples, trigIndex: -1 };
        nextStatus = 'RUN';
      } else {
        let from = 1;
        if (isSingle) from = Math.max(1, singleArmedAt - firstAbs);
        else if (trigMode === 'auto') {
          from = len - postSamples - windowSamples - Math.round(AUTO_TIMEOUT_MS / sampleIntervalMs);
        }
        const t = findTrigger(data, trigLevel, trigEdge, from, len - 1 - postSamples);

        if (t !== -1) {
          frame = { buf: data, start: t - preSamples, trigIndex: t };
          lastTrigFrameRef.current = frame;
          nextStatus = "TRIG'D";
          if (isSingle) {
            setFrozen({ buf: data, anchor: t, trigIndex: t });
            setSingleArmedAt(null);
            nextStatus = 'STOP';
          }
        } else if (trigMode === 'auto' && !isSingle) {
          frame = { buf: data, start: len - windowSamples, trigIndex: -1 };
          nextStatus = 'AUTO';
        } else {
          // Normal / single: keep showing the last triggered frame while waiting
          frame = isSingle ? frameRef.current : lastTrigFrameRef.current;
          nextStatus = 'WAIT';
        }
      }
    }

    frameRef.current = frame;
    setStatus(nextStatus);
    setMeasurements(frame ? measure(frame.buf, frame.start, windowSamples, sampleIntervalMs) : null);
    draw();
  }, [data, total, frozen, singleArmedAt, trigMode, trigEdge, trigLevel, windowSamples, preSamples, sampleIntervalMs, draw]);

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

  const single = () => {
    setFrozen(null);
    setSingleArmedAt(total);
    if (trigMode === 'off') setTrigMode('auto');
  };

  const autoSet = () => {
    if (data.length < 2) return;
    const recent = data.slice(-Math.round(1000 / sampleIntervalMs));
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

  // Which draggable item (cursor or trigger level) is under the pointer
  const hitTest = (x: number, y: number, w: number, h: number): DragKind | null => {
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
      if (hit === 'level') levelAdjustingRef.current = true;
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
        hit === 'x0' || hit === 'x1' ? 'ew-resize' : hit ? 'ns-resize' : '';
      draw();
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    if (levelAdjustingRef.current) {
      levelAdjustingRef.current = false;
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
          <span className={styles.barItem}>H <b>{formatTime(timeDiv)}</b>/div</span>
          <span className={styles.barItem}>
            {trigMode === 'off' ? (
              <span className={styles.dim}>TRIG OFF</span>
            ) : (
              <span className={styles.trigText}>
                T {trigEdge === 'rising' ? '↑' : '↓'} {trigLevel.toFixed(2)}V {trigMode.toUpperCase()}
              </span>
            )}
          </span>
        </div>

        <div className={styles.canvasWrap} style={fullscreen ? undefined : { height }}>
          <canvas
            ref={canvasRef}
            className={`${styles.canvas} ${frozen ? styles.canvasPannable : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerLeave}
          />
        </div>

        <div className={styles.bottomBar}>
          <span className={styles.channelBadge}>CH1</span>
          <span className={styles.barItem}><b>{formatVolt(voltDiv)}</b>/div</span>
          <span className={styles.measure}>Max <b>{measurements ? measurements.vmax.toFixed(2) + 'V' : '--'}</b></span>
          <span className={styles.measure}>Min <b>{measurements ? measurements.vmin.toFixed(2) + 'V' : '--'}</b></span>
          <span className={styles.measure}>Vpp <b>{measurements ? (measurements.vmax - measurements.vmin).toFixed(2) + 'V' : '--'}</b></span>
          <span className={styles.measure}>Avg <b>{measurements ? measurements.vavg.toFixed(2) + 'V' : '--'}</b></span>
          <span className={styles.measure}>Freq <b>{measurements?.freq ? formatFreq(measurements.freq) : '--'}</b></span>
        </div>
        <div className={styles.hint}>
          {frozen
            ? 'Stopped — drag the screen to scroll through the capture, change H/div to zoom.'
            : xCursorsOn || yCursorsOn
              ? 'Drag the cursor lines to measure. Drag the orange marker to set the trigger level.'
              : 'Drag the orange marker on the right edge to set the trigger level.'}
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.group}>
          <div className={styles.groupTitle}>Acquire</div>
          <div className={styles.buttonRow}>
            <button className={`${styles.key} ${!frozen && singleArmedAt === null ? styles.keyRun : ''}`} onClick={run}>RUN</button>
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
              onPointerDown={() => { levelAdjustingRef.current = true; draw(); }}
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
