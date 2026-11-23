# Companion: verification, performance, limits (November 2026)

## Creative direction

Three directions were weighed:
- **Living Companion:** the puppy is a calm friend who follows the learner's journey.
- **Interactive Storybook:** each section is an illustrated scene.
- **Cinematic World:** characters, light and UI in one continuous environment.

We chose the **Living Companion**, set in a **Cinematic World** background (the meadow itself moves gently; the characters own the attention). The storybook option was set aside because full-scene art for every section is a large art budget that the AI pipeline can't keep consistent across many scenes. It also clashes with dense pages such as the question round and the dashboard. The guiding rule is restraint: the dog is calm while the learner reads, reacts only when something happens, and never covers a control.

## What was verified (and how)

All of these ran in muted headless Chrome against the local demo stack. The scripts are in the session scratchpad: `cine/e2e/`.

| Check | Result |
|---|---|
| Landing: the dog is live (WebGL, stacked-alpha video) and sits in the layout beside the welcome bubble; it says hello on arrival, then a curious tilt | pass (zoomed frames at 2x, clean fur edges) |
| Route change landing → sign-in: lifted, arcs across, lands in the new page's spot; never vanishes (80/80 samples) or jumps (max 72 px per 60 ms) | pass |
| Round at 1440: the dog sits beside the card, never over it; turns to look at a new question | pass |
| Right answer: small hop; wrong answer: `comfort` (then talks along with the voice feedback) | pass |
| Round complete (science, English): hops into the results dialog and cheers | pass |
| Phone round (390x844): no dog over the question; the dog comes into the answer sheet; never covers Next | pass |
| The narrator speaks → `talk` clip | pass |
| Less movement: no live dog, no butterflies, no background film; the still dog shows | pass |
| No page exceptions across the journeys | pass |
| Unit tests: brain (10) and geometry (5), plus all other client tests | 62/62 pass |
| `eslint .` (client), `vite build` | clean, built |
| AI Teacher at 360x740: no dog over the card (the old video's painted dog is gone) | pass |

The responsive pass (Camera Games grid, banner, orb lane, 44 px targets) was measured separately at 8 to 11 sizes from 320 to 2560 px. On the Camera Games hub that found 0 clipped tiles, no horizontal overflow, and 0 covered or orb-covered controls. Details are in the PR description.

## Performance (measured)

Question round at 1440x900, measured over 8 s after load, in the dev build (React dev mode, so absolute numbers are higher than production). "4x" is Chrome CPU throttling, a stand-in for a mid-range phone.

| | fps | p95 frame | frames > 33 ms | long tasks | main-thread ms/s |
|---|---|---|---|---|---|
| companion off | 60.1 | 16.8 ms | 0 | 0 | 28.7 |
| companion on | 60.1 | 16.7 ms | 0 | 0 | 57.5 |
| off, 4x CPU | 60.1 | 16.7 ms | 0 | 0 | 75.9 |
| on, 4x CPU | 60.1 | 16.8 ms | 0 | 0 | 167.2 |

- Two fixes found by this measurement are in:
  - the butterflies read `--nav-h` once a second, not every frame;
  - clips draw on `requestVideoFrameCallback` (24 Hz) instead of every display frame.

  At 4x CPU the companion's cost went from about 126 to about 91 ms/s.
- **Bytes.** Background loops are 0.46 to 0.63 MB each, down from 7 to 10 MB, and the still posters are 80 to 115 KB.
  - First paint of the dog: 30 KB poster plus 246 KB idle clip.
  - Then three likely clips, about 0.86 MB, fetched when the browser is idle.
  - Then others on first use; all 10 clips total 2.5 MB.
  - Nothing is downloaded with less movement, fewer distractions or Save-Data on.
- **Pausing.** Decoding stops when the tab is hidden or the dog's place is off screen.

Not measured: real devices (iOS Safari, Android Chrome on mid-range hardware). Headless Chrome on a laptop GPU is not a phone.

## Known limits and next steps

- **Safari is not tested here.** The stacked-alpha approach is chosen because it needs no Safari-only codec, but it should be checked on an iPhone. In iOS Low Power Mode video autoplay is refused: the dog then stays as the still picture, still hops and travels, and retries the film on the next tap.
- **Looks have three directions:** left, right and the paw point to the right. The lean adds direction but there is no "look up/down" clip. A left paw point would need a mirrored or new clip.
- **Lip-sync is a talking loop,** not phoneme-accurate. P-Video can take audio as input (audio-to-video), which could make true lip-sync clips for fixed phrases later.
- **Camera Games hub has no seat for the dog** (the board is full by design). There is room at 1920 px and up beside the hub, and the butterflies already rest on "New" badges there.
- **The source mascot cut-out has a ragged ear tip;** the pipeline heals it. A cleaner master illustration would make future clips better.
- **Model output varies:** 2 of 3 cheer takes and 1 of 2 talk takes were rejected at review. Keep the review step; never ship unreviewed clips.
- **The old `Mascot` CSS motion** remains as the reduced-motion and fallback look. It is intentionally simple.
