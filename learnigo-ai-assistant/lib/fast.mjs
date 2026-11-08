// The fast model: a small model on the CPU through Ollama (Qwen3.5 0.8B by
// default, the same one that answers, so a host loads one model). It
// only pulls the topic out of a question ("Who painted the Mona Lisa?" ->
// "the Mona Lisa") for the line the teacher says while the real answer is
// being made. Tiny models answer fast but often wrongly, so this one is never
// asked to answer anything.
import { ACKS, GENERIC_ACKS } from '../shared/lines.js';
import { createWarm } from './warm.mjs';

export const TOPIC_SYSTEM = "Extract the main subject of the student's question as a short noun phrase of 1 to 4 words. Reply with the phrase only, no sentence, no answer.";

export function createFast({ host = 'http://127.0.0.1:11434', model = 'qwen3.5:0.8b', cpu = false, timeoutMs = 700 } = {}) {
  // Same CPU/GPU setting as the LLM: Ollama reloads a model whose setting changes.
  const think = /qwen3|gemma4|deepseek-r1/.test(model) ? { think: false } : {};
  let n = 0;
  const pick = createWarm(host);
  async function topic(text) {
    // Only when its own model is loaded (or nothing is): a swap would never
    // finish in time, and the generic line is fine.
    const use = await pick(model);
    if (use.swapped) return null;
    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model, stream: false, ...think, keep_alive: '60m',
        options: { temperature: 0, num_predict: 12, ...(use.ctx ? { num_ctx: use.ctx } : {}), ...(cpu ? { num_gpu: 0 } : {}) },
        messages: [{ role: 'system', content: TOPIC_SYSTEM }, { role: 'user', content: text.slice(0, 300) }],
      }),
    });
    const data = await res.json();
    return cleanTopic(data.message?.content || '');
  }

  // The line to say now, with the topic when the fast model gives one in time.
  // The topic must be made of the student's own words: a small model asked
  // for the topic of "Who painted the Mona Lisa?" once said "Michelangelo",
  // an answer, and a wrong one.
  async function ack(text) {
    let t = await topic(text).catch(() => null);
    if (t && !fromQuestion(t, text)) t = null;
    const i = n++;
    if (!t) return { say: GENERIC_ACKS[i % GENERIC_ACKS.length], topic: null };
    const lower = /^(the|a|an)\b/i.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
    const line = ACKS[i % ACKS.length].replace('{topic}', lower).replace('{Topic}', t[0].toUpperCase() + t.slice(1));
    return { say: line, topic: t[0].toUpperCase() + t.slice(1) };
  }

  const warm = () => topic('hello').catch(() => {});
  return { topic, ack, warm, model };
}

// Every content word of the topic appears in the question (plurals folded).
export function fromQuestion(topicText, question) {
  const stem = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(es|s)$/, '');
  const asked = new Set(question.split(/\s+/).map(stem));
  const words = topicText.split(/\s+/).map(stem).filter((w) => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w));
  return words.length > 0 && words.every((w) => asked.has(w));
}

export function cleanTopic(raw) {
  const t = raw.split('\n')[0].replace(/["“”'`*.:!?]/g, '').replace(/\s+/g, ' ').trim();
  const words = t.split(' ');
  if (!t || words.length > 5 || /^(i|you|sorry|yes|no|hello)\b/i.test(t)) return null;
  return t;
}
