// Generative soundtrack for the home-page hero. Everything is synthesised with
// the Web Audio API (no audio files), so it works offline and adds nothing to
// the bundle size. Browsers only allow sound after a user gesture, so playback
// starts from the "Sound on" button and is off by default.
//
// Scenes: 0 dance, 1 live music, 2 wedding, 3 proposal, 4 birthday.

type Ctx = AudioContext;

const MAYAMALAVAGOWLA = [0, 1, 4, 5, 7, 8, 11, 12, 13, 16, 17, 19];
const MOHANAM = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const MAJOR_PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

type SceneDef = {
  bpm: number;
  /** Called for every 16th-note step. */
  step: (a: HeroAudio, s: number, bar: number, t: number) => void;
  /** Optional sustained layer. */
  drone?: (a: HeroAudio) => void;
  gain: number;
};

class HeroAudio {
  ctx: Ctx | null = null;
  master: GainNode | null = null;
  reverb: ConvolverNode | null = null;
  noise: AudioBuffer | null = null;
  bus: GainNode | null = null;
  droneNodes: { stop: () => void }[] = [];
  timer: ReturnType<typeof setInterval> | null = null;
  next = 0;
  stepNo = 0;
  scene = 0;
  playing = false;

  get supported() {
    return typeof window !== "undefined" && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  private ensure(): Ctx | null {
    if (this.ctx) return this.ctx;
    if (!this.supported) return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;

    // Small generated room reverb.
    const len = Math.floor(ctx.sampleRate * 1.9);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    conv.connect(wet);
    wet.connect(master);
    this.reverb = conv;

    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.playing) void this.ctx.resume();
    });
    return ctx;
  }

  /** Connect a voice to the current scene bus (dry) and the reverb (wet). */
  out(node: AudioNode, wet = 0.25) {
    if (!this.bus || !this.ctx || !this.reverb) return;
    node.connect(this.bus);
    if (wet > 0) {
      const w = this.ctx.createGain();
      w.gain.value = wet;
      node.connect(w);
      w.connect(this.reverb);
    }
  }

  async start(scene: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") await ctx.resume();
    this.playing = true;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.4);
    this.enterScene(scene);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  }

  stop() {
    const ctx = this.ctx;
    this.playing = false;
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.setTimeout(() => {
      if (!this.playing) this.killDrones();
    }, 600);
  }

  setScene(scene: number) {
    if (!this.playing || scene === this.scene) return;
    this.enterScene(scene);
  }

  private killDrones() {
    this.droneNodes.forEach((d) => d.stop());
    this.droneNodes = [];
  }

  private enterScene(scene: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const old = this.bus;
    const oldDrones = this.droneNodes;
    if (old) {
      old.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.18);
      window.setTimeout(() => {
        oldDrones.forEach((d) => d.stop());
        old.disconnect();
      }, 900);
    }
    this.droneNodes = [];
    this.scene = scene;
    const def = SCENES[scene];
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.master as GainNode);
    bus.gain.setTargetAtTime(def.gain, ctx.currentTime + 0.05, 0.35);
    this.bus = bus;
    this.stepNo = 0;
    this.next = ctx.currentTime + 0.12;
    def.drone?.(this);
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.playing || !this.bus) return;
    const def = SCENES[this.scene];
    const dur = 60 / def.bpm / 4;
    while (this.next < ctx.currentTime + 0.14) {
      const s = this.stepNo % 16;
      const bar = Math.floor(this.stepNo / 16);
      def.step(this, s, bar, this.next);
      this.next += dur;
      this.stepNo++;
    }
  }

  /* ----------------------------- voices ----------------------------- */

  env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  kick(t: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    this.env(g, t, 0.95 * v, 0.003, 0.28);
    o.connect(g);
    this.out(g, 0.04);
    o.start(t);
    o.stop(t + 0.4);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, q: number, peak: number, decay: number, wet = 0.15) {
    const c = this.ctx;
    if (!c || !this.noise) return;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    this.env(g, t, peak, 0.002, decay);
    s.connect(f);
    f.connect(g);
    this.out(g, wet);
    s.start(t, Math.random() * 0.5);
    s.stop(t + decay + 0.05);
  }

  hat(t: number, open = false, v = 1) {
    this.noiseHit(t, "highpass", 7500, 0.7, 0.22 * v, open ? 0.16 : 0.04, 0.05);
  }
  clap(t: number, v = 1) {
    for (let i = 0; i < 3; i++) this.noiseHit(t + i * 0.011, "bandpass", 1500, 1.2, 0.38 * v, 0.09, 0.22);
  }
  shaker(t: number, v = 1) {
    this.noiseHit(t, "bandpass", 5200, 1.8, 0.14 * v, 0.07, 0.1);
  }

  /** Low dhol / thavil thump with a slap. */
  dhol(t: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.14);
    this.env(g, t, 0.8 * v, 0.003, 0.3);
    o.connect(g);
    this.out(g, 0.18);
    o.start(t);
    o.stop(t + 0.45);
    this.noiseHit(t, "bandpass", 900, 1.4, 0.18 * v, 0.05, 0.1);
  }
  slap(t: number, v = 1) {
    this.noiseHit(t, "bandpass", 2600, 2.2, 0.34 * v, 0.06, 0.2);
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.07);
    this.env(g, t, 0.2 * v, 0.002, 0.09);
    o.connect(g);
    this.out(g, 0.15);
    o.start(t);
    o.stop(t + 0.15);
  }

  /** Tabla-like tuned drum. */
  tabla(t: number, freq: number, v = 1, bend = 0.82, decay = 0.28) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 1.25, t);
    o.frequency.exponentialRampToValueAtTime(freq * bend, t + 0.06);
    o.frequency.exponentialRampToValueAtTime(freq * bend * 0.96, t + decay);
    this.env(g, t, 0.55 * v, 0.002, decay);
    o.connect(g);
    this.out(g, 0.22);
    o.start(t);
    o.stop(t + decay + 0.1);
    this.noiseHit(t, "bandpass", freq * 6, 1.6, 0.09 * v, 0.03, 0.05);
  }

  bass(t: number, freq: number, dur: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.value = freq;
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(160, t + dur);
    this.env(g, t, 0.32 * v, 0.008, dur);
    o.connect(f);
    f.connect(g);
    this.out(g, 0.03);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  /** Plucked string (sitar / veena / synth pluck). */
  pluck(t: number, freq: number, dur = 0.5, v = 1, bright = 3200, type: OscillatorType = "sawtooth") {
    const c = this.ctx;
    if (!c) return;
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(bright, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(300, bright * 0.12), t + dur);
    f.Q.value = 2.5;
    this.env(g, t, 0.2 * v, 0.004, dur);
    [-6, 6].forEach((det) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
    f.connect(g);
    this.out(g, 0.3);
  }

  /** Reedy nadaswaram-style lead with vibrato. */
  reed(t: number, freq: number, dur: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    const g = c.createGain();
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = Math.min(3200, freq * 3.2);
    bp.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.26 * v, t + 0.05);
    g.gain.setValueAtTime(0.26 * v, t + Math.max(0.06, dur - 0.1));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = 5.4;
    lg.gain.value = freq * 0.012;
    lfo.connect(lg);
    [-9, 0, 9].forEach((det) => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.detune.value = det;
      lg.connect(o.frequency);
      o.connect(bp);
      o.start(t);
      o.stop(t + dur + 0.2);
    });
    bp.connect(g);
    this.out(g, 0.32);
    lfo.start(t);
    lfo.stop(t + dur + 0.2);
  }

  bell(t: number, freq: number, v = 1, decay = 2.2) {
    const c = this.ctx;
    if (!c) return;
    [1, 2.76, 5.4, 8.93].forEach((m, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq * m;
      this.env(g, t, (0.2 / (i + 1)) * v, 0.002, decay / (1 + i * 0.7));
      o.connect(g);
      this.out(g, 0.4);
      o.start(t);
      o.stop(t + decay + 0.1);
    });
  }

  marimba(t: number, freq: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    [1, 4].forEach((m, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq * m;
      this.env(g, t, (i ? 0.06 : 0.3) * v, 0.002, i ? 0.08 : 0.32);
      o.connect(g);
      this.out(g, 0.2);
      o.start(t);
      o.stop(t + 0.5);
    });
  }

  pad(t: number, freqs: number[], dur: number, v = 1) {
    const c = this.ctx;
    if (!c) return;
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1 * v, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
    freqs.forEach((fr) => {
      [-5, 5].forEach((det) => {
        const o = c.createOscillator();
        o.type = "triangle";
        o.frequency.value = fr;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur * 1.1);
      });
    });
    f.connect(g);
    this.out(g, 0.45);
  }

  /** Sa-Pa tanpura drone. Returns a handle so it can be stopped. */
  tanpura(freq: number, v = 1) {
    const c = this.ctx;
    if (!c || !this.bus) return;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.05 * v, c.currentTime, 0.6);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1100;
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = 0.18;
    lg.gain.value = 500;
    lfo.connect(lg);
    lg.connect(f.frequency);
    const oscs: OscillatorNode[] = [];
    [freq, freq * 1.5, freq * 2, freq / 2].forEach((fr, i) => {
      [-4, 4].forEach((det) => {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = fr;
        o.detune.value = det + i;
        o.connect(f);
        o.start();
        oscs.push(o);
      });
    });
    f.connect(g);
    this.out(g, 0.3);
    lfo.start();
    this.droneNodes.push({
      stop: () => {
        try {
          g.gain.setTargetAtTime(0, c.currentTime, 0.1);
          oscs.forEach((o) => o.stop(c.currentTime + 0.5));
          lfo.stop(c.currentTime + 0.5);
        } catch {
          /* already stopped */
        }
      },
    });
  }
}

