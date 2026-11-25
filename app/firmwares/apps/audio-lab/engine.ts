import workletSource from './worklet';

export type Wave = 'sine' | 'triangle' | 'saw' | 'square' | 'noise' | 'sweep' | 'dc';

// One generator channel, in volts at the jack
export interface GenChannel {
  on: boolean;
  wave: Wave;
  freq: number;       // Hz (the start of a sweep)
  vpp: number;        // V peak to peak
  offset: number;     // V
  duty: number;       // 0..1, square only
  phase: number;      // degrees
  sweepTo: number;    // Hz
  sweepTime: number;  // s
}

export interface Levels {
  inFS: number;   // volts at an input jack for a full scale sample
  outFS: number;  // volts at an output jack for a full scale sample
}

// About 11 s at 192 kHz, 43 s at 48 kHz
const RING_BITS = 21;
export const RING = 1 << RING_BITS;
export const MASK = RING - 1;

let moduleUrl: string | undefined;

// The audio side of the lab: the generator plays on the output device, the two
// inputs land in a ring buffer (volts at the jacks). In demo mode the outputs
// are patched straight into the inputs, inside the page.
export class LabEngine {
  readonly ctx: AudioContext;
  readonly demo: boolean;
  readonly sampleRate: number;
  readonly ring: [Float32Array, Float32Array] = [new Float32Array(RING), new Float32Array(RING)];
  written = 0;         // frames received since the start
  inputChannels = 2;
  inputId = '';        // the input device the browser opened
  levels: Levels;
  private gen: AudioWorkletNode;
  private tap: AudioWorkletNode;
  private stream?: MediaStream;
  private closed = false;

  private constructor(ctx: AudioContext, gen: AudioWorkletNode, tap: AudioWorkletNode, demo: boolean, levels: Levels) {
    this.ctx = ctx;
    this.gen = gen;
    this.tap = tap;
    this.demo = demo;
    this.levels = levels;
    this.sampleRate = ctx.sampleRate;
    tap.port.onmessage = (e: MessageEvent<{ a: Float32Array; b: Float32Array }>) => this.take(e.data.a, e.data.b);
  }

  static async open({ demo, inputId, outputId, levels }: { demo: boolean; inputId?: string; outputId?: string; levels: Levels }) {
    let stream: MediaStream | undefined;
    let sampleRate: number | undefined;
    let inputChannels = 2;
    let openedId = '';
    if (!demo) {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: inputId ? { exact: inputId } : undefined,
          channelCount: { ideal: 2 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const settings = stream.getAudioTracks()[0]?.getSettings();
      sampleRate = settings?.sampleRate;
      if (settings?.channelCount) inputChannels = settings.channelCount;
      openedId = settings?.deviceId ?? '';
    }

    let ctx: AudioContext;
    try {
      ctx = new AudioContext({ sampleRate, latencyHint: 'interactive' });
    } catch {
      ctx = new AudioContext({ latencyHint: 'interactive' });
    }
    try {
      if (!demo && outputId && 'setSinkId' in ctx) {
        await (ctx as AudioContext & { setSinkId(id: string): Promise<void> }).setSinkId(outputId);
      }
      moduleUrl ??= URL.createObjectURL(new Blob([workletSource], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(moduleUrl);

      const gen = new AudioWorkletNode(ctx, 'lab-gen', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      const tap = new AudioWorkletNode(ctx, 'lab-tap', {
        numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1],
        channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'discrete',
      });
      // The tap is pulled through a silent gain, so it runs in every browser
      const mute = new GainNode(ctx, { gain: 0 });
      tap.connect(mute).connect(ctx.destination);

      const engine = new LabEngine(ctx, gen, tap, demo, levels);
      engine.inputChannels = inputChannels;
      engine.inputId = openedId;
      if (demo) {
        gen.connect(tap);
        engine.patchDemo();
      } else {
        engine.stream = stream;
        ctx.destination.channelCount = Math.min(2, ctx.destination.maxChannelCount);
        ctx.destination.channelInterpretation = 'discrete';
        gen.connect(ctx.destination);
        new MediaStreamAudioSourceNode(ctx, { mediaStream: stream! }).connect(tap);
      }
      await ctx.resume();
      return engine;
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      void ctx.close();
      throw error;
    }
  }

  get latency() {
    return this.ctx.baseLatency + (this.ctx.outputLatency || 0);
  }

  // Demo: the outputs come back at the inputs, with a little noise (0.4 mV)
  private patchDemo() {
    const { inFS, outFS } = this.levels;
    this.tap.port.postMessage({ type: 'demo', noise: 0.0004 / inFS, scale: outFS / inFS });
  }

  setLevels(levels: Levels) {
    this.levels = levels;
    if (this.demo) this.patchDemo();
  }

  setGen(ch: number, g: GenChannel) {
    const fs = this.levels.outFS;
    const nyquist = this.sampleRate / 2;
    this.gen.port.postMessage({
      type: 'set', ch,
      params: {
        on: g.on ? 1 : 0,
        wave: g.wave,
        freq: Math.min(g.freq, nyquist),
        amp: g.wave === 'dc' ? 0 : g.vpp / 2 / fs,
        offset: g.offset / fs,
        duty: g.duty,
        phase: g.phase / 360,
        sweepTo: Math.min(g.sweepTo, nyquist),
        sweepTime: g.sweepTime,
      },
    });
  }

  // Both generator channels from the start of their cycle (and sweep)
  sync() {
    this.gen.port.postMessage({ type: 'sync' });
  }

  private take(a: Float32Array, b: Float32Array) {
    if (this.closed) return;
    const fs = this.levels.inFS;
    const [ra, rb] = this.ring;
    let w = this.written & MASK;
    for (let i = 0; i < a.length; i++) {
      ra[w] = a[i] * fs;
      rb[w] = b[i] * fs;
      w = (w + 1) & MASK;
    }
    this.written += a.length;
  }

  // Copies frames [start, start + out.length) of a channel (zeros before the first)
  read(ch: number, start: number, out: Float32Array) {
    const r = this.ring[ch];
    const first = Math.max(0, this.written - RING);
    for (let i = 0; i < out.length; i++) {
      const n = start + i;
      out[i] = n >= first && n < this.written ? r[n & MASK] : 0;
    }
    return out;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.stream?.getTracks().forEach(track => track.stop());
    void this.ctx.close();
  }
}
