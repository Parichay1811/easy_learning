// One speech model in its own process, so making a sentence never blocks the
// server (routing a question takes milliseconds; a sentence takes a second).
// A process, not a worker thread: ONNX Runtime's native code crashed when
// two models ran in worker threads of one process.
//   node speech-worker.mjs tts|asr   (started by speech.mjs with fork)
//
// Voice (LT_TTS): supertonic (default; Supertonic 3, about 2x faster than
// Kokoro on CPU) or kokoro. Hearing (LT_ASR): moonshine (default; Moonshine
// base, about 5x faster than Whisper on short questions) or whisper.
import fs from 'node:fs';
import path from 'node:path';
import { env } from '@huggingface/transformers';
import { modelDir } from './models.mjs';
import { loadHearing } from './hearing.mjs';
import { loadTextToSpeech, loadVoiceStyle } from './vendor/supertonic.js';

const SUPERTONIC = {
  repo: 'https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46',
  files: ['onnx/duration_predictor.onnx', 'onnx/text_encoder.onnx', 'onnx/tts.json', 'onnx/unicode_indexer.json',
    'onnx/vector_estimator.onnx', 'onnx/vocoder.onnx', 'voice_styles/F1.json', 'voice_styles/F2.json', 'voice_styles/M1.json', 'voice_styles/M2.json', 'LICENSE'],
};

// Supertonic's files (about 400 MB) are fetched once into the model cache.
async function supertonicDir() {
  const dir = path.join(modelDir(), 'supertonic-3');
  for (const f of SUPERTONIC.files) {
    const file = path.join(dir, f);
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    console.log(`downloading Supertonic ${f}`);
    const res = await fetch(`${SUPERTONIC.repo}/${f}`);
    if (!res.ok) throw new Error(`could not download ${f}: ${res.status}`);
    fs.writeFileSync(`${file}.part`, Buffer.from(await res.arrayBuffer()));
    fs.renameSync(`${file}.part`, file);
  }
  return dir;
}

async function loadVoice(engine) {
  if (engine === 'kokoro') { // optional: npm install kokoro-js
    env.cacheDir = modelDir();
    const { KokoroTTS } = await import('kokoro-js');
    const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32', device: 'cpu' });
    return async (text, voice, speed) => {
      const out = await tts.generate(text, { voice: voice?.includes('_') ? voice : 'af_heart', speed });
      return { audio: Float32Array.from(out.audio), rate: out.sampling_rate };
    };
  }
  const dir = await supertonicDir();
  const tts = await loadTextToSpeech(path.join(dir, 'onnx'));
  const styles = new Map();
  const style = (name) => {
    const n = /^[FM][12]$/.test(name || '') ? name : 'F1';
    if (!styles.has(n)) styles.set(n, loadVoiceStyle([path.join(dir, 'voice_styles', `${n}.json`)]));
    return styles.get(n);
  };
  const steps = Number(process.env.LT_TTS_STEPS || 5);
  return async (text, voice, speed) => {
    const out = await tts.call(text, 'en', style(voice), steps, 1.05 * (speed || 1), 0.15);
    return { audio: Float32Array.from(out.wav), rate: tts.sampleRate };
  };
}

const tts = process.argv[2] === 'tts';
const origLog = console.log;
console.log = (...a) => { if (!/^Using CPU|^Loaded/.test(String(a[0]))) origLog(...a); };
const run = tts ? await loadVoice(process.env.LT_TTS || 'supertonic') : await loadHearing(process.env.LT_ASR || 'moonshine');
process.send({ ready: true, engine: tts ? (process.env.LT_TTS || 'supertonic') : (process.env.LT_ASR || 'moonshine') });

process.on('message', async ({ id, text, voice, speed, samples, prompt, beams, keep, texts }) => {
  try {
    if (texts) {
      process.send({ id, scores: await run.score(keep, texts) });
    } else if (tts) {
      const { audio, rate } = await run(text, voice, speed);
      process.send({ id, audio, rate });
    } else {
      process.send({ id, hyps: await run(Float32Array.from(samples), { prompt, beams, keep }) });
    }
  } catch (e) {
    process.send({ id, error: e.message });
  }
});
process.on('disconnect', () => process.exit(0));
