// Hearing: speech to text with a short list of what the student may have
// said, best first, so the words of the lesson can choose between them.
//
// transformers.js keeps one beam however many are asked for, so the beam
// search is done here, step by step over the decoder with its key/value
// cache. Whisper also takes a prompt: text it reads as "said just before"
// (the lesson's title, its key words, the questions on screen), which makes
// it spell "Thevenin" and "Okonkwo" instead of "the venom" and "a con co".
// Moonshine (the fast default) has no prompt; it gives the list only.
//
//   const hear = await loadHearing('whisper');
//   await hear(samples, { prompt: 'Thevenin equivalent, open-circuit voltage', beams: 4 })
//   -> [{ text, score }]   score: mean log-probability per token (0 is sure)
import { AutoProcessor, AutoTokenizer, AutoModelForSpeechSeq2Seq, cat, env } from '@huggingface/transformers';
import { modelDir } from './models.mjs';

export const ASR_MODELS = {
  moonshine: ['onnx-community/moonshine-base-ONNX', 'fp32'],
  'moonshine-tiny': ['onnx-community/moonshine-tiny-ONNX', 'q8'],
  whisper: ['onnx-community/whisper-base.en_timestamped', 'q8'],
  'whisper-small': ['onnx-community/whisper-small.en_timestamped', 'q8'],
};

const PROMPT_TOKENS = 120; // Whisper reads at most 223; a short prompt is safer