/* ============================== scene scores ============================== */

const deg = (scale: number[], d: number, root: number) => root + scale[((d % scale.length) + scale.length) % scale.length] + 12 * Math.floor(d / scale.length);

// Seeded pick so a "random" phrase is the same every time.
const pick = (n: number) => {
  const x = Math.sin(n * 91.345 + 7.1) * 43758.5453;
  return x - Math.floor(x);
};

const SCENES: SceneDef[] = [
  /* 0 · Dance Night: four on the floor with dhol accents */
  {
    bpm: 122,
    gain: 0.95,
    step: (a, s, bar, t) => {
      if (s % 4 === 0) a.kick(t, 1);
      if (s % 4 === 2) a.hat(t, true, 0.9);
      else if (s % 2 === 0) a.hat(t, false, 0.5);
      if (s === 4 || s === 12) a.clap(t, 0.9);
      if (s === 3 || s === 11 || (bar % 4 === 3 && (s === 14 || s === 15))) a.dhol(t, 0.7);
      if (s === 7 || s === 15) a.slap(t, 0.6);
      // driving bass (D, Mayamalavagowla flavour)
      const bassPat = [0, -1, 0, 0, 1, -1, 0, -1, 0, -1, 0, 4, 1, -1, 0, 1];
      const b = bassPat[s];
      if (b >= 0 && s % 2 === 0) a.bass(t, midi(38 + b), 0.22, 0.9);
      // sparkly arpeggio
      if (s % 2 === 1 || s % 4 === 0) {
        const d = Math.floor(pick(bar * 16 + s) * 6) + (bar % 2) * 2;
        a.pluck(t, midi(deg(MAYAMALAVAGOWLA, d, 62)), 0.22, 0.55, 4200, "square");
      }
    },
  },
  /* 1 · Live Music: tabla, sitar-like pluck, tanpura */
  {
    bpm: 108,
    gain: 0.95,
    drone: (a) => a.tanpura(midi(50), 1),
    step: (a, s, bar, t) => {
      // teental-ish 16 matra cycle played on every 16th
      const bols = ["dha", "dhin", "dhin", "dha", "dha", "dhin", "dhin", "dha", "dha", "tin", "tin", "ta", "ta", "dhin", "dhin", "dha"];
      if (s % 2 === 0) {
        const b = bols[s];
        if (b === "dha") {
          a.tabla(t, 98, 1, 0.72, 0.34);
          a.tabla(t, 330, 0.5, 0.95, 0.12);
        } else if (b === "dhin") a.tabla(t, 210, 0.6, 0.9, 0.2);
        else if (b === "tin") a.tabla(t, 440, 0.7, 0.98, 0.16);
        else a.tabla(t, 520, 0.55, 1, 0.1);
      }
      if (s % 4 === 1) a.shaker(t, 0.8);
      // melodic phrase every two bars
      const motif = [0, 2, 3, 4, 3, 2, 0, -1, 0, 3, 4, 6, 4, 3, 2, 0];
      if (s % 2 === 0 && (bar % 2 === 0 || s >= 8)) {
        const i = s / 2;
        const d = motif[(i + bar * 3) % motif.length] + (bar % 4 === 3 ? 2 : 0);
        a.pluck(t, midi(deg(MAYAMALAVAGOWLA, d, 62)), 0.65, 0.9, 3000, "sawtooth");
        if (pick(bar * 16 + s) > 0.7) a.pluck(t + 0.09, midi(deg(MAYAMALAVAGOWLA, d + 1, 62)), 0.4, 0.5, 2800, "sawtooth");
      }
    },
  },
  /* 2 · Wedding: nadaswaram + thavil + temple bell */
  {
    bpm: 84,
    gain: 0.95,
    drone: (a) => a.tanpura(midi(48), 0.9),
    step: (a, s, bar, t) => {
      if (s === 0) {
        a.dhol(t, 1);
        if (bar % 2 === 0) a.bell(t, midi(84), 0.9, 3.2);
      }
      if (s === 6 || s === 10) a.dhol(t, 0.7);
      if ([2, 3, 7, 11, 14, 15].includes(s)) a.slap(t, s === 15 ? 0.9 : 0.65);
      if (s % 4 === 2) a.shaker(t, 0.5);
      // melody: mangala vadyam-like phrase in Mayamalavagowla
      const phrase = [
        [0, 4], [2, 2], [3, 2], [4, 4], [6, 2], [4, 2], [3, 4], [2, 2], [0, 2],
        [0, 4], [3, 2], [4, 2], [5, 4], [6, 2], [7, 2], [6, 2], [4, 2], [3, 2], [2, 2],
      ];
      // lay phrase notes out across the bar
      let pos = 0;
      for (let i = 0; i < phrase.length; i++) {
        const [d, len] = phrase[i];
        const startBar = i < 9 ? 0 : 1;
        if (bar % 2 === startBar && pos === s) {
          const dur = (len * 60) / 84 / 4;
          a.reed(t, midi(deg(MAYAMALAVAGOWLA, d, 60)), Math.max(0.15, dur * 0.92), 0.9);
        }
        pos += len;
        if (i === 8) pos = 0;
      }
    },
  },
  /* 3 · Proposal: soft pads, bell arpeggio, heartbeat */
  {
    bpm: 68,
    gain: 0.9,
    step: (a, s, bar, t) => {
      const chords = [
        [48, 52, 55, 59],
        [45, 48, 52, 55],
        [41, 45, 48, 52],
        [43, 47, 50, 55],
      ];
      const ch = chords[bar % 4];
      if (s === 0) a.pad(t, ch.map((n) => midi(n + 12)), (60 / 68) * 4, 1);
      if (s === 0 || s === 3) a.kick(t, 0.28);
      if (s % 2 === 0) {
        const n = ch[Math.floor(pick(bar * 16 + s) * 4)] + 24 + (s % 8 === 0 ? 0 : 12);
        a.bell(t, midi(n), 0.42, 1.8);
      }
      if (s === 8) a.bell(t, midi(ch[2] + 36), 0.3, 2.4);
    },
  },
  /* 4 · Birthday: playful marimba, claps and tambourine */
  {
    bpm: 112,
    gain: 0.95,
    step: (a, s, bar, t) => {
      if (s % 8 === 0) a.kick(t, 0.9);
      if (s === 4 || s === 12) a.clap(t, 0.9);
      if (s % 2 === 0) a.shaker(t, 0.7);
      if (s % 4 === 2) a.hat(t, false, 0.6);
      if (s % 8 === 0 || s === 6 || s === 14) a.bass(t, midi(deg(MAJOR_PENT, s === 6 ? 2 : s === 14 ? 3 : 0, 36)), 0.2, 0.85);
      if (s === 0) a.bell(t, midi(96), 0.5, 1.2);
      const jingle = [0, 2, 4, 2, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 4, 2];
      if (s % 2 === 0) {
        const d = jingle[(s / 2 + bar * 5) % jingle.length] + (bar % 4 === 3 && s > 8 ? 2 : 0);
        a.marimba(t, midi(deg(MAJOR_PENT, d, 72)), 0.95);
      }
      void MOHANAM;
    },
  },
];

export const heroAudio = new HeroAudio();
