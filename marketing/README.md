# Learnigo marketing videos

Promotional videos for LinkedIn and YouTube, with the copy to post them. This folder is
**separate from the website**: it has its own `package.json`, never imports from `client/`
or `server/`, and keeps its own copies of the brand assets it needs.

- **Why and what:** [PLAN.md](PLAN.md) for the product videos, and [PLAN-MISSION.md](PLAN-MISSION.md) for the mission films (story-led, "learning for every kind of mind")
- **LinkedIn page:** [linkedin-page/PAGE.md](linkedin-page/PAGE.md) with every field filled in for search, plus logo, cover and 13 translations
- **Post copy:** [copy/linkedin/](copy/linkedin) and [copy/youtube/](copy/youtube)
- **Finished files:** `renders/` (MP4, captions `.srt`, thumbnail `.jpg`), not committed to git

## The videos

**Mission films.** Hand-drawn, gentle, no product demo: Learnigo signs at the end.

| # | Folder | Size | Length | For |
|---|---|---|---|---|
| M1 | `videos/m1-born-curious` | 1920×1080 | 58 s | YouTube brand film, LinkedIn page featured |
| M2 | `videos/m2-dear-child` | 1080×1350 | 28.5 s | LinkedIn feed (lead post) |
| M3 | `videos/m3-same-wonder` | 1080×1920 | 21.5 s | Shorts, Reels, LinkedIn |
| M4 | `videos/m4-ten-minutes` | 1080×1920 | 24 s | Shorts, Reels, LinkedIn |

**Product videos.** Real screens of learnigo.eu.

| # | Folder | Size | Length | For |
|---|---|---|---|---|
| 1 | `videos/01-meet-learnigo` | 1920×1080 | 55 s | YouTube main / channel trailer, LinkedIn page featured |
| 2 | `videos/02-every-kind-of-mind` | 1080×1350 | 25.5 s | LinkedIn feed, parents |
| 3 | `videos/03-schools-and-teachers` | 1080×1080 | 32 s | LinkedIn feed, teachers and schools |
| 4 | `videos/04-ai-teacher` | 1080×1920 | 22 s | YouTube Shorts + LinkedIn |
| 5 | `videos/05-learn-by-moving` | 1080×1920 | 26.5 s | YouTube Shorts + LinkedIn |

Every video has burned-in captions (or on-screen handwriting), a voiceover, a soft music bed
and the site's own puppy. They make sense with the sound off.

## How they are made

Each video is an HTML page animated with GSAP and rendered frame by frame to MP4 by
[HyperFrames](https://github.com/heygen-com/hyperframes). To change a word, edit the HTML
(or the voiceover) and render again.

```
marketing/
├── PLAN.md                  the marketing plan
├── copy/                    LinkedIn posts, YouTube titles/descriptions/tags
├── videos/<name>/
│   ├── index.html           the composition (scenes, timing, animation)
│   ├── voiceover.json       the narration, line by line (source of the captions)
│   ├── compositions/captions.html   generated captions (don't edit by hand)
│   ├── captions.srt         generated subtitles to upload
│   ├── timing.json          when each voice line starts and ends
│   └── assets -> ../../assets   shared assets (symlink)
├── assets/
│   ├── brand/               wordmark, meadow background, video.css (shared look),
│   │                        drawings.js (hand-drawn children and line art for the mission films)
│   ├── fonts/               Fredoka (the site's typeface)
│   ├── screens/             real screenshots of learnigo.eu
│   ├── footage/             screen recording of the AI teacher
│   ├── companion/           the puppy as transparent WebM clips
│   ├── voice/<name>/vo.wav  the narration track
│   └── audio/               bed.mp3 (product) and bed-gentle.mp3 (mission), generated, royalty-free
├── linkedin-page/           LinkedIn page kit: PAGE.md, logo, cover, share image, translations
└── tools/                   the scripts below
```

## Setup (once)

Needs Node 22+, FFmpeg, Google Chrome and Python 3.

```bash
cd marketing
npm install
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile numpy
npx hyperframes doctor
```

The venv is only for the offline voice (Kokoro) and the music generator. You don't need it
to re-render the videos, because the voice tracks are already in `assets/voice/`.

## Everyday commands

Render everything for upload (about 8 minutes for all nine); output in `renders/`:

```bash
bash tools/render.sh
```

Render one video:

```bash
bash tools/render.sh 04-ai-teacher
```

Preview and edit in HyperFrames Studio (live reload in the browser):

```bash
cd videos/01-meet-learnigo && npx hyperframes preview
```

Check a video for layout, contrast and timing problems:

```bash
cd videos/01-meet-learnigo && npx hyperframes check
```

### Change what the narrator says

1. Edit the line in `videos/<name>/voiceover.json`. `text` is what the captions show
   (`*word*` turns yellow); `say` (optional) is how to pronounce it, for example the URL;
   `"caption": false` hides captions when the picture already shows those words.
2. Re-make the voice, captions and timing:
   ```bash
   node tools/voice.mjs videos/02-every-kind-of-mind
   ```
3. If a line got longer or shorter, nudge the scene start times in `index.html`. The
   script prints the new start of every line, and the same numbers are in `timing.json`.

The voice is `af_heart` (Kokoro, offline, free). For a warmer result, record a human voice
reading `voiceover.json`, save it as `assets/voice/<name>/vo.wav` and render. Keep the same
pacing, or re-time the scenes.

### Refresh the product screens after a site change

```bash
node tools/capture.mjs
node tools/record-ai-teacher.mjs
```

The first command re-captures every screen from https://learnigo.eu (or `SITE=http://localhost:5173`).
The second records the AI teacher answering "Why do plants need sunlight?". Pass another
question as an argument. If you change the question, re-check the camera moves in
`videos/04-ai-teacher/index.html`, because they frame that particular diagram.

### Other tools

| Command | What it does |
|---|---|
| `bash tools/companion.sh` | Converts the site's puppy clips (`client/public/companion`) into transparent WebM |
| `.venv/bin/python tools/music.py` / `music.py gentle` | Re-makes the product / mission music bed |
| `node tools/linkedin-page.mjs` | Re-makes the LinkedIn logo, cover, share image and `translations.md` |
| `node tools/inline-drawings.mjs` | Copies `assets/brand/drawings.js` into the mission films (`render.sh` runs it; the renderer can't load external scripts) |
| `bash tools/render.sh` | Renders, normalises audio to −14 LUFS, and writes the `.srt` and thumbnail |

## Before publishing

- **Music:** `assets/audio/bed.mp3` is generated by `tools/music.py`, so it is ours to use.
  A licensed track will sound better: drop it in with the same file name and render again.
- **Voice:** a human voiceover is better for parents. See "Change what the narrator says".
- **Watch each video once with the sound off, and once on a phone.**
- **Claims:** keep to what the product does today. No medical or diagnostic wording,
  and no outcome numbers we haven't measured. See PLAN.md §2.
- **Tag every link to the site** with `utm_source`, `utm_medium` and `utm_campaign`, as the
  copy in `copy/` does (`?utm_source=youtube&utm_medium=video&utm_campaign=video_launch`).
  The site counts visits without cookies, and the super admin console shows them under
  Analytics → Growth → Website visits: visits and sign-in arrivals per source and campaign.
