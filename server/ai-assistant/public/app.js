// The live teacher in the browser: the student talks (or types), the server
// routes it to a lesson plan, and the board draws each step while the voice
// says it. Talking over the teacher pauses it at once; what the student said
// decides what happens next (carry on, repeat, a new question...).
import { Board, BIG_OPS } from "./board.js";
import { Voice } from "./voice.js";
import { startMic } from "./mic.js";
import { answerPlan } from "./shared/solvers.js";
import { isEcho } from "./shared/echo.js";
import { GREETING, FILLERS, NOT_HEARD, GO_AHEAD } from "./shared/lines.js";
import { createOrb } from "./orb.js";
import { createScene } from "./scene.js";
import { createHaptics } from "./haptics.js";
import { readCompanion, companionLines, chipLabel, lower } from "./companion.js";
import { createLessonMemory } from "./lesson-memory.js";
import { createTopicPicker } from "./topic-picker.js";
import { createNotesStore, topicKey, lessonOf } from "./notes-store.js";
import { createNotesPanel } from "./notes-panel.js";

const $ = (id) => document.getElementById(id);
const els = {
  board: $("board"),
  start: $("start"),
  mic: $("mic"),
  stop: $("stop"),
  status: $("status"),
  form: $("ask"),
  input: $("text"),
  warm: $("warm"),
  haptic: $("haptic"),
  sounds: $("sounds"),
  sticky: $("sticky"),
  source: $("source"),
  subjectBtn: $("subject-btn"),
  subjectArea: $("subject-area"),
  subjectGroup: $("subject-group"),
  subjectIcon: document.querySelector(".subject-icon"),
  related: $("related"),
  notes: $("notes"),
};
const STATUS = {
  off: "Press Start, then allow the microphone",
  idle: "Listening: ask me anything",
  hearing: "I hear you…",
  thinking: "Thinking…",
  teaching: "Teaching: just talk to interrupt",
  paused: "Paused: I’m listening",
};
const FILLER_KINDS = new Set(["solve", "explain", "faq", "quiz", "miss"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ctx = null;
let voice = null;
let serverVoice = true; // false: the server has no voice, the browser speaks (health)
let serverHearing = true; // false: no speech recognition on the server; questions are typed (health)
let mic = null;
let run = null;
let mode = "off";
let context = {};
let awaiting = null;
let askSeq = 0;
let fillerAt = 0;
let fillerIdx = 0;
let examples = [];
// What the last answer offers to ask next ("When was he born?", "Tell me
// more"); before any, the examples on the greeting's board. The hearing
// listens for these words.
let followUps = [];
let prefix = null; // the start of a sentence the student has not finished
let prefixAt = 0;
const talk = []; // the last few questions and answers, for follow-ups
// Plans whose spoken lines are not a lesson's key points.
const NOT_LESSON = new Set(["answer", "ack", "say", "unclear", "fragment"]);

const board = new Board(els.board, {
  onSfx: (name, where) => {
    voice?.sfx(name, where);
    feel(name);
  },
  onOption: (i) => {
    if (awaiting) teach(answerPlan(awaiting, i));
  },
  // A chip on the board ("What is soap bubble?") is asked as if said; a
  // chip for one of the learner's own skills opens its lesson.
  onChip: (text) => {
    if (mode === "teaching") interrupt();
    const focus = focusChips.get(text);
    if (focus) return openFocus(focus);
    ask(text);
  },
});

// The look and feel: the orb, the 2.5D scene, and haptics on every moment.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const orb = createOrb(document.getElementById("orb"), { reduced });
const scene = createScene({ reduced });
const haptics = createHaptics({ onPulse: scene.pulse });
const SFX_FEEL = { correct: "success", wrong: "error", question: "notify" };
function feel(sfx) {
  if (SFX_FEEL[sfx]) haptics.fire(SFX_FEEL[sfx]);
}
els.haptic.setAttribute("aria-pressed", String(haptics.on));
els.haptic.title = haptics.supported
  ? "Haptics: a light touch when the teacher responds"
  : "Haptics: this device shows a visual pulse instead";
els.haptic.addEventListener("click", () => {
  const on = haptics.toggle();
  els.haptic.setAttribute("aria-pressed", String(on));
  if (on) haptics.fire("tick");
});

// Pops as the pictures appear, remembered per device; the voice stays clear either way.
let sounds = true;
try {
  sounds = localStorage.getItem("lt-sounds") !== "off";
} catch {
  /* storage blocked: on */
}
els.sounds.setAttribute("aria-pressed", String(sounds));
els.sounds.addEventListener("click", () => {
  sounds = !sounds;
  els.sounds.setAttribute("aria-pressed", String(sounds));
  try {
    localStorage.setItem("lt-sounds", sounds ? "on" : "off");
  } catch {
    /* not remembered */
  }
  if (voice) {
    voice.sounds = sounds;
    if (sounds) voice.sfx("pop", { step: 4 });
  }
});

// For checking the page from the console: window.teacher.state, and
// window.teacher.heard(text, { heard, options }) as if it was said
const history = [];
window.teacher = {
  show: (plan) => teach(plan),
  // The site's pop-up calls this as it closes, so the voice stops at once.
  silence: () => silence(),
  heard: (text) => ask(text, ++askSeq),
  get state() {
    return {
      mode,
      awaiting: !!awaiting,
      kind: run?.plan.kind,
      step: run?.i,
      history: history.slice(-12),
    };
  },
};

// While an answer is on its way (the question sent, or only the quick "let me
// think" said so far) the board shows the teacher sketching an idea, with a
// line about what she is doing. It appears only if the wait lasts a moment.
const THINKING_LINES = [
  "Thinking about your question…",
  "Finding the best way to explain it…",
  "Picking a good example…",
  "Getting the board ready…",
  "Drawing a picture for you…",
  "Almost there…",
];
const thinkingLine = $("thinkingLine");
const holoEl = document.querySelector(".holo");
let thinkingOn = false;
let thinkingShow = null;
let thinkingTurn = null;
function showThinking(on) {
  if (on === thinkingOn || !holoEl || !thinkingLine) return;
  thinkingOn = on;
  clearTimeout(thinkingShow);
  clearInterval(thinkingTurn);
  if (!on) {
    holoEl.classList.remove("is-thinking");
    return;
  }
  thinkingShow = setTimeout(() => {
    let i = 0;
    thinkingLine.textContent = THINKING_LINES[0];
    holoEl.classList.add("is-thinking");
    thinkingTurn = setInterval(() => {
      if (i >= THINKING_LINES.length - 1) return clearInterval(thinkingTurn);
      thinkingLine.classList.add("fading");
      setTimeout(() => {
        thinkingLine.textContent = THINKING_LINES[++i];
        thinkingLine.classList.remove("fading");
      }, 300);
    }, 2600);
  }, 220);
}

const PHONE = matchMedia("(max-width: 700px)");
let quietTimer = null;
function setMode(m) {
  const prev = mode;
  if (m !== mode) history.push(`${mode}→${m}`);
  mode = m;
  document.body.dataset.mode = m;
  showThinking(m === "thinking" || (m === "teaching" && run?.plan?.kind === "ack" && !run.dead));
  orb.setState(m);
  scene.setMode(m);
  if (m !== prev) {
    if (m === "hearing") haptics.fire("listen");
    else if (m === "thinking") haptics.fire("think");
    else if (m === "teaching" && prev !== "paused") haptics.fire("speak");
  }
  els.status.textContent =
    m === "idle" && mic?.muted ? "Mic off: type your question" : STATUS[m];
  // The question bar shows it too, as its placeholder ("Ready: type a question");
  // on a phone the bar is too short for that, and simply invites a question.
  els.input.placeholder = PHONE.matches ? "Ask a question…" : els.status.textContent;
  if (!mic) return;
  // The bar for an interruption stays high a moment after the teacher stops,
  // while the room still echoes the last words.
  clearTimeout(quietTimer);
  if (m === "teaching") mic.teacherTalking = true;
  else
    quietTimer = setTimeout(() => {
      mic.teacherTalking = false;
    }, 800);
}

// Word times in a sentence, estimated from its length (Kokoro gives no word
// timings): longer words and punctuation take longer.
function cues(say, dur) {
  const words = say.split(/\s+/);
  const weights = words.map(
    (w) =>
      w.replace(/[^\w']/g, "").length + 1.5 + (/[,.;:?!]$/.test(w) ? 3 : 0),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const lead = Math.min(0.15, dur * 0.05);
  return words.map((word, i) => {
    const start = lead + (acc / total) * (dur - lead);
    acc += weights[i];
    return { word, key: word.toLowerCase().replace(/[^a-z0-9']/g, ""), start };
  });
}
const resolve = (at, cs) =>
  typeof at === "number"
    ? at
    : (cs.find((c) => c.key === String(at).toLowerCase())?.start ?? 0);

// The article or data an answer used, credited on the board's corner and one
// tap away (Wikipedia's CC BY-SA asks for the link and the licence).
const SOURCE_LICENCE = { Wikipedia: "CC BY-SA", Wiktionary: "CC BY-SA", Wikidata: "CC0" };
function showSource(source) {
  const licence = source?.licence || SOURCE_LICENCE[source?.site];
  els.source.hidden = !source?.url;
  if (!source?.url) return els.source.removeAttribute("href");
  els.source.href = source.url;
  els.source.textContent = `${source.site || "Source"}${licence ? ` · ${licence}` : ""}`;
  els.source.title = `Read “${source.title || source.site}” on ${source.site || "its site"}`;
}

function teach(plan) {
  if (plan.next?.length) followUps = plan.next;
  // A menu view ("Key Concepts") borrows the board: what the lesson was doing
  // is kept, for "Lesson Board" to pick up again (backToLesson).
  if (plan.menu) {
    memory.leave(run, { awaiting, sticky: els.sticky.hidden ? "" : els.sticky.textContent });
    setView(plan.menu);
  }
  aroundTheBoard(plan);
  if (run) {
    run.dead = true;
    run.ctrl.abort();
  }
  voice.stop();
  speechSynthesis.cancel();
  board.playing = true;
  // A question's options can be answered while they are still being read.
  awaiting = plan.awaiting || null;
  if (plan.kind !== "ack" && plan.kind !== "say")
    context = {
      ...context,
      ...(plan.context || {}),
      offer: plan.context?.offer ?? null,
    };
  run = { plan, i: 0, ctrl: new AbortController() };
  // Only "let me think" so far: the sketch stays up until the answer arrives.
  showThinking(plan.kind === "ack");
  run.audio = plan.steps.map((s) =>
    voice.load(s.say, run.ctrl.signal).catch(() => null),
  );
  startStep(run, 0);
  // An answer that arrives while the page is hidden waits, silent, until it is back.
  if (document.hidden) {
    pausedWhileHidden = true;
    interrupt();
  }
}

// No narration in the background: when the page is hidden (another tab, the
// phone locked, the site's pop-up closed) the teacher stops talking at once and
// carries on from there when the page is back. Leaving the page silences it.
let pausedWhileHidden = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (run && !run.paused && !run.finished && !run.dead) {
      pausedWhileHidden = true;
      interrupt();
    }
  } else if (pausedWhileHidden) {
    pausedWhileHidden = false;
    if (run?.paused) resume();
  }
});
function silence() {
  if (run) {
    run.dead = true;
    run.ctrl.abort();
  }
  voice?.stop();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
window.addEventListener("pagehide", silence);

// A sentence of a streamed answer arrived: play it when its turn comes.
function stepArrived(plan, step) {
  plan.steps.push(step);
  const r = run;
  if (r?.plan !== plan) return;
  r.audio.push(voice.load(step.say, r.ctrl.signal).catch(() => null));
  if (r.waiting === plan.steps.length - 1) {
    r.waiting = null;
    startStep(r, plan.steps.length - 1);
  }
}

function streamEnded(plan) {
  plan.streaming = false;
  const r = run;
  if (r?.plan === plan && r.waiting != null) {
    r.waiting = null;
    finish(r);
  }
}

// Everything a plan draws goes through here. The lesson's own drawings are
// remembered (lesson-memory.js); a menu view's are not. When the lesson draws
// while a menu view has the board, the board is the lesson's again: what it
// had comes back first, unless it starts a fresh board anyway.
const memory = createLessonMemory();
function drawOn(r, op, at) {
  if (!r.plan.menu) {
    if (memory.away) {
      const was = memory.back();
      if (op.op !== "clear") redrawLesson(was.ops);
      setView("board");
    }
    memory.drew(op, at);
  }
  board.add(op, at);
}
// The lesson's board as it stood: the same ops at the same board times, so
// nothing slides in or pops again.
function redrawLesson(ops) {
  board.add({ op: "clear" }, board.clock - 1);
  for (const [op, at] of ops) board.add(op, at);
}
// "Lesson Board" after a menu view: the lesson's board comes back, and the
// lesson carries on from the sentence it had reached. With nothing asked yet
// that is the welcome board.
function backToLesson() {
  const was = memory.back();
  if (!was) return;
  if (run) {
    run.dead = true;
    run.ctrl.abort();
  }
  voice.stop();
  speechSynthesis.cancel();
  board.playing = true;
  redrawLesson(was.ops);
  setView("board");
  els.sticky.hidden = !was.sticky;
  if (was.sticky) els.sticky.textContent = was.sticky;
  awaiting = was.awaiting;
  const old = was.run;
  if (!old) return setMode("idle");
  // The rest of an answer that was still streaming was dropped when the menu view opened.
  old.plan.streaming = false;
  const r = (run = {
    plan: old.plan, i: Math.min(was.i, old.plan.steps.length - 1), drawn: old.drawn, buffer: old.buffer, dur: old.dur,
    cues: old.cues, stepClock: old.stepClock, finished: !was.resume, ctrl: new AbortController(),
  });
  if (!was.resume) {
    showThinking(false);
    setMode("idle");
    return;
  }
  r.audio = r.plan.steps.map((st, k) => (k >= was.i ? voice.load(st.say, r.ctrl.signal).catch(() => null) : null));
  startStep(r, was.i, { redraw: false });
}

async function startStep(r, i, { redraw = true } = {}) {
  if (r.dead) return;
  // "Next" or "slower" while a step is still loading: only the newest goes on.
  const token = (r.token = (r.token || 0) + 1);
  const step = r.plan.steps[i];
  if (!step && r.plan.streaming) {
    r.waiting = i;
    return;
  }
  if (!step) return finish(r);
  r.i = i;
  r.loading = true;
  setMode(r.paused ? "paused" : "teaching");
  let buffer = await Promise.race([r.audio[i], sleep(350).then(() => "slow")]);
  if (buffer === "slow") {
    if (
      i === 0 &&
      FILLER_KINDS.has(r.plan.kind) &&
      Date.now() - fillerAt > 8000
    )
      await filler(r);
    buffer = await r.audio[i];
  }
  if (r.dead || r.token !== token) return;
  r.loading = false;
  if (r.paused) {
    r.resumeStep = i;
    return;
  }
  r.buffer = buffer;
  r.dur = buffer ? buffer.duration : Math.max(1.5, step.say.length / 14);
  r.cues = cues(step.say, r.dur);
  r.stepClock = board.clock;
  // Said again slower or faster: its drawing is on the board already.
  if (redraw || r.drawn !== i)
    for (const op of step.draw) {
      const o = { ...op };
      // A big picture is there for the whole step (its word may come last, and the
      // next step's picture turns the page); text and marks appear on their word.
      if (BIG_OPS.has(o.op)) delete o.at;
      for (const k of Object.keys(o))
        if ((k === "at" || k.endsWith("At")) && o[k] != null)
          o[k] = r.stepClock + resolve(o[k], r.cues);
      drawOn(r, o, o.at ?? r.stepClock);
    }
  r.drawn = i;
  sayFrom(r, 0);
}

// The browser's clearest English voice, for when the server has none: the
// natural/neural ones first (Edge, newer Chrome, Safari), then the familiar
// good ones, then any British or other English voice.
let chosenVoice = null;
function browserVoice() {
  if (chosenVoice) return chosenVoice;
  const all = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  const rank = (v) =>
    /natural|neural|premium|enhanced/i.test(v.name) ? 0
      : /google uk english female|google us english|samantha|serena|martha|daniel|karen|moira|aria|jenny|libby|sonia/i.test(v.name) ? 1
        : /^en[-_]gb/i.test(v.lang) ? 2
          : 3;
  chosenVoice = all.sort((a, b) => rank(a) - rank(b))[0] || null;
  return chosenVoice;
}
if ("speechSynthesis" in window)
  speechSynthesis.addEventListener?.("voiceschanged", () => { chosenVoice = null; });

// Says something short while the first sentence is still being made.
async function filler(r) {
  const text = FILLERS[fillerIdx++ % FILLERS.length];
  const buf = await Promise.race([
    voice.load(text).catch(() => null),
    sleep(200).then(() => null),
  ]);
  if (!buf || r.dead || r.paused) return;
  fillerAt = Date.now();
  rememberSaid(text);
  await Promise.race([
    new Promise((res) => voice.play(buf, 0, res)),
    sleep(buf.duration * 1000 + 150),
  ]);
}

function sayFrom(r, offset) {
  board.playing = true;
  setMode("teaching");
  rememberSaid(r.plan.steps[r.i].say);
  const done = () =>
    setTimeout(() => {
      if (!r.dead && !r.paused && run === r) startStep(r, r.i + 1);
    }, 420); // a relaxed breath between sentences
  if (r.buffer) voice.play(r.buffer, offset, done);
  else {
    const u = new SpeechSynthesisUtterance(r.plan.steps[r.i].say);
    const v = browserVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "en-GB";
    u.rate = voice.speed * 0.92; // relaxed, like the server voice
    // The lesson never waits on the browser's voice: if it fails, or never
    // says it has finished (some browsers have no voices), carry on after
    // about as long as the sentence would take to say.
    let moved = false;
    const token = (r.sayToken = (r.sayToken || 0) + 1); // a later utterance replaces this one
    const next = () => {
      if (moved || r.paused || r.dead || r.sayToken !== token) return;
      moved = true;
      clearTimeout(guard);
      done();
    };
    const words = r.plan.steps[r.i].say.split(/\s+/).length;
    const guard = setTimeout(next, (words / 2.3 / voice.speed + 2) * 1000);
    u.onend = next;
    u.onerror = next;
    speechSynthesis.speak(u);
  }
}

function finish(r) {
  if (r.dead) return;
  r.finished = true;
  if (r.next) {
    const next = r.next;
    r.next = null;
    return teach(next);
  } // the answer after its "let me think"
  // "Let me think" said, the answer not here yet: keep thinking (and sketching)
  // until it comes, but never for ever.
  if (r.plan.kind === "ack") {
    setMode("thinking");
    setTimeout(() => { if (run === r && mode === "thinking") setMode("idle"); }, 30000);
    return;
  }
  if (r.plan.awaiting) awaiting = r.plan.awaiting;
  setMode("idle");
}

function interrupt() {
  const r = run;
  if (!r || r.finished || r.paused || r.dead) return;
  r.paused = true;
  // In the pause after a sentence, nothing is playing: carry on with the next one.
  r.between =
    !r.loading && (r.buffer ? !voice.speaking : !speechSynthesis.speaking);
  r.offset = r.buffer ? voice.stop() : 0;
  speechSynthesis.cancel();
  voice.stop();
  board.playing = false;
  setMode("paused");
}

function resume() {
  const r = run;
  if (!r || !r.paused) return setMode("idle");
  r.paused = false;
  if (r.loading) {
    board.playing = true;
    return setMode("teaching");
  }
  if (r.resumeStep != null) {
    const i = r.resumeStep;
    r.resumeStep = null;
    return startStep(r, i);
  }
  if (r.between) {
    r.between = false;
    board.playing = true;
    return startStep(r, r.i + 1);
  }
  if (r.buffer) {
    const back = Math.min(0.6, r.offset);
    board.clock -= back;
    sayFrom(r, r.offset - back);
  } else {
    board.clock = r.stepClock;
    sayFrom(r, 0);
  }
}

function repeatStep() {
  const r = run;
  if (!r || r.dead || r.i == null || !r.plan.steps[r.i]) return say(GO_AHEAD);
  voice.stop();
  r.paused = false;
  r.finished = false;
  if (r.resumeStep != null) {
    const i = r.resumeStep;
    r.resumeStep = null;
    return startStep(r, i);
  }
  board.clock = r.stepClock;
  sayFrom(r, 0);
}

const say = (text) => teach({ kind: "say", steps: [{ say: text, draw: [] }] });

function control(action, text) {
  history.push(`control:${action}`);
  const r = run;
  if (action === "stop") {
    if (r) {
      r.dead = true;
      r.ctrl.abort();
    }
    voice.stop();
    board.playing = true;
    return say(text || "Okay.");
  }
  if (action === "resume") return r?.paused ? resume() : say(GO_AHEAD);
  if (action === "repeat") return repeatStep();
  if (action === "next") {
    if (!r || r.finished) return say(GO_AHEAD);
    voice.stop();
    r.paused = false;
    board.playing = true;
    return startStep(r, (r.resumeStep ?? r.i) + 1);
  }
  if (action === "slower" || action === "faster") {
    voice.speed =
      Math.round(
        Math.min(
          1.3,
          Math.max(0.7, voice.speed + (action === "slower" ? -0.15 : 0.15)),
        ) * 100,
      ) / 100;
    if (!r || r.finished)
      return say(
        action === "slower"
          ? "Okay, I will talk slower."
          : "Okay, a bit faster.",
      );
    r.audio = r.plan.steps.map((s, k) =>
      k >= r.i ? voice.load(s.say, r.ctrl.signal).catch(() => null) : null,
    );
    voice.stop();
    r.paused = false;
    board.clock = r.stepClock ?? board.clock;
    return startStep(r, r.resumeStep ?? r.i, { redraw: false });
  }
}

// The teacher's last lines, to tell echo from the student (shared/echo.js).
const spoken = [];
function rememberSaid(text) {
  spoken.push(text);
  if (spoken.length > 4) spoken.shift();
}

// The hearing is told which lesson is open and which questions are on
// screen, so it listens for those words ("Thevenin", not "the venom").
async function onUtterance(audio) {
  const seq = ++askSeq;
  setMode("thinking");
  let out = {};
  const ctx = encodeURIComponent(
    JSON.stringify({
      topic: context.topic || null,
      chips: (followUps.length ? followUps : examples).slice(0, 6),
      awaiting: !!awaiting,
    }),
  );
  try {
    const res = await fetch(`/api/ai-assistant/asr?ctx=${ctx}`, {
      method: "POST",
      body: audio.buffer,
    });
    out = await res.json();
  } catch {
    /* treated as not heard */
  }
  const text = out.text || "";
  if (seq !== askSeq) return;
  if (!text || isEcho(text, spoken)) {
    if (text) history.push(`echo: ${text.slice(0, 40)}`);
    return run?.paused ? resume() : setMode("idle");
  }
  ask(text, seq);
}

// Sends the question and acts on the answer as it streams in: an 'ack' is
// said at once ("Ooh, the Mona Lisa. Let me think."), the 'plan' follows it,
// and a spoken answer arrives sentence by sentence ('step', then 'end').
// open: a lesson's id, picked from the topic suggestions: that lesson, as it is.
async function ask(text, seq = ++askSeq, open = null) {
  if (prefix && Date.now() - prefixAt < 8000) text = `${prefix} ${text}`;
  prefix = null;
  setMode("thinking");
  let res;
  try {
    res = await fetch("/api/ai-assistant/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        context: {
          ...context,
          awaiting,
          history: talk.slice(-3),
          ...(open && { open }),
          // "visual" | "guided" | "words": not used by the router yet (see companion.js).
          ...(companion?.prefers && { style: companion.prefers }),
        },
      }),
    });
    if (!res.ok || !res.body) throw new Error(`ask ${res.status}`);
  } catch {
    if (seq === askSeq) say(NOT_HEARD);
    return;
  }
  let plan = null;
  const handle = (e) => {
    if (e.type === "ack") {
      if (plan) return;
      fillerAt = Date.now();
      teach({ kind: "ack", steps: [{ say: e.say, draw: [] }] });
    } else if (e.type === "plan") {
      plan = e;
      if (e.kind === "control") return control(e.action, e.say);
      if (e.kind === "fragment") {
        prefix = e.prefix;
        prefixAt = Date.now();
      }
      if (run && run.plan.kind === "ack" && !run.finished && !run.dead)
        run.next = e;
      else teach(e);
    } else if (e.type === "step" && plan) {
      stepArrived(plan, e.step);
    } else if (e.type === "figure" && plan) {
      // A picture made once the whole answer was known: onto the board now.
      if (run?.plan === plan && !run.dead)
        for (const op of e.draw) drawOn(run, op, board.clock);
    } else if (e.type === "end" && plan) {
      streamEnded(plan);
    }
  };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (seq !== askSeq) {
        reader.cancel();
        return;
      }
      buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.trim()) handle(JSON.parse(line));
      }
    }
  } catch {
    /* the connection dropped: what arrived is used below */
  }
  if (seq !== askSeq) return;
  // A stream that ended early (the server failed, the network dropped) must
  // not leave the teacher thinking for ever or waiting for a next sentence.
  if (!plan) {
    say(NOT_HEARD);
    return;
  }
  if (plan.streaming) streamEnded(plan);
  if (plan && plan.kind !== "fragment" && plan.kind !== "control") {
    talk.push({
      q: text,
      a:
        plan.kind === "chat"
          ? plan.steps.map((s) => s.say).join(" ")
          : plan.title || plan.steps[0]?.say || "",
    });
    if (talk.length > 6) talk.shift();
  }
}

