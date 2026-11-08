// The microphone: echo cancellation on, 16 kHz frames from the worklet, and
// the voice detector from shared/vad.js deciding when the student talks.
import { Vad } from '/shared/vad.js';

export async function startMic(ctx, { onStart, onEnd, onCancel } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  await ctx.audioWorklet.addModule('/capture-worklet.js');
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'capture');
  const sink = ctx.createGain();
  sink.gain.value = 0;
  source.connect(node).connect(sink).connect(ctx.destination);
  const vad = new Vad();
  let muted = false;
  node.port.onmessage = (e) => {
    if (muted) return;
    for (const ev of vad.push(e.data)) {
      if (ev === 'start') onStart?.();
      else if (ev === 'cancel') onCancel?.();
      else if (ev.type === 'end') onEnd?.(ev.audio);
    }
  };
  return {
    vad,
    get level() { return muted ? 0 : vad.level; },
    set teacherTalking(v) { vad.teacherTalking = v; },
    mute(v) { muted = v; if (v && vad.speaking) { vad.speech = null; onCancel?.(); } },
    get muted() { return muted; },
    stop() { stream.getTracks().forEach((t) => t.stop()); node.disconnect(); },
  };
}
