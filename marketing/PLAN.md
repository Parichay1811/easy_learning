# Learnigo — Video Marketing Plan (LinkedIn + YouTube)

> This plan covers the **product videos** (01–05). The story-led **mission films** (M1–M4,
> "learning for every kind of mind") have their own plan in [PLAN-MISSION.md](PLAN-MISSION.md),
> and the LinkedIn page set-up is in [linkedin-page/PAGE.md](linkedin-page/PAGE.md).

Everything for marketing lives in `marketing/`. It has its own `package.json` and never
imports from `client/` or `server/`. Brand assets it needs are **copied** into
`marketing/assets/` (not linked), so the website can change without breaking a video and a
video can change without touching the website.

---

## 1. Goal

Make Learnigo known to the two groups who decide whether a child uses it:

| Audience | Where they are | What they need to hear |
|---|---|---|
| **Parents** of children with dyslexia, ADHD or other learning differences | YouTube (search, Shorts), LinkedIn (working parents) | "My child can practise without feeling tested. It's free." |
| **Teachers, tutors, SENCOs, therapists, school leaders** | LinkedIn first, YouTube second | "It saves me work, shows me progress, works in my language, and I can start free." |

**Business outcome:** visits to learnigo.eu → free sign-ups (families) and conversations at
solutions@futuresightanalytics.eu (schools, clinics, tutors).

## 2. Positioning (one sentence)

> **Learning games for every kind of mind** — short, read-aloud rounds, an AI teacher that
> explains out loud with drawings, and camera games that get kids moving. 14 languages.
> Free for families.

### Message pillars (every video uses one or two, never all at once)

1. **No child left out** — audio on every question; designed with dyslexia and ADHD in mind.
2. **Speed is never the point** — no buzzer, no red marks; "beat your own best".
3. **AI teacher that draws and talks** — voice-first, no reading needed to ask or listen.
4. **Learn by moving** — 60+ camera games, any webcam, the camera never leaves the device.
5. **Progress you can see** — dashboards for parents, teachers and schools.
6. **Everywhere** — 14 languages, browser-based, free for families.

### Claims we may make (they are true in the product today)

- Free for families; private teachers start free; schools ask for a plan.
- 14 languages. 3 worlds (English Kingdom, Maths Galaxy, Science Lab) × Listen / Read / Write / Speak.
- Rounds of 10 questions, audio on every question, Practice and Warrior modes.
- 60+ camera games in 8 groups; no video or photo is recorded, saved or uploaded.
- AI teacher answers by voice or text with a drawn, narrated mini-lesson.
- Five roles: Student, Parent, Teacher, School admin, platform admin.

### Claims we must not make

