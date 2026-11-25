// Draws the scope and the analyzer on their canvases (device pixels).

export const CH_COLORS = ['#e3a443', '#6fb7d8'];
const GRID = '#262624';
const GRID_AXIS = '#3a3a36';
const TEXT = '#8f8e85';
const BG = '#121211';

export const DIVS_X = 10;
export const DIVS_Y = 8;

export interface Trace {
  data: Float32Array;   // volts
  vdiv: number;
  pos: number;          // volts added before drawing (moves the trace)
}

export interface ScopeFrame {
  a: Float32Array;
  b: Float32Array;
  frac: number;         // where the screen starts, in samples after a[0]
  span: number;         // samples across the screen
  triggered: boolean;
  roll: boolean;        // the right edge is now (roll mode)
  filled: number;       // roll mode: samples received so far, from the right
}

export interface Cursor {
  x: number;            // 0..1 across
  y: number;            // 0..1 down
}

function grid(g: CanvasRenderingContext2D, w: number, h: number, dpr: number) {
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);
  g.lineWidth = 1;
  g.strokeStyle = GRID;
  g.beginPath();
  for (let i = 1; i < DIVS_X; i++) {
    const x = Math.round((i * w) / DIVS_X) + 0.5;
    g.moveTo(x, 0);
    g.lineTo(x, h);
  }
  for (let i = 1; i < DIVS_Y; i++) {
    const y = Math.round((i * h) / DIVS_Y) + 0.5;
    g.moveTo(0, y);
    g.lineTo(w, y);
  }
  g.stroke();
  // the centre lines carry fifth-division ticks
  g.strokeStyle = GRID_AXIS;
  g.beginPath();
  const cx = Math.round(w / 2) + 0.5;
  const cy = Math.round(h / 2) + 0.5;
  g.moveTo(cx, 0);
  g.lineTo(cx, h);
  g.moveTo(0, cy);
  g.lineTo(w, cy);
  const t = 3 * dpr;
  for (let i = 0; i <= DIVS_X * 5; i++) {
    const x = Math.round((i * w) / (DIVS_X * 5)) + 0.5;
    g.moveTo(x, cy - t);
    g.lineTo(x, cy + t);
  }
  for (let i = 0; i <= DIVS_Y * 5; i++) {
    const y = Math.round((i * h) / (DIVS_Y * 5)) + 0.5;
    g.moveTo(cx - t, y);
    g.lineTo(cx + t, y);
  }
  g.stroke();
}

const clampY = (y: number, h: number) => (y < -h ? -h : y > 2 * h ? 2 * h : y);

