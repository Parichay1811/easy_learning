# Learnigo · LinkedIn page kit

Everything needed to create the LinkedIn page and fill every field, written so the page is
found on LinkedIn search and on Google. Copy each value into the field of the same name.

**Files in this folder**

| File | Use |
|---|---|
| `logo-400.png` | Page logo (400×400) |
| `cover-1128x191.png` | Cover image (made at 2× for sharp screens; LinkedIn scales it) |
| `share-1200x627.png` | Image for link posts and the Featured section |
| `translations.md` | Tagline + description in 13 more languages (from the website's own translations) |

Regenerate images and translations with `node tools/linkedin-page.mjs`.

---

## 0. Which kind of page

- **If Futuresight Analytics Limited already has a LinkedIn page:** create Learnigo as a
  **Showcase Page** under it (Admin tools → Create a Showcase Page). The company and
  product stay connected, and followers of either see both.
- **If not:** create a **Company page** for Learnigo (linkedin.com/company/setup/new → Company).
  You'll need a personal LinkedIn profile, and to confirm you're authorised to act for the
  company.

The fields below are the same for both.

---

## 1. Page identity

| Field | Value | Why |
|---|---|---|
| **Name** | `Learnigo Official` | Chosen name. Five other pages are already called "Learnigo"; "Official" sets this one apart, and "Learnigo" still matches searches. |
| **LinkedIn public URL** | `linkedin.com/company/learnigo-eu` | `/learnigo` belongs to learnigo.co (Mumbai, unrelated) and `/learnigo-official` is reserved by a deleted page. `learnigo-eu` matches the domain. |
| **Website** | `https://learnigo.eu/?utm_source=linkedin&utm_medium=company_page&utm_campaign=profile` | The UTM tags show in analytics as visits from the page. |
| **Industry** | `E-Learning Providers` | The closest match in LinkedIn's list; it's how people filter company search. |
| **Organization size** | `2-10 employees` | |
| **Organization type** | `Privately held` | |
| **Founded** | `2026` (confirm) | |
| **Phone** | leave empty | |
| **Locations** | Primary: **[Futuresight Analytics Limited's registered address]** | Needed to appear in location-filtered searches. Fill in the real address. |
| **Logo** | `logo-400.png` | The puppy reads at the tiny sizes LinkedIn uses (comments, search results). |
| **Cover image** | `cover-1128x191.png` | Text sits right of centre, so the logo overlap on desktop and the side crop on mobile don't hide it. |

## 2. Tagline (max 120 characters)

Shown under the name everywhere: search results, posts, the follow card.

```
Learning games and an AI teacher for every kind of mind. Dyslexia and ADHD friendly, 14 languages, free for families.
```

## 3. Description / Overview (max 2,000 characters)

Google uses the **first ~155 characters** as the snippet for the page, so the first sentence
carries the main search terms (learning games, dyslexia, ADHD, AI teacher, 14 languages).

```
Learnigo is a free learning platform for children who learn differently: short, read-aloud learning games, an AI teacher that explains with drawings, and camera movement games, in 14 languages.

We believe learning should be basic, like clean water, and easy, like play: for every child, in every home and every language. Learnigo is designed with dyslexia, ADHD and other learning differences in mind, and it works for every child.

What children get
• English, maths and science in short 10-question rounds, with every question read aloud
• No buzzer and no red marks: children beat their own best, never each other
• An AI teacher: ask by voice or typing, and it draws the answer on a board and explains it out loud
• 69 camera games that use any webcam (reach, freeze, trace, copy), and no video is ever recorded or uploaded

Who it's for
• Parents: free, with a view of your child's progress
• Teachers and private tutors: groups, your own questions, progress for every student (start free)
• Schools and institutes: classes, timetables, question review and school-wide reports
• Therapists and SEN/SEND specialists: adjustable movement games and clear progress data

Languages: English, Spanish, Portuguese, French, Italian, German, Dutch, Russian, Turkish, Chinese, Japanese, Korean, Indonesian and Vietnamese.

Learnigo is an educational practice platform, not a diagnostic or medical service.

Start free: https://learnigo.eu
Schools and partnerships: solutions@futuresightanalytics.eu
A product of Futuresight Analytics Limited.
```

## 4. Specialties (up to 20)

These are indexed for LinkedIn search. Add them one at a time:

```
Learning games for children
Dyslexia
ADHD
Special educational needs (SEN/SEND)
Inclusive education
Neurodiversity
Learning differences
AI teacher
EdTech
Literacy
Numeracy
Science education
Movement-based learning
Occupational therapy activities
Multilingual learning
Homeschooling
Tutoring platform
School learning platform
Parent progress tracking
Accessible learning
```

## 5. Buttons and Featured

- **Custom button:** `Sign up` → `https://learnigo.eu/?utm_source=linkedin&utm_medium=company_page&utm_campaign=button`
  (Visit website is the alternative; Sign up converts better for a free product.)
- **Featured section** (pin in this order):
  1. Video **M1 · Born curious** (`renders/m1-born-curious.mp4`): what we believe
  2. Video **01 · Meet Learnigo** (`renders/01-meet-learnigo.mp4`): what it is
  3. Link post to `https://learnigo.eu`, using `share-1200x627.png`
- **Hashtags:** if your admin view still offers community hashtags, use `#Dyslexia`, `#InclusiveEducation` and `#EdTech`.

## 6. Languages

Add the other 13 languages under **Edit page → Page info → Manage languages**, using
`translations.md`. People whose LinkedIn is set to Spanish, German and so on then see the
page in their language, and it is indexed in those languages too.

## 7. The first two weeks (for reach)

LinkedIn shows a new page to more people when it gets followers and activity early:

1. Everyone on the team updates their profile **Experience** to the Learnigo page (the logo
   then links to it) and **follows** it.
2. Use **Invite to follow** (Page admin → Grow → Invite connections): up to 250 invites a month.
3. **Post twice in week 1**: M2 *Dear child*, then 01 *Meet Learnigo* (copy in
   `copy/linkedin/`). After that, keep to 2–3 posts a week, Tue–Thu mornings.
4. Founders reshare each page post with their own line on top. Personal reshares reach far
   more people than the page alone.
5. Reply to every comment within the first hour.
6. **On the website:** link to the LinkedIn page from the footer and add it to the
   Organization structured data (`sameAs`) in `client/src/config/company.js`. Google then
   ties the page and the site together. That change is in the website, so make it there.

## 8. Checklist (status 25 Nov 2026)

Page: **Learnigo Official**, https://www.linkedin.com/company/learnigo-eu/ (admin ID 147027176)

- [x] Page created as a Company page at `/company/learnigo-eu`
- [x] Logo (puppy), tagline, website (with UTM), industry, size, type
- [x] Overview (1,538 characters), founded 2026, 20 specialties
- [x] Custom button set to **Sign up**, pointing to learnigo.eu
- [x] 13 more languages (de, es, fr, id, it, ja, ko, nl, pt, ru, tr, vi, zh)
- [ ] **Cover image**: upload `cover-1128x191.png` (Page info → Banner). Needs a file from your computer.
- [x] Location: Dublin, Ireland (Headquarters, primary; no street address)
- [x] Workplace: Remote, with a short description
- [x] Competitor tracked in Analytics: Nessy Learning (free pages track 1; Premium tracks 9)
- [ ] Featured: M1, 01, website link (after the first posts are live)
- [ ] Team profiles linked; invitations sent
- [ ] Posts scheduled (see `SCHEDULE.md`)
- [ ] Website links back to the page (footer + `sameAs`)
