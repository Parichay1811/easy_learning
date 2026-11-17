// Voice in and out on this computer's CPU, with the repo's own models:
// Moonshine (or Whisper, LT_ASR) hears the student, Supertonic (or Kokoro,
// LT_TTS) speaks for the teacher.
// Each model runs in its own process (speech-worker.mjs), so hearing the
// student never waits behind a sentence and the server stays quick.
// Speech is made one sentence at a time, live requests before the warm-up
// queue, and cached on disk by its text, so a line is only ever made once.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isKokoroVoice, isSupertonicVoice } from './models.mjs';
import { speakable } from './speech-text.mjs';
import { writeWhole } from './files.mjs';

// The voice engine and its default voice (see speech-worker.mjs).
export const ENGINE = process.env.LT_TTS || 'supertonic';
const VOICE = process.env.LT_VOICE || (ENGINE === 'kokoro' ? 'af_heart' : 'F1');

// A model in a child process: call(message) resolves with its reply. A
// process that dies (out of memory, a model error) fails the calls it had and
// is started again, a little later each time, so the teacher carries on.
function modelWorker(kind, log) {
  const file = fileURLToPath(new URL('./speech-worker.mjs', import.meta.url));
  const pending = new Map();
  let next = 0;
  let child = null;
  let ready = null;
  let everReady = false;
  let restarts = 0;
  let stopping = false;
  function start() {
    const c = fork(file, [kind], { serialization: 'advanced', stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
    child = c;
    ready = new Promise((resolve, reject) => {
      c.on('message', (m) => {
        if (m.ready) { everReady = true; restarts = 0; return resolve(); }
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) p?.reject(new Error(m.error)); else p?.resolve(m);
      });
      c.on('exit', (code) => {
        const err = new Error(`${kind} process exited (${code})`);
        reject(err);
        for (const p of pending.values()) p.reject(err);
        pending.clear();
        // One that never loaded (no model files) would only fail again.
        if (stopping || !everReady) return;
        const wait = Math.min(30000, 1000 * 2 ** restarts++);
        log(`${err.message}; starting it again in ${wait / 1000} s`);
        setTimeout(start, wait).unref();
      });
    });
    ready.catch(() => {});
  }
  start();
  process.on('exit', () => { stopping = true; child.kill(); });
  const call = async (msg) => {
    await ready;
    if (!child.connected) throw new Error(`${kind} process is restarting`);
    return new Promise((resolve, reject) => {
      const id = next++;
      pending.set(id, { resolve, reject });
      child.send({ ...msg, id }, (err) => { if (err) { pending.delete(id); reject(err); } });
    });
  };
  return { get ready() { return ready; }, call };
}

const HALLUCINATIONS = /^(thank you\.?|thanks( for watching)?\.?|you\.?|bye\.?|\.+|okay\.?|\[.*\]|\(.*\))$/i;

export { speakable } from './speech-text.mjs';

// Speech needs no more than 24 kHz; Supertonic makes 44.1, so this halves the
// bytes sent to the browser.
function to24k(samples, rate) {
  if (rate <= 24000) return { samples, rate };
  const out = new Float32Array(Math.floor((samples.length * 24000) / rate));
  for (let i = 0; i < out.length; i++) {
    const x = (i * rate) / 24000;
    const j = Math.floor(x);
    out[i] = samples[j] + ((samples[j + 1] ?? samples[j]) - samples[j]) * (x - j);
  }
  return { samples: out, rate: 24000 };
}

export function wav(input, inputRate) {
  const { samples, rate } = to24k(input, inputRate);
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buf;
}

export function createSpeech({ dataDir, log = () => {} }) {
  const dir = path.join(dataDir, 'tts');
  fs.mkdirSync(dir, { recursive: true });
  const tts = modelWorker('tts', log);
  const asr = modelWorker('asr', log);
  let loaded = false;
  const ready = Promise.all([tts.ready, asr.ready]).then(() => { loaded = true; log('voice and speech models ready'); });
  const queues = { live: [], warm: [] };
  const memory = new Map();
  const inflight = new Map();
  let busy = false;
  const stats = { made: 0, cached: 0, ms: 0 };

  async function pump() {
    if (busy) return;
    busy = true;
    while (queues.live.length || queues.warm.length) {
      const job = queues.live.shift() || queues.warm.shift();
      if (job.cancelled?.()) { job.reject(new Error('cancelled')); continue; }
      try { job.resolve(await job.run()); } catch (e) { job.reject(e); }
    }
    busy = false;
  }

  // WAV bytes of the text in that voice and speed.
  async function speak(text, { voice = VOICE, speed = 1, priority = 'live', cancelled } = {}) {
    if (!(ENGINE === 'kokoro' ? isKokoroVoice(voice) : isSupertonicVoice(voice))) voice = VOICE;
    const clean = speakable(text);
    const key = crypto.createHash('sha1').update(`${ENGINE}|${voice}|${speed}|${clean}`).digest('hex');
    if (memory.has(key)) { stats.cached++; return memory.get(key); }
    const file = path.join(dir, `${key}.wav`);
    if (fs.existsSync(file)) { const b = fs.readFileSync(file); remember(key, b); stats.cached++; return b; }
    // The server often starts a line before the browser asks for it: share
    // it. It is dropped only when every caller has gone, and a student
    // waiting for a warm-up line moves it to the front.
    const mine = cancelled || (() => false);
    const shared = inflight.get(key);
    if (shared) {
      shared.cancels.push(mine);
      if (priority !== 'warm') shared.live();
      return shared.p;
    }
    const entry = { cancels: [mine], live: () => {} };
    entry.p = make(key, file, clean, voice, speed, priority, entry);
    inflight.set(key, entry);
    entry.p.finally(() => inflight.delete(key)).catch(() => {});
    return entry.p;
  }

  async function make(key, file, clean, voice, speed, priority, entry) {
    await ready;
    return new Promise((resolve, reject) => {
      const job = {
        cancelled: () => entry.cancels.every((c) => c()), resolve, reject,
        run: async () => {
          if (memory.has(key)) return memory.get(key);
          const t0 = performance.now();
          const out = await tts.call({ text: clean, voice, speed });
          const b = wav(out.audio, out.rate);
          stats.made++; stats.ms += performance.now() - t0;
          writeWhole(file, b).catch(() => {});
          remember(key, b);
          return b;
        },
      };
      queues[priority === 'warm' ? 'warm' : 'live'].push(job);
      entry.live = () => {
        const i = queues.warm.indexOf(job);
        if (i >= 0) { queues.warm.splice(i, 1); queues.live.push(job); }
      };
      pump();
    });
  }

  function remember(key, b) {
    memory.set(key, b);
    if (memory.size > 400) memory.delete(memory.keys().next().value);
  }

  // What 16 kHz mono samples may say: [{ text, score }], best first (see
  // hearing.mjs). Empty when it is silence or a Whisper hallucination
  // ("Thank you.") on noise. prompt: the lesson's words, for Whisper.
  // keep: a name for the recording, to score sentences against it after.
  async function transcribe(samples, { prompt = '', beams = 4, keep = null } = {}) {
    await ready;
    const r = await asr.call({ samples, prompt, beams, keep });
    const hyps = r.hyps.map((h) => ({ ...h, text: h.text.trim() }));
    return !hyps.length || HALLUCINATIONS.test(hyps[0].text) ? [] : hyps.filter((h) => !HALLUCINATIONS.test(h.text));
  }

  // How well each sentence fits a kept recording (hearing.mjs hear.score).
  async function score(keep, texts) {
    return (await asr.call({ keep, texts })).scores;
  }

  function warm(texts, voice = VOICE) {
    for (const t of new Set(texts)) speak(t, { voice, priority: 'warm' }).catch(() => {});
  }

  return { ready, speak, transcribe, score, warm, stats, isReady: () => loaded };
}