// Started once: a chip tapped while the microphone prompt is up waits for the
// same start (and its greeting) instead of being talked over by it.
let starting = null;
function start() {
  starting ||= begin();
  return starting;
}
async function begin() {
  ctx = new AudioContext();
  // Phones suspend audio for a call or another app: pick it up again.
  const wake = () => {
    if (ctx.state !== "running" && ctx.state !== "closed")
      ctx.resume().catch(() => {});
  };
  ctx.addEventListener("statechange", () => {
    if (ctx.state === "suspended" && !document.hidden) wake();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) wake();
  });
  document.addEventListener("pointerdown", wake);
  voice = new Voice(ctx);
  voice.sounds = sounds;
  voice.server = serverVoice;
  scene.enter();
  scene.enableTilt();
  haptics.fire("start");
  if (serverHearing) try {
    mic = await startMic(ctx, {
      onStart: () => {
        if (mode === "teaching") interrupt();
        if (mode !== "thinking") setMode("hearing");
      },
      onCancel: () => {
        if (mode === "hearing") {
          if (run?.paused) resume();
          else setMode("idle");
        }
      },
      onEnd: onUtterance,
    });
  } catch {
    // The microphone is blocked: questions are typed, and the bar says why.
    typedOnly();
    STATUS.idle = STATUS.hearing = "Microphone blocked: type a question";
    setMode(mode);
  }
  FILLERS.forEach((f) => voice.load(f).catch(() => {}));
  // Started from one of the learner's own skills on the start screen: that lesson, no hello first.
  if (openOnStart) {
    const f = openOnStart;
    openOnStart = null;
    openFocus(f);
    return true;
  }
  const personal = companionGreeting();
  if (personal) {
    teach(personal);
    return true;
  }
  teach({
    kind: "greet",
    title: "Hello!",
    steps: [
      {
        say: serverHearing ? GREETING : GREETING_TYPED,
        draw: [
          { op: "clear" },
          { op: "title", text: "Ask me anything" },
          {
            op: "text",
            text: serverHearing
              ? "Say or type a question. Talk any time to interrupt me."
              : "Type a question, or a topic and pick it from the list.",
            at: "Ask",
          },
          { op: "chips", items: examples, at: "topic" },
        ],
      },
    ],
  });
  return true;
}

