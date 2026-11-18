// The live teacher in the browser: the student talks (or types), the server
// routes it to a lesson plan, and the board draws each step while the voice
// says it. Talking over the teacher pauses it at once; what the student said
// decides what happens next (carry on, repeat, a new question...).
import { Board, BIG_OPS } from "./board.js";
import { Voice } from "./voice.js";
import { startMic } from "./mic.js";
import { answerPlan } from "./shared/solvers.js";
import { isEcho } from "./shared/echo.js";
import { questionPlan, resultPlan } from "./shared/test.js";
import { GREETING, FILLERS, NOT_HEARD, GO_AHEAD } from "./shared/lines.js";
import { createOrb } from "./orb.js";
import { createScene, reveal } from "./scene.js";
import { createHaptics } from "./haptics.js";

const $ = (id) => document.getElementById(id);
const els = {
  board: $("board"),
  start: $("start"),
  mic: $("mic"),
  stop: $("stop"),
  status: $("status"),
  caption: $("caption"),
  log: $("log"),
  form: $("ask"),
  input: $("text"),
  chips: $("chips"),
  videos: $("videos"),
  warm: $("warm"),
  tier: $("tier"),
  haptic: $("haptic"),
  sounds: $("sounds"),
  state: $("state"),
  meter: $("meter"),
  saying: $("saying"),
  sticky: $("sticky"),
  subjectBtn: $("subject-btn"),
  subjectArea: $("subject-area"),
  subjectGroup: $("subject-group"),
  subjectIcon: document.querySelector(".subject-icon"),
  related: $("related"),
  takeaways: $("takeaways"),
  realImg: $("real-img"),
  realText: $("real-text"),
  tryText: $("try-text"),
  tryBtn: $("try-btn"),
  quizText: $("quiz-text"),
  quizBtn: $("quiz-btn"),
  notes: $("notes"),
  notesText: $("notes-text"),
};
const STATUS = {
  off: "Press Start, then allow the microphone",
  idle: "Listening: ask me anything",
  hearing: "I hear you…",
  thinking: "Thinking…",
  teaching: "Teaching: just talk to interrupt",
  paused: "Paused: I’m listening",
};
const STATE = {
  off: "Waiting",
  idle: "Listening",
  hearing: "Hearing you",
  thinking: "Thinking",
  teaching: "Speaking",
  paused: "Paused",
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
let prefix = null; // the start of a sentence the student has not finished
let prefixAt = 0;
const talk = []; // the last few questions and answers, for follow-ups
let test = null; // a running test: { questions, i, results, title }
const TEST_KINDS = new Set([
  "test",
  "test-q",
  "answer",
  "ack",
  "say",
  "unclear",
  "fragment",
  "test-result",
]);

const board = new Board(els.board, {
  onSfx: (name, where) => {
    voice?.sfx(name, where);
    feel(name);
  },
  onOption: (i) => {
    if (awaiting) {
      log("you", `Option ${"ABCD"[i]}`);
      teach(answerPlan(awaiting, i, test ? "" : undefined));
    }
  },
  // A chip on the board ("What is soap bubble?") is asked as if said.
  onChip: (text) => {
    if (mode === "teaching") interrupt();
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
  heard: (text, spokenAs = {}) => ask(text, ++askSeq, spokenAs),
  get state() {
    return {
      mode,
      awaiting: !!awaiting,
      kind: run?.plan.kind,
      step: run?.i,
      test: test && {
        i: test.i,
        n: test.questions.length,
        results: test.results.map((x) => x.correct),
      },
      history: history.slice(-12),
    };
  },
};

const PHONE = matchMedia("(max-width: 700px)");
let quietTimer = null;
function setMode(m) {
  const prev = mode;
  if (m !== mode) history.push(`${mode}→${m}`);
  mode = m;
  document.body.dataset.mode = m;
  orb.setState(m);
  scene.setMode(m);
  els.state.textContent = STATE[m] || "";
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

// Videos to watch next on what was just taught (server: /api/videos).
let watching = "";
async function showVideos(q, source = null) {
  if (!q || (q === watching && !source)) return;
  watching = q;
  try {
    const { videos = [] } = await (
      await fetch(`/api/ai-assistant/videos?q=${encodeURIComponent(q)}`)
    ).json();
    if (watching !== q) return;
    const row = els.videos.querySelector(".v-row");
    row.replaceChildren(
      ...videos.map((v) => {
        const a = document.createElement("a");
        a.className = "v-card";
        a.href = v.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = v.title;
        const img = document.createElement("img");
        img.src = v.thumb;
        img.alt = "";
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        const t = document.createElement("span");
        t.className = "v-t";
        t.textContent = v.title;
        const m = document.createElement("span");
        m.className = "v-m";
        m.textContent = [v.channel, v.duration].filter(Boolean).join(" · ");
        a.append(img, t, m);
        return a;
      }),
    );
    // The article the answer used, credited and one click away.
    if (source?.url) {
      const a = document.createElement("a");
      a.className = "v-card v-source";
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const w = document.createElement("span");
      w.className = "v-w";
      w.textContent =
        source.site === "Wikipedia"
          ? "W"
          : source.site
              .split(/\s+/)
              .map((x) => x[0])
              .join("")
              .slice(0, 3);
      const t = document.createElement("span");
      t.className = "v-t";
      t.textContent = source.title;
      const m = document.createElement("span");
      m.className = "v-m";
      m.textContent = `Read on ${source.site} · ${source.licence || "CC BY-SA"}`;
      a.append(w, t, m);
      row.prepend(a);
    }
    els.videos.hidden = !row.children.length;
    videoPicture();
  } catch {
    /* no videos: the lesson still works */
  }
}

function teach(plan) {
  if (plan.next?.length) showChips(plan.next, true);
  aroundTheBoard(plan);
  if (plan.watch) showVideos(plan.watch, plan.source);
  if (run) {
    run.dead = true;
    run.ctrl.abort();
  }
  voice.stop();
  speechSynthesis.cancel();
  board.playing = true;
  // A question's options can be answered while they are still being read.
  awaiting = plan.awaiting || null;
  if (plan.kind === "test") test = { ...plan.test, i: -1, results: [] };
  else if (!TEST_KINDS.has(plan.kind)) test = null; // something else was asked: the test is over
  if (plan.kind !== "ack" && plan.kind !== "say")
    context = {
      ...context,
      ...(plan.context || {}),
      offer: plan.context?.offer ?? null,
    };
  run = { plan, i: 0, ctrl: new AbortController() };
  run.audio = plan.steps.map((s) =>
    voice.load(s.say, run.ctrl.signal).catch(() => null),
  );
  // The topic of the answer, in the conversation (not when it only repeats
  // the question just asked: the answer itself shows under it).
  if (
    plan.title &&
    !["say", "ack", "talk", "unclear", "fragment", "faq"].includes(plan.kind)
  )
    log("teacher", plan.title);
  startStep(run, 0);
}

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
      board.add(o, o.at ?? r.stepClock);
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
    }, 250);
  if (r.buffer) voice.play(r.buffer, offset, done);
  else {
    const u = new SpeechSynthesisUtterance(r.plan.steps[r.i].say);
    const v = browserVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "en-GB";
    u.rate = voice.speed;
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
  if (r.plan.awaiting) awaiting = r.plan.awaiting;
  setMode("idle");
  if (test && r.plan.kind === "test") return nextQuestion();
  if (test && r.plan.kind === "answer") {
    const q = test.questions[test.i];
    test.results.push({
      topic: q?.topic,
      topicTitle: q?.topicTitle,
      correct: !!r.plan.correct,
    });
    setTimeout(() => {
      if (run === r) nextQuestion();
    }, 500);
  }
}

// The next question of the running test, or the score after the last one.
function nextQuestion() {
  if (!test) return;
  test.i++;
  if (test.i >= test.questions.length) {
    const result = resultPlan(test, test.results);
    test = null;
    return teach(result);
  }
  teach(questionPlan(test, test.i));
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
  if (test && action === "stop") {
    // stop the test: the score so far
    const result = resultPlan(test, test.results);
    test = null;
    return result.total ? teach(result) : say(text || "Okay.");
  }
  if (test && action === "next" && awaiting) {
    // skip this question
    const q = test.questions[test.i];
    test.results.push({
      topic: q?.topic,
      topicTitle: q?.topicTitle,
      correct: false,
    });
    return nextQuestion();
  }
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
  const chips = [...els.chips.querySelectorAll("button")]
    .map((b) => b.textContent)
    .slice(0, 6);
  const ctx = encodeURIComponent(
    JSON.stringify({
      topic: context.topic || null,
      chips,
      awaiting: !!awaiting,
    }),
  );
  try {
    const res = await fetch(`/api/ai-assistant/asr?ctx=${ctx}`, {
      method: "POST",
      body: audio.buffer,
    });
    out = await res.json();
    els.tier.textContent = `heard in ${out.ms} ms`;
  } catch {
    /* treated as not heard */
  }
  const text = out.text || "";
  if (seq !== askSeq) return;
  if (!text || isEcho(text, spoken)) {
    if (text) history.push(`echo: ${text.slice(0, 40)}`);
    return run?.paused ? resume() : setMode("idle");
  }
  ask(text, seq, {
    heard: out.heard,
    options: out.options || [],
    swapped: out.swapped,
  });
}

// A misheard question is put right by tapping it (or one of the other
// things it may have been): asked again, and the correction is remembered
// so the same words are heard right next time.
function correct(said, meant) {
  if (!meant.trim() || meant.trim() === said.trim()) return;
  fetch("/api/ai-assistant/heard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heard: said, text: meant }),
  }).catch(() => {});
  if (mode === "teaching") interrupt();
  ask(meant.trim());
}

function heardLine(li, text, spokenAs) {
  const span = document.createElement("button");
  span.type = "button";
  span.className = "said";
  span.textContent = text;
  span.title = "Not what you said? Tap to correct it";
  li.append(span);
  if (spokenAs.swapped) {
    const note = document.createElement("small");
    note.className = "was";
    note.textContent = `heard “${spokenAs.swapped.from}”`;
    li.append(note);
  }
  if (spokenAs.options?.length) {
    const row = document.createElement("span");
    row.className = "or";
    row.append("or: ");
    for (const o of spokenAs.options) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o;
      b.addEventListener("click", () => {
        row.remove();
        correct(text, o);
      });
      row.append(b);
    }
    li.append(row);
  }
  span.addEventListener("click", () => {
    const input = document.createElement("input");
    input.className = "fix";
    input.value = text;
    input.setAttribute("aria-label", "What you said");
    span.replaceWith(input);
    input.focus();
    input.select();
    // Removing the box blurs it, which calls this again: once only.
    let closed = false;
    const done = (send) => {
      if (closed) return;
      closed = true;
      const meant = input.value;
      input.replaceWith(span);
      if (send) correct(text, meant);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") done(true);
      if (e.key === "Escape") done(false);
    });
    input.addEventListener("blur", () => done(false));
  });
}

