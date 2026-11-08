// The knowledge base: every pack turned into small searchable cards, so a
// question finds its answer by search instead of a big model. A card is one
// thing the teacher can do: say a checked answer (faq, fact), teach a lesson,
// ask a quiz question, or run a maths tool with the student's numbers.
//
// Search is hybrid: BM25 over content words (exact terms) plus the cosine of
// sentence embeddings (meaning), 0.65 * meaning + 0.35 * words. On paraphrased
// questions that found the right card 13 times in 14 at about 6 ms, where a
// 0.5B chat model asked to pick from the top 5 got 3 in 14 in a second
// (eval-kb.mjs). The words the teacher says always come from the card,
// written and checked by people.
import { tokens } from "./packs.mjs";
import { TEMPLATES } from "../shared/solvers.js";
import { DIMS } from "./embed.mjs";

// Extra words for the maths tools, so "carpet for my bedroom" finds rect_area.
const TOOL_WORDS = {
  rect_area:
    "area rectangle square turf carpet floor lawn garden room bedroom paint cover tiles how much space",
  rect_perimeter:
    "perimeter rectangle fence fencing border edge around frame skirting rope how far round how long round the garden field room distance all the way round",
  tri_area: "area triangle base height half triangular sail roof gable",
  circle_area:
    "area circle radius diameter pizza pond round disc inside space pi",
  circle_circumference:
    "circumference circle round edge rim wheel distance around pi diameter radius",
  vec_add: "add vectors column vector plus sum resultant move then",
  vec_sub: "subtract vectors column vector minus difference take away",
};

export function buildCards(packs) {
  const cards = [];
  for (const p of packs.values()) {
    const topicWords = `${p.title} ${p.keywords.join(" ")}`;
    p.faq.forEach(({ q, a, asks }, i) =>
      cards.push({
        id: `${p.id}/faq/${i}`,
        kind: "faq",
        pack: p.id,
        label: q,
        q,
        a,
        phrasings: [q, ...asks],
        text: `${q} ${q} ${asks.join(" ")} ${a}`,
      }),
    );
    (p.facts || []).forEach((f, i) =>
      cards.push({
        id: `${p.id}/fact/${i}`,
        kind: "fact",
        pack: p.id,
        label: f,
        a: f,
        phrasings: [f],
        text: `${f} ${topicWords}`,
      }),
    );
    const lesson = `Teach the lesson on ${p.title.toLowerCase()}`;
    // A long title ("Achebe's Things Fall Apart: Okonkwo, Umuofia and…") is
    // also asked for by its short name (the part before the colon) and by
    // its first keyword ("explain Things Fall Apart").
    const short = p.title.includes(":")
      ? p.title.split(":")[0].trim().toLowerCase()
      : "";
    const key = (p.keywords[0] || "").toLowerCase();
    const named = [...new Set([short, key])]
      .filter((n) => n && n.split(/\s+/).length >= 2)
      .flatMap((n) => [`explain ${n}`, `teach me about ${n}`]);
    cards.push({
      id: `${p.id}/lesson`,
      kind: "lesson",
      pack: p.id,
      label: lesson,
      phrasings: [lesson, `explain ${p.title.toLowerCase()}`, ...named],
      text: `teach explain lesson learn ${topicWords} ${topicWords} ${p.explain.map((s) => s.say).join(" ")}`,
    });
    const quiz = `Give a practice question on ${p.title.toLowerCase()}`;
    cards.push({
      id: `${p.id}/quiz`,
      kind: "quiz",
      pack: p.id,
      label: quiz,
      phrasings: [quiz],
      text: `quiz test practice question try ${topicWords}`,
    });
  }
  for (const [name, t] of Object.entries(TEMPLATES)) {
    const label = `Work out the ${t.what} from the student's numbers`;
    cards.push({
      id: `tool/${name}`,
      kind: "tool",
      tool: name,
      pack: t.topic,
      label,
      phrasings: [label],
      text: `${t.what} ${TOOL_WORDS[name] || ""}`,
    });
  }
  return cards;
}