const GREETING_TYPED =
  "Hi, I'm your Learnigo teacher. Type any question, or start typing a topic and pick it from the list.";

// ── The learner, when signed in on the site ─────────────────────────────
// The site's AI Teacher page (client/src/pages/AITeacher.jsx) sends a short
// summary of the signed-in learner from GET /api/learn/companion: the first
// name, a few skills to work on (with the way of explaining that helped:
// pictures, step by step, simpler first), recent wins and how they like
// things explained. Nothing the learner typed or said is in it. Only a message
// from this origin, from the page around this one, is read; without one (not
// signed in, the site's own pop-up, an older server) nothing changes.
let companion = null;
let openOnStart = null; // a skill picked on the start screen, opened once started
const focusChips = new Map(); // a chip's label -> the skill it opens

function companionGreeting() {
  const words = companionLines(companion);
  if (!words) return null;
  focusChips.clear();
  const chips = companion.focus.map((f) => {
    const label = chipLabel(f, companion);
    focusChips.set(label, f);
    return label;
  });
  const tail = serverHearing ? "Tap one below, or ask me anything." : "Tap one below, or type any question.";
  // Two short sentences: the hello is ready to say at once while the rest is made.
  return {
    kind: "greet",
    title: words.hello,
    steps: [
      { say: words.hello, draw: [{ op: "clear" }, { op: "title", text: words.hello }] },
      {
        say: `${words.line} ${tail}`,
        draw: [
          { op: "text", text: words.line },
          { op: "chips", items: [...chips, ...examples].slice(0, 6) },
        ],
      },
    ],
  };
}

