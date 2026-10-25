export type TriggerMode = 'off' | 'auto' | 'normal';
export type TriggerEdge = 'rising' | 'falling';
export type ScopeStatus = 'RUN' | "TRIG'D" | 'AUTO' | 'WAIT' | 'STOP';

/** Both buffers always share the same absolute sample origin, start and trigger index. */
export interface ScopeFrame {
  buf: number[];
  secondary?: number[];
  start: number;
  trigIndex: number;
}
export interface FrozenScopeFrame {
  buf: number[];
  secondary?: number[];
  anchor: number;
  trigIndex: number;
}

const HYSTERESIS = 0.04;
const AUTO_TIMEOUT_MS = 200;

export function findTrigger(buf: number[], level: number, edge: TriggerEdge, from: number, to: number): number {
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

export function freezeScopeFrame(frame: ScopeFrame, preSamples: number): FrozenScopeFrame {
  return {
    buf: [...frame.buf],
    secondary: frame.secondary ? [...frame.secondary] : undefined,
    anchor: frame.start + preSamples,
    trigIndex: frame.trigIndex,
  };
}

export function buildScopeCapture(input: {
  data: number[];
  secondaryData?: number[];
  total: number;
  windowSamples: number;
  preSamples: number;
  sampleIntervalMs: number;
  mode: TriggerMode;
  edge: TriggerEdge;
  level: number;
  triggerSource: 0 | 1;
  armedAt: number | null;
  frozen: FrozenScopeFrame | null;
  previousFrame: ScopeFrame | null;
  lastTrigger: ScopeFrame | null;
}): { frame: ScopeFrame | null; status: ScopeStatus; triggered?: ScopeFrame; captured?: FrozenScopeFrame } {
  const { data, total, windowSamples, preSamples, sampleIntervalMs, mode, edge, level, armedAt, frozen } = input;
  if (frozen) return {
    frame: { buf: frozen.buf, secondary: frozen.secondary, start: frozen.anchor - preSamples, trigIndex: frozen.trigIndex },
    status: 'STOP',
  };
  if (!data.length) return { frame: null, status: 'RUN' };
  // Never display an unpaired secondary buffer, even from a misbehaving caller.
  const secondary = input.secondaryData?.length === data.length ? input.secondaryData : undefined;
  const source = input.triggerSource === 1 && secondary ? secondary : data;
  const len = data.length;
  const single = armedAt !== null;
  const live: ScopeFrame = { buf: data, secondary, start: len - windowSamples, trigIndex: -1 };
  if (mode === 'off' && !single) return { frame: live, status: 'RUN' };
  const postSamples = windowSamples - preSamples;
  const firstAbs = total - len;
  let from = 1;
  if (single) from = Math.max(1, armedAt - firstAbs);
  else if (mode === 'auto') from = len - postSamples - windowSamples - Math.round(AUTO_TIMEOUT_MS / sampleIntervalMs);
  const t = findTrigger(source, level, edge, from, len - 1 - postSamples);
  if (t !== -1) {
    const frame: ScopeFrame = { buf: data, secondary, start: t - preSamples, trigIndex: t };
    return {
      frame, triggered: frame, status: single ? 'STOP' : "TRIG'D",
      ...(single ? { captured: freezeScopeFrame(frame, preSamples) } : {}),
    };
  }
  if (mode === 'auto' && !single) return { frame: live, status: 'AUTO' };
  // Hold the ENTIRE previous capture, never combine old A1 with newly arrived A2.
  return { frame: single ? input.previousFrame : input.lastTrigger, status: 'WAIT' };
}
