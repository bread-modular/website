'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LabEngine, RING, type GenChannel, type Levels, type Wave } from './engine';
import { findPeak, findTrigger, measure, powerSpectrum, type Measures, type Peak } from './dsp';
import { CH_COLORS, DIVS_X, DIVS_Y, dbAt, drawScope, drawSpectrum, freqAt, type Cursor, type ScopeFrame } from './draw';
import { Knob, Seg, Stepper, Toggle } from './controls';
import { WavePreview } from './preview';
import { fmtDiv, fmtHz, fmtSet, fmtTime, fmtV, parseNum } from './format';
import s from './lab.module.css';

// The Audio Lab: a two channel oscilloscope, a function generator and a
// spectrum analyzer on any audio interface, made for the USB Audio module
// (2 in, 2 out, DC coupled, ±5 V). It runs in the browser with Web Audio.

const TIME_DIVS = [50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3, 100e-3, 200e-3, 500e-3, 1] as const;
const V_DIVS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5] as const;
const FFT_SIZES = [2048, 4096, 8192, 16384, 32768] as const;
const AVERAGES = [1, 4, 16] as const;
const WAVES: Wave[] = ['sine', 'triangle', 'saw', 'square', 'noise', 'sweep', 'dc'];
const WAVE_LABELS: Partial<Record<Wave, string>> = { sine: 'Sine', triangle: 'Tri', saw: 'Saw', square: 'Square', noise: 'Noise', sweep: 'Sweep', dc: 'DC' };
// from 200 ms/div the screen rolls (no trigger), like a bench scope
const ROLL_FROM = 0.2;

// Full scale at the jacks of the USB Audio module, its pots fully up
const MODULE_LEVELS: Levels = { inFS: 5.54, outFS: 5.29 };
const PREFS_KEY = 'bread-modular-audio-lab';
const MODULE_NAME = /bread modular/i;

type Mode = 'auto' | 'normal' | 'single';

interface ScopeSettings {
  run: boolean;
  mode: Mode;
  xy: boolean;
  timeDiv: number;
  ch: { on: boolean; vdiv: number; pos: number }[];
  trig: { src: number; rising: boolean; level: number };
}

interface FftSettings {
  size: number;
  avg: number;
  hold: boolean;
  freeze: boolean;
  full: boolean; // up to Nyquist, not 20 kHz
  ch: boolean[];
}

interface Prefs extends Levels {
  inputId: string;
  outputId: string;
}

interface Readout {
  m: (Measures | null)[];
  peaks: (Peak | null)[];
  dc: number[];
  scopeCursor: string;
  fftCursor: string;
}

const DEFAULT_GEN: GenChannel = { on: false, wave: 'sine', freq: 440, vpp: 5, offset: 0, duty: 0.5, phase: 0, sweepTo: 20000, sweepTime: 5 };

const EMPTY_READOUT: Readout = { m: [null, null], peaks: [null, null], dc: [NaN, NaN], scopeCursor: '', fftCursor: '' };

type Status = { kind: 'idle' | 'busy' | 'live' | 'demo' | 'error'; text: string };

// Keeps a canvas at its box's size in device pixels
function useCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);
  return ref;
}

// The pointer over a canvas, 0..1 both ways
function cursorOf(e: React.PointerEvent<HTMLCanvasElement>): Cursor {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}

function errorText(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError') return 'The browser may not use the audio input. Allow the microphone for this site (in the address bar) and press Connect again.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No audio input found. Plug the module into this computer and press Connect again.';
  if (name === 'NotReadableError') return 'The audio input is busy or could not be opened. Close other apps that use it and try again.';
  return `Could not start the audio: ${(error as Error)?.message ?? error}`;
}