// A focus skill: its lesson when one has the same name, else asked for by name.
const topicFor = new Map();
async function findTopic(name) {
  if (topicFor.has(name)) return topicFor.get(name);
  let topic = null;
  try {
    const r = await fetch(`/api/ai-assistant/topics?q=${encodeURIComponent(name)}`);
    topic = (await r.json()).topics?.[0] || null;
  } catch {
    /* no lesson list: asked by name */
  }
  topicFor.set(name, topic);
  return topic;
}
async function openFocus(f) {
  const topic = await findTopic(f.name);
  if (topic?.id) openTopic(topic.id, topic.title);
  else askNow(`Teach me about ${lower(f.name)}`);
}

// The start screen says hello by name and offers the learner's own skills.
function personaliseHero() {
  const words = companionLines(companion);
  const line = $("hero-personal");
  const row = $("hero-focus");
  if (!words || !line || !row) return;
  line.textContent = `${words.hello} ${words.line}`;
  line.hidden = false;
  row.replaceChildren(
    ...companion.focus.slice(0, 2).map((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "focus-chip";
      b.textContent = chipLabel(f, companion);
      b.addEventListener("click", () => {
        if (starting) return openFocus(f);
        openOnStart = f;
        start();
      });
      return b;
    }),
  );
  row.hidden = !row.children.length;
}

