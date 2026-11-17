// Runs in the audio thread: averages the microphone down to 16 kHz (a box
// filter, so it works for 44.1 and 48 kHz) and posts 20 ms frames.
class Capture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.phase = 0;
    this.acc = 0;
    this.n = 0;
    this.frame = new Float32Array(320);
    this.i = 0;
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let k = 0; k < ch.length; k++) {
      this.acc += ch[k];
      this.n++;
      this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        this.frame[this.i++] = this.acc / this.n;
        this.acc = 0;
        this.n = 0;
        if (this.i === this.frame.length) {
          this.port.postMessage(this.frame, [this.frame.buffer]);
          this.frame = new Float32Array(320);
          this.i = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('capture', Capture);
