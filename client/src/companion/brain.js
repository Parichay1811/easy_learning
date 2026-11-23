// The companion's behaviour: which performance to give next, and when to keep still.
//
// A small state machine rather than random clips. Every input is an event
// (something the learner or the page did); every output is one "beat": a clip from
// the manifest plus optional body cues (hop, lean) for the procedural layer. Clips
// all start and end on the same resting pose, so a beat can follow any other beat.
//
// Principles (docs/companion/INTERACTIONS.md):
//  - Earned, not constant: reactions have cooldowns; ambient moves are rare and never
//    while the learner is reading, scrolling or typing.
//  - Priority: speaking > celebrating > supporting > guiding > attending > ambient.
//  - Never the same flourish twice in a row; rest when nobody is around.
//  - Pure: no DOM, no timers. The stage calls choose(now) when a clip ends (or when
//    an event wants to interrupt) and plays what comes back. Tested in brain.test.mjs.

export const PRIORITY = { ambient: 1, attend: 2, guide: 3, greet: 4, support: 5, celebrate: 6, speak: 7 };

const COOLDOWN_MS = {
  greet: 45_000, // hello once in a while, not on every arrival
  attend: 7_000, // glances at things the learner reaches for
  guide: 30_000, // "look over there" is a rare nudge
  support: 6_000,
  celebrateBig: 3_500,
  ambient: 14_000, // a tilt or glance when the scene is quiet
  play: 90_000, // playing with a butterfly: a rare, delightful moment
};
const QUIET_AFTER_ACTIVITY_MS = 6_000; // reading, scrolling, typing: stay calm this long after
const SLEEPY_AFTER_MS = 75_000; // nobody around: a slow yawn, then calm idle
const PENDING_TTL_MS = 2_500; // a reaction that waited longer than this is stale