export default function AudioLab({ className }: { className?: string }) {
  const [engine, setEngine] = useState<LabEngine | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: 'Not connected' });
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ inputId: '', outputId: '', ...MODULE_LEVELS });
  const [devices, setDevices] = useState<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }>({ inputs: [], outputs: [] });
  const [canPickOutput, setCanPickOutput] = useState(true);
  const [gen, setGen] = useState<GenChannel[]>([DEFAULT_GEN, { ...DEFAULT_GEN, wave: 'square', freq: 220 }]);
  const [scope, setScope] = useState<ScopeSettings>({
    run: true, mode: 'auto', xy: false, timeDiv: 1e-3,
    ch: [{ on: true, vdiv: 2, pos: 0 }, { on: true, vdiv: 2, pos: 0 }],
    trig: { src: 0, rising: true, level: 0 },
  });
  const [fft, setFft] = useState<FftSettings>({ size: 8192, avg: 4, hold: false, freeze: false, full: false, ch: [true, true] });
  const [readout, setReadout] = useState<Readout>(EMPTY_READOUT);
  const [narrow, setNarrow] = useState(false);

  const engineRef = useRef<LabEngine | null>(null);
  const scopeRef = useRef(scope);
  const fftRef = useRef(fft);
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeCanvas = useCanvas();
  const fftCanvas = useCanvas();
  const scopeCursor = useRef<Cursor | null>(null);
  const fftCursor = useRef<Cursor | null>(null);
  const holdReset = useRef(false);

  useEffect(() => { scopeRef.current = scope; }, [scope]);
  useEffect(() => { fftRef.current = fft; }, [fft]);
  useEffect(() => { engineRef.current = engine; }, [engine]);

  // Saved devices and levels
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (saved) setPrefs(p => ({ ...p, ...saved }));
    } catch { /* nothing saved */ }
    setCanPickOutput(typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype);
  }, []);
  const savePrefs = useCallback((next: Partial<Prefs>) => {
    setPrefs(p => {
      const merged = { ...p, ...next };
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(merged)); } catch { /* private mode */ }
      return merged;
    });
  }, []);

  // Narrow box (phones, a small window): one column that scrolls
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => setNarrow(root.clientWidth < 900));
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const listDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return { inputs: [], outputs: [] };
    const all = await navigator.mediaDevices.enumerateDevices();
    const list = {
      inputs: all.filter(d => d.kind === 'audioinput' && d.deviceId),
      outputs: all.filter(d => d.kind === 'audiooutput' && d.deviceId),
    };
    setDevices(list);
    return list;
  }, []);

  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = () => { void listDevices(); };
    md.addEventListener('devicechange', onChange);
    return () => md.removeEventListener('devicechange', onChange);
  }, [listDevices]);

  // Closes the engine when the page goes
  useEffect(() => () => engineRef.current?.close(), []);

  const stop = useCallback(() => {
    engineRef.current?.close();
    engineRef.current = null;
    setEngine(null);
    setStatus({ kind: 'idle', text: 'Not connected' });
    setReadout(EMPTY_READOUT);
  }, []);

  const start = useCallback(async (demo: boolean, pick?: { inputId?: string; outputId?: string }) => {
    engineRef.current?.close();
    engineRef.current = null;
    setEngine(null);
    setNote(null);
    setStatus({ kind: 'busy', text: demo ? 'Starting the demo…' : 'Connecting…' });
    const levels = { inFS: prefs.inFS, outFS: prefs.outFS };
    try {
      if (demo) {
        const e = await LabEngine.open({ demo: true, levels });
        // something to look at: both outputs on, patched into the inputs
        setGen(g => (g.some(c => c.on) ? g : g.map(c => ({ ...c, on: true }))));
        engineRef.current = e;
        setEngine(e);
        setStatus({ kind: 'demo', text: 'Demo: OUT 1 → IN 1, OUT 2 → IN 2' });
        setNote({ text: 'Demo mode: the generator is patched into the scope inside the page, with a little noise. Nothing plays on your speakers.' });
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('this browser has no audio input access here (it needs HTTPS)');
      let inputId = pick?.inputId ?? prefs.inputId;
      let outputId = pick?.outputId ?? prefs.outputId;
      let list = await listDevices();
      // the browser names the devices only after the first permission: open, look, reopen on the module
      if (!list.inputs.some(d => d.label)) {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach(t => t.stop());
        list = await listDevices();
      }
      const moduleIn = list.inputs.find(d => MODULE_NAME.test(d.label));
      if (!list.inputs.some(d => d.deviceId === inputId)) inputId = moduleIn?.deviceId ?? '';
      if (!list.outputs.some(d => d.deviceId === outputId)) {
        const chosen = list.inputs.find(d => d.deviceId === inputId);
        const moduleOut = list.outputs.find(d => MODULE_NAME.test(d.label))
          ?? list.outputs.find(d => chosen && d.groupId === chosen.groupId);
        outputId = moduleOut?.deviceId ?? '';
      }
      const e = await LabEngine.open({ demo: false, inputId: inputId || undefined, outputId: outputId || undefined, levels });
      // no choice yet: the browser's default, by its real id
      if (!inputId && e.inputId) inputId = e.inputId;
      const input = list.inputs.find(d => d.deviceId === inputId);
      savePrefs({ inputId, outputId });
      // a new link starts with the outputs off
      setGen(g => g.map(c => ({ ...c, on: false })));
      engineRef.current = e;
      setEngine(e);
      const name = input?.label || 'the default input';
      setStatus({ kind: 'live', text: `Connected · ${name}` });
      if (e.inputChannels < 2) setNote({ text: `${name} gives one channel only: IN 2 stays silent.`, error: true });
      else if (input && !MODULE_NAME.test(input.label)) setNote({ text: 'This is not the USB Audio module: the volts assume its levels. Set the full scale of your interface under Levels.' });
    } catch (error) {
      setStatus({ kind: 'error', text: 'Not connected' });
      setNote({ text: errorText(error), error: true });
    }
  }, [prefs, listDevices, savePrefs]);

  useEffect(() => {
    engine?.setLevels({ inFS: prefs.inFS, outFS: prefs.outFS });
  }, [engine, prefs.inFS, prefs.outFS]);

  // The generator follows its settings (after the levels: they scale it)
  useEffect(() => {
    if (!engine) return;
    gen.forEach((g, n) => engine.setGen(n, g));
  }, [engine, gen, prefs.outFS]);

  // ---- the drawing loop: scope, analyzer and the readings
  useEffect(() => {
    let frame: ScopeFrame | null = null;
    let lastTrigger = 0;
    let lastReadout = 0;
    let tick = 0;
    let raf = 0;
    const spectra: { power: Float64Array | null; hold: Float64Array | null; size: number; rate: number }[] = [0, 1].map(() => ({ power: null, hold: null, size: 0, rate: 0 }));
    let fftData = new Float32Array(0);
    let measureData = new Float32Array(0);
    let lastEngine: LabEngine | null = null;

    const capture = (e: LabEngine, start: number, span: number, triggered: boolean, roll: boolean) => {
      const i0 = Math.floor(start);
      const len = Math.ceil(span) + 2;
      const a = frame?.a.length === len ? frame.a : new Float32Array(len);
      const b = frame?.b.length === len ? frame.b : new Float32Array(len);
      e.read(0, i0, a);
      e.read(1, i0, b);
      return { a, b, frac: start - i0, span, triggered, roll, filled: e.written };
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      tick++;
      const e = engineRef.current;
      const S = scopeRef.current;
      const F = fftRef.current;
      if (e !== lastEngine) {
        frame = null;
        lastEngine = e;
        for (const sp of spectra) { sp.power = null; sp.hold = null; }
      }

      // scope
      if (e && S.run && e.written > 0) {
        const sr = e.sampleRate;
        const span = Math.min(S.timeDiv * DIVS_X * sr, RING / 2);
        if (S.xy || S.timeDiv >= ROLL_FROM) {
          frame = capture(e, e.written - span, span, false, !S.xy);
        } else {
          const pre = span / 2;
          const to = e.written - Math.ceil(span - pre);
          const from = Math.max(to - Math.max(span, sr * 0.25), e.written - RING + 2, 1);
          const c = S.ch[S.trig.src];
          const t = to > from ? findTrigger(e.ring[S.trig.src], from, to, S.trig.level, S.trig.rising, Math.max(0.004, c.vdiv * 0.05)) : -1;
          if (t >= 0) {
            frame = capture(e, t - pre, span, true, false);
            lastTrigger = now;
            if (S.mode === 'single') setScope(v => ({ ...v, run: false }));
          } else if (S.mode === 'auto' && now - lastTrigger > Math.max(150, (span / sr) * 1500)) {
            frame = capture(e, e.written - span, span, false, false);
          } else if (frame && !frame.triggered && S.mode !== 'auto') {
            frame = null;
          }
        }
      }
      const sc = scopeCanvas.current;
      if (sc) {
        drawScope(sc, frame, {
          ch: S.ch, trigSrc: S.trig.src, trigLevel: S.trig.level,
          showTrigger: !S.xy && S.timeDiv < ROLL_FROM, xy: S.xy,
        }, scopeCursor.current);
      }

      // analyzer, every other frame
      if (tick % 2 === 0) {
        const sr = e?.sampleRate ?? 48000;
        if (e && !F.freeze && e.written >= F.size) {
          if (fftData.length !== F.size) fftData = new Float32Array(F.size);
          for (let n = 0; n < 2; n++) {
            const sp = spectra[n];
            if (!F.ch[n]) continue;
            if (sp.size !== F.size || sp.rate !== sr) {
              sp.power = null;
              sp.hold = null;
              sp.size = F.size;
              sp.rate = sr;
            }
            const p = powerSpectrum(e.read(n, e.written - F.size, fftData), new Float64Array(F.size / 2 + 1));
            if (!sp.power || F.avg <= 1) sp.power = p;
            else {
              const k = 1 / F.avg;
              for (let i = 0; i < p.length; i++) sp.power[i] += (p[i] - sp.power[i]) * k;
            }
            if (holdReset.current || !F.hold) sp.hold = null;
            if (F.hold) {
              if (!sp.hold) sp.hold = Float64Array.from(sp.power);
              else for (let i = 0; i < p.length; i++) if (sp.power[i] > sp.hold[i]) sp.hold[i] = sp.power[i];
            }
          }
          holdReset.current = false;
        }
        const fMax = F.full ? sr / 2 : Math.min(20000, sr / 2);
        const fc = fftCanvas.current;
        if (fc) {
          drawSpectrum(fc, {
            fMax, sampleRate: sr,
            ch: spectra.map((sp, n) => ({ on: F.ch[n], power: sp.power, hold: F.hold ? sp.hold : null })),
          }, fftCursor.current);
        }
      }

      // readings, five times a second
      if (now - lastReadout > 200) {
        lastReadout = now;
        const sr = e?.sampleRate ?? 48000;
        const m: (Measures | null)[] = [null, null];
        const dc = [NaN, NaN];
        if (e && frame) {
          const n0 = Math.max(0, Math.floor(frame.frac));
          const n1 = Math.min(frame.a.length, Math.ceil(frame.frac + frame.span));
          const filled = frame.roll ? Math.min(frame.filled, n1 - n0) : n1 - n0;
          for (let n = 0; n < 2; n++) {
            const data = (n === 0 ? frame.a : frame.b).subarray(n1 - filled, n1);
            if (filled > 1) m[n] = measure(data, sr);
          }
          // the frequency over at least half a second, while it runs
          if (S.run) {
            const len = Math.min(e.written, Math.max(filled, Math.round(sr * 0.5)), RING / 2);
            if (measureData.length !== len) measureData = new Float32Array(len);
            for (let n = 0; n < 2; n++) {
              const mn = m[n];
              if (mn) mn.freq = measure(e.read(n, e.written - len, measureData), sr).freq;
            }
          }
        }
        if (e && e.written > 0) {
          // the voltmeter: the mean of the last 100 ms
          const len = Math.min(e.written, Math.round(sr * 0.1));
          const buf = new Float32Array(len);
          for (let n = 0; n < 2; n++) {
            e.read(n, e.written - len, buf);
            let sum = 0;
            for (let i = 0; i < len; i++) sum += buf[i];
            dc[n] = sum / len;
          }
        }
        const peaks = spectra.map((sp, n) => (e && F.ch[n] && sp.power ? findPeak(sp.power, sr) : null));

        // cursor readings
        let scopeText = '';
        const c = scopeCursor.current;
        if (c && !S.xy) {
          const t = (c.x - (S.timeDiv < ROLL_FROM ? 0.5 : 1)) * S.timeDiv * DIVS_X;
          const parts = [`t ${t >= 0 ? '+' : ''}${fmtTime(t)}`];
          S.ch.forEach((ch, n) => {
            if (ch.on) parts.push(`${n + 1}: ${fmtV((0.5 - c.y) * DIVS_Y * ch.vdiv - ch.pos, true)}`);
          });
          scopeText = parts.join('   ');
        } else if (c) {
          const [c1, c2] = S.ch;
          scopeText = `1: ${fmtV((c.x - 0.5) * DIVS_X * c1.vdiv - c1.pos, true)}   2: ${fmtV((0.5 - c.y) * DIVS_Y * c2.vdiv - c2.pos, true)}`;
        }
        let fftText = '';
        const fcur = fftCursor.current;
        if (fcur) {
          const fMax = F.full ? sr / 2 : Math.min(20000, sr / 2);
          fftText = `${fmtHz(freqAt(fcur.x, fMax))}   ${dbAt(fcur.y).toFixed(1)} dBV`;
        }
        setReadout({ m, peaks, dc, scopeCursor: scopeText, fftCursor: fftText });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [scopeCanvas, fftCanvas]);

  // ---- setters
  const setCh = (n: number, next: Partial<ScopeSettings['ch'][number]>) =>
    setScope(v => ({ ...v, ch: v.ch.map((c, i) => (i === n ? { ...c, ...next } : c)) }));
  const setTrig = (next: Partial<ScopeSettings['trig']>) => setScope(v => ({ ...v, trig: { ...v.trig, ...next } }));
  const setGenCh = (n: number, next: Partial<GenChannel>) => setGen(g => g.map((c, i) => (i === n ? { ...c, ...next } : c)));

  const sr = engine?.sampleRate ?? 48000;
  const fMax = Math.floor(Math.min(sr * 0.45, 96000));
  const live = !!engine;
  const busy = status.kind === 'busy';
  const roll = scope.timeDiv >= ROLL_FROM;

  const statusClass = status.kind === 'live' || status.kind === 'demo' ? s.on : status.kind === 'error' ? s.warn : '';

  return (
    <div ref={rootRef} className={`${s.root} ${narrow ? s.narrow : ''} ${className ?? ''}`}>
      <div className={s.app}>
        <div className={s.main}>
          {/* ---- oscilloscope */}
          <section className={`${s.panel} ${s.scope}`} aria-label="Oscilloscope">
            <header className={s.phead}>
              <span className={s.pname}>SCOPE</span>
              <span className={s.psub}>IN 1 · IN 2</span>
              <span className={s.sp} />
              <Seg options={['auto', 'normal', 'single'] as Mode[]} value={scope.mode} labels={{ auto: 'Auto', normal: 'Normal', single: 'Single' }}
                disabled={roll || scope.xy}
                title="Auto: runs free when nothing triggers. Normal: waits for the trigger. Single: one capture, then stops."
                onChange={mode => setScope(v => ({ ...v, mode, run: true }))} />
              <Toggle on={scope.xy} onChange={xy => setScope(v => ({ ...v, xy }))} title="IN 1 across, IN 2 up">XY</Toggle>
              <button type="button" className={`${s.tg} ${scope.run ? s.running : s.stopped}`} onClick={() => setScope(v => ({ ...v, run: !v.run }))}
                title={scope.run ? 'Freeze the screen' : 'Run again'}>
                {scope.run ? 'RUN' : 'STOP'}
              </button>
            </header>
            <div className={s.pbody}>
              <div className={s.screen}>
                <canvas
                  ref={scopeCanvas}
                  className={s.canvas}
                  onPointerMove={e => { scopeCursor.current = cursorOf(e); }}
                  onPointerLeave={() => { scopeCursor.current = null; }}
                />
                <div className={s.scale}>
                  {scope.xy ? (
                    <span>XY · {fmtTime(scope.timeDiv * DIVS_X)}</span>
                  ) : (
                    <span>{fmtTime(scope.timeDiv)}/div{roll ? ' · roll' : ''}</span>
                  )}
                  {scope.ch.map((c, n) => c.on && (
                    <span key={n} style={{ color: CH_COLORS[n] }}>{n + 1} · {fmtDiv(c.vdiv)}/div</span>
                  ))}
                </div>
                <div className={s.readout}>{readout.scopeCursor}</div>
              </div>
              <div className={s.controls}>
                <div className={s.card}>
                  <h5>Horizontal</h5>
                  <Stepper label="Time / div" options={TIME_DIVS} value={scope.timeDiv as typeof TIME_DIVS[number]} format={fmtTime}
                    onChange={timeDiv => setScope(v => ({ ...v, timeDiv }))} />
                </div>
                <div className={`${s.card} ${roll || scope.xy ? s.dim : ''}`}>
                  <h5>Trigger</h5>
                  <div className={s.row}>
                    <Seg options={[0, 1]} value={scope.trig.src} labels={{ 0: 'IN 1', 1: 'IN 2' }} onChange={src => setTrig({ src })} />
                    <Seg options={['rise', 'fall']} value={scope.trig.rising ? 'rise' : 'fall'} labels={{ rise: '↗', fall: '↘' }}
                      onChange={v => setTrig({ rising: v === 'rise' })} title="Rising or falling edge" />
                  </div>
                  <Knob label="Level" value={scope.trig.level} min={-6} max={6} bipolar defaultValue={0}
                    format={v => fmtSet(v)} parse={parseNum} round={v => Math.round(v * 100) / 100}
                    onChange={level => setTrig({ level })} title={`Trigger level on IN ${scope.trig.src + 1}`} />
                </div>
                {scope.ch.map((c, n) => (
                  <div key={n} className={s.card}>
                    <h5>
                      <button type="button" className={`${s.pwr} ${c.on ? s.on : ''}`} style={{ '--c': CH_COLORS[n] } as React.CSSProperties}
                        aria-pressed={c.on} aria-label={`Show IN ${n + 1}`} onClick={() => setCh(n, { on: !c.on })} />
                      <span style={{ color: c.on ? CH_COLORS[n] : undefined }}>IN {n + 1}</span>
                    </h5>
                    <div className={`${s.row} ${c.on ? '' : s.dim}`}>
                      <Stepper label="V / div" options={V_DIVS} value={c.vdiv as typeof V_DIVS[number]} format={fmtDiv}
                        onChange={vdiv => setCh(n, { vdiv })} />
                      <Knob label="Position" value={c.pos} min={-10} max={10} bipolar defaultValue={0}
                        format={v => fmtSet(v)} parse={parseNum} round={v => Math.round(v * 100) / 100}
                        onChange={pos => setCh(n, { pos })} title="Moves the trace up or down (in volts)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <footer className={s.measures}>
              {[0, 1].map(n => {
                const m = readout.m[n];
                return (
                  <div key={n} className={`${s.mrow} ${scope.ch[n].on ? '' : s.dim}`}>
                    <span className={s.mch} style={{ color: CH_COLORS[n] }}>IN {n + 1}</span>
                    <span><i>Freq</i>{m ? fmtHz(m.freq) : '—'}</span>
                    <span><i>Vpp</i>{m ? fmtV(m.max - m.min) : '—'}</span>
                    <span><i>Max</i>{m ? fmtV(m.max, true) : '—'}</span>
                    <span><i>Min</i>{m ? fmtV(m.min, true) : '—'}</span>
                    <span><i>Mean</i>{m ? fmtV(m.mean, true) : '—'}</span>
                    <span><i>RMS</i>{m ? fmtV(m.rms) : '—'}</span>
                  </div>
                );
              })}
            </footer>
          </section>

          {/* ---- spectrum analyzer */}
          <section className={`${s.panel} ${s.fft}`} aria-label="Spectrum analyzer">
            <header className={s.phead}>
              <span className={s.pname}>ANALYZER</span>
              <span className={s.psub}>dBV</span>
              <span className={s.sp} />
              {[0, 1].map(n => (
                <Toggle key={n} on={fft.ch[n]} className={s.chtg} style={{ '--c': CH_COLORS[n] } as React.CSSProperties} onChange={on => setFft(v => ({ ...v, ch: v.ch.map((c, i) => (i === n ? on : c)) }))}
                  title={`Show IN ${n + 1}`}>
                  {n + 1}
                </Toggle>
              ))}
              <Toggle on={fft.freeze} onChange={freeze => setFft(v => ({ ...v, freeze }))} title="Freeze the spectrum">HOLD</Toggle>
            </header>
            <div className={s.screen}>
              <canvas
                ref={fftCanvas}
                className={s.canvas}
                onPointerMove={e => { fftCursor.current = cursorOf(e); }}
                onPointerLeave={() => { fftCursor.current = null; }}
              />
              <div className={s.readout}>{readout.fftCursor}</div>
            </div>
            <div className={s.fftbar}>
              <label><span>FFT</span>
                <Seg options={FFT_SIZES} value={fft.size as typeof FFT_SIZES[number]} labels={{ 2048: '2k', 4096: '4k', 8192: '8k', 16384: '16k', 32768: '32k' }}
                  onChange={size => setFft(v => ({ ...v, size }))} title={`Points per transform: ${fmtHz(sr / fft.size)} per bin`} />
              </label>
              <label><span>Avg</span>
                <Seg options={AVERAGES} value={fft.avg as typeof AVERAGES[number]} labels={{ 1: 'Off', 4: '4', 16: '16' }} onChange={avg => setFft(v => ({ ...v, avg }))} />
              </label>
              <label><span>Range</span>
                <Seg options={['audio', 'full']} value={fft.full ? 'full' : 'audio'} labels={{ audio: '20k', full: fmtHz(sr / 2).replace(' ', '') }}
                  onChange={r => setFft(v => ({ ...v, full: r === 'full' }))} />
              </label>
              <Toggle on={fft.hold} onChange={hold => { holdReset.current = true; setFft(v => ({ ...v, hold })); }} title="Keep the highest level of every bin (filter sweeps)">Peak hold</Toggle>
            </div>
            <footer className={s.measures}>
              {[0, 1].map(n => {
                const p = readout.peaks[n];
                return (
                  <div key={n} className={`${s.mrow} ${fft.ch[n] ? '' : s.dim}`}>
                    <span className={s.mch} style={{ color: CH_COLORS[n] }}>IN {n + 1}</span>
                    <span><i>Peak</i>{p ? fmtHz(p.freq) : '—'}</span>
                    <span><i>Level</i>{p ? `${p.dbv.toFixed(1)} dBV` : '—'}</span>
                    <span><i>THD</i>{p && Number.isFinite(p.thd) ? `${p.thd < 0.1 ? p.thd.toFixed(3) : p.thd.toFixed(2)} %` : '—'}</span>
                  </div>
                );
              })}
            </footer>
          </section>

          {/* ---- function generator */}
          <section className={`${s.panel} ${s.gen}`} aria-label="Function generator">
            <header className={s.phead}>
              <span className={s.pname}>GENERATOR</span>
              <span className={s.psub}>OUT 1 · OUT 2{engine?.demo ? ' (patched to IN 1 · IN 2)' : ''}</span>
              <span className={s.sp} />
              <button type="button" className={s.tg} onClick={() => engine?.sync()} disabled={!live}
                title="Starts both outputs from the top of their cycle, so their phases line up">Sync phase</button>
            </header>
            <div className={s.genbody}>
              {gen.map((g, n) => {
                const clips = g.wave !== 'dc' && g.vpp / 2 + Math.abs(g.offset) > prefs.outFS + 1e-6;
                return (
                  <div key={n} className={`${s.gch} ${g.on ? '' : s.offch}`}>
                    <div className={s.ghead}>
                      <button type="button" className={`${s.pwr} ${g.on ? s.on : ''}`} aria-pressed={g.on} aria-label={`OUT ${n + 1} on`}
                        onClick={() => setGenCh(n, { on: !g.on })} />
                      <span className={s.gname}>OUT {n + 1}</span>
                      <Seg options={WAVES} value={g.wave} labels={WAVE_LABELS} onChange={wave => setGenCh(n, { wave })} />
                      {clips && <span className={s.clip} title={`The output stops at ±${prefs.outFS} V`}>CLIPS</span>}
                    </div>
                    <div className={s.gbody}>
                      <WavePreview g={g} fs={prefs.outFS} color={g.on ? CH_COLORS[n] : 'var(--text-muted)'} />
                      <div className={s.knobs}>
                        <Knob label={g.wave === 'sweep' ? 'From' : 'Frequency'} value={g.freq} min={0.01} max={fMax} log defaultValue={440}
                          format={fmtHz} parse={parseNum} disabled={g.wave === 'noise' || g.wave === 'dc'}
                          onChange={freq => setGenCh(n, { freq })} />
                        {g.wave === 'sweep' && (
                          <>
                            <Knob label="To" value={g.sweepTo} min={0.01} max={fMax} log defaultValue={20000}
                              format={fmtHz} parse={parseNum} onChange={sweepTo => setGenCh(n, { sweepTo })} />
                            <Knob label="Time" value={g.sweepTime} min={0.1} max={60} log defaultValue={5}
                              format={v => `${v < 10 ? v.toFixed(2) : v.toFixed(1)} s`} parse={parseNum} onChange={sweepTime => setGenCh(n, { sweepTime })} />
                          </>
                        )}
                        <Knob label="Amplitude" value={g.vpp} min={0} max={prefs.outFS * 2} defaultValue={5}
                          format={v => `${v.toFixed(2)} Vpp`} parse={parseNum} round={v => Math.round(v * 1000) / 1000}
                          disabled={g.wave === 'dc'} onChange={vpp => setGenCh(n, { vpp })} title="Peak to peak, in volts at the jack" />
                        <Knob label={g.wave === 'dc' ? 'Voltage' : 'Offset'} value={g.offset} min={-prefs.outFS} max={prefs.outFS} bipolar defaultValue={0}
                          format={v => fmtSet(v, 3)} parse={parseNum} round={v => Math.round(v * 1000) / 1000}
                          onChange={offset => setGenCh(n, { offset })} title="DC added to the wave; with DC this is the voltage (CV)" />
                        {g.wave === 'square' && (
                          <Knob label="Width" value={g.duty} min={0.01} max={0.99} defaultValue={0.5}
                            format={v => `${Math.round(v * 100)} %`} parse={t => parseNum(t) / 100} round={v => Math.round(v * 100) / 100}
                            onChange={duty => setGenCh(n, { duty })} title="Pulse width" />
                        )}
                        {g.wave !== 'noise' && g.wave !== 'dc' && g.wave !== 'sweep' && (
                          <Knob label="Phase" value={g.phase} min={0} max={360} defaultValue={0}
                            format={v => `${Math.round(v)}°`} parse={parseNum} round={v => Math.round(v)}
                            onChange={phase => setGenCh(n, { phase })} title="Shifts this output against the other one (press Sync phase)" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {!live && (
            <div className={s.gate}>
              <div className={s.gatebox}>
                <div className={s.brand}>USB AUDIO <small>Audio Lab</small></div>
                <span className={`${s.badge} ${statusClass}`}><span className={s.dot} />{status.text}</span>
                <p className={note?.error ? s.noteError : s.gateNote}>
                  {note?.text ?? 'Plug the module into this computer, press Connect and allow the audio input. Any audio interface works too.'}
                </p>
                <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => start(false)} disabled={busy}>Connect</button>
                <button type="button" className={s.btn} onClick={() => start(true)} disabled={busy}>Demo</button>
              </div>
            </div>
          )}
        </div>

        {/* ---- side panel */}
        <aside className={s.side}>
          <div className={s.brand}>USB AUDIO <small>Audio Lab · scope, generator, analyzer</small></div>
          <div className={s.sgroup}>
            {live ? (
              <button type="button" className={s.btn} onClick={stop}>Disconnect</button>
            ) : (
              <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => start(false)} disabled={busy}>Connect</button>
            )}
            <button type="button" className={`${s.btn} ${engine?.demo ? s.selbtn : ''}`} onClick={() => (engine?.demo ? stop() : start(true))} disabled={busy}
              title="Try the lab without the module: the outputs are patched into the inputs inside the page">
              Demo
            </button>
            <span className={`${s.badge} ${statusClass}`}><span className={s.dot} /><span className={s.ellipsis}>{status.text}</span></span>
          </div>

          <div className={s.sgroup}>
            <h4>Devices</h4>
            <label className={s.field}><span>Input</span>
              <select value={prefs.inputId} disabled={busy || engine?.demo || !devices.inputs.length}
                onChange={e => { savePrefs({ inputId: e.target.value }); if (engine && !engine.demo) void start(false, { inputId: e.target.value }); }}>
                {!devices.inputs.length && <option value="">Connect to list them</option>}
                {devices.inputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Audio input'}</option>)}
              </select>
            </label>
            <label className={s.field}><span>Output</span>
              <select value={prefs.outputId} disabled={busy || engine?.demo || !devices.outputs.length || !canPickOutput}
                onChange={e => { savePrefs({ outputId: e.target.value }); if (engine && !engine.demo) void start(false, { outputId: e.target.value }); }}>
                {(!devices.outputs.length || !canPickOutput) && <option value="">{canPickOutput ? 'Connect to list them' : 'System output'}</option>}
                {canPickOutput && devices.outputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Audio output'}</option>)}
              </select>
            </label>
            {!canPickOutput && <p className={s.small}>This browser plays on the system output: choose the module there, or use Chrome or Edge.</p>}
          </div>

          <div className={s.sgroup}>
            <h4>Link</h4>
            <div className={s.status}>
              <span>Sample rate</span><b>{engine ? `${(engine.sampleRate / 1000).toFixed(1)} kHz` : '—'}</b>
              <span>Inputs</span><b>{engine ? (engine.demo ? '2 (demo)' : engine.inputChannels) : '—'}</b>
              <span>Output latency</span><b>{engine ? `${(engine.latency * 1000).toFixed(1)} ms` : '—'}</b>
            </div>
          </div>

          <div className={s.sgroup}>
            <h4>Voltmeter (DC)</h4>
            {[0, 1].map(n => {
              const v = readout.dc[n];
              const pos = Number.isFinite(v) ? Math.max(-1, Math.min(1, v / prefs.inFS)) : 0;
              return (
                <div key={n} className={s.volt}>
                  <span style={{ color: CH_COLORS[n] }}>IN {n + 1}</span>
                  <b>{Number.isFinite(v) ? fmtSet(v, 3) : '—'}</b>
                  <div className={s.vbar}>
                    <div className={s.vfill} style={{ left: `${50 + Math.min(0, pos) * 50}%`, width: `${Math.abs(pos) * 50}%`, background: CH_COLORS[n] }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={s.sgroup}>
            <h4>Levels at the jacks</h4>
            <label className={s.level}><span>IN full scale</span><span>±</span>
              <input type="number" step="0.01" min="0.1" max="20" value={prefs.inFS}
                onChange={e => { const v = parseFloat(e.target.value); if (v > 0) savePrefs({ inFS: v }); }} /><span>V</span>
            </label>
            <label className={s.level}><span>OUT full scale</span><span>±</span>
              <input type="number" step="0.01" min="0.1" max="20" value={prefs.outFS}
                onChange={e => { const v = parseFloat(e.target.value); if (v > 0) savePrefs({ outFS: v }); }} /><span>V</span>
            </label>
            <div className={s.two}>
              <button type="button" className={s.btn} onClick={() => savePrefs(MODULE_LEVELS)} title="±5.54 V in, ±5.29 V out">USB Audio</button>
              <button type="button" className={s.btn} onClick={() => savePrefs({ inFS: 1, outFS: 1 })} title="Shows full scale as 1 V">Full scale = 1</button>
            </div>
            <p className={s.small}>The module&apos;s levels assume its pots fully up. Inputs and outputs are DC coupled, so CVs and DC read true.</p>
          </div>

          {live && note && <p className={note.error ? s.noteError : s.note}>{note.text}</p>}
        </aside>
      </div>
    </div>
  );
}
