"""The publishing calendar: one list, two outputs.

    python3 tools/schedule.py

Writes SCHEDULE.md (the plan to follow / schedule from) and schedule.ics (import into
Google Calendar or Outlook for a reminder per post). Edit the SLOTS list, then re-run.

Times are Irish time (Europe/Dublin): LinkedIn at 08:00 (09:00 CET), inside the Tue–Thu
morning window for European parents and teachers; YouTube long videos at 17:00 and Shorts
at 12:00 or 10:00 at the weekend. No posts 23 Dec – 4 Jan, when reach collapses.
"""
import os
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")

# (date, time, platform, video file, copy file + section, what it is)
SLOTS = [
    ("2026-11-26", "08:00", "LinkedIn page", "renders/m2-dear-child.mp4", "copy/linkedin/M-mission-series.md · M2", "Launch post: the letter. Most shareable; opens the page."),
    ("2026-11-26", "17:00", "YouTube ✅ scheduled", "renders/m1-born-curious.mp4", "copy/youtube/M-mission-series.md · M1", "Brand film, https://youtu.be/XoxLSPkXk3I. Playlist: Learning for Every Kind of Mind. Set as channel trailer once public."),
    ("2026-11-27", "08:30", "LinkedIn (founder)", "reshare of 26 Nov post", "copy/linkedin/M-mission-series.md · M2 founder", "Founder reshare with one real sentence on top (yours to write)."),
    ("2026-11-28", "10:00", "YouTube Short ✅ scheduled", "renders/m3-same-wonder.mp4", "copy/youtube/M-mission-series.md · M3", "\"Why?\" in 14 languages."),
    ("2026-12-01", "08:00", "LinkedIn page", "renders/01-meet-learnigo.mp4", "copy/linkedin/01-meet-learnigo.md", "What Learnigo is, in 55 s. Pin to Featured."),
    ("2026-12-01", "17:00", "YouTube ✅ scheduled", "renders/01-meet-learnigo.mp4", "copy/youtube/01-meet-learnigo.md", "Product explainer, with chapters. First video in the playlist \"How Learnigo works\"."),
    ("2026-12-02", "08:00", "LinkedIn page", "linkedin-carousels/S1-dyslexia-at-home.pdf", "copy/linkedin/S-search-series.md · S1", "Search post (carousel): \"help a child with dyslexia at home\". Saves and shares."),
    ("2026-12-03", "08:00", "LinkedIn page", "renders/04-ai-teacher.mp4", "copy/linkedin/04-ai-teacher.md", "The AI teacher draws the answer."),
    ("2026-12-03", "12:00", "YouTube Short ✅ scheduled", "renders/04-ai-teacher.mp4", "copy/youtube/04-ai-teacher-short.md", "AI teacher Short; related video: 01."),
    ("2026-12-05", "10:00", "YouTube Short ✅ scheduled", "renders/m4-ten-minutes.mp4", "copy/youtube/M-mission-series.md · M4", "Saturday: family time."),
    ("2026-12-08", "08:00", "LinkedIn page", "renders/m1-born-curious.mp4", "copy/linkedin/M-mission-series.md · M1", "Brand film on LinkedIn. Add to Featured, first place."),
    ("2026-12-08", "12:00", "YouTube Short ⚠️ not uploaded yet", "renders/05-learn-by-moving.mp4", "copy/youtube/05-learn-by-moving-short.md", "Camera games Short. The file still needs uploading as a draft."),
    ("2026-12-09", "08:00", "LinkedIn page", "linkedin-carousels/S2-adhd-homework.pdf", "copy/linkedin/S-search-series.md · S2", "Search post (carousel): \"ADHD homework tips\"."),
    ("2026-12-10", "08:00", "LinkedIn page", "renders/02-every-kind-of-mind.mp4", "copy/linkedin/02-every-kind-of-mind.md", "For parents."),
    ("2026-12-10", "17:00", "YouTube Short ✅ scheduled", "renders/02-every-kind-of-mind.mp4", "copy/youtube/02-03-optional.md · 02", "Parents video (4:5, so YouTube files it as a Short)."),
    ("2026-12-12", "10:00", "YouTube Short ✅ scheduled", "renders/m2-dear-child.mp4", "copy/youtube/M-mission-series.md · M2", "The letter, on YouTube too."),
    ("2026-12-15", "08:00", "LinkedIn page", "renders/03-schools-and-teachers.mp4", "copy/linkedin/03-schools-and-teachers.md", "For teachers and schools, before the term ends."),
    ("2026-12-15", "17:00", "YouTube Short ✅ scheduled", "renders/03-schools-and-teachers.mp4", "copy/youtube/02-03-optional.md · 03", "Schools video (1:1, so YouTube files it as a Short)."),
    ("2026-12-16", "08:00", "LinkedIn page", "linkedin-posters/S3-dyslexia-myths.png", "copy/linkedin/S-search-series.md · S3", "Search post: \"dyslexia myths\". Have a teacher or SENCO read it first."),
    ("2026-12-17", "08:00", "LinkedIn page", "renders/m3-same-wonder.mp4", "copy/linkedin/M-mission-series.md · M3", "\"What language did you first ask why in?\" A good comment-starter before the break."),
    ("2026-12-22", "08:00", "LinkedIn page", "renders/m4-ten-minutes.mp4", "copy/linkedin/M-mission-series.md · M4", "Holidays at home: ten minutes after dinner."),
    ("2027-01-06", "08:00", "LinkedIn page", "renders/05-learn-by-moving.mp4", "copy/linkedin/05-learn-by-moving.md", "Back to school: movement breaks."),
    ("2027-01-07", "08:00", "LinkedIn page", "linkedin-posters/S4-brain-breaks.png", "copy/linkedin/S-search-series.md · S4", "Search post: \"brain breaks for kids\" (first week back)."),
    ("2027-01-13", "08:00", "LinkedIn page", "linkedin-posters/S5-inclusive-classroom.png", "copy/linkedin/S-search-series.md · S5", "Search post: \"inclusive classroom ideas\" (teachers)."),
    ("2027-01-14", "08:00", "LinkedIn page", "linkedin-posters/S6-bilingual-children.png", "copy/linkedin/S-search-series.md · S6", "Search post: \"bilingual children\"."),
]