export function createBrain({ random = Math.random, now: clock = () => Date.now() } = {}) {
  const t0 = clock();
  const s = {
    speaking: false,
    pending: null, // { kind, clip, priority, cues, at }
    current: { clip: "idle", priority: 0, startedAt: t0 },
    last: {}, // kind -> time it last played
    lastClip: "idle",
    lastActivity: t0,
    lastQuiet: -Infinity, // last time the learner was reading/scrolling/typing
    greetedAt: -Infinity,
    sleepyDone: false,
    arrivals: 0,
  };

  const ready = (kind, at, ms = COOLDOWN_MS[kind]) => at - (s.last[kind] ?? -Infinity) >= ms;
  const want = (kind, clip, priority, at, cues = {}) => {
    if (s.pending && s.pending.priority > priority && at - s.pending.at < PENDING_TTL_MS) return false;
    s.pending = { kind, clip, priority, cues, at };
    return true;
  };

  /**
   * Feed an event. Returns true when it should interrupt the clip that is playing now
   * (higher priority than what is on screen), false when it can wait for the clip to end.
   */
  function dispatch(evt, at = clock()) {
    const type = evt?.type;
    if (!type) return false;
    if (type === "activity" || type === "quiet") {
      s.lastActivity = at;
      if (type === "quiet") s.lastQuiet = at;
      s.sleepyDone = false;
      return false;
    }
    if (type === "speakStart") {
      s.speaking = true;
      s.lastActivity = at;
      s.pending = { kind: "speak", clip: "talk", priority: PRIORITY.speak, cues: {}, at };
      return s.current.priority < PRIORITY.celebrate; // a celebration finishes first
    }
    if (type === "speakEnd") {
      s.speaking = false;
      if (s.pending?.kind === "speak") s.pending = null;
      return s.current.clip === "talk";
    }
    if (type === "arrive") {
      s.arrivals += 1;
      s.lastActivity = at;
      if (at - s.greetedAt >= COOLDOWN_MS.greet) {
        s.greetedAt = at;
        return want("greet", "hello", PRIORITY.greet, at, { settle: true }) && s.current.priority < PRIORITY.greet;
      }
      // Already said hello recently: a curious look at the new place instead.
      return want("attend", "tilt", PRIORITY.attend, at) && false;
    }
    if (type === "greet") {
      if (at - s.greetedAt < COOLDOWN_MS.greet) return false;
      s.greetedAt = at;
      return want("greet", "hello", PRIORITY.greet, at) && s.current.priority < PRIORITY.greet;
    }
    if (type === "success") {
      s.lastActivity = at;
      const big = evt.size === "big";
      if (big && ready("celebrateBig", at)) {
        s.last.celebrateBig = at;
        return want("celebrate", "cheer", PRIORITY.celebrate, at, { hop: "big" }) && s.current.priority < PRIORITY.celebrate;
      }
      // A single right answer: a small happy hop on whatever is playing, no clip change.
      return want("celebrate", null, PRIORITY.celebrate, at, { hop: "small" }) && true;
    }
    if (type === "support") {
      s.lastActivity = at;
      if (!ready("support", at)) return false;
      s.last.support = at;
      return want("support", "comfort", PRIORITY.support, at) && s.current.priority < PRIORITY.support;
    }
    if (type === "play") {
      // A butterfly came to play. Only in a calm moment: never while the voice speaks,
      // while the learner reads or scrolls, or over something more important.
      if (!canPlay(at)) return false;
      s.last.play = at;
      return want("play", "play", PRIORITY.attend, at) && s.current.priority < PRIORITY.guide;
    }
    if (type === "curious") {
      return want("attend", "tilt", PRIORITY.attend, at) && s.current.priority < PRIORITY.attend;
    }
    if (type === "attend" || type === "guide") {
      const guide = type === "guide";
      const kind = guide ? "guide" : "attend";
      if (s.speaking || !ready(kind, at)) return false;
      if (!guide && at - s.lastQuiet < 1_500) return false; // mid-scroll: don't chase things
      const dir = evt.dir === "left" ? "left" : "right";
      // Only the right-facing paw point exists as a performance; a left target gets a look.
      const clip = guide && dir === "right" ? "point" : dir === "left" ? "lookLeft" : "lookRight";
      return want(kind, clip, guide ? PRIORITY.guide : PRIORITY.attend, at, { lean: dir === "left" ? -1 : 1 }) && s.current.priority < (guide ? PRIORITY.guide : PRIORITY.attend);
    }
    return false;
  }

  /** Could a butterfly come and play now? (No side effects: the butterfly asks first.) */
  function canPlay(at = clock()) {
    if (s.speaking || !ready("play", at)) return false;
    if (at - s.lastQuiet < QUIET_AFTER_ACTIVITY_MS) return false;
    if (s.current.priority > PRIORITY.attend) return false;
    if (s.pending && s.pending.priority > PRIORITY.ambient && at - s.pending.at < PENDING_TTL_MS) return false;
    return true;
  }

  /** Called when the playing clip ends, or after dispatch() asked to interrupt. Returns the next beat. */
  function choose(at = clock()) {
    let beat;
    const p = s.pending;
    if (s.speaking) {
      beat = { kind: "speak", clip: "talk", priority: PRIORITY.speak, cues: p?.kind === "celebrate" ? p.cues : {} };
      if (p && p.kind !== "speak") s.pending = p.kind === "celebrate" && !p.clip ? null : p; // keep a bigger reaction for later
      else s.pending = null;
    } else if (p && at - p.at < PENDING_TTL_MS) {
      s.pending = null;
      // A look's cooldown starts when it is actually performed, not when it was asked for.
      if (p.kind === "attend" || p.kind === "guide") s.last[p.kind] = at;
      beat = { kind: p.kind, clip: p.clip || s.current.clip || "idle", priority: p.priority, cues: p.cues, keep: !p.clip };
    } else {
      s.pending = null;
      beat = ambient(at);
    }
    if (!beat.keep) {
      s.current = { clip: beat.clip, priority: beat.priority, startedAt: at };
      if (beat.clip !== "idle" && beat.clip !== "talk") s.lastClip = beat.clip;
    }
    return beat;
  }

  function ambient(at) {
    const calmFor = at - Math.max(s.lastActivity, s.lastQuiet);
    // Nobody around for a long while: one slow yawn, then stillness.
    if (!s.sleepyDone && at - s.lastActivity >= SLEEPY_AFTER_MS) {
      s.sleepyDone = true;
      return { kind: "ambient", clip: "sleepy", priority: PRIORITY.ambient, cues: {} };
    }
    const quiet = at - s.lastQuiet < QUIET_AFTER_ACTIVITY_MS;
    if (!quiet && calmFor > 3_000 && ready("ambient", at) && random() < 0.5) {
      s.last.ambient = at;
      const options = ["tilt", "lookLeft", "lookRight"].filter((c) => c !== s.lastClip);
      const clip = options[Math.floor(random() * options.length) % options.length];
      return { kind: "ambient", clip, priority: PRIORITY.ambient, cues: { lean: clip === "lookLeft" ? -1 : clip === "lookRight" ? 1 : 0 } };
    }
    return { kind: "idle", clip: "idle", priority: 0, cues: {} };
  }

  return {
    dispatch,
    choose,
    canPlay,
    get state() {
      return { speaking: s.speaking, current: { ...s.current }, pending: s.pending ? { ...s.pending } : null, arrivals: s.arrivals };
    },
  };
}
