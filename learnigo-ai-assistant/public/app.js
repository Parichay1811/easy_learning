// The live teacher in the browser: the student talks (or types), the server
// routes it to a lesson plan, and the board draws each step while the voice
// says it. Talking over the teacher pauses it at once; what the student said
// decides what happens next (carry on, repeat, a new question...).
import { Board, BIG_OPS } from "./board.js";
import { Voice } from "./voice.js";
import { startMic } from "./mic.js";
import { answerPlan } from "/shared/solvers.js";
import { isEcho } from "/shared/echo.js";
import { questionPlan, resultPlan } from "/shared/test.js";
import { GREETING, FILLERS, NOT_HEARD, GO_AHEAD } from "/shared/lines.js";
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
      await fetch(`/api/videos?q=${encodeURIComponent(q)}`)
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
  } catch {
    /* no videos: the lesson still works */
  }
}

function teach(plan) {
  if (plan.next?.length) showChips(plan.next, true);
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
  if (
    plan.title &&
    !["say", "ack", "talk", "unclear", "fragment"].includes(plan.kind)
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
    u.onend = () => {
      if (!r.paused) done();
    };
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
    const res = await fetch(`/api/asr?ctx=${ctx}`, {
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
  fetch("/api/heard", {
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
async function ask(text, seq = ++askSeq, spokenAs = null) {
  if (prefix && Date.now() - prefixAt < 8000) text = `${prefix} ${text}`;
  prefix = null;
  log("you", text, spokenAs);
  setMode("thinking");
  let res;
  try {
    res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        context: {
          ...context,
          awaiting,
          test: !!test,
          history: talk.slice(-3),
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
      els.tier.textContent = `said “${e.say}” after ${e.ms} ms`;
      fillerAt = Date.now();
      teach({ kind: "ack", steps: [{ say: e.say, draw: [] }] });
    } else if (e.type === "plan") {
      plan = e;
      els.tier.textContent = `answered by ${e.tier} in ${e.ms} ms`;
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
      els.tier.textContent += `, spoken answer complete in ${e.ms} ms`;
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
  scene.enter();
  scene.enableTilt();
  haptics.fire("start");
  try {
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
        say: GREETING,
        draw: [
          { op: "clear" },
          { op: "title", text: "Ask me anything" },
          {
            op: "text",
            text: "Say or type a question. Talk any time to interrupt me.",
            at: "Ask",
          },
          { op: "chips", items: examples, at: "topic" },
        ],
      },
    ],
  });
  return true;
}

els.start.addEventListener("click", start);
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
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
      ? voice.level() * 7
      : mode === "hearing" || mode === "paused"
        ? (mic?.level || 0) * 14
        : 0;
  orb.setLevel(level);
  els.meter.style.width = `${Math.round(Math.min(1, level) * 100)}%`;
  const r = run;
  if (r && !r.finished && r.cues && mode !== "thinking") {
    const t = board.clock - r.stepClock;
    let k = r.cues.findIndex((c) => c.start > t) - 1;
    if (k < -1) k = r.cues.length - 1;
    if (captionAt !== `${r.i}|${k}|${r.cues.length}`) {
      captionAt = `${r.i}|${k}|${r.cues.length}`;
      els.caption.innerHTML = r.cues
        .map(
          (c, i) =>
            `<span class="${i <= k ? "said" : ""}">${c.word.replace(/[<&]/g, "")}</span>`,
        )
        .join(" ");
    }
  } else if (mode === "idle" && awaiting && captionAt !== "answer") {
    captionAt = "answer";
    els.caption.textContent =
      "Your turn: say your answer, or tap an option (or press A to D).";
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
    const h = await (await fetch("/api/health")).json();
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
