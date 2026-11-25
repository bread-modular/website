'use client';

import type { GenChannel } from './engine';
import { fmtSet, fmtTime } from './format';
import s from './lab.module.css';

// A small picture of what a generator channel sends: two cycles, in volts,
// drawn against the output's range (the dashed lines), clipped where the jack clips.

const W = 180; // the box stretches to fit; the strokes keep their width
const H = 54;
const PAD = 4;
const POINTS = 240;
const CYCLES = 2;

// The wave at t (in cycles), from -1 to 1
function shape(g: GenChannel, t: number) {
  t -= Math.floor(t);
  switch (g.wave) {
    case 'triangle': return t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
    case 'saw': return 2 * t - 1;
    case 'square': return t < g.duty ? 1 : -1;
    case 'dc': return 0;
    default: return Math.sin(Math.PI * 2 * t);
  }
}

// The same noise every time, so the picture does not flicker
function noise(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// A log sweep across the box: about 1.5 cycles at the slow end, more at the fast end
function sweepCycles(g: GenChannel, x: number) {
  const r = Math.min(10, Math.max(0.1, g.sweepTo / g.freq));
  const c0 = r >= 1 ? 1.5 : 1.5 / r;
  if (Math.abs(r - 1) < 1e-3) return c0 * x;
  return (c0 * (Math.pow(r, x) - 1)) / Math.log(r);
}

export function WavePreview({ g, fs, color }: { g: GenChannel; fs: number; color: string }) {
  const top = fs * 1.12;
  const y = (v: number) => PAD + ((top - v) / (2 * top)) * (H - 2 * PAD);
  const amp = g.wave === 'dc' ? 0 : g.vpp / 2;
  const hi = Math.min(fs, g.offset + amp);
  const lo = Math.max(-fs, g.offset - amp);
  const clips = g.offset + amp > fs + 1e-6 || g.offset - amp < -fs - 1e-6;

  let d = '';
  const n = g.wave === 'noise' ? 90 : POINTS;
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    let v: number;
    if (g.wave === 'noise') v = noise(i);
    else if (g.wave === 'sweep') v = Math.sin(Math.PI * 2 * sweepCycles(g, x));
    else v = shape(g, x * CYCLES + g.phase / 360);
    const volts = Math.min(fs, Math.max(-fs, g.offset + amp * v));
    d += `${i ? 'L' : 'M'}${(x * W).toFixed(1)} ${y(volts).toFixed(1)}`;
  }

  const span = g.wave === 'noise' ? 'noise' : g.wave === 'sweep' ? `${fmtTime(g.sweepTime)} sweep` : g.wave === 'dc' ? 'DC' : `${fmtTime(CYCLES / g.freq)}`;

  return (
    <div className={s.wprev} aria-hidden>
      <svg height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line className={s.wzero} x1={0} x2={W} y1={y(0)} y2={y(0)} />
        <line className={clips ? s.wlimitHit : s.wlimit} x1={0} x2={W} y1={y(fs)} y2={y(fs)} />
        <line className={clips ? s.wlimitHit : s.wlimit} x1={0} x2={W} y1={y(-fs)} y2={y(-fs)} />
        <path className={s.wtrace} d={d} style={{ stroke: color }} />
      </svg>
      <div className={s.wcap}>
        <span>{span}</span>
        <span className={clips ? s.wclip : undefined}>
          {g.wave === 'dc' ? fmtSet(hi) : `${fmtSet(hi).replace(' V', '')} / ${fmtSet(lo)}`}
        </span>
      </div>
    </div>
  );
}
