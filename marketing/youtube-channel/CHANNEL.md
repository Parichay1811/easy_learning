# Learnigo · YouTube channel kit

Everything for the YouTube channel: profile, branding, home page, playlists and upload
defaults. In **YouTube Studio → Customisation** (profile and branding) and **Settings**
(upload defaults). Images are regenerated with `node tools/youtube-channel.mjs`.

| File | Where it goes |
|---|---|
| `avatar-800.png` | Customisation → Branding → Picture |
| `banner-2560x1440.png` | Customisation → Branding → Banner image (the logo and line sit in the safe area every device shows) |
| `watermark-150.png` | Customisation → Branding → Video watermark (display time: entire video) |

---

## Basic info (Customisation → Basic info)

**Name:** `Learnigo` (or `Learnigo Official` to match the LinkedIn page; keep both the same)

**Handle:** `@learnigoofficial` (fallback `@learnigo-eu`). Short, and it matches the LinkedIn page.

**Description** (max 1,000 characters; the first two lines show in search):

```
Learning for every kind of mind. Short films about how children learn, and why learning should be basic, like clean water, and easy, like play.

Learnigo is a free learning platform for children who learn differently: read-aloud learning games, an AI teacher that explains with drawings, and camera movement games, designed with dyslexia, ADHD and other learning differences in mind, in 14 languages.

On this channel:
• Learning for every kind of mind: short films for parents and teachers
• How Learnigo works: a look inside the games, the AI teacher and the camera games
• Shorts: one idea in 30 seconds

New films every week. Subscribe, and send one to a parent or teacher who needs it.

Free for families: https://learnigo.eu
Schools and partnerships: solutions@futuresightanalytics.eu

Learnigo is an educational practice platform, not a diagnostic or medical service. A product of Futuresight Analytics Limited.
```

**Links** (shown on the banner):
1. `Learnigo (free)` → `https://learnigo.eu/?utm_source=youtube&utm_medium=channel&utm_campaign=profile`
2. `LinkedIn` → the page URL once it's live (see `linkedin-page/PAGE.md`)
3. `For schools` → `https://learnigo.eu/pricing?utm_source=youtube&utm_medium=channel&utm_campaign=profile`

Links on banner: show **1**.

**Contact info (business enquiries):** `solutions@futuresightanalytics.eu`

---

## Home tab (Customisation → Layout)

- **Channel trailer for people who haven't subscribed:** M1 *Born curious*
- **Featured video for returning subscribers:** 01 *Meet Learnigo*
- **Sections, in order:**
  1. Short videos
  2. Playlist: *Learning for every kind of mind*
  3. Playlist: *How Learnigo works*
  4. Videos (popular uploads)

## Playlists (create them before the first upload)

| Playlist | Description | Videos |
|---|---|---|
| **Learning for every kind of mind** | Short films about how children learn and why learning should fit every child, made for parents and teachers. | M1, M2, M3, M4 |
| **How Learnigo works** | A look inside Learnigo: the learning games, the AI teacher and the camera games. Free for families at learnigo.eu. | 01, 02, 03, 04, 05 |

## Channel keywords (Settings → Channel → Basic info → Keywords)

```
learnigo, learning games for kids, dyslexia, ADHD, learning differences, special educational needs, SEN, inclusive education, neurodiversity, AI teacher for kids, learning at home, homeschool, education for all, parenting, teachers
```

Country of residence: **[the company's country]**

## Upload defaults (Settings → Upload defaults)

Set these once and every upload starts with them:

| Setting | Value |
|---|---|
| Visibility | Private (each upload is then **scheduled** individually, see `SCHEDULE.md`) |
| Description footer | `Free for families: https://learnigo.eu` · `#education #learningdifferences` |
| Tags | `learnigo, learning games, dyslexia, ADHD, inclusive education, learning differences` |
| Category | **Education** |
| Video language / caption language | English |
| Caption certification | This content has never aired on television in the U.S. |
| Licence | Standard YouTube licence; allow embedding |
| Comments | On; hold potentially inappropriate comments for review |
| Audience | **No, it's not made for kids.** The videos are made for parents and teachers. This is a legal setting (COPPA) that you confirm in Studio; the drawn style alone doesn't make a video "for kids". |

## Per upload (see `SCHEDULE.md` for dates)

1. Upload `renders/<name>.mp4`; title, description, tags and pinned comment come from `copy/youtube/`.
2. Thumbnail: `renders/<name>-thumb.jpg` (Shorts pick a frame instead).
3. Subtitles → Upload file → With timing → `renders/<name>.srt`.
4. Playlist (table above); for long videos, end screen: Subscribe + "Best for viewer".
5. Visibility → **Schedule** at the date and time in `SCHEDULE.md`.
6. Once it's live: pin the prepared comment.