window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.source !== window.parent || window.parent === window) return;
  if (e.data?.type !== "learnigo:companion" || companion) return;
  companion = readCompanion(e.data.companion);
  // Already started: the usual hello was said, and nothing is said twice.
  if (companion && !starting) personaliseHero();
});
// Tell the page around this one that the teacher is listening for the summary.
if (window.parent !== window) {
  try {
    window.parent.postMessage({ type: "learnigo:teacher-ready" }, location.origin);
  } catch {
    /* another origin around us: nothing is sent */
  }
}

// ── The page around the board ───────────────────────────────────────────
// The sticky note says what kind of lesson is on the board; the subject card
// and the menu follow the topic being taught (GET /lesson). The lesson's key
// points and activity are kept for the menu's "Key Concepts" and
// "Experiments / Activities"; a general answer's own sentences are its key points.
const STICKY = {
  explain: "Concept Explainer", faq: "Your Question", solve: "Worked Example", convert: "Worked Example",
  chat: "Fact Finder", data: "Fact Finder", card: "Concept Explainer", question: "Your Turn",
  answer: "Your Turn", quiz: "Your Turn", miss: "Coming Soon",
};
const SUBJECT_ICONS = [
  [/math/i, "➗"], [/physic|engineer|electric/i, "⚡"], [/chem/i, "🧪"], [/bio|body|health/i, "🌱"],
  [/space|astro/i, "🪐"], [/hist|ancient|war/i, "🏛️"], [/geo|world|earth/i, "🌍"], [/english|literat|languag|phonic|read/i, "📚"],
  [/art|music|film|media|design/i, "🎨"], [/comput|tech|coding|ai\b/i, "💻"], [/commerce|econ|business|money|account/i, "💰"],
  [/kid|early/i, "🧸"], [/philos|religio|faith|belief/i, "💭"],
];
let lesson = null; // the /lesson card of the topic on the board
let lessonFor = null;
let keyPoints = []; // its takeaways, for "Key Concepts"
const firstSentence = (t) => (String(t).match(/[^.!?]+[.!?]/) || [String(t)])[0].trim();

