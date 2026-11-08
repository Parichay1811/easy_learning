// Voice activity detection on 20 ms frames of 16 kHz audio. It learns the
// room's noise floor, says when the student starts talking (so the teacher
// can stop at once) and hands over the whole utterance when they stop.
// While the teacher talks it needs a louder, longer sound, so the teacher's
// own voice leaking into the mic is less likely to count as an interruption.
export class Vad {
  constructor({ frameMs = 20, startMs = 200, startMsTalking = 320, endMs = 650, preMs = 400, tailMs = 200, minMs = 350, maxMs = 15000, floor = 0.004 } = {}) {
    const f = (ms) => Math.max(1, Math.round(ms / frameMs));
    Object.assign(this, { startN: f(startMs), startTalkingN: f(startMsTalking), endN: f(endMs), preN: f(preMs), tailN: f(tailMs), minN: f(minMs), maxN: f(maxMs) });
    this.floor = floor;
    this.teacherTalking = false;
    this.level = 0;
    this.pre = [];
    this.speech = null;
    this.above = 0;
    this.below = 0;
  }

  threshold() {
    return Math.max(0.012, this.floor * 3.2) * (this.teacherTalking ? 2.4 : 1);
  }

  // Returns the events this frame caused: 'start', 'cancel' or { type: 'end', audio }.
  push(frame) {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    this.level = rms;
    const th = this.threshold();
    const events = [];
    if (!this.speech) {
      this.pre.push(frame);
      if (this.pre.length > this.preN) this.pre.shift();
      if (rms > th) this.above++;
      else { this.above = 0; this.floor = this.floor * 0.98 + Math.min(rms, th) * 0.02; }
      if (this.above >= (this.teacherTalking ? this.startTalkingN : this.startN)) {
        this.speech = [...this.pre];
        this.pre = [];
        this.above = 0;
        this.below = 0;
        events.push('start');
      }
      return events;
    }
    this.speech.push(frame);
    this.below = rms < th * 0.65 ? this.below + 1 : 0;
    if (this.below >= this.endN || this.speech.length >= this.maxN) {
      const frames = this.speech.slice(0, this.speech.length - Math.max(0, this.below - this.tailN));
      this.speech = null;
      this.below = 0;
      if (frames.length - this.preN < this.minN) events.push('cancel');
      else events.push({ type: 'end', audio: concat(frames) });
    }
    return events;
  }

  get speaking() { return !!this.speech; }
}

function concat(frames) {
  const out = new Float32Array(frames.reduce((n, f) => n + f.length, 0));
  let o = 0;
  for (const f of frames) { out.set(f, o); o += f.length; }
  return out;
}
