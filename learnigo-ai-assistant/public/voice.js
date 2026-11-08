// The teacher's voice: sentences from the server (Kokoro on its CPU), decoded
// once and cached, played through Web Audio so they can stop within a few
// milliseconds when the student interrupts and resume from where they stopped.
//
// The voice goes through a small clarity chain: low rumble off, a little lift
// where consonants live (about 3 kHz), and a gentle compressor so quiet words
// are as easy to hear as loud ones. The board's pops go on a bus of their own,
// well under the voice and lower still while the teacher is talking, and both
// end in a limiter so nothing clips.
export const POP_LEVEL = 0.2;    // a pop's peak with the teacher quiet
export const DUCK = 0.5;         // pops while the teacher talks: about 6 dB lower

export class Voice {
  constructor(ctx) {
    this.ctx = ctx;
    this.master = ctx.createDynamicsCompressor();
    set(this.master, { threshold: -3, knee: 0, ratio: 20, attack: 0.002, release: 0.1 });
    this.master.connect(ctx.destination);
    this.out = ctx.createGain();
    const low = ctx.createBiquadFilter();
    set(low, { type: 'highpass', frequency: 75, Q: 0.7 });
    const presence = ctx.createBiquadFilter();
    set(presence, { type: 'peaking', frequency: 3000, Q: 0.9, gain: 3 });
    const even = ctx.createDynamicsCompressor();
    set(even, { threshold: -24, knee: 10, ratio: 3, attack: 0.005, release: 0.2 });
    const makeup = ctx.createGain();
    makeup.gain.value = 1.3;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.buf = new Float32Array(512);
    this.out.connect(low).connect(presence).connect(even).connect(makeup).connect(this.analyser);
    this.analyser.connect(this.master);
    this.fx = ctx.createGain();
    this.fx.connect(this.master);
    this.sounds = true;
    this.lastPop = -1;
    this.cache = new Map();
    this.speed = 1;
    this.src = null;
    this.sfxCache = new Map();
  }

  // Pops dip while the teacher talks and come back up in the pauses.
  duck(on) { this.fx.gain.setTargetAtTime(on ? DUCK : 1, this.ctx.currentTime, on ? 0.02 : 0.15); }

  key(text) { return `${this.speed}|${text}`; }

  // An AudioBuffer of the text (a promise), fetched once.
  load(text, signal) {
    const key = this.key(text);
    if (this.cache.has(key)) return this.cache.get(key);
    const url = `/api/tts?${new URLSearchParams({ text, speed: String(this.speed) })}`;
    let settled = false;
    const p = fetch(url, { signal })
      .then((r) => { if (!r.ok) throw new Error(`tts ${r.status}`); return r.arrayBuffer(); })
      .then((b) => this.ctx.decodeAudioData(b))
      .finally(() => { settled = true; });
    p.catch(() => { if (this.cache.get(key) === p) this.cache.delete(key); });
    // A lesson dropped while its line was still coming: forget it at once, so
    // the same line asked for again (in the same moment) is fetched afresh.
    signal?.addEventListener('abort', () => { if (!settled && this.cache.get(key) === p) this.cache.delete(key); }, { once: true });
    this.cache.set(key, p);
    if (this.cache.size > 300) this.cache.delete(this.cache.keys().next().value);
    return p;
  }

  play(buffer, offset = 0, onended = () => {}) {
    this.stop();
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    src.connect(gain).connect(this.out);
    src.start(0, Math.min(offset, buffer.duration));
    this.src = src;
    this.gain = gain;
    this.startedAt = this.ctx.currentTime - offset;
    this.duck(true);
    src.onended = () => { if (this.src === src) { this.src = null; this.duck(false); onended(); } };
  }

  // Stops with a 40 ms fade and returns how far into the sentence it was.
  stop() {
    if (!this.src) return 0;
    const now = this.ctx.currentTime;
    const elapsed = now - this.startedAt;
    this.gain.gain.setTargetAtTime(0, now, 0.012);
    this.src.stop(now + 0.06);
    this.src = null;
    this.duck(false);
    return elapsed;
  }

