#!/usr/bin/env node
// Measures the live teacher against a running server: how each question is
// routed and how fast, how long a new sentence of voice takes, and a full
// spoken round trip (the teacher's voice says the question, the hearing model hears it back).
//   node bench.mjs [http://localhost:4173]
const base = process.argv[2] || 'http://localhost:4173';
const QUESTIONS = [
  'My garden is 12 m by 7.5 m, how much turf do I need?',
  'how much fencing for a field eight metres by five metres',
  'area of a circle with diameter ten centimetres',
  'add vectors 3 4 and minus 1 2',
  'Why do we halve for a triangle?',
  'teach me circles',
  'quiz me on vectors',
  'how big is the inside of a hoop 3 m from middle to rim',
  'hello, how are you today',
  'in a column vector which number goes sideways',
  'how much carpet for my bedroom',
  'the Aroheadhuche.',
  'Who painted the Mona Lisa?',
  'why is the sky blue',
];

const post = (path, body, type = 'application/json') => fetch(base + path, { method: 'POST', headers: { 'Content-Type': type }, body });

// /api/ask streams events; returns them with the time each arrived.
async function ask(text) {
  const t0 = performance.now();
  const res = await post('/api/ask', JSON.stringify({ text }));
  const events = [];
  let buf = '';
  for await (const chunk of res.body) {
    buf += Buffer.from(chunk).toString();
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.trim()) events.push({ ...JSON.parse(line), at: Math.round(performance.now() - t0) });
    }
  }
  const plan = events.find((e) => e.type === 'plan') || {};
  return { plan, events, ack: events.find((e) => e.type === 'ack'), step: events.find((e) => e.type === 'step'), total: Math.round(performance.now() - t0) };
}

function wavToFloat16k(buf) {
  const rate = buf.readUInt32LE(24);
  const n = (buf.length - 44) / 2;
  const src = new Float32Array(n);
  for (let i = 0; i < n; i++) src[i] = buf.readInt16LE(44 + i * 2) / 32768;
  const out = new Float32Array(Math.floor((n * 16000) / rate));
  for (let i = 0; i < out.length; i++) {
    const x = (i * rate) / 16000;
    const j = Math.floor(x);
    out[i] = src[j] + ((src[j + 1] ?? src[j]) - src[j]) * (x - j);
  }
  return out;
}

console.log(`Routing (${base}): first thing to say, the plan, the first spoken sentence of a streamed answer`);
for (const q of QUESTIONS) {
  const { plan, ack, step, total } = await ask(q);
  const what = `${plan.kind} ${plan.context?.template || plan.topic || ''}`.trim();
  console.log(`  ${q}`);
  console.log(`      ${plan.tier?.padEnd(7)} ${what.padEnd(26)} ack ${ack ? `${ack.at} ms “${ack.say}”` : '-'}  plan ${plan.at ?? '-'} ms${step ? `  first sentence ${step.at} ms “${step.step.say.slice(0, 60)}”` : ''}  total ${total} ms`);
}

console.log('\nVoice (a new sentence each time, so nothing is cached)');
for (const n of [1, 2, 3]) {
  const text = `Test sentence number ${Date.now() % 100000 + n}: twelve times seven point five is ninety square metres.`;
  const t0 = performance.now();
  const res = await fetch(`${base}/api/tts?${new URLSearchParams({ text })}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const secs = (buf.length - 44) / 2 / 24000;
  console.log(`  ${String(Math.round(performance.now() - t0)).padStart(5)} ms for ${secs.toFixed(1)} s of speech`);
}

console.log('\nSpoken round trip (the teacher voice says it, the hearing model hears it, the router answers)');
for (const q of QUESTIONS.slice(0, 4)) {
  const wav = Buffer.from(await (await fetch(`${base}/api/tts?${new URLSearchParams({ text: q })}`)).arrayBuffer());
  const samples = wavToFloat16k(wav);
  const t0 = performance.now();
  const heard = await (await post('/api/asr', Buffer.from(samples.buffer), 'application/octet-stream')).json();
  const t1 = performance.now();
  if (heard.error) { console.log(`  hearing failed: ${heard.error}`); continue; }
  const { plan } = await ask(heard.text);
  console.log(`  hear ${Math.round(t1 - t0)} ms + route ${plan.at} ms  "${heard.text}" -> ${plan.tier} ${plan.context?.template || plan.kind}`);
}
