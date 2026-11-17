# Vendored tracking models

## `hand_landmarker_lite.task`

The hand model the AR games use on phones and tablets for hand games (see
`src/ar/core/vision.js`): MediaPipe's **full** palm detector paired with its
**lite** hand-landmark network. About 4.4 MB, against 7.8 MB for Google's
`hand_landmarker.task`. The landmark network, which runs for every tracked hand
on every frame, is 2.2× faster: 4.3 ms vs 9.4 ms per hand, single-threaded
TFLite CPU on an Apple-silicon Mac.

Why not lite for both? The lite palm detector is only 1.2× faster, and in our
tests it missed small, distant hands entirely. Whole-body games (child standing
back from the camera) keep the full hand model either way.

Google publishes the lite landmark network but no `.task` bundle with it. It
also lacks the TFLite metadata block the MediaPipe Tasks API requires (otherwise
*"Input tensor has type float32: it requires specifying NormalizationOptions
metadata"*). Its input/output tensors are identical to the full network's, so
`transplant_metadata.py` copies the full network's metadata across, after
checking shapes and output names match.

`scripts/setup-mediapipe.mjs` copies this file to `public/mediapipe/models/`
after checking its SHA-256.

### Rebuilding it

Needs Python with `tensorflow` (for the TFLite flatbuffer schema) and `flatbuffers`.

```sh
B=https://storage.googleapis.com
curl -LO $B/mediapipe-assets/hand_landmark_lite.tflite
curl -LO $B/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
unzip -o hand_landmarker.task          # → hand_detector.tflite, hand_landmarks_detector.tflite (full)
mkdir lite && cp hand_detector.tflite lite/
python transplant_metadata.py hand_landmarks_detector.tflite hand_landmark_lite.tflite lite/hand_landmarks_detector.tflite
(cd lite && zip -0 -X ../hand_landmarker_lite.task hand_detector.tflite hand_landmarks_detector.tflite)
shasum -a 256 hand_landmarker_lite.task   # update LITE_HAND.sha256 in setup-mediapipe.mjs
```

The models are © Google, released under the Apache License 2.0 as part of
[MediaPipe](https://github.com/google-ai-edge/mediapipe).