  get speaking() { return !!this.src; }

  level() {
    this.analyser.getFloatTimeDomainData(this.buf);
    let s = 0;
    for (const v of this.buf) s += v * v;
    return Math.sqrt(s / this.buf.length);
  }

  // A short sound: one made here (pop, tick, whoosh, sparkle) or a file
  // from public/assets/sfx (correct, wrong, question). pan: -1 left to 1
  // right, where the thing is on the board; step: the nth of a row of pops,
  // which climb a little scale.
  async sfx(name, { gain = 1, pan = 0, step = 0 } = {}) {
    if (!this.sounds) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = ctx.createStereoPanner();
    out.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    out.connect(this.fx);
    if (SYNTH[name]) {
      // Two pops closer than 70 ms are one blur: the second waits its turn.
      const at = Math.max(now, this.lastPop + 0.07);
      if (at - now > 0.25) return; // a pile-up: let it go
      this.lastPop = at;
      SYNTH[name](ctx, out, at, POP_LEVEL * gain, step);
      return;
    }
    const file = { pop: 'pop-1' }[name] || name;
    if (!this.sfxCache.has(file)) this.sfxCache.set(file, fetch(`/assets/sfx/${file}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
    try {
      const buffer = await this.sfxCache.get(file);
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      g.gain.value = 0.35 * gain;
      src.buffer = buffer;
      src.connect(g).connect(out);
      src.start();
    } catch { /* a missing sound never stops the lesson */ }
  }
}

function set(node, values) {
  for (const [k, v] of Object.entries(values)) {
    if (node[k] instanceof AudioParam) node[k].value = v;
    else node[k] = v;
  }
}

// A note of the pentatonic scale above C5: rows of pops climb it and never clash.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (step) => 523.25 * 2 ** (SCALE[step % SCALE.length] / 12);

// A gain that rises in a few milliseconds and dies away: the shape of a pop.
function blip(ctx, dest, at, peak, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  g.connect(dest);
  return g;
}

function tone(ctx, dest, at, { type = 'sine', f0, f1 = f0, glide = 0.05, peak, decay }) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + glide);
  o.connect(blip(ctx, dest, at, peak, decay));
  o.start(at);
  o.stop(at + decay + 0.02);
}

let noise = null;
function noiseBuffer(ctx) {
  if (noise?.sampleRate === ctx.sampleRate) return noise;
  noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.4), ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

// The sounds made in code: short (under a third of a second) and soft, so
// they mark what appears without covering a word.
export const SYNTH = {
  // A bubble: a quick upward sweep, with a quiet octave on top.
  pop(ctx, out, at, level, step) {
    const f = note(step);
    tone(ctx, out, at, { f0: f * 0.6, f1: f * 1.15, glide: 0.045, peak: level, decay: 0.11 });
    tone(ctx, out, at, { type: 'triangle', f0: f * 1.2, f1: f * 2.3, glide: 0.045, peak: level * 0.18, decay: 0.08 });
  },
  // A soft wooden tock for a line of text.
  tick(ctx, out, at, level, step) {
    tone(ctx, out, at, { f0: 880 + step * 40, f1: 620, glide: 0.03, peak: level * 0.55, decay: 0.05 });
  },
  // Air moving: a picture sliding onto the board.
  whoosh(ctx, out, at, level) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(350, at);
    bp.frequency.exponentialRampToValueAtTime(1600, at + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level * 0.55, at + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    src.connect(bp).connect(g).connect(out);
    src.start(at);
    src.stop(at + 0.32);
  },
  // Three bright notes for a title or a big number.
  sparkle(ctx, out, at, level) {
    [1567.98, 2093, 2637].forEach((f, i) => tone(ctx, out, at + i * 0.05, { f0: f, peak: level * 0.45, decay: 0.12 }));
  },
};