- Anything medical or diagnostic ("treats", "cures", "diagnoses" dyslexia/ADHD). Use
  "designed with … in mind" and "practice". (Same rule as the site's own footer note.)
- Outcome numbers we have not measured ("improves reading by 40%").
- Endorsements, testimonials or school logos we do not have permission for.

## 3. Visual & sound identity for video

- **Look:** the site's meadow world — soft greens and sky blues, the orange/yellow
  Learnigo wordmark, the puppy companion. Rounded cards, generous white space.
- **Type:** rounded, friendly display face for headlines (Fredoka), clean sans (Nunito) for
  body and captions. Big sizes: phone viewers first.
- **The puppy** is the presenter: it says hello at the start, cheers on the proof points,
  and waves at the CTA. (Clips come from the site's own companion set.)
- **Captions always on, burned in.** LinkedIn autoplays muted; ~80% of feed video is
  watched without sound. A video must make sense with the sound off.
- **Motion:** gentle, never flashy — this audience includes children who are sensitive to
  fast flicker. No strobing, no hard cuts faster than ~0.5 s.
- **Sound:** soft, warm music bed + optional voiceover (script in each video's folder).
  Music must be royalty-free/licensed; see §7.

## 4. The video slate

| # | Video | Platform | Format | Length | Pillars | Primary CTA |
|---|---|---|---|---|---|---|
| 1 | **Meet Learnigo** (flagship explainer) | YouTube main channel; pinned on LinkedIn page | 16:9 · 1920×1080 | 55 s | 1, 3, 4, 5, 6 | Start free at learnigo.eu |
| 2 | **Every kind of mind** (parents) | LinkedIn feed | 4:5 · 1080×1350 | 25.5 s | 1, 2, 6 | Start free |
| 3 | **For schools & teachers** | LinkedIn feed (company + founder posts) | 1:1 · 1080×1080 | 32 s | 5, 6, 1 | Talk to us: solutions@… |
| 4 | **The AI teacher** | YouTube Shorts + LinkedIn | 9:16 · 1080×1920 | 22 s | 3 | Ask it a question |
| 5 | **Learn by moving** (camera games) | YouTube Shorts + LinkedIn | 9:16 · 1080×1920 | 26.5 s | 4, 2 | Try the camera games |

Why these five: one long-form anchor for YouTube search and the channel page; one feed
video per LinkedIn audience (parents vs. schools); two vertical Shorts that each sell one
feature hard. Shorts feed people into video 1 and the website.

### Story structure (all videos)

1. **Hook (0–3 s):** a line the viewer recognises from their own life
   ("Some kids read slowly. That's not the problem. The test is.").
2. **Turn (3–8 s):** the puppy + "There's a kinder way to practise."
3. **Proof (middle):** real product screens, one idea per beat, captioned.
4. **Reassurance:** free, private, 14 languages.
5. **CTA (last 3–5 s):** logo, URL, one action. Same end card everywhere.

## 5. Copy for each platform

Lives in `marketing/copy/`:

- `copy/youtube/<video>.md` — title (≤70 chars, keyword first), description (first two
  lines carry the hook + link, then chapters, then links and hashtags), tags, pinned
  comment, thumbnail text.
- `copy/linkedin/<video>.md` — post text written to LinkedIn feed rules (hook in the first
  ~200 characters before "…see more", short lines, one idea, no external link in the body,
  link in the first comment, 3 hashtags max, a question at the end to invite comments),
  plus a variant for the company page and one for the founder's personal profile.

The LinkedIn copy follows the rules in
[sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills); the specifics
we apply are summarised in `copy/linkedin/RULES.md`.

## 6. How the videos are made

Videos are HTML compositions rendered to MP4 with
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP → deterministic
frames → FFmpeg). That means:

- Every video is plain, editable source in `marketing/videos/<name>/` — change a word,
  re-render; translate the captions, re-render a localised version.
- Screens are **real screenshots** of learnigo.eu captured by `marketing/tools/capture.mjs`
  (re-run it after a site redesign and every video picks up the new look). The AI teacher
  is real footage recorded by `marketing/tools/record-ai-teacher.mjs`.
- Narration is generated offline with HyperFrames' built-in voice (Kokoro, `af_heart`) from
  each video's `voiceover.json`; `tools/voice.mjs` also builds the burned-in captions and
  the `.srt`, so words on screen and words spoken never drift apart.
- The puppy clips are the site's companion clips, converted once to transparent WebM by
  `marketing/tools/companion.sh`.

See `marketing/README.md` for the commands.

## 7. Production checklist (per video)

- [ ] Script and captions reviewed against §2 (claims) — no medical claims.
- [ ] Rendered; watched once **muted** — does it still make sense?
- [ ] Watched once on a phone — is every caption readable?
- [ ] Music: `assets/audio/bed.mp3` is generated in code (`tools/music.py`), so it is free to
      use. A licensed track (YouTube Audio Library, Epidemic Sound) will sound better: same file name, re-render.
- [ ] Optional: a human voiceover recorded from `voiceover.json` (best for this audience).
- [ ] Thumbnail (YouTube): `renders/<video>-thumb.jpg`, the hook frame, written by `tools/render.sh`.
- [ ] Upload `renders/<video>.srt` as well (accessibility + YouTube search).
- [ ] Audio is normalised to −14 LUFS / −1.5 dBTP by `tools/render.sh` (YouTube and LinkedIn targets).
- [ ] UTM-tagged link in the description / first comment (see copy files).

## 8. Publishing schedule (4 weeks)

| Week | LinkedIn | YouTube |
|---|---|---|
| 1 | Company page: **#2 Every kind of mind**. Founder repost with personal story (founder variant). | **#1 Meet Learnigo** (main upload, set as channel trailer) |
| 2 | **#4 The AI teacher** (native vertical upload) | **#4** as a Short |
| 3 | **#3 For schools & teachers** (company + founder; tag partner schools only with permission) | **#5 Learn by moving** as a Short |
| 4 | **#5 Learn by moving** + a text-only "what we learned launching" founder post | Community post linking #1; pin best comment |

Post LinkedIn Tue–Thu, 07:30–09:00 in the target timezone (see `copy/linkedin/RULES.md`). Reply to every comment in the
first hour. Upload video **natively** to LinkedIn (never a YouTube link — the feed buries it).

## 9. Measuring it

| Platform | Watch | Good first-month signal |
|---|---|---|
| LinkedIn | Views, % watched to 3 s and 50 %, comments, clicks on first-comment link | >30 % reach 3 s; comments from teachers/parents |
| YouTube | Click-through rate on thumbnail, average view duration, subscribers from video | CTR > 4 %, AVD > 50 % on Shorts |
| Site | Visits and sign-ups with `utm_source=linkedin|youtube` | Sign-ups attributed per video |

After 4 weeks: keep the best hook, re-cut the weakest video with that hook, and produce
localised versions (Spanish, German, Portuguese first) by translating the captions only.

## 10. What would make the next round stronger

These need something only the team can provide:

1. **Dashboard screens.** The parent, teacher and school dashboards need a signed-in account,
   so videos 2 and 3 show the real pricing-page feature lists instead. A demo account with
   sample progress would let us show the actual dashboards (heatmap, progress map, reports).
2. **A child playing a camera game**, filmed with a parent's written consent. That is the
   strongest possible shot for video 5. Until then it uses the real Game Zone screens.
3. **A human voiceover**, especially for video 2 (parents).
4. **One real, dated founder story** for the founder versions of the LinkedIn posts. The
   drafts leave a marked slot for it and must not be posted with the placeholder.
5. **Site issue spotted while capturing:** opening a round while signed out
   (e.g. `/module/read/english`, then "Not now, just play") shows "Could not load. Is the
   server running?". A signed-out visitor arriving from a video could land there; a
   "sign in to play" message would be kinder.