function aroundTheBoard(plan) {
  const label = STICKY[plan.kind];
  els.sticky.hidden = !label;
  if (label) els.sticky.textContent = label;
  if (["ack", "say", "talk", "greet", "unclear", "fragment", "control"].includes(plan.kind)) return;
  showSource(plan.source);
  const topic = plan.topic || plan.context?.topic;
  if (topic) {
    if (topic !== lessonFor) {
      // Notes are filed under this lesson from now on, not once its card has loaded.
      notes.setTopic(topic, lesson?.id === topic ? lesson.title : plan.watch || "");
      loadLesson(topic);
    }
  } else if (plan.steps?.length && !NOT_LESSON.has(plan.kind)) {
    // An answer from Wikipedia or open data: its own sentences are the key points.
    lessonFor = null;
    lesson = { title: plan.title || "", related: [] };
    keyPoints = plan.steps.map((st) => firstSentence(st.say)).filter(Boolean).slice(0, 3);
    showSubject(plan.source?.site || "AI Teacher", plan.title || "Your question", "");
    // It has no lesson of its own: no neighbours to offer, and notes filed under its title.
    picker.setRelated([]);
    notes.setTopic(topicKey(lesson), lesson.title);
  }
}

// Usage for a signed-in learner's parents (FND-045): the lesson's topic id, its
// title and the time on it. Never what the child typed or said. Anonymous
// visitors (no learner token in this origin's storage) log nothing.
const usage = { topic: null, title: "", subject: "", since: 0 };
const learnerToken = () => {
  try { return localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt"); } catch { return null; }
};
function flushUsage() {
  if (!usage.topic || !usage.since) return;
  const seconds = Math.round((Date.now() - usage.since) / 1000);
  usage.since = document.hidden ? 0 : Date.now();
  const token = learnerToken();
  if (!token || seconds < 5) return;
  let tz = "UTC";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { /* default */ }
  fetch("/api/dashboard/ai-teacher-log", {
    method: "POST", keepalive: true,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Timezone": tz },
    body: JSON.stringify({ topic: usage.topic, title: usage.title, subject: usage.subject, seconds }),
  }).catch(() => {});
}
function trackLesson(card, id) {
  if (usage.topic === id) return;
  flushUsage();
  Object.assign(usage, { topic: id, title: card.title || "", subject: card.subject || "", since: Date.now() });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushUsage();
  else if (usage.topic) usage.since = Date.now();
});
window.addEventListener("pagehide", flushUsage);
setInterval(flushUsage, 5 * 60 * 1000);