export async function loadHearing(name = 'moonshine') {
  env.cacheDir = modelDir();
  const [id, dtype] = ASR_MODELS[name] || ASR_MODELS.moonshine;
  const [processor, tokenizer, model] = await Promise.all([
    AutoProcessor.from_pretrained(id),
    AutoTokenizer.from_pretrained(id),
    AutoModelForSpeechSeq2Seq.from_pretrained(id, { dtype, device: 'cpu' }),
  ]);
  const cfg = model.generation_config;
  const whisper = name.startsWith('whisper');
  const eos = Number(Array.isArray(cfg.eos_token_id) ? cfg.eos_token_id[0] : cfg.eos_token_id);
  const vocab = model.config.vocab_size;
  // Tokens never written: Whisper's suppress list and every special token
  // (timestamps, task, language), which this transcribes without.
  const banned = new Uint8Array(vocab);
  for (const t of cfg.suppress_tokens || []) banned[t] = 1;
  if (whisper) for (let t = eos + 1; t < vocab; t++) banned[t] = 1;
  const firstBanned = [...(cfg.begin_suppress_tokens || []), eos];

  function start(prompt) {
    if (!whisper) return [BigInt(cfg.decoder_start_token_id ?? 1)];
    const sot = [BigInt(cfg.decoder_start_token_id), BigInt(cfg.no_timestamps_token_id)];
    const words = String(prompt || '').trim();
    if (!words) return sot;
    const ids = tokenizer.encode(` ${words}`, { add_special_tokens: false }).slice(-PROMPT_TOKENS);
    return [BigInt(cfg.prev_sot_token_id), ...ids.map(BigInt), ...sot];
  }

  // log of the sum of exp over the tokens that may be written
  function logTotal(row) {
    let max = -Infinity;
    for (let t = 0; t < row.length; t++) if (!banned[t] && row[t] > max) max = row[t];
    let sum = 0;
    for (let t = 0; t < row.length; t++) if (!banned[t]) sum += Math.exp(row[t] - max);
    return max + Math.log(sum);
  }

  // The last 24 recordings' encoder outputs, so sentences can be scored
  // against the same sound afterwards (hear.score).
  const kept = new Map();

  async function hear(samples, { prompt = '', beams = 1, keep = null } = {}) {
    const inputs = await processor(samples);
    const name0 = whisper ? 'input_features' : 'input_values';
    const encoded = await model._prepare_encoder_decoder_kwargs_for_generation({
      inputs_tensor: inputs[name0], model_inputs: { [name0]: inputs[name0] }, model_input_name: name0, generation_config: cfg,
    });
    const init = start(whisper ? prompt : '');
    if (keep != null) {
      kept.set(keep, { encoded, init });
      if (kept.size > 24) kept.delete(kept.keys().next().value);
    }
    // Speech is about 3–5 tokens a second; a decoder left to run on loops
    // ("next. you. you. next…" on half a second of Whisper).
    const maxNew = Math.min(whisper ? 96 : 194, Math.ceil((samples.length / 16000) * 6.5) + 8);
    const width = Math.max(1, beams);
    // All live beams go through the decoder as one batch. Their caches are
    // rows of one tensor: a step keeps the rows of the beams that carry on
    // (a beam can carry on twice), and the encoder's part, the same for
    // every beam, is repeated to the batch size.
    let live = [{ ids: init, out: [], lp: 0 }];
    const done = [];
    const norm = (b) => b.lp / Math.max(1, b.out.length);
    const once1 = Object.fromEntries(Object.entries(encoded).filter(([, t]) => t?.dims?.[0] === 1));
    const repeated = new Map();
    const repeat = (name, t, n) => {
      const k = `${name}|${n}`;
      if (!repeated.has(k)) repeated.set(k, n === 1 ? t : cat(Array(n).fill(t), 0));
      return repeated.get(k);
    };
    let past = null;
    let encoderPast = null;
    for (let step = 0; step < maxNew && live.length; step++) {
      const n = live.length;
      const mi = { ...encoded };
      for (const [k, t] of Object.entries(once1)) mi[k] = repeat(k, t, n);
      if (past) mi.past_key_values = past;
      const out = await model.forward(model.prepare_inputs_for_generation(live.map((b) => b.ids), mi, cfg));
      const { data, dims } = out.logits;
      const v = dims.at(-1);
      const seq = dims.at(-2);
      const next = [];
      for (let b = 0; b < n; b++) {
        const row = data.subarray((b * seq + seq - 1) * v, (b * seq + seq) * v);
        const lse = logTotal(row);
        const top = [];
        // No three tokens twice: the token that would repeat a pair's follower is out.
        const o = live[b].out;
        const again = new Set();
        for (let j = 0; j + 2 < o.length; j++) if (o[j] === o[o.length - 2] && o[j + 1] === o[o.length - 1]) again.add(o[j + 2]);
        for (let t = 0; t < v; t++) {
          if (banned[t] || step === 0 && firstBanned.includes(t) || again.has(t)) continue;
          const sc = row[t] - lse;
          if (top.length < width + 1) { top.push([t, sc]); top.sort((x, y) => y[1] - x[1]); } else if (sc > top[top.length - 1][1]) { top[top.length - 1] = [t, sc]; top.sort((x, y) => y[1] - x[1]); }
        }
        for (const [t, sc] of top) {
          const lp = live[b].lp + sc;
          if (t === eos) done.push({ ...live[b], lp });
          else next.push({ parent: b, ids: [...live[b].ids, BigInt(t)], out: [...live[b].out, t], lp });
        }
      }
      next.sort((x, y) => y.lp - x.lp);
      const keep = next.slice(0, width);
      const all = model.getPastKeyValues(out, past);
      if (!encoderPast) encoderPast = Object.fromEntries(Object.entries(all).filter(([k]) => k.includes('encoder')).map(([k, t]) => [k, t.dims[0] === 1 ? t : t.slice([0, 1])]));
      const idx = keep.map((b) => b.parent);
      past = {};
      for (const [k, t] of Object.entries(all)) {
        if (k.includes('encoder')) past[k] = repeat(k, encoderPast[k], idx.length);
        else past[k] = idx.length === n && idx.every((x, i) => x === i) ? t : cat(idx.map((i) => t.slice([i, i + 1])), 0);
      }
      live = keep;
      // Stop once enough have ended and no live beam can still beat them.
      if (done.length >= width) {
        const worst = done.map(norm).sort((x, y) => y - x)[width - 1];
        if (live.every((b) => b.lp / (b.out.length + 1) < worst)) break;
      }
    }
    if (!done.length) done.push(...live);
    const seen = new Set();
    // A decoder that runs on can say it twice: "what was sankin-kotai what was sankin-kotai".
    const once = (t) => { const m = t.match(/^(.{8,}?)[\s,.]+\1[.?!]?$/i); return m ? m[1] : t; };
    return done
      .map((b) => ({ text: once(tokenizer.decode(b.out, { skip_special_tokens: true }).trim()), score: +norm(b).toFixed(3) }))
      .sort((x, y) => y.score - x.score)
      .filter((h) => h.text && !seen.has(h.text.toLowerCase()) && seen.add(h.text.toLowerCase()))
      .slice(0, width);
  }

  // How well each sentence fits a kept recording: the mean log-probability
  // of its tokens (and the end), all sentences in one batch. A sentence
  // shorter than the longest is padded at the end, which the decoder (it
  // only looks back) never sees. -> [number] or null once forgotten.
  hear.score = async function score(keep, texts) {
    const k = kept.get(keep);
    if (!k || !texts.length) return null;
    const seqs = texts.map((t) => [...tokenizer.encode(whisper ? ` ${t.trim()}` : t.trim(), { add_special_tokens: false }), eos]);
    const len = k.init.length + Math.max(...seqs.map((q) => q.length)) - 1;
    const ids = seqs.map((q) => [...k.init, ...q.slice(0, -1).map(BigInt)]).map((r) => [...r, ...Array(len - r.length).fill(BigInt(eos))]);
    const mi = { ...k.encoded };
    for (const [name, t] of Object.entries(k.encoded)) if (t?.dims?.[0] === 1) mi[name] = texts.length === 1 ? t : cat(Array(texts.length).fill(t), 0);
    const out = await model.forward(model.prepare_inputs_for_generation(ids, mi, cfg));
    const { data, dims } = out.logits;
    const v = dims.at(-1);
    const seq = dims.at(-2);
    return seqs.map((q, b) => {
      let lp = 0;
      q.forEach((tok, j) => {
        const pos = k.init.length - 1 + j;
        const row = data.subarray((b * seq + pos) * v, (b * seq + pos + 1) * v);
        lp += row[tok] - logTotal(row);
      });
      return +(lp / q.length).toFixed(3);
    });
  };
  return hear;
}
