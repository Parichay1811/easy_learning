# Companion asset pipeline

This pipeline turns the mascot picture into transparent, browser-ready performance clips, and the background into clean, light loops. It can be repeated: a new performance is one line in `tools/companion/clips.json` and one review.

## Requirements

- Node 20+, Python 3 with `opencv-python` and `numpy`, and ffmpeg with `libx264` and `libwebp`.
- `REPLICATE_API_TOKEN` in the environment of the shell that runs the scripts. Never commit it, put it in a `.env` the app reads, or ship it to the browser. The site needs no token at runtime: every asset is pre-generated and reviewed.
- Raw clips, frames and contact sheets go to `tools/companion/.work/`, which git ignores.

## Steps

```bash
cd tools/companion
# 1. Reference: the mascot on flat green, 4x upscaled (Real-ESRGAN), centred on a square plate with headroom
python3 matte.py ref ../../client/src/assets/dash/mascot.webp .work/ref-small.png --pad 40
#    (upscale .work/ref-small.png with nightmareai/real-esrgan, scale 4 -> .work/ref-x4.png)
python3 matte.py place .work/ref-x4.png .work/home.png --size 1440 --height 0.62 --floor 0.07

# 2. Performances (image-to-video), every clip starts AND ends on home.png
node generate.mjs --draft --only hello,cheer   # cheap previews ($0.005/s) to test a prompt
node generate.mjs                              # all clips at 720p ($0.02/s; about $0.72 for the set)
node generate.mjs --only cheer --seed 11 --tag cheer-11   # retakes with a seed

# 3. Review: contact sheets (ffmpeg tile), reject broken anatomy, pick takes in selection.json

# 4. Build: key, heal, crop to one shared box, stack colour over alpha, H.264, poster, manifest
python3 build.py                               # -> client/public/companion/

# Background without the painted dog and butterflies
node plates.mjs edit      # a frame of each old video -> clean still (google/nano-banana)
node plates.mjs loop      # clean still -> 6 s breeze loop, first = last frame (p-video, 1080p)
node plates.mjs encode    # 1 s cross-faded seam, one keyframe per loop -> meadow-*.mp4 + .webp posters
node plates.mjs stills    # the still meadows behind dashboard cards and entry pages
```

## Why each choice

| Step | Chosen | Compared with | Why |
|---|---|---|---|
| Video model | **Pruna P-Video** (Replicate), image-to-video with `image` and `last_frame_image` both set to the home pose | — | First and last frame control makes every clip start and end on the same pose, so clips can follow each other in any order with no jump (measured: first and last frames are within 2.3 to 3.1 grey levels of the home pose). 5 to 10 s per clip, $0.02/s. Draft mode at $0.005/s for prompt tests. |
| Big moves | **Filmed seated, the jump done in code** | Asking the model for a jump | Three draft and final takes of a jump melted the anatomy (blurred limbs, a smeared face). The cheer is filmed seated; the hop (anticipation, stretch, squash on landing) is `motion.hop` on top. |
| Matte | **Chroma key on flat green, with despill, a garbage matte and bite healing** | Ultralytics YOLO11m-seg; BiRefNet (`men1scus/birefnet`) | YOLO found the dog in 97/97 frames but labels it "teddy bear". Its masks (IoU 0.95 vs chroma) are low resolution: rounded fur tufts and a green halo. BiRefNet's shape is excellent (IoU 0.992) but leaves green fringes (no despill) and costs a call per frame. The chroma key keeps fine fur edges and is per-pixel deterministic, so the edges do not flicker; frame-to-frame IoU equals YOLO's (0.98). Comparison images are in `.work/compare/`. |
| Garbage matte | **Largest connected shape, grown 18 px** | Using YOLO's mask as the garbage matte | It removes the sparkles the model adds without a 40 MB model in the pipeline. |
| Bite healing | **Morphological close in the head region only, small pieces only, inpainted colour** | Regenerating every clip from a repaired reference | The source cut-out had a ragged notch in one ear, which the model painted green. Healing fixes all clips; gaps lower down (tail, legs) are left alone. |
| Format | **Stacked alpha in H.264** (colour on top, alpha as grey below), joined by a WebGL shader | WebM VP9 alpha plus HEVC alpha; frame sequences or sprite sheets; Rive or Spine rig; Three.js | One file per clip that every browser decodes in hardware. WebM alpha does not work in Safari and HEVC alpha only works in Safari, so that route needs two files per clip. Sprite sheets of this size would be about 10x heavier. A Rive or Spine rig needs hand-rigged art, and a 3D model would not match the 2D look. The approach follows Jake Archibald's comparison of alpha video on the web. |
| Real-time layer | **Web Animations API transforms**: hop, lean, travel, enter, exit | GSAP; framer-motion | The interruptible reactions (hops, leaning towards a target, travel between places) are not filmed. WAAPI adds no library, runs on the compositor, and composes (`composite: "add"`). |
| Background | **Clean plate (nano-banana) with a P-Video breeze loop** | Keeping the old videos; a still image | The old 15 s videos had the dog and butterflies painted in (7 to 10 MB each). The new loops are 0.46 to 0.61 MB, have a 1 s cross-faded seam and no keyframe pulses, and come with a still poster. |

## Settings that matter

- `matte.key_alpha`: green dominance `G − max(R, B)`, opaque below 0.05 and transparent above 0.28. The character has no green or yellow-green, so `despill` also warms any "greener than red, little blue" pixel back to fur.
- `build.py` crops every clip to one shared box (the union over all clips, plus 16 px), so the dog does not shift between clips. Output is 480 × 454 per half, CRF 24, about 2.5 MB for 10 clips.
- `manifest.body`: where the body sits in the frame at the home pose. The page uses it to fit the dog onto the old `<Mascot>` box exactly.

## Cost of the set made in this round

| Item | Cost |
|---|---|
| 4 draft clips | $0.07 |
| 10 final clips | $0.72 |
| 5 retakes | $0.32 |
| Upscale | about $0.01 |
| BiRefNet test | about $0.01 |
| 5 plate edits | about $0.20 |
| 3 1080p loops | about $0.72 |
| **Total** | **under $2.10** |