async function loadLesson(id) {
  lessonFor = id;
  try {
    const card = await (await fetch(`/api/ai-assistant/lesson?id=${encodeURIComponent(id)}`)).json();
    if (lessonFor !== id || card.error) return;
    lesson = card;
    keyPoints = card.takeaways || [];
    trackLesson(card, id);
    showSubject(card.subject, card.group || card.title, card.subject + " " + card.group + " " + card.title);
    picker.setRelated(card.related || []);
    notes.setTopic(id, card.title);
  } catch {
    /* the board still teaches without the lesson's details */
  }
}

function showSubject(area, group, words) {
  els.subjectArea.textContent = area || "AI Teacher";
  els.subjectGroup.textContent = group || "Pick a topic";
  els.subjectIcon.textContent = (SUBJECT_ICONS.find(([re]) => re.test(words || "")) || [null, "✨"])[1];
}

// "Pick a topic": every topic by subject to browse, and the open lesson's
// neighbours once there is one (topic-picker.js).
const picker = createTopicPicker({
  button: els.subjectBtn,
  list: els.related,
  iconFor: (name) => (SUBJECT_ICONS.find(([re]) => re.test(name)) || [null, "✨"])[1],
  onPick: (id, title) => openTopic(id, title),
});

async function askNow(text, open = null) {
  await start();
  if (mode === "teaching") interrupt();
  ask(text, ++askSeq, open);
}
function openTopic(id, title) {
  askNow(`Teach me about ${title}`, id);
}
// A short lesson made here from the card: drawn on the board and said aloud.
// It is a menu view (menu: "concepts" or "try"): it borrows the board, and
// "Lesson Board" gives it back to the lesson (teach, backToLesson).
function boardFrom(menu, title, rows) {
  if (!rows.length) return false;
  askSeq++;
  start().then(() => {
    if (mode === "teaching") interrupt();
    teach({
      kind: "say",
      menu,
      title,
      steps: [{ say: rows.join(" "), draw: [{ op: "clear" }, { op: "title", text: title }, { op: "bullets", items: rows }] }],
    });
    showBoard();
  });
  return true;
}
// On a phone the menu is under the board: bring the board into view.
const showBoard = () =>
  document.querySelector(".holo-wrap").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });

// The lesson menu. The row that is lit says what the board shows (the lesson,
// its key concepts or its activity), or "Notes" while the notes card is open.
// Where the board is always in view (tablets, upright screens: style.css) the
// "Lesson Board" row shows only while something else has the board.
let view = "board";
const menuItems = [...document.querySelectorAll(".menu-item")];
function lightMenu() {
  const lit = notes.isOpen ? "notes" : view;
  for (const b of menuItems) {
    b.classList.toggle("active", b.dataset.go === lit);
    if (b.dataset.go === lit) b.setAttribute("aria-current", "true");
    else b.removeAttribute("aria-current");
  }
}
function setView(v) {
  if (v === view) return;
  // The "Lesson Board" row may go as the board comes back: the focus moves to the next row.
  const boardRow = menuItems.find((b) => b.dataset.go === "board");
  const had = document.activeElement === boardRow;
  view = v;
  document.body.dataset.view = v;
  lightMenu();
  if (had && !boardRow.getClientRects().length) menuItems.find((b) => b.getClientRects().length)?.focus();
}
// With nothing on the board yet, the board says how to start.
const PICK_FIRST = "Type a question or pick a topic first.";
const MENU = {
  board: () => {
    if (ctx) backToLesson();
    showBoard();
  },
  concepts: () => {
    if (lesson?.title && keyPoints.length) boardFrom("concepts", `Key concepts: ${lesson.title}`, keyPoints);
    else boardFrom("concepts", "Key concepts", [PICK_FIRST, "Its key ideas will show here."]);
  },
  notes: () => notes.toggle(),
  try: () => {
    const activity = lesson?.tryIt || (lesson?.practice ? `Try this: ${lesson.practice}` : "");
    if (activity) boardFrom("try", "Try it yourself", [activity]);
    else if (lesson?.title) boardFrom("try", "Try it yourself", ["No activity for this one yet.", "Ask me a question about it, or ask me for one."]);
    else boardFrom("try", "Try it yourself", [PICK_FIRST, "Something to try with it will show here."]);
  },
  games: () => {
    (window.top || window).location.href = "/games";
  },
};
for (const b of menuItems) b.addEventListener("click", () => MENU[b.dataset.go]?.());

// Notes: several per topic, kept in this browser only (notes-store.js); the
// card lists this topic's, all of them by topic, and the one being written
// (notes-panel.js). The topic is the lesson on the board (aroundTheBoard).
let noteStorage = null;
try {
  noteStorage = localStorage;
} catch {
  /* storage blocked: the notes last until the page closes */
}
const notes = createNotesPanel(els.notes, {
  store: createNotesStore(noteStorage),
  onToggle: (open, hadFocus) => {
    lightMenu();
    if (!open && hadFocus) menuItems.find((b) => b.dataset.go === "notes")?.focus();
  },
  // "Open lesson" beside a topic's notes: its lesson, or for an answer from the web, asked again.
  openTopic: (key, title) => (lessonOf(key) ? openTopic(lessonOf(key), title || "this lesson") : askNow(`Tell me about ${title}`)),
  titleOf: async (id) => (await (await fetch(`/api/ai-assistant/lesson?id=${encodeURIComponent(id)}`)).json()).title || "",
});

// No speech recognition on this server (LT_ASR=off): no microphone, and
// everything on the page asks for typing instead of talking.
function typedOnly() {
  serverHearing = false;
  els.mic.hidden = true;
  Object.assign(STATUS, {
    off: "Press Start to begin",
    idle: "Ready: type a question",
    hearing: "Ready: type a question",
    teaching: "Teaching: press Stop to interrupt",
    paused: "Paused",
  });
  // The start screen, while it is still there.
  const sub = $("hero-sub");
  const tip = $("hero-tip");
  if (sub) sub.textContent = "Type any question or topic. It draws and explains, step by step.";
  if (tip) tip.textContent = "Pick a topic as you type, or tap an example";
  setMode(mode);
}

