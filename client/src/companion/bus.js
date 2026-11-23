// Signals from the app to the companion and its butterflies, and a registry of the
// places in the layout where the companion may sit ("spots").
//
//   import { companion } from "../companion/bus";
//   companion.signal("success", { size: "big" });   // a finished round, a badge
//   companion.signal("success");                     // one right answer
//   companion.signal("support");                     // a wrong answer, an error
//   companion.signal("curious");                     // something is loading / thinking
//
// Spots register themselves (components/Mascot does it): { el, priority, modal }.
const listeners = new Set();
const spotListeners = new Set();
const spots = new Map();
let order = 0;
let seq = 0;

export const companion = {
  signal(type, detail = {}) {
    const evt = { type, ...detail };
    listeners.forEach((fn) => { try { fn(evt); } catch { /* a listener failed */ } });
  },
  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function addSpot(spot) {
  seq += 1;
  const id = `spot-${seq}`;
  spots.set(id, { ...spot, id, order: (order += 1) });
  spotListeners.forEach((fn) => fn());
  return {
    id,
    update(patch) {
      const s = spots.get(id);
      if (!s) return;
      spots.set(id, { ...s, ...patch });
      spotListeners.forEach((fn) => fn({ updated: id, ...patch }));
    },
    remove() {
      spots.delete(id);
      spotListeners.forEach((fn) => fn({ removed: id }));
    },
  };
}

export const getSpots = () => [...spots.values()];

// Is the live companion on screen? While it is, spots it is not in stay empty (one
// dog, never two); when it is off (less movement, fewer distractions, no WebGL, data
// saver), every <Mascot> shows the still picture as before.
let live = false;
const liveListeners = new Set();
export function setLive(v) {
  if (live === !!v) return;
  live = !!v;
  liveListeners.forEach((fn) => fn());
}
export const isLive = () => live;
export function onLive(fn) {
  liveListeners.add(fn);
  return () => liveListeners.delete(fn);
}
export const getSpot = (id) => spots.get(id);
export function onSpots(fn) {
  spotListeners.add(fn);
  return () => spotListeners.delete(fn);
}
