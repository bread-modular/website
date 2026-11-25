// How the lab writes (and reads back) its numbers.

const trim = (n: number, digits: number) => n.toFixed(digits);

export function fmtHz(f: number) {
  if (!Number.isFinite(f)) return '—';
  if (f >= 1000) return `${trim(f / 1000, f >= 10000 ? 1 : 2)} kHz`;
  if (f >= 100) return `${trim(f, 0)} Hz`;
  if (f >= 10) return `${trim(f, 1)} Hz`;
  if (f >= 1) return `${trim(f, 2)} Hz`;
  return `${trim(f, 3)} Hz`;
}

// A volt reading: mV under 1 V
export function fmtV(v: number, signed = false) {
  if (!Number.isFinite(v)) return '—';
  const sign = signed && v > 0 ? '+' : v < 0 ? '−' : '';
  const a = Math.abs(v);
  if (a < 0.9995) return `${sign}${trim(a * 1000, a < 0.0995 ? 1 : 0)} mV`;
  return `${sign}${trim(a, a < 9.995 ? 3 : 2)} V`;
}

// A set voltage: always in volts, signed
export function fmtSet(v: number, digits = 2) {
  const a = Math.abs(v);
  const sign = a < 0.5 * 10 ** -digits ? '' : v > 0 ? '+' : '−';
  return `${sign}${a.toFixed(digits)} V`;
}

export function fmtDiv(v: number) {
  return v < 1 ? `${Math.round(v * 1000)} mV` : `${v} V`;
}

export function fmtTime(t: number) {
  const a = Math.abs(t);
  if (a >= 1) return `${+t.toFixed(3)} s`;
  if (a >= 0.001) return `${+(t * 1000).toFixed(3)} ms`;
  return `${+(t * 1e6).toFixed(1)} µs`;
}

// Reads "2.5k", "2.5 kHz", "440", "500m", "-1.2 V", "300 mV"
export function parseNum(text: string) {
  const m = text.trim().replace(',', '.').replace('−', '-').match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*([kmµu]?)/i);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  const p = m[2];
  if (p === 'k' || p === 'K') return n * 1000;
  if (p === 'm') return n / 1000;
  if (p === 'µ' || p === 'u') return n / 1e6;
  return n;
}