// Topic suggestions in the question box: as the student types, the lessons
// whose titles match (GET /topics, titles only, cheap) appear under it; arrow
// keys or a tap pick one, which opens that lesson straight away.
const suggest = { el: $("suggest"), items: [], at: -1, seq: 0, timer: null };
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function hideSuggest() {
  suggest.el.hidden = true;
  suggest.items = [];
  suggest.at = -1;
  els.input.setAttribute("aria-expanded", "false");
  els.input.removeAttribute("aria-activedescendant");
}
function markSuggest(at) {
  suggest.at = at;
  [...suggest.el.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === at)));
  if (at >= 0) els.input.setAttribute("aria-activedescendant", `suggest-${at}`);
  else els.input.removeAttribute("aria-activedescendant");
}
function showSuggest(topics, typed) {
  if (!topics.length) return hideSuggest();
  // Bold the start of each word that matches a typed word.
  const words = typed.toLowerCase().split(/\s+/).filter(Boolean);
  const bold = (title) =>
    title
      .split(/(\s+)/)
      .map((w) => {
        const n = Math.max(0, ...words.filter((t) => w.toLowerCase().startsWith(t)).map((t) => t.length));
        return n ? `<b>${escapeHtml(w.slice(0, n))}</b>${escapeHtml(w.slice(n))}` : escapeHtml(w);
      })
      .join("");
  suggest.items = topics;
  suggest.el.innerHTML = topics
    .map(
      (t, i) =>
        `<li id="suggest-${i}" role="option" aria-selected="false"><span class="sg-title">${bold(t.title)}</span>` +
        (t.area ? `<span class="sg-area">${escapeHtml(t.area.split(":")[0])}</span>` : "") +
        "</li>",
    )
    .join("");
  suggest.el.hidden = false;
  els.input.setAttribute("aria-expanded", "true");
  markSuggest(-1);
}
async function fetchSuggest(typed) {
  const seq = ++suggest.seq;
  try {
    const r = await fetch(`/api/ai-assistant/topics?q=${encodeURIComponent(typed)}`);
    const { topics = [] } = await r.json();
    if (seq === suggest.seq && els.input.value.trim() === typed) showSuggest(topics, typed);
  } catch {
    /* no suggestions: the question can still be asked */
  }
}
async function pickSuggest(i) {
  const t = suggest.items[i];
  if (!t) return;
  hideSuggest();
  els.input.value = "";
  openTopic(t.id, t.title);
}
els.input.addEventListener("input", () => {
  clearTimeout(suggest.timer);
  const typed = els.input.value.trim();
  if (typed.length < 2) {
    suggest.seq++;
    return hideSuggest();
  }
  suggest.timer = setTimeout(() => fetchSuggest(typed), 120);
});
els.input.addEventListener("keydown", (e) => {
  if (suggest.el.hidden) return;
  const n = suggest.items.length;
  if (e.key === "ArrowDown") { e.preventDefault(); markSuggest((suggest.at + 1) % n); }
  else if (e.key === "ArrowUp") { e.preventDefault(); markSuggest((suggest.at - 1 + n) % n); }
  else if (e.key === "Escape") { e.preventDefault(); hideSuggest(); }
  else if (e.key === "Enter" && suggest.at >= 0) { e.preventDefault(); pickSuggest(suggest.at); }
});
// pointerdown, not click: picked before the input loses focus and hides the list.
suggest.el.addEventListener("pointerdown", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  e.preventDefault();
  pickSuggest([...suggest.el.children].indexOf(li));
});
suggest.el.addEventListener("pointermove", (e) => {
  const li = e.target.closest("li");
  if (li) markSuggest([...suggest.el.children].indexOf(li));
});
els.input.addEventListener("blur", () => setTimeout(hideSuggest, 100));

els.start.addEventListener("click", start);
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
  hideSuggest();
  suggest.seq++;
  els.input.value = "";
  await start();
  if (mode === "teaching") interrupt();
  ask(text);
});
els.mic.addEventListener("click", () => {
  if (!mic) return;
  mic.mute(!mic.muted);
  els.mic.setAttribute("aria-pressed", String(!mic.muted));
  els.mic.querySelector(".lbl").textContent = mic.muted ? "Mic off" : "Mic on";
  setMode(mode);
});
// Stop also drops an answer still on its way.
const stopAll = () => {
  if (!ctx) return;
  askSeq++;
  control("stop", "Okay.");
};
els.stop.addEventListener("click", stopAll);
document.addEventListener("keydown", (e) => {
  const typing =
    /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) ||
    e.target.isContentEditable;
  if (e.key === "Escape" && !typing) return stopAll();
  // A quiz answered from the keyboard: A to D, or 1 to 4.
  const pick =
    !typing && awaiting && !e.ctrlKey && !e.metaKey && !e.altKey
      ? "abcd1234".indexOf(e.key.toLowerCase()) % 4
      : -1;
  if (pick >= 0 && e.key.length === 1 && pick < (awaiting.options?.length || 4))
    board.onOption(pick);
});

// The orb follows whoever is talking: the teacher's voice, or the student's.
(function animate() {
  const level =
    mode === "teaching" && voice
      ? voice.speaking
        ? voice.level() * 7
        : speechSynthesis.speaking
          ? 0.35 + 0.25 * Math.sin(performance.now() / 95) // the browser's voice has no level to read
          : 0
      : mode === "hearing" || mode === "paused"
        ? (mic?.level || 0) * 14
        : 0;
  orb.setLevel(level);
  document.documentElement.style.setProperty("--talk", Math.min(1, level).toFixed(2));
  requestAnimationFrame(animate);
})();

async function health() {
  try {
    const h = await (await fetch("/api/ai-assistant/health")).json();
    serverVoice = h.voice !== "browser";
    if (voice) voice.server = serverVoice;
    if (h.hearing === false && serverHearing) typedOnly();
    examples = [
      ...h.packs.flatMap((p) =>
        p.examples.slice(0, h.packs.length > 3 ? 1 : 2),
      ),
    ];
    els.warm.hidden = h.ready;
    if (!h.ready) setTimeout(health, 1500);
  } catch {
    setTimeout(health, 2000);
  }
}
health();
setMode("off");
