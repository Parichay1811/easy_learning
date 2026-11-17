/**
 * MediaPipe inference, off the main thread.
 *
 * Why a worker: `detectForVideo()` is synchronous. On a phone a single call can
 * take 50-500 ms (CPU path), and the GPU path can stall far longer on its first
 * real frame (shader compile) or on every frame (synchronous GPU read-back on
 * mobile WebGL). On the main thread that froze the whole page the moment
 * tracking started. In here, a slow model only means fewer tracking updates;
 * touch, drawing and the game clock never wait for it.
 *
 * Protocol (all messages carry an `id`; replies echo it):
 *   → { type: 'init', wasmPath, models: { hand, pose }, delegate: 'GPU'|'CPU' }
 *   → { type: 'load', kind: 'hand'|'pose', numHands, model } ← { delegate, fellBack }
 *     (loading a different `model` for a kind replaces the old task)
 *   → { type: 'detect', bitmap, ts, run: { hand, pose } } (bitmap transferred)
 *     ← { hand, pose, ms: { hand, pose }, delegate: { hand, pose } }
 *   → { type: 'setDelegate', delegate }                  (hot-swap all tasks)
 * Errors come back as { id, error }.
 */
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'

let config = null
let filesetPromise = null
let moduleFactory = null
const tasks = {} // kind -> { task, delegate, lastTs, failStreak, fellBack, ema, frames, opts }

const FACTORY = { hand: HandLandmarker, pose: PoseLandmarker }

const GPU_RUNTIME_FAILS = 3
const ANY_RUNTIME_FAILS = 20
// A GPU delegate this slow after warm-up is worse than the CPU on any phone.
const GPU_TOO_SLOW_MS = 160

function fileset() {
  if (!filesetPromise) {
    // `true` = the ES-module build of the WASM loader: module workers have no
    // `importScripts`, and tasks-vision falls back to `import()` for it.
    filesetPromise = (async () => {
      const fs = await FilesetResolver.forVisionTasks(config.wasmPath, true)
      // tasks-vision loads its WASM glue with `import()` and then *clears*
      // `self.ModuleFactory` after building each task. An ES module is only
      // evaluated once, so the second model (pose after hand) found no factory
      // ("ModuleFactory not set"). Keep our own reference and hand it back
      // before every build — the factory is safe to call more than once.
      const mod = await import(/* @vite-ignore */ fs.wasmLoaderPath)
      moduleFactory = mod.default || self.ModuleFactory
      return fs
    })().catch((err) => {
      filesetPromise = null
      throw err
    })
  }
  return filesetPromise
}

