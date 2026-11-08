// The teacher's tools, in one registry with JSON schemas: what the website's
// router does, what an MCP client (Claude, ChatGPT, VS Code...) can call
// through /mcp, and what a small model can be asked to choose between. Every
// tool returns a lesson plan ({ steps: [{ say, draw }] }) plus plain text.
import { TEMPLATES, solvePlan, quizStep } from '../shared/solvers.js';
import { packPlan, cardPlan, respond } from './router.mjs';

// The numbers each maths template takes, in order.
const FIELDS = {
  rect_area: ['length', 'width'], rect_perimeter: ['length', 'width'], tri_area: ['base', 'height'],
  circle_area: ['radius'], circle_circumference: ['radius'],
  vec_add: ['a_top', 'a_bottom', 'b_top', 'b_bottom'], vec_sub: ['a_top', 'a_bottom', 'b_top', 'b_bottom'],
};

// The words of a plan, for clients that show text.
export function planText(plan) {
  const lines = (plan.steps || []).map((s) => s.say);
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

export function createTools({ packs, kb, llm = null, fast = null }) {
  const topicIds = [...packs.keys()];
  const tools = [
    {
      name: 'ask_teacher',
      description: 'Ask the Learnigo teacher what a student would ask (a maths question with numbers, "teach me circles", "why do we halve for a triangle?"). Returns the spoken answer and the lesson steps to draw.',
      inputSchema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
      async run({ question }) {
        const events = [];
        const tier = await respond(String(question), { packs, kb, llm, fast, emit: (e) => events.push(e) });
        const plan = events.find((e) => e.type === 'plan') || {};
        plan.steps = [...(plan.steps || []), ...events.filter((e) => e.type === 'step').map((e) => e.step)];
        return { plan: { ...plan, tier } };
      },
    },
    {
      name: 'search_knowledge',
      description: 'Search the checked lesson knowledge base. Returns the closest cards (common questions with answers, lessons, quizzes, maths tools) with a 0 to 1 score.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['query'] },
      async run({ query, limit = 5 }) {
        const hits = await kb.find(String(query), limit);
        const cards = hits.map((h) => ({ id: h.card.id, kind: h.card.kind, topic: h.card.pack, label: h.card.label, answer: h.card.a || null, score: +h.score.toFixed(3) }));
        return { data: cards, text: cards.map((c) => `${c.score} ${c.id}: ${c.label}${c.answer ? ` — ${c.answer}` : ''}`).join('\n') };
      },
    },
    {
      name: 'use_card',
      description: 'Teach from one knowledge-base card by its id (from search_knowledge).',
      inputSchema: { type: 'object', properties: { id: { type: 'string' }, question: { type: 'string' } }, required: ['id'] },
      async run({ id, question = '' }) {
        const card = kb.cards.find((c) => c.id === id);
        if (!card) throw Object.assign(new Error(`no card ${id}`), { code: -32602 });
        return { plan: cardPlan(card, { text: question, packs }) };
      },
    },
    {
      name: 'list_topics',
      description: 'The topics the teacher has lessons for, with example questions.',
      inputSchema: { type: 'object', properties: {} },
      async run() {
        const data = [...packs.values()].map((p) => ({ id: p.id, title: p.title, examples: p.examples }));
        return { data, text: data.map((p) => `${p.id}: ${p.title} (e.g. ${p.examples.join('; ')})`).join('\n') };
      },
    },
    {
      name: 'explain_topic',
      description: 'The short drawn lesson on a topic, ending with a question for the student.',
      inputSchema: { type: 'object', properties: { topic_id: { type: 'string', enum: topicIds } }, required: ['topic_id'] },
      async run({ topic_id: id }) { return { plan: packPlan(packs.get(id), 'explain') }; },
    },
    {
      name: 'practice_question',
      description: 'One exam-style multiple-choice question on a topic, with the answer and why each wrong option is wrong.',
      inputSchema: { type: 'object', properties: { topic_id: { type: 'string', enum: topicIds } }, required: ['topic_id'] },
      async run({ topic_id: id }) {
        const plan = packPlan(packs.get(id), 'quiz');
        const q = plan.awaiting;
        return { plan, text: `${quizStep(q).say}\nAnswer: ${'ABCD'[q.answer]}. ${q.why}` };
      },
    },
    ...Object.entries(TEMPLATES).map(([name, t]) => ({
      name: `solve_${name}`,
      description: `Work out the ${t.what} step by step, drawn and narrated, then a fresh practice question.`,
      inputSchema: {
        type: 'object',
        properties: { ...Object.fromEntries(FIELDS[name].map((f) => [f, { type: 'number' }])), unit: { type: 'string', enum: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd'] } },
        required: FIELDS[name],
      },
      async run(args) {
        const params = t.params(FIELDS[name].map((f) => Number(args[f])), args.unit || null, {});
        if (!params) throw Object.assign(new Error('those numbers do not make a shape'), { code: -32602 });
        return { plan: solvePlan(name, params) };
      },
    })),
  ];
  const byName = new Map(tools.map((t) => [t.name, t]));

  async function call(name, args = {}) {
    const tool = byName.get(name);
    if (!tool) throw Object.assign(new Error(`unknown tool ${name}`), { code: -32602 });
    const out = await tool.run(args);
    return { ...out, text: out.text ?? planText(out.plan) };
  }

  return { list: () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })), call };
}
