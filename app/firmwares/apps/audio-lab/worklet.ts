// The two audio worklet processors of the Audio Lab, loaded from a blob URL:
//   lab-gen: the function generator, two channels (OUT 1, OUT 2), in full scale units
//   lab-tap: takes the two inputs (IN 1, IN 2) and posts them to the page in batches
// Settings come in on the port; every change is smoothed, so nothing clicks.

const source = String.raw`
const TAU = Math.PI * 2;

// PolyBLEP: rounds the steps of the saw and the square, so they alias less
function blep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}

class Gen extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ch = [0, 1].map(() => ({
      wave: 'sine', freq: 440, amp: 0, offset: 0, duty: 0.5, phase: 0, sweepTo: 20000, sweepTime: 5, on: 0,
      p: 0, sweepT: 0, gain: 0, curAmp: 0, curOffset: 0, tri: 0,
    }));
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'set') Object.assign(this.ch[m.ch], m.params);
      if (m.type === 'sync') for (const c of this.ch) { c.p = 0; c.sweepT = 0; }
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    const k = 1 - Math.exp(-1 / (0.004 * sampleRate)); // 4 ms smoothing
    for (let n = 0; n < 2; n++) {
      const o = out[n];
      if (!o) continue;
      const c = this.ch[n];
      for (let i = 0; i < o.length; i++) {
        c.gain += ((c.on ? 1 : 0) - c.gain) * k;
        c.curAmp += (c.amp - c.curAmp) * k;
        c.curOffset += (c.offset - c.curOffset) * k;
        let f = c.freq;
        if (c.wave === 'sweep') {
          f = c.freq * Math.pow(c.sweepTo / c.freq, c.sweepT / c.sweepTime);
          c.sweepT += 1 / sampleRate;
          if (c.sweepT >= c.sweepTime) c.sweepT = 0;
        }
        const dt = Math.min(f / sampleRate, 0.5);
        let t = c.p + c.phase;
        t -= Math.floor(t);
        let v;
        switch (c.wave) {
          case 'triangle': v = t < 0.5 ? 4 * t - 1 : 3 - 4 * t; break;
          case 'saw': v = 2 * t - 1 - blep(t, dt); break;
          case 'square': {
            const d = c.duty;
            v = (t < d ? 1 : -1) + blep(t, dt);
            let t2 = t - d + 1;
            t2 -= Math.floor(t2);
            v -= blep(t2, dt);
            break;
          }
          case 'noise': v = Math.random() * 2 - 1; break;
          case 'dc': v = 0; break;
          default: v = Math.sin(TAU * t);
        }
        c.p += dt;
        if (c.p >= 1) c.p -= 1;
        const s = (c.curOffset + c.curAmp * v) * c.gain;
        o[i] = s > 1 ? 1 : s < -1 ? -1 : s;
      }
    }
    return true;
  }
}

class Tap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 128 * Math.max(4, Math.round(sampleRate / 6000)); // about 20 ms
    this.fill = 0;
    this.noise = 0;
    this.scale = 1;
    this.alloc();
    this.port.onmessage = (e) => {
      if (e.data.type === 'demo') { this.noise = e.data.noise; this.scale = e.data.scale; }
    };
  }

  alloc() {
    this.a = new Float32Array(this.size);
    this.b = new Float32Array(this.size);
  }

  process(inputs) {
    const inp = inputs[0] || [];
    const a = inp[0], b = inp[1];
    const len = (a && a.length) || 128;
    for (let i = 0; i < len; i++) {
      let x = a ? a[i] * this.scale : 0;
      let y = b ? b[i] * this.scale : 0;
      if (this.noise) {
        x += (Math.random() + Math.random() - 1) * this.noise;
        y += (Math.random() + Math.random() - 1) * this.noise;
      }
      this.a[this.fill] = x;
      this.b[this.fill] = y;
      if (++this.fill === this.size) {
        this.port.postMessage({ a: this.a, b: this.b }, [this.a.buffer, this.b.buffer]);
        this.alloc();
        this.fill = 0;
      }
    }
    return true;
  }
}

registerProcessor('lab-gen', Gen);
registerProcessor('lab-tap', Tap);
`;

export default source;
