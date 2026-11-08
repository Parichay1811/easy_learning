// The local model (qwen3.5 through Ollama, LT_LLM=ollama) for what rules and packs cannot do:
// classify a maths question with numbers no rule understood (JSON only, the
// lesson still comes from a template), and answer anything else in a few
// spoken sentences, streamed.
import { TEMPLATES } from '../shared/solvers.js';
import { createWarm } from './warm.mjs';

export function createLLM({ host = 'http://127.0.0.1:11434', model = 'qwen3.5:0.8b', cpu = false, timeoutMs = 8000, topics = [] } = {}) {
  // Thinking models (qwen3, gemma4...) answer at once with thinking off; older ones reject the flag.
  const thinkOf = (m) => (/qwen3|gemma4|deepseek-r1/.test(m) ? { think: false } : {});
  const pick = createWarm(host);
  let up = null;
  let checkedAt = 0;
  const templates = Object.keys(TEMPLATES);
  const schema = {
    type: 'object',
    properties: {
      topic: { type: ['string', 'null'], enum: [...topics.map((t) => t.id), null] },
      intent: { type: 'string', enum: ['solve', 'explain', 'quiz', 'none'] },
      template: { type: 'string', enum: [...templates, 'none'] },
      a: { type: 'number' }, b: { type: 'number' }, c: { type: 'number' }, d: { type: 'number' },
      unit: { type: 'string', enum: ['', 'mm', 'cm', 'm', 'km', 'in', 'ft', 'yd'] },
    },
    required: ['topic', 'intent', 'template', 'a', 'b', 'c', 'd', 'unit'],
  };
  const system = [
    'You route a student\'s question in a maths teaching app. Reply with JSON only.',
    `Topics: ${topics.map((t) => `${t.id} = ${t.title}`).join('; ')}.`,
    'intent: solve (they give numbers to work out), explain (teach the topic), quiz (they want a question), none (not one of these topics).',
    `template, for solve: ${templates.map((t) => `${t} (${TEMPLATES[t].what})`).join(', ')}.`,
    'Numbers: rectangles a = length, b = width; triangles a = base, b = height; circles a = radius (half of a diameter);',
    'vectors a, b = the first vector top and bottom, c, d = the second. Use 0 for unused numbers.',
  ].join('\n');

  async function available() {
    if (Date.now() - checkedAt < (up ? 30000 : 5000)) return up;
    checkedAt = Date.now();
    try {
      const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(2500) });
      const { models = [] } = await res.json();
      up = models.some((m) => m.name === model || m.model === model);
    } catch { up = false; }
    return up;
  }

  async function classify(text) {
    if (!(await available())) return null;
    const use = await pick(model);
    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: use.model, stream: false, ...thinkOf(use.model), keep_alive: '30m', format: schema,
        options: { temperature: 0, ...(use.ctx ? { num_ctx: use.ctx } : {}), ...(cpu && !use.swapped ? { num_gpu: 0 } : {}) },
        messages: [{ role: 'system', content: system }, { role: 'user', content: text.slice(0, 400) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    try { return JSON.parse(data.message.content); } catch { return null; }
  }

  // A short spoken answer to anything outside the lessons, streamed: each
  // sentence goes to onSentence as soon as it is complete, so the teacher
  // starts speaking while the rest is still being written.
  async function chat(text, { history = [], notes = [], onSentence, signal } = {}) {
    // Checked facts from the knowledge base, closest first: a small model is
    // far more accurate rephrasing these than recalling facts on its own.
    const grounding = notes.length ? `\nTeacher's notes (checked facts; use them when they help, never contradict them):\n${notes.map((n) => `- ${n}`).join('\n')}` : '';
    const messages = [{ role: 'system', content: CHAT_SYSTEM + grounding }];
    for (const h of history.slice(-3)) {
      if (h.q) messages.push({ role: 'user', content: String(h.q).slice(0, 300) });
      if (h.a) messages.push({ role: 'assistant', content: String(h.a).slice(0, 300) });
    }
    messages.push({ role: 'user', content: text.slice(0, 400) });
    const use = await pick(model);
    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000),
      body: JSON.stringify({ model: use.model, stream: true, ...thinkOf(use.model), keep_alive: '30m', options: { temperature: 0.3, num_predict: 160, ...(use.ctx ? { num_ctx: use.ctx } : {}), ...(cpu && !use.swapped ? { num_gpu: 0 } : {}) }, messages }),
    });
    if (!res.ok || !res.body) return 0;
    const split = sentenceSplitter(onSentence);
    const decoder = new TextDecoder();
    let rest = '';
    for await (const chunk of res.body) {
      rest += decoder.decode(chunk, { stream: true });
      const lines = rest.split('\n');
      rest = lines.pop();
      for (const line of lines) if (line.trim()) split.push(JSON.parse(line).message?.content || '');
    }
    return split.end();
  }

  return { available, classify, chat, model };
}

export const CHAT_SYSTEM = [
  'You are Learnigo, a warm, patient teacher talking out loud with one school student.',
  'Start with the answer itself: never greet, never say who you are, never say you are happy to help.',
  'Answer in two or three short spoken sentences with simple words and correct facts.',
  'No lists, no markdown, no emojis, no headings. If you are not sure, say so.',
  'Answer every curious question, on any subject, with the facts in the notes when there are notes.',
  'Only if a question is unsafe or hurtful, kindly say you cannot help with that.',
].join('\n');

// Collects streamed text and hands out whole sentences ("3.5" stays whole:
// a full stop counts only when a space follows it).
export function sentenceSplitter(onSentence) {
  let buf = '';
  let n = 0;
  const clean = (s) => s.replace(/[*#_`]/g, '').replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim();
  const emit = (s, last = false) => { const c = clean(s); if (c && (last || n === 0 || c.split(' ').length >= 2)) onSentence?.(c, n++); };
  return {
    push(text) {
      buf += text;
      let m;
      while ((m = buf.match(/^([\s\S]*?[.!?])(\s+)([\s\S]*)$/))) { emit(m[1]); buf = m[3]; }
    },
    end() { if (buf.trim()) emit(buf, true); buf = ''; return n; },
  };
}
