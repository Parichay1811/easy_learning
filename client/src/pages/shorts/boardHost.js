// The AI Teacher's drawing board, borrowed for Shorts. The board is the same canvas code
// the AI Teacher page uses (server/ai-assistant/public/board.js, served at /ai-assistant/):
// it is loaded at run time, only when Shorts opens, so nothing else pays for it.
//
// One board for the whole feed: it sits in the short that is playing and is moved to the
// next one. The board draws every frame while it is in use and is stopped when Shorts is
// left (its own loop has no off switch, so the frame function is swapped for a no-op).
let host = null;
let loading = null;

// Word times in a sentence, estimated from its length (the same estimate the AI Teacher
// page uses): longer words and punctuation take longer.
function cues(say, dur) {
  const list = String(say).split(/\s+/);
  const weights = list.map((w) => w.replace(/[^\w']/g, "").length + 1.5 + (/[,.;:?!]$/.test(w) ? 3 : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const lead = Math.min(0.15, dur * 0.05);
  return list.map((word, i) => {
    const start = lead + (acc / total) * (dur - lead);
    acc += weights[i];
    return { key: word.toLowerCase().replace(/[^a-z0-9']/g, ""), start };
  });
}
const resolve = (at, cs) => (typeof at === "number" ? at : cs.find((c) => c.key === String(at).toLowerCase())?.start ?? 0);

/** How long a sentence takes to say, in seconds, when there is no audio to measure. */
export const sayDuration = (say, rate = 0.9) => Math.max(2.2, String(say).length / (14 * rate));

/** Resolves with the shared board ({ canvas, draw, clear, play, pause, start, stop }) or null when it cannot load. */
export function getBoard() {
  if (host) return Promise.resolve(host);
  if (loading) return loading;
  loading = import(/* @vite-ignore */ `${window.location.origin}/ai-assistant/board.js`).then((mod) => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const board = new mod.Board(canvas, {});
    const frame = board.frame;
    const big = mod.BIG_OPS || new Set();
    let running = true; // the board starts its own loop when it is made
    host = {
      canvas,
      /** Wipes the board for a new short. */
      clear() { board.add({ op: "clear" }, board.clock); },
      /** Draws one spoken step: big pictures at once, words and marks on their word. */
      draw(step, dur) {
        const cs = cues(step.say, dur);
        const t0 = board.clock;
        for (const op of step.draw || []) {
          const o = { ...op };
          delete o.ask; // a short has nothing to tap
          if (big.has(o.op)) delete o.at;
          for (const k of Object.keys(o)) if ((k === "at" || k.endsWith("At")) && o[k] != null) o[k] = t0 + resolve(o[k], cs);
          try { board.add(o, o.at ?? t0); } catch { /* one drawing that fails leaves the rest */ }
        }
      },
      play() { board.playing = true; },
      pause() { board.playing = false; },
      start() { if (running) return; running = true; board.frame = frame; board.last = performance.now(); requestAnimationFrame(frame); },
      stop() { running = false; board.frame = () => {}; },
    };
    return host;
  }).catch(() => null).finally(() => { loading = null; });
  return loading;
}

/** Stops the board's drawing loop (leaving Shorts, or the tab is hidden). */
export function restBoard() { host?.stop(); }
