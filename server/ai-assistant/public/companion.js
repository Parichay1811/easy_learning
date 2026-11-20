// The learner, when signed in on the site: what the teacher says and offers
// at the start. Pure functions (no page), so they can be checked in Node.
//
// The site's AI Teacher page sends a short summary from GET /api/learn/companion:
// { name, focus: [{ skill, name, strategy }], wins: [{ name }], prefers }.
// Nothing the learner typed or said is in it.
//
// How it reaches the page: client/src/pages/AITeacher.jsx fetches the summary
// with the learner's token and posts { type: "learnigo:companion", companion }
// to this frame, to this origin only; app.js reads it only from window.parent
// and this origin, and says "learnigo:teacher-ready" when it is listening.
// Without it (not signed in, the site's pop-up, an older server) nothing changes.
//
// How the learner likes things explained (`prefers`: visual | guided | words)
// already shapes the hello and the skill chips ("… with pictures", "…, step by
// step"), and rides along with every question as context.style. The router
// (lib/router.mjs) does not read it yet. To let it shape a lesson it would:
//   - visual: open with the pack's picture or simulation (pack.visual / its
//     figure) and keep each step's words short;
//   - guided: split the explanation into one idea per step and, after each,
//     wait for "yes / go on" (a plan with `awaiting` yes/no), reading every
//     hint in order;
//   - words: start with the lesson's key takeaways as plain sentences.
// and the voice could slow a little for "guided" (voice.speed), which changes
// the cached audio key, so only after the hello.

const STRATEGIES = new Set(["words", "visual", "guided", "simpler", "reassess"]);

// Plain text only: no markup, no control characters, short.
const clean = (v, n) =>
  typeof v === "string"
    ? v.replace(/[\u0000-\u001f<>{}]/g, " ").replace(/\s+/g, " ").trim().slice(0, n)
    : "";

/** "Taking away within 10" -> "taking away within 10" mid-sentence (not "TV", "I" or "English"). */
export const lower = (t) =>
  /^[A-Z][a-z]/.test(t) && !/^(English|Earth|Sun|Moon|Mars|Venus|Jupiter)\b/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
export const upper = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/** The summary as sent by the page around this one, checked and trimmed; null when there is nothing to use. */
export function readCompanion(d) {
  if (!d || typeof d !== "object") return null;
  const focus = (Array.isArray(d.focus) ? d.focus : [])
    .map((f) => ({
      skill: clean(f?.skill, 80),
      name: clean(f?.name, 60),
      strategy: STRATEGIES.has(f?.strategy) ? f.strategy : "",
    }))
    .filter((f) => f.name)
    .slice(0, 3);
  const wins = (Array.isArray(d.wins) ? d.wins : [])
    .map((w) => ({ name: clean(typeof w === "string" ? w : w?.name, 60) }))
    .filter((w) => w.name)
    .slice(0, 2);
  const prefers = ["words", "visual", "guided"].includes(d.prefers) ? d.prefers : null;
  const name = clean(d.name, 40).split(" ")[0] || "";
  if (!name && !focus.length && !wins.length) return null;
  return { name, focus, wins, prefers };
}

// How to try a skill again: the way that helped last time, else the way the
// learner likes things explained.
const howOf = (f, c) =>
  ["visual", "guided", "simpler"].includes(f.strategy)
    ? f.strategy
    : c?.prefers === "visual" || c?.prefers === "guided"
      ? c.prefers
      : "words";
const HOW = {
  visual: "shall we try it with pictures?",
  guided: "shall we go through it step by step, together?",
  simpler: "shall we start with an easier one?",
  words: "shall we have another go?",
};

/** The chip that starts a lesson on a skill: "Taking away with pictures". */
export function chipLabel(f, c) {
  const how = howOf(f, c);
  if (how === "visual") return `${upper(f.name)} with pictures`;
  if (how === "guided") return `${upper(f.name)}, step by step`;
  return `Practise ${lower(f.name)}`;
}

/** The welcome, { hello, line }: something real about this learner, kind and short. */
export function companionLines(c) {
  if (!c) return null;
  const hello = c.name ? `Welcome back, ${c.name}!` : "Welcome back!";
  const f = c.focus?.[0];
  const w = c.wins?.[0];
  let line = "";
  if (f && f.strategy && f.strategy !== "words" && f.strategy !== "reassess")
    line = `Last time, ${lower(f.name)} was tricky, so ${HOW[howOf(f, c)]}`;
  else if (f) line = `Shall we carry on with ${lower(f.name)}?`;
  if (w) line = `You've got the hang of ${lower(w.name)}. ${line ? upper(line) : "Ready for something new?"}`;
  if (!line) line = "What shall we learn today?";
  return { hello, line: upper(line) };
}