// Sends the question and acts on the answer as it streams in: an 'ack' is
// said at once ("Ooh, the Mona Lisa. Let me think."), the 'plan' follows it,
// and a spoken answer arrives sentence by sentence ('step', then 'end').
// open: a lesson's id, picked from the topic suggestions: that lesson, as it is.
async function ask(text, seq = ++askSeq, spokenAs = null, open = null) {
  if (prefix && Date.now() - prefixAt < 8000) text = `${prefix} ${text}`;
  prefix = null;
  log("you", text, spokenAs);
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
          test: !!test,
          history: talk.slice(-3),
          ...(open && { open }),
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
      els.tier.textContent = "Thinking…";
      fillerAt = Date.now();
      teach({ kind: "ack", steps: [{ say: e.say, draw: [] }] });
    } else if (e.type === "plan") {
      plan = e;
      els.tier.textContent = `Answered by AI in ${e.ms} ms`;
      els.tier.title = `${e.tier}: ${e.ms} ms`;
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
        for (const op of e.draw) board.add(op, board.clock);
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

function log(who, text, spokenAs = null) {
  const li = document.createElement("li");
  li.className = `from-${who}`;
  if (spokenAs) heardLine(li, text, spokenAs);
  else li.textContent = text;
  // Oldest at the top, newest at the bottom, scrolled into view like a chat
  // (unless the student has scrolled back to read).
  const atEnd =
    els.log.scrollHeight - els.log.scrollTop - els.log.clientHeight < 60;
  els.log.append(li);
  reveal(li);
  while (els.log.children.length > 60) els.log.firstChild.remove();
  if (atEnd)
    els.log.scrollTo({
      top: els.log.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
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
    els.mic.disabled = true;
    log("teacher", "The microphone is blocked, so type your questions below.");
  }
  FILLERS.forEach((f) => voice.load(f).catch(() => {}));
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
  "Hi, I'm your Learnigo teacher. Type any question, or start typing a topic and pick it from the list. Type test me for some questions.";

// ── The page around the board ───────────────────────────────────────────
// The sticky note says what kind of lesson is on the board; the subject card,
// the four cards under the board and the menu follow the topic being taught
// (GET /lesson), and a general answer fills the cards from its own words.
const STICKY = {
  explain: "Concept Explainer", faq: "Your Question", solve: "Worked Example", convert: "Worked Example",
  chat: "Fact Finder", data: "Fact Finder", card: "Concept Explainer", test: "Practice", question: "Practice",
  answer: "Practice", quiz: "Practice", miss: "Coming Soon",
};
const SUBJECT_ICONS = [
  [/math/i, "➗"], [/physic|engineer|electric/i, "⚡"], [/chem/i, "🧪"], [/bio|body|health/i, "🌱"],
  [/space|astro/i, "🪐"], [/hist|ancient|war/i, "🏛️"], [/geo|world|earth/i, "🌍"], [/english|literat|languag|phonic|read/i, "📚"],
  [/art|music|film|media|design/i, "🎨"], [/comput|tech|coding|ai\b/i, "💻"], [/commerce|econ|business|money|account/i, "💰"],
  [/kid|early/i, "🧸"], [/philos|religio|faith|belief/i, "💭"],
];
let lesson = null; // the /lesson card of the topic on the board
let lessonFor = null;
const firstSentence = (t) => (String(t).match(/[^.!?]+[.!?]/) || [String(t)])[0].trim();

function aroundTheBoard(plan) {
  const label = STICKY[plan.kind];
  els.sticky.hidden = !label;
  if (label) els.sticky.textContent = label;
  if (["ack", "say", "talk", "greet", "unclear", "fragment", "control"].includes(plan.kind)) return;
  const topic = plan.topic || plan.context?.topic;
  if (topic) {
    if (topic !== lessonFor) loadLesson(topic);
  } else if (plan.steps?.length && !TEST_KINDS.has(plan.kind)) {
    // An answer from Wikipedia or open data: its own sentences are the takeaways.
    lessonFor = null;
    lesson = { title: plan.title || "", related: [] };
    showSubject(plan.source?.site || "AI Teacher", plan.title || "Your question", "");
    showCards({
      takeaways: plan.steps.map((st) => firstSentence(st.say)).filter(Boolean).slice(0, 3),
      realLife: null,
      tryIt: null,
      quizCount: 0,
    });
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
    trackLesson(card, id);
    showSubject(card.subject, card.group || card.title, card.subject + " " + card.group + " " + card.title);
    showCards(card);
    showRelated(card.related || []);
    loadNotes();
  } catch {
    /* the board still teaches without the cards */
  }
}

function showSubject(area, group, words) {
  els.subjectArea.textContent = area || "AI Teacher";
  els.subjectGroup.textContent = group || "Pick a topic";
  els.subjectIcon.textContent = (SUBJECT_ICONS.find(([re]) => re.test(words || "")) || [null, "✨"])[1];
}

function showRelated(list) {
  els.related.replaceChildren(
    ...(list.length
      ? list.map((t) => {
          const li = document.createElement("li");
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = t.title;
          b.addEventListener("click", () => {
            toggleRelated(false);
            openTopic(t.id, t.title);
          });
          li.append(b);
          return li;
        })
      : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Type a topic in the bar above to begin." })]),
  );
}
function toggleRelated(open = els.related.hidden) {
  els.related.hidden = !open;
  els.subjectBtn.setAttribute("aria-expanded", String(open));
}
els.subjectBtn.addEventListener("click", () => toggleRelated());
document.addEventListener("pointerdown", (e) => {
  if (!els.related.hidden && !e.target.closest(".subject")) toggleRelated(false);
});
showRelated([]);

function showCards(c) {
  els.takeaways.replaceChildren(
    ...(c.takeaways?.length ? c.takeaways : ["Ask a question or pick a topic: the key points appear here."]).map((t) =>
      Object.assign(document.createElement("li"), { textContent: t }),
    ),
  );
  els.realText.textContent = c.realLife || (lesson?.title ? `Ask “Give me an example” to see ${lesson.title} in everyday life.` : "Where you meet it in everyday life.");
  els.realImg.hidden = !c.image?.src;
  if (c.image?.src) els.realImg.src = c.image.src;
  els.tryText.textContent = c.tryIt || (c.practice ? `Try this: ${c.practice}` : "Something to try with what you learn.");
  els.tryBtn.hidden = !c.practice;
  els.quizText.textContent = c.quizCount
    ? `Test your understanding with ${Math.max(5, c.quizCount)} quick questions.`
    : "Test your understanding with quick questions.";
}

// No picture of its own: the first video's thumbnail stands in.
function videoPicture() {
  if (!els.realImg.hidden) return;
  const img = els.videos.querySelector(".v-card img");
  if (!img) return;
  els.realImg.src = img.src;
  els.realImg.hidden = false;
}

async function askNow(text, open = null) {
  await start();
  if (mode === "teaching") interrupt();
  ask(text, ++askSeq, null, open);
}
function openTopic(id, title) {
  askNow(`Teach me about ${title}`, id);
}
const testMe = () => askNow(lesson?.title ? `Test me on ${lesson.title}` : "Test me");
const glow = (el) => {
  el.classList.add("glow");
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  setTimeout(() => el.classList.remove("glow"), 1600);
};
// A short lesson made here from the card: drawn on the board and said aloud.
function boardFrom(title, rows) {
  if (!rows.length) return false;
  askSeq++;
  start().then(() => {
    if (mode === "teaching") interrupt();
    teach({
      kind: "say",
      title,
      steps: [{ say: rows.join(" "), draw: [{ op: "clear" }, { op: "title", text: title }, { op: "bullets", rows }] }],
    });
  });
  return true;
}

// The quick asks under the conversation (and, on phones, "Try it yourself").
for (const b of document.querySelectorAll(".action"))
  b.addEventListener("click", () => {
    if (b.dataset.go) MENU[b.dataset.go]();
    else if (b.dataset.ask === "test") testMe();
    else askNow(b.dataset.ask);
  });
els.quizBtn.addEventListener("click", testMe);
els.tryBtn.addEventListener("click", testMe);

// The lesson menu.
const MENU = {
  board: () => document.querySelector(".holo-wrap").scrollIntoView({ block: "nearest", behavior: "smooth" }),
  concepts: () => {
    glow($("card-take"));
    const rows = [...els.takeaways.children].map((li) => li.textContent);
    if (lesson?.title) boardFrom(`Key concepts: ${lesson.title}`, rows);
  },
  notes: () => {
    els.notes.hidden = !els.notes.hidden;
    if (!els.notes.hidden) els.notesText.focus();
  },
  practice: testMe,
  try: () => {
    glow($("card-try"));
    if (lesson?.tryIt) boardFrom("Try it yourself", [lesson.tryIt]);
  },
  quiz: testMe,
  games: () => {
    (window.top || window).location.href = "/games";
  },
};
for (const b of document.querySelectorAll(".menu-item"))
  b.addEventListener("click", () => {
    for (const x of document.querySelectorAll(".menu-item")) {
      x.classList.toggle("active", x === b);
      x.toggleAttribute("aria-current", x === b);
    }
    MENU[b.dataset.go]?.();
  });

// Notes: one per topic, kept in this browser only.
const notesKey = () => `learnigo-notes:${lesson?.id || "general"}`;
function loadNotes() {
  try {
    els.notesText.value = localStorage.getItem(notesKey()) || "";
  } catch {
    els.notesText.value = "";
  }
}
els.notesText.addEventListener("input", () => {
  try {
    localStorage.setItem(notesKey(), els.notesText.value);
  } catch {
    /* storage off: the notes last until the page closes */
  }
});
$("notes-close").addEventListener("click", () => {
  els.notes.hidden = true;
});
loadNotes();

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
  Object.assign(STATE, { idle: "Ready", hearing: "Ready" });
  $("hero-sub").textContent =
    "Type any question or topic. It draws, explains and tests you.";
  $("hero-tip").textContent = "Pick a topic as you type, or tap an example";
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

// The face: the mouth follows the teacher's voice, the ring the student's.
let captionAt = "";
(function animate() {
  // The orb and the meter follow whoever is talking.
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
  els.meter.style.width = `${Math.round(Math.min(1, level) * 100)}%`;
  const r = run;
  if (r && !r.finished && r.cues && mode !== "thinking") {
    const t = board.clock - r.stepClock;
    let k = r.cues.findIndex((c) => c.start > t) - 1;
    if (k < -1) k = r.cues.length - 1;
    if (captionAt !== `${r.i}|${k}|${r.cues.length}`) {
      captionAt = `${r.i}|${k}|${r.cues.length}`;
      els.saying.hidden = false;
      els.caption.innerHTML = r.cues
        .map(
          (c, i) =>
            `<span class="${i <= k ? "said" : ""}">${c.word.replace(/[<&]/g, "")}</span>`,
        )
        .join(" ");
    }
  } else if (mode === "idle" && awaiting && captionAt !== "answer") {
    captionAt = "answer";
    els.saying.hidden = false;
    els.caption.textContent = serverHearing
      ? "Your turn: say your answer, or tap an option (or press A to D)."
      : "Your turn: tap an option, or press A to D.";
  }
  requestAnimationFrame(animate);
})();

// The buttons under the board: examples at first, then after each answer
// what to ask next about it ("When was he born?", "Tell me more").
function showChips(list, next = false) {
  els.chips.dataset.next = next ? "1" : "";
  els.chips.classList.toggle("next", next);
  els.chips.replaceChildren(
    ...list.map((ex) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = ex;
      b.addEventListener("click", async () => {
        await start();
        if (mode === "teaching") interrupt();
        ask(ex);
      });
      return b;
    }),
  );
}

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
      "Test me on maths",
    ];
    if (!els.chips.dataset.next) showChips(examples);
    els.warm.hidden = h.ready;
    if (!h.ready) setTimeout(health, 1500);
  } catch {
    setTimeout(health, 2000);
  }
}
health();
setMode("off");
