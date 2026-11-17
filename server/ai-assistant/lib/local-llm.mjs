// The small language model inside this server: llama.cpp through
// node-llama-cpp (MIT; prebuilt for macOS, Linux and Windows, CPU or GPU
// found by itself), with Qwen3.5 0.8B (Apache-2.0) as a 533 MB GGUF file
// downloaded on the first start into the model cache. No Ollama, no other
// service: `npm install && npm start` is the whole setup on any server.
// Same interface as lib/llm.mjs (classify, chat) and lib/fast.mjs (ack), so
// the router does not know which one it talks to.
import path from 'node:path';
import fs from 'node:fs';
import { TEMPLATES } from '../shared/solvers.js';
import { ACKS, GENERIC_ACKS } from '../shared/lines.js';
import { CHAT_SYSTEM, sentenceSplitter } from './llm.mjs';
import { cleanTopic, fromQuestion, TOPIC_SYSTEM } from './fast.mjs';
import { cacheRoot } from './models.mjs';

export const DEFAULT_MODEL = 'hf:unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M';

export function createLocalLLM({ uri = DEFAULT_MODEL, cpu = false, topics = [], contextSize = 4096, log = () => {} } = {}) {
  let ready = false;
  let failed = null;
  let llama;
  let model;
  let context;
  let grammar = null;
  const free = [];
  const waiting = [];
  const templates = Object.keys(TEMPLATES);
  const name = uri.replace(/^hf:/, '').split('/').pop();

  // Loads in the background; until then the router answers from packs alone.
  const loading = (async () => {
    const { getLlama, resolveModelFile } = await import('node-llama-cpp');
    const dir = path.join(cacheRoot(), 'models', 'llm');
    fs.mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    const file = await resolveModelFile(uri, { directory: dir, cli: false });
    llama = await getLlama({ gpu: cpu ? false : 'auto' });
    model = await llama.loadModel({ modelPath: file });
    // One sequence each for the answer, the maths router and the first line.
    context = await model.createContext({ contextSize, sequences: 3 });
    for (let i = 0; i < 3; i++) free.push(context.getSequence());
    grammar = await llama.createGrammarForJsonSchema({
      type: 'object',
      properties: {
        topic: { type: 'string', enum: [...topics.map((t) => t.id), 'none'] },
        intent: { enum: ['solve', 'explain', 'quiz', 'none'] },
        template: { enum: [...templates, 'none'] },
        a: { type: 'number' }, b: { type: 'number' }, c: { type: 'number' }, d: { type: 'number' },
        unit: { enum: ['', 'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd'] },
      },
      required: ['topic', 'intent', 'template', 'a', 'b', 'c', 'd', 'unit'],
    });
    ready = true;
    log(`local model ${name} ready in ${((Date.now() - t0) / 1000).toFixed(1)} s (${llama.gpu || 'cpu'}, ${llama.cpuMathCores} cores)`);
  })().catch((e) => { failed = e; log(`local model unavailable: ${e.message}`); });

  // A free sequence, waiting for one when all are busy (now: null at once
  // instead, for a quick extra that is not worth a wait).
  async function withSequence(fn, { now = false } = {}) {
    if (now && !free.length) return null;
    const seq = free.pop() || (await new Promise((r) => waiting.push(r)));
    const { LlamaChatSession } = await import('node-llama-cpp');
    try {
      return await fn(seq, LlamaChatSession);
    } finally {
      // The next one gets the sequence once it is empty again.
      try { await seq.clearHistory?.(); } catch { /* a fresh session starts from its own prompt */ }
      const next = waiting.shift();
      if (next) next(seq); else free.push(seq);
    }
  }

  async function available() { return ready && !failed; }

  async function classify(text, { signal } = {}) {
    if (!ready) return null;
    return withSequence(async (seq, Session) => {
      const session = new Session({ contextSequence: seq, systemPrompt: `Route a student's maths question. Topics: ${topics.map((t) => `${t.id} = ${t.title}`).join('; ')}. Templates: ${templates.map((t) => `${t} (${TEMPLATES[t].what})`).join(', ')}. Reply in JSON.` });
      try {
        const out = await session.prompt(text.slice(0, 400), { grammar, maxTokens: 120, temperature: 0, budgets: { thoughtTokens: 0 }, signal, stopOnAbortSignal: true });
        const r = grammar.parse(out);
        return { ...r, topic: r.topic === 'none' ? null : r.topic };
      } catch { return null; } finally { session.dispose({ disposeSequence: false }); }
    });
  }

  // Streamed spoken answer: onSentence gets each sentence as it completes.
  async function chat(text, { history = [], notes = [], onSentence, signal } = {}) {
    if (!ready) return 0;
    const grounding = notes.length ? `\nTeacher's notes (checked facts; use them when they help, never contradict them):\n${notes.map((n) => `- ${n}`).join('\n')}` : '';
    return withSequence(async (seq, Session) => {
      const session = new Session({ contextSequence: seq, systemPrompt: CHAT_SYSTEM + grounding });
      const turns = [];
      for (const h of history.slice(-3)) {
        if (h.q) turns.push({ type: 'user', text: String(h.q).slice(0, 300) });
        if (h.a) turns.push({ type: 'model', response: [String(h.a).slice(0, 300)] });
      }
      if (turns.length) session.setChatHistory([{ type: 'system', text: CHAT_SYSTEM + grounding }, ...turns]);
      // Three sentences at most: a tiny model that goes on starts to wander.
      const enough = new AbortController();
      let count = 0;
      // Greetings and "I am happy to help" say nothing: they are dropped.
      const FILLER = /^(hello|hi|hey|great question|good question|sure|okay|of course)\b[^.?!]{0,30}[.!?]?$|^(i am|i'm) (learnigo|your teacher|happy|glad|here)\b|^(i('d| would) (love|be happy) to|let me (explain|tell you))\b/i;
      const split = sentenceSplitter((sentence) => { if (count >= 3 || FILLER.test(sentence.trim()) || sentence.trim().split(/\s+/).length < 3) return; onSentence(sentence, count); count++; if (count >= 3) enough.abort(); });
      const stop = AbortSignal.any([AbortSignal.timeout(30000), enough.signal, ...(signal ? [signal] : [])]);
      try {
        await session.prompt(text.slice(0, 400), {
          maxTokens: 160, temperature: 0.3, budgets: { thoughtTokens: 0 },
          signal: stop, stopOnAbortSignal: true,
          onTextChunk: (chunk) => split.push(chunk),
        });
      } finally { session.dispose({ disposeSequence: false }); }
      split.end();
      return count;
    });
  }

  // The topic of a question, for the line said while the answer is made.
  async function topicOf(text, ms = 900) {
    if (!ready) return null;
    return withSequence(async (seq, Session) => {
      const session = new Session({ contextSequence: seq, systemPrompt: TOPIC_SYSTEM });
      try {
        const out = await session.prompt(text.slice(0, 300), { maxTokens: 12, temperature: 0, budgets: { thoughtTokens: 0 }, signal: AbortSignal.timeout(ms), stopOnAbortSignal: true });
        return cleanTopic(out);
      } catch { return null; } finally { session.dispose({ disposeSequence: false }); }
    }, { now: true });
  }

  return { available, classify, chat, topicOf, model: name, loading, get failed() { return failed; } };
}

// The first line ("Good question about volcanoes...") from the same model.
export function createLocalFast(local) {
  let n = 0;
  async function ack(text) {
    let t = await local.topicOf(text).catch(() => null);
    if (t && !fromQuestion(t, text)) t = null;
    const i = n++;
    if (!t) return { say: GENERIC_ACKS[i % GENERIC_ACKS.length], topic: null };
    const lower = /^(the|a|an)\b/i.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
    return { say: ACKS[i % ACKS.length].replace('{topic}', lower).replace('{Topic}', t[0].toUpperCase() + t.slice(1)), topic: t[0].toUpperCase() + t.slice(1) };
  }
  return { ack, warm: () => local.topicOf('hello').catch(() => {}), topic: (t) => local.topicOf(t), model: local.model };
}