export function createIndex(
  cards,
  { k1 = 1.4, b = 0.75, embedder = null, log = null } = {},
) {
  // Word search: an inverted index (word -> [card, count]), so a query only
  // touches the cards that share its words.
  const lens = new Float32Array(cards.length);
  const postings = new Map();
  cards.forEach((c, i) => {
    const toks = tokens(c.text);
    lens[i] = toks.length;
    const tf = new Map();
    for (const w of toks) tf.set(w, (tf.get(w) || 0) + 1);
    for (const [w, f] of tf) {
      if (!postings.has(w)) postings.set(w, []);
      postings.get(w).push(i, f);
    }
  });
  const avg = lens.reduce((s, l) => s + l, 0) / Math.max(1, cards.length);
  const idf = (w) => {
    const df = (postings.get(w)?.length || 0) / 2;
    return Math.log(1 + (cards.length - df + 0.5) / (df + 0.5));
  };

  // The best cards with their BM25 scores, best first.
  function search(query, limit = 5, filter = null) {
    const scores = new Map();
    for (const w of new Set(tokens(query))) {
      const list = postings.get(w);
      if (!list) continue;
      const weight = idf(w);
      for (let j = 0; j < list.length; j += 2) {
        const i = list[j];
        const f = list[j + 1];
        scores.set(
          i,
          (scores.get(i) || 0) +
            weight *
              ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * lens[i]) / avg))),
        );
      }
    }
    const out = [];
    for (const [i, score] of scores)
      if (!filter || filter(cards[i])) out.push({ card: cards[i], score });
    return out.sort((x, y) => y.score - x.score).slice(0, limit);
  }

  // Meaning search: every phrasing's vector in one matrix, row -> card.
  let matrix = null;
  let rowCard = null;
  const embedded = embedder
    ? (async () => {
        const texts = [];
        const owners = [];
        cards.forEach((c, i) =>
          c.phrasings.forEach((p) => {
            texts.push(p);
            owners.push(i);
          }),
        );
        const t0 = Date.now();
        const vecs = await embedder.embedMany(texts);
        embedder.save();
        const m = new Float32Array(texts.length * DIMS);
        vecs.forEach((v, r) => m.set(v, r * DIMS));
        matrix = m;
        rowCard = Int32Array.from(owners);
        log?.(
          `knowledge base: ${cards.length} cards, ${texts.length} phrasings embedded in ${Date.now() - t0} ms`,
        );
      })()
    : Promise.resolve();

  // Hybrid search: { card, score } best first; score 0..1. Word search
  // alone while there is no embedder or it is still loading.
  async function find(query, limit = 5) {
    const words = search(query, 50);
    if (!matrix)
      return words
        .slice(0, limit)
        .map((w) => ({
          card: w.card,
          score: Math.min(1, w.score / 12),
          words: w.score,
        }));
    const top = Math.max(1, ...words.map((w) => w.score));
    const lexical = new Map(words.map((w) => [w.card, w.score / top]));
    const v = await embedder.embed(query, { query: true });
    const best = new Float32Array(cards.length).fill(-1);
    for (let r = 0, o = 0; r < rowCard.length; r++, o += DIMS) {
      let s = 0;
      for (let k = 0; k < DIMS; k++) s += v[k] * matrix[o + k];
      if (s > best[rowCard[r]]) best[rowCard[r]] = s;
    }
    const out = [];
    for (let i = 0; i < cards.length; i++) {
      const score = 0.65 * best[i] + 0.35 * (lexical.get(cards[i]) || 0);
      if (score > 0.2) out.push({ card: cards[i], score, meaning: best[i] });
    }
    return out.sort((x, y) => y.score - x.score).slice(0, limit);
  }

  // Several versions of one sentence ("explain the venom theorem",
  // "explain Thevenin theorem"…) scored the way find() scores them, but only
  // against a shortlist: the best 30 cards for the first version, the word
  // hits of every version and the cards of the given packs. One embedding
  // batch and a few thousand rows instead of a full search per version.
  // -> [{ card, score }] for each version (its best card, or null).
  const index = new Map(cards.map((c, i) => [c, i]));
  const byPack = new Map();
  cards.forEach((c, i) => {
    if (!byPack.has(c.pack)) byPack.set(c.pack, []);
    byPack.get(c.pack).push(i);
  });
  async function rank(texts, packIds = []) {
    if (!matrix)
      return Promise.all(texts.map(async (t) => (await find(t, 1))[0] || null));
    const short = new Set(
      (await find(texts[0], 30)).map((h) => index.get(h.card)),
    );
    const words = texts.map((t) => search(t, 30));
    for (const w of words) for (const h of w) short.add(index.get(h.card));
    for (const id of packIds)
      for (const i of byPack.get(id) || []) short.add(i);
    const vecs = await embedder.embedMany(texts, { query: true });
    const rows = [];
    for (let r = 0; r < rowCard.length; r++)
      if (short.has(rowCard[r])) rows.push(r);
    return texts.map((t, q) => {
      const v = vecs[q];
      const top = Math.max(1, ...words[q].map((w) => w.score));
      const lexical = new Map(
        words[q].map((w) => [index.get(w.card), w.score / top]),
      );
      const best = new Map();
      for (const r of rows) {
        let s = 0;
        const o = r * DIMS;
        for (let k = 0; k < DIMS; k++) s += v[k] * matrix[o + k];
        const i = rowCard[r];
        if (!(best.get(i) >= s)) best.set(i, s);
      }
      let hit = null;
      for (const [i, m] of best) {
        const score = 0.65 * m + 0.35 * (lexical.get(i) || 0);
        if (!hit || score > hit.score)
          hit = { card: cards[i], score, meaning: m };
      }
      return hit && hit.score > 0.2 ? hit : null;
    });
  }

  return {
    search,
    find,
    rank,
    embedded,
    size: cards.length,
    cards,
    get hybrid() {
      return !!matrix;
    },
  };
}