function optionsFor(kind, delegate, opts) {
  // Our own canvas: tasks-vision otherwise decides from the user agent whether
  // OffscreenCanvas is usable and, for iOS Chrome/Firefox, reaches for
  // `document` — which does not exist in a worker.
  const canvas = new OffscreenCanvas(1, 1)
  if (kind === 'hand') {
    return {
      canvas,
      baseOptions: { modelAssetPath: opts.model || config.models.hand, delegate },
      runningMode: 'VIDEO',
      numHands: opts.numHands ?? 2,
      // Slightly permissive: children's hands are small and often partly out
      // of frame. Missing a real reach is worse than a brief false one.
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    }
  }
  return {
    canvas,
    baseOptions: { modelAssetPath: opts.model || config.models.pose, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  }
}

let warmup = null
function warmupImage() {
  if (!warmup) {
    const c = new OffscreenCanvas(128, 96)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#806050'
    ctx.fillRect(0, 0, 128, 96)
    ctx.fillStyle = '#203040'
    ctx.fillRect(32, 24, 64, 48)
    warmup = c
  }
  return warmup
}

function nextTs(entry, t) {
  const ts = Math.max(Math.floor(t), entry.lastTs + 1)
  entry.lastTs = ts
  return ts
}

async function build(kind, opts, first) {
  const fs = await fileset()
  const order = first === 'GPU' ? ['GPU', 'CPU'] : ['CPU']
  const entry = tasks[kind] || { lastTs: 0 }
  let lastErr = null
  let gpuErr = null
  for (const delegate of order) {
    let task = null
    try {
      if (moduleFactory && !self.ModuleFactory) self.ModuleFactory = moduleFactory
      task = await FACTORY[kind].createFromOptions(fs, optionsFor(kind, delegate, opts))
      // Constructing is not enough on mobile GPUs — prove it can run a frame.
      task.detectForVideo(warmupImage(), nextTs(entry, performance.now()))
      Object.assign(entry, {
        task,
        delegate,
        failStreak: 0,
        ema: 0,
        frames: 0,
        opts,
        fellBack: entry.fellBack || Boolean(gpuErr),
      })
      tasks[kind] = entry
      return entry
    } catch (err) {
      lastErr = err
      try {
        task?.close()
      } catch {
        /* already broken */
      }
      if (delegate === 'GPU') gpuErr = err
    }
  }
  throw lastErr || new Error('MODEL_FAILED')
}

async function rebuild(kind, delegate) {
  const entry = tasks[kind]
  if (!entry || entry.rebuilding) return
  entry.rebuilding = true
  const old = entry.task
  entry.task = null
  try {
    old?.close()
  } catch {
    /* context already gone */
  }
  try {
    await build(kind, entry.opts, delegate)
    post({ type: 'delegateChanged', kind, delegate: tasks[kind].delegate, fellBack: tasks[kind].fellBack })
  } catch (err) {
    post({ type: 'log', level: 'error', msg: `${kind} rebuild failed: ${err?.message || err}` })
  } finally {
    entry.rebuilding = false
  }
}

function plain(kind, res) {
  if (!res) return null
  // Copy just what the tracker reads: results can carry methods/masks that
  // cannot be structured-cloned.
  return kind === 'hand'
    ? { landmarks: res.landmarks, handedness: res.handedness || res.handednesses }
    : { landmarks: res.landmarks, worldLandmarks: res.worldLandmarks }
}

function runOne(kind, bitmap, ts) {
  const entry = tasks[kind]
  if (!entry?.task || entry.rebuilding) return { res: null, ms: 0 }
  const t0 = performance.now()
  try {
    const res = entry.task.detectForVideo(bitmap, nextTs(entry, ts))
    const ms = performance.now() - t0
    entry.failStreak = 0
    entry.frames++
    entry.ema = entry.ema ? entry.ema * 0.85 + ms * 0.15 : ms
    if (entry.delegate === 'GPU' && entry.frames > 20 && entry.ema > GPU_TOO_SLOW_MS) {
      post({ type: 'log', level: 'warn', msg: `${kind}: GPU averaging ${Math.round(entry.ema)} ms — switching to CPU` })
      entry.fellBack = true
      rebuild(kind, 'CPU')
    }
    return { res: plain(kind, res), ms }
  } catch (err) {
    entry.failStreak++
    if (entry.failStreak === 1) {
      post({ type: 'log', level: 'warn', msg: `${kind} detect failed (${entry.delegate}): ${err?.message || err}` })
    }
    const limit = entry.delegate === 'GPU' ? GPU_RUNTIME_FAILS : ANY_RUNTIME_FAILS
    if (entry.failStreak >= limit) {
      if (entry.delegate === 'GPU') {
        entry.fellBack = true
        post({ type: 'gpuFailed' })
      }
      rebuild(kind, entry.delegate === 'GPU' ? 'CPU' : entry.delegate)
    }
    return { res: null, ms: performance.now() - t0 }
  }
}

function post(msg, transfer) {
  self.postMessage(msg, transfer || [])
}

self.onmessage = async (e) => {
  const m = e.data
  try {
    if (m.type === 'init') {
      config = { wasmPath: m.wasmPath, models: m.models, delegate: m.delegate }
      await fileset()
      post({ id: m.id, ok: true })
    } else if (m.type === 'load') {
      let entry = tasks[m.kind]
      const model = m.model || config.models[m.kind]
      if (entry?.task && entry.opts?.model !== model) {
        // Same kind, different model (lite ↔ full hand): replace it.
        try {
          entry.task.close()
        } catch {
          /* ignore */
        }
        entry.task = null
      }
      if (!entry?.task) {
        entry = await build(m.kind, { numHands: m.numHands, model }, config.delegate)
      }
      post({ id: m.id, delegate: entry.delegate, fellBack: entry.fellBack })
    } else if (m.type === 'detect') {
      const bitmap = m.bitmap
      const hand = m.run.hand ? runOne('hand', bitmap, m.ts) : { res: null, ms: 0 }
      const pose = m.run.pose ? runOne('pose', bitmap, m.ts) : { res: null, ms: 0 }
      bitmap.close?.()
      post({
        id: m.id,
        hand: hand.res,
        pose: pose.res,
        ms: { hand: hand.ms, pose: pose.ms },
        delegate: { hand: tasks.hand?.delegate || null, pose: tasks.pose?.delegate || null },
      })
    } else if (m.type === 'setDelegate') {
      config.delegate = m.delegate
      for (const kind of Object.keys(tasks)) {
        if (tasks[kind]?.task && tasks[kind].delegate !== m.delegate) rebuild(kind, m.delegate)
      }
      post({ id: m.id, ok: true })
    }
  } catch (err) {
    m.bitmap?.close?.()
    post({ id: m.id, error: String(err?.message || err) })
  }
}
