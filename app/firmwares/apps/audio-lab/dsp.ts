// The lab's maths: trigger search, measurements and the spectrum.

import { MASK } from './engine';

// Finds the last trigger (rising or falling through level, with hysteresis) in
// frames [from, to) of a ring. Returns the crossing with its fraction, or -1.
export function findTrigger(ring: Float32Array, from: number, to: number, level: number, rising: boolean, hysteresis: number) {
  let armed = false;
  let found = -1;
  for (let n = from; n < to; n++) {
    const x = ring[n & MASK];
    if (rising) {
      if (x < level - hysteresis) armed = true;
      else if (armed && x >= level) {
        const prev = ring[(n - 1) & MASK];
        found = n - 1 + (x === prev ? 1 : (level - prev) / (x - prev));
        armed = false;
      }
    } else if (x > level + hysteresis) armed = true;
    else if (armed && x <= level) {
      const prev = ring[(n - 1) & MASK];
      found = n - 1 + (x === prev ? 1 : (prev - level) / (prev - x));
      armed = false;
    }
  }
  return found;
}

export interface Measures {
  min: number;
  max: number;
  mean: number;
  rms: number;
  freq: number; // Hz, NaN when there is no steady cycle
}

export function measure(data: Float32Array, sampleRate: number): Measures {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sq = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    if (x < min) min = x;
    if (x > max) max = x;
    sum += x;
    sq += x * x;
  }
  const n = data.length || 1;
  const mean = sum / n;
  return { min, max, mean, rms: Math.sqrt(sq / n), freq: frequency(data, sampleRate, min, max) };
}

// Counts the rising crossings of the middle level (with 10 % hysteresis) and
// times the whole cycles between the first and the last.
function frequency(data: Float32Array, sampleRate: number, min: number, max: number) {
  const pp = max - min;
  if (!(pp > 0.02)) return NaN;
  const mid = (max + min) / 2;
  const h = pp * 0.1;
  let armed = false;
  let first = -1;
  let last = -1;
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const x = data[i];
    if (x < mid - h) armed = true;
    else if (armed && x >= mid) {
      const prev = data[i - 1];
      const t = i - 1 + (x === prev ? 1 : (mid - prev) / (x - prev));
      if (first < 0) first = t;
      last = t;
      count++;
      armed = false;
    }
  }
  if (count < 2) return NaN;
  return sampleRate * (count - 1) / (last - first);
}

// ---- spectrum

const twiddles = new Map<number, { cos: Float64Array; sin: Float64Array; rev: Uint32Array; win: Float64Array; winSum: number }>();

function tables(n: number) {
  let t = twiddles.get(n);
  if (t) return t;
  const bits = Math.log2(n);
  const cos = new Float64Array(n / 2);
  const sin = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / n);
    sin[i] = -Math.sin((2 * Math.PI * i) / n);
  }
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  // Hann window
  const win = new Float64Array(n);
  let winSum = 0;
  for (let i = 0; i < n; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    winSum += win[i];
  }
  t = { cos, sin, rev, win, winSum };
  twiddles.set(n, t);
  return t;
}

// Power spectrum in Vrms² per bin (a sine reads its own level at its peak),
// bins 0..n/2. Input: the last n samples, in volts.
export function powerSpectrum(data: Float32Array, out: Float64Array) {
  const n = data.length;
  const { cos, sin, rev, win, winSum } = tables(n);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[rev[i]] = data[i] * win[i];
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let j = 0; j < half; j++) {
        const wr = cos[j * step];
        const wi = sin[j * step];
        const a = start + j;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
  // peak amplitude = 2 |X| / sum(w); rms² = peak² / 2
  const scale = 2 / (winSum * winSum);
  for (let k = 0; k <= n / 2; k++) out[k] = (re[k] * re[k] + im[k] * im[k]) * scale;
  out[0] /= 4; // DC: no mirror bin, and no rms factor
  return out;
}

export interface Peak {
  freq: number;
  dbv: number;
  thd: number; // %, NaN when the fundamental is too low
}

const dbv = (power: number) => 10 * Math.log10(power + 1e-20);

// The strongest tone above 10 Hz, with its THD (harmonics 2 to 10)
export function findPeak(power: Float64Array, sampleRate: number): Peak {
  const bins = power.length - 1;
  const n = bins * 2;
  const hz = sampleRate / n;
  let k0 = Math.max(3, Math.ceil(10 / hz));
  let best = k0;
  for (let k = k0; k < bins; k++) if (power[k] > power[best]) best = k;
  k0 = best;
  // parabolic interpolation on the dB values
  const a = dbv(power[k0 - 1]);
  const b = dbv(power[k0]);
  const c = dbv(power[Math.min(k0 + 1, bins)]);
  const d = a - 2 * b + c;
  const shift = d >= 0 ? 0 : Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / d));
  const freq = (k0 + shift) * hz;
  // a Hann tone spreads over about 3 bins each side
  const band = (k: number) => {
    let sum = 0;
    for (let i = Math.max(1, k - 3); i <= Math.min(bins, k + 3); i++) sum += power[i];
    return sum;
  };
  const fund = band(k0);
  let thd = NaN;
  if (dbv(power[k0]) > -60) {
    let harm = 0;
    for (let h = 2; h <= 10; h++) {
      const k = Math.round(((k0 + shift) * h));
      if (k + 3 > bins) break;
      harm += band(k);
    }
    thd = 100 * Math.sqrt(harm / fund);
    if (thd > 100) thd = NaN; // no clear fundamental: noise
  }
  return { freq, dbv: dbv(fund / 1.5), thd };
}

export { dbv };