function trace(g: CanvasRenderingContext2D, w: number, h: number, t: Trace, frame: ScopeFrame, color: string, dpr: number) {
  const { data } = t;
  const divY = h / DIVS_Y;
  const yOf = (v: number) => clampY(h / 2 - ((v + t.pos) / t.vdiv) * divY, h);
  const spp = frame.span / w; // samples per pixel
  const x0 = frame.roll ? w - (Math.min(frame.filled, frame.span) / frame.span) * w : 0;
  g.strokeStyle = color;
  g.lineWidth = 1.5 * dpr;
  g.lineJoin = 'round';
  g.beginPath();
  if (spp > 1) {
    // min and max of the samples under each pixel column
    for (let px = Math.max(0, Math.floor(x0)); px < w; px++) {
      const s0 = Math.floor(frame.frac + px * spp);
      const s1 = Math.min(data.length, Math.max(s0 + 1, Math.floor(frame.frac + (px + 1) * spp)));
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = s0; i < s1; i++) {
        const v = data[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (lo === Infinity) continue;
      if (px === Math.max(0, Math.floor(x0))) g.moveTo(px, yOf(hi));
      g.lineTo(px, yOf(hi));
      g.lineTo(px, yOf(lo));
    }
    g.stroke();
  } else {
    const first = Math.max(0, Math.floor(frame.frac));
    const last = Math.min(data.length - 1, Math.ceil(frame.frac + frame.span));
    for (let i = first; i <= last; i++) {
      const x = (i - frame.frac) / spp;
      if (i === first) g.moveTo(x, yOf(data[i]));
      else g.lineTo(x, yOf(data[i]));
    }
    g.stroke();
    // few samples on the screen: show where they are
    if (spp < 1 / 8) {
      g.fillStyle = color;
      for (let i = first; i <= last; i++) {
        g.beginPath();
        g.arc((i - frame.frac) / spp, yOf(data[i]), 2.2 * dpr, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}

function tag(g: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, dpr: number, side: 'left' | 'right' | 'top') {
  const s = 7 * dpr;
  g.fillStyle = color;
  g.beginPath();
  if (side === 'left') {
    g.moveTo(x, y - s); g.lineTo(x + s * 1.4, y - s); g.lineTo(x + s * 2.1, y); g.lineTo(x + s * 1.4, y + s); g.lineTo(x, y + s);
  } else if (side === 'right') {
    g.moveTo(x, y - s); g.lineTo(x - s * 1.4, y - s); g.lineTo(x - s * 2.1, y); g.lineTo(x - s * 1.4, y + s); g.lineTo(x, y + s);
  } else {
    g.moveTo(x - s, y); g.lineTo(x + s, y); g.lineTo(x + s, y + s * 1.2); g.lineTo(x, y + s * 2); g.lineTo(x - s, y + s * 1.2);
  }
  g.closePath();
  g.fill();
  if (label) {
    g.fillStyle = '#1a1408';
    g.font = `600 ${9 * dpr}px system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const lx = side === 'left' ? x + s * 0.8 : side === 'right' ? x - s * 0.8 : x;
    const ly = side === 'top' ? y + s * 0.8 : y + 0.5 * dpr;
    g.fillText(label, lx, ly);
  }
}

function cross(g: CanvasRenderingContext2D, w: number, h: number, c: Cursor, dpr: number) {
  g.strokeStyle = '#c3c2b7';
  g.globalAlpha = 0.35;
  g.lineWidth = dpr;
  g.setLineDash([3 * dpr, 3 * dpr]);
  g.beginPath();
  const x = Math.round(c.x * w) + 0.5;
  const y = Math.round(c.y * h) + 0.5;
  g.moveTo(x, 0); g.lineTo(x, h);
  g.moveTo(0, y); g.lineTo(w, y);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
}

export interface ScopeView {
  ch: { on: boolean; vdiv: number; pos: number }[];
  trigSrc: number;
  trigLevel: number;
  showTrigger: boolean;   // triggered (not roll) mode
  xy: boolean;
}

export function drawScope(canvas: HTMLCanvasElement, frame: ScopeFrame | null, view: ScopeView, cursor: Cursor | null) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  grid(g, w, h, dpr);
  const data = frame ? [frame.a, frame.b] : null;

  if (view.xy) {
    if (frame && data) {
      const [c1, c2] = view.ch;
      const divX = w / DIVS_X;
      const divY = h / DIVS_Y;
      const first = Math.max(0, Math.floor(frame.frac));
      const last = Math.min(frame.a.length - 1, Math.ceil(frame.frac + frame.span));
      const step = Math.max(1, Math.floor((last - first) / 40000));
      g.strokeStyle = CH_COLORS[0];
      g.globalAlpha = 0.85;
      g.lineWidth = 1.2 * dpr;
      g.beginPath();
      for (let i = first; i <= last; i += step) {
        const x = w / 2 + ((frame.a[i] + c1.pos) / c1.vdiv) * divX;
        const y = clampY(h / 2 - ((frame.b[i] + c2.pos) / c2.vdiv) * divY, h);
        if (i === first) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.globalAlpha = 1;
    }
  } else {
    if (frame && data) {
      // channel 2 under channel 1
      for (const n of [1, 0]) {
        const c = view.ch[n];
        if (c.on) trace(g, w, h, { data: data[n], vdiv: c.vdiv, pos: c.pos }, frame, CH_COLORS[n], dpr);
      }
    }
    // ground markers on the left, the trigger level on the right, the trigger time on top
    for (const n of [1, 0]) {
      const c = view.ch[n];
      if (!c.on) continue;
      const y = h / 2 - (c.pos / c.vdiv) * (h / DIVS_Y);
      if (y > -8 && y < h + 8) tag(g, 0, Math.min(h - 7 * dpr, Math.max(7 * dpr, y)), String(n + 1), CH_COLORS[n], dpr, 'left');
    }
    if (view.showTrigger) {
      const c = view.ch[view.trigSrc];
      const y = h / 2 - ((view.trigLevel + c.pos) / c.vdiv) * (h / DIVS_Y);
      tag(g, w, Math.min(h - 7 * dpr, Math.max(7 * dpr, y)), 'T', CH_COLORS[view.trigSrc], dpr, 'right');
      tag(g, w / 2, 0, '', frame?.triggered ? CH_COLORS[view.trigSrc] : TEXT, dpr, 'top');
    }
  }
  if (cursor) cross(g, w, h, cursor, dpr);
}

// ---- analyzer

export const DB_TOP = 20;
export const DB_BOTTOM = -120;
export const F_MIN = 10;

export interface SpectrumView {
  fMax: number;
  sampleRate: number;
  ch: { on: boolean; power: Float64Array | null; hold: Float64Array | null }[];
}

export const freqAt = (x: number, fMax: number) => F_MIN * Math.pow(fMax / F_MIN, x);
export const dbAt = (y: number) => DB_TOP - y * (DB_TOP - DB_BOTTOM);

function spectrumPath(g: CanvasRenderingContext2D, w: number, h: number, power: Float64Array, view: SpectrumView) {
  const bins = power.length - 1;
  const hz = view.sampleRate / (bins * 2);
  const yOf = (p: number) => {
    const db = 10 * Math.log10(p + 1e-20);
    return Math.min(h + 2, ((DB_TOP - db) / (DB_TOP - DB_BOTTOM)) * h);
  };
  g.beginPath();
  for (let px = 0; px <= w; px++) {
    const k0 = freqAt(px / w, view.fMax) / hz;
    const k1 = freqAt((px + 1) / w, view.fMax) / hz;
    let p: number;
    if (k1 - k0 >= 1) {
      p = 0;
      for (let k = Math.ceil(k0); k < k1 && k <= bins; k++) if (power[k] > p) p = power[k];
    } else {
      // fewer bins than pixels: between the two nearest bins (in dB)
      const k = Math.floor(k0);
      const f = k0 - k;
      const a = 10 * Math.log10(power[Math.min(k, bins)] + 1e-20);
      const b = 10 * Math.log10(power[Math.min(k + 1, bins)] + 1e-20);
      p = Math.pow(10, (a + (b - a) * f) / 10);
    }
    if (px === 0) g.moveTo(px, yOf(p));
    else g.lineTo(px, yOf(p));
  }
}

export function drawSpectrum(canvas: HTMLCanvasElement, view: SpectrumView, cursor: Cursor | null) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);
  const xOf = (f: number) => (Math.log(f / F_MIN) / Math.log(view.fMax / F_MIN)) * w;

  // grid: decades (with 2 and 5) and every 20 dB
  g.lineWidth = 1;
  g.font = `${9 * dpr}px system-ui, sans-serif`;
  g.fillStyle = TEXT;
  g.textBaseline = 'bottom';
  g.textAlign = 'center';
  for (let decade = 10; decade < view.fMax * 10; decade *= 10) {
    for (const m of [1, 2, 5]) {
      const f = decade * m;
      if (f <= F_MIN || f >= view.fMax) continue;
      const x = Math.round(xOf(f)) + 0.5;
      g.strokeStyle = m === 1 ? GRID_AXIS : GRID;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
      g.fillText(f >= 1000 ? `${f / 1000}k` : String(f), x, h - 3 * dpr);
    }
  }
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  for (let db = DB_TOP; db >= DB_BOTTOM; db -= 20) {
    const y = Math.round(((DB_TOP - db) / (DB_TOP - DB_BOTTOM)) * h) + 0.5;
    g.strokeStyle = db === 0 ? GRID_AXIS : GRID;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
    if (db !== DB_TOP && db !== DB_BOTTOM) g.fillText(String(db), 4 * dpr, y - 6 * dpr);
  }

  for (const n of [1, 0]) {
    const c = view.ch[n];
    if (!c.on) continue;
    if (c.hold) {
      spectrumPath(g, w, h, c.hold, view);
      g.strokeStyle = CH_COLORS[n];
      g.globalAlpha = 0.4;
      g.lineWidth = dpr;
      g.stroke();
      g.globalAlpha = 1;
    }
    if (c.power) {
      spectrumPath(g, w, h, c.power, view);
      g.strokeStyle = CH_COLORS[n];
      g.lineWidth = 1.4 * dpr;
      g.stroke();
      g.lineTo(w, h + 2);
      g.lineTo(0, h + 2);
      g.closePath();
      g.fillStyle = CH_COLORS[n];
      g.globalAlpha = 0.08;
      g.fill();
      g.globalAlpha = 1;
    }
  }
  if (cursor) cross(g, w, h, cursor, dpr);
}