DAY = lambda d: datetime.strptime(d, "%Y-%m-%d").strftime("%a %d %b %Y")

md = ["# Publishing schedule (LinkedIn + YouTube)", "",
      "Generated by `tools/schedule.py` (edit the list there and re-run). Times are **Irish time**",
      "(Europe/Dublin); 08:00 is 09:00 CET. Calendar file with a reminder per post: `schedule.ics`.", "",
      "**How to schedule.** On LinkedIn, open the page as admin → Create → Start a post → add the video →",
      "paste the text → clock icon → set date and time. On YouTube, use Studio → Create → Upload → fill in the",
      "details → Visibility → Schedule. Add the `.srt` under Subtitles and the `-thumb.jpg` as the thumbnail.",
      "Post the **first comment** (the link) yourself as soon as each LinkedIn post goes live;",
      "LinkedIn can't schedule comments.", "",
      "**Upload copies.** `01-meet-learnigo` and `m1-born-curious` also have smaller copies in `renders/upload/`",
      "(under 8.5 MB, for upload tools with a 10 MB limit). Upload the full-quality file when you upload by hand.", "",
      "**Search posts (S1–S6)** sit between the video posts: each one owns a phrase people search for",
      "(see `copy/linkedin/S-search-series.md`). S1 and S2 are PDF carousels (attach as a document);",
      "S3–S6 are image posts (attach the poster from `linkedin-posters/`; the post text is the caption).", "",
      "| # | When (Irish time) | Where | Video / file | Copy | Note |", "|---|---|---|---|---|---|"]
for i, (d, t, where, video, copy, note) in enumerate(SLOTS, 1):
    md.append(f"| {i} | {DAY(d)} · {t} | {where} | `{video}` | `{copy}` | {note} |")
md += ["", "## Every week", "",
       "- Reply to every comment within the first hour after each LinkedIn post.",
       "- Leave 3–5 real comments on other people's posts (teachers, SEN, parenting) before posting.",
       "- YouTube: pin the prepared comment on each upload, and heart the first replies.",
       "- Friday: note views, comments, reposts and site visits with `utm_source=linkedin|youtube` (PLAN.md §9).", ""]
open(os.path.join(ROOT, "SCHEDULE.md"), "w").write("\n".join(md))

# iCalendar with Europe/Dublin times (a TZID the calendar apps resolve)
ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Learnigo//marketing schedule//EN", "CALSCALE:GREGORIAN"]
for i, (d, t, where, video, copy, note) in enumerate(SLOTS, 1):
    start = datetime.strptime(f"{d} {t}", "%Y-%m-%d %H:%M")
    end = start + timedelta(minutes=30)
    f = lambda x: x.strftime("%Y%m%dT%H%M%S")
    desc = f"Video: {video}\\nCopy: {copy}\\n{note}".replace(",", "\\,").replace(";", "\\;")
    ics += ["BEGIN:VEVENT", f"UID:learnigo-{d}-{t.replace(':', '')}-{i}@learnigo.eu", f"DTSTAMP:20261125T120000Z",
            f"DTSTART;TZID=Europe/Dublin:{f(start)}", f"DTEND;TZID=Europe/Dublin:{f(end)}",
            f"SUMMARY:Learnigo · {where}: {os.path.basename(video).replace('.mp4', '')}".replace(",", "\\,"),
            f"DESCRIPTION:{desc}", "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Post due", "END:VALARM", "END:VEVENT"]
ics.append("END:VCALENDAR")
open(os.path.join(ROOT, "schedule.ics"), "w").write("\r\n".join(ics) + "\r\n")
print(f"ok  SCHEDULE.md + schedule.ics ({len(SLOTS)} slots)")
