"""SEO caption files for every rendered video.

    python3 tools/captions.py

Writes renders/<video>.caption.txt next to each MP4: a search-friendly title, a caption
to paste on any platform (LinkedIn, YouTube, Instagram, TikTok, Facebook), hashtags,
keywords, alt text for accessibility, and the tracked link. Each caption puts the phrase
people search for in its first line, says it once more naturally, and never makes
medical claims.
"""
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LINK = "https://learnigo.eu/?utm_source=social&utm_medium=video&utm_campaign=captions&utm_content={id}"

VIDEOS = {
    "01-meet-learnigo": dict(
        title="Free learning games for kids with dyslexia & ADHD | Learnigo in 55 seconds",
        caption="""Free learning games for children with dyslexia, ADHD and every kind of mind.

Learnigo turns reading, maths and science practice into short, kind games: rounds of 10 questions, every question read aloud, no buzzer and no red marks. Children beat their own best, never each other.

Ask the AI teacher a question and it draws the answer on a board and explains it out loud. When it's time to move, 69 camera games turn reaching, freezing and copying into learning, and the camera never leaves the device.

Parents, teachers and schools each get their own view of progress. 14 languages, right in the browser, free for families.""",
        hashtags="#Dyslexia #ADHD #LearningGames #InclusiveEducation #EdTech #Learnigo",
        keywords="learning games for kids, dyslexia learning games, ADHD learning games, free educational games, reading practice for kids, maths games, AI teacher for kids, special educational needs, inclusive education, homeschool",
        alt="Short explainer of Learnigo: notebook text 'Some children read slowly. That isn't the problem. The test is.', then the Learnigo meadow world, real screens of the learning games, the AI teacher drawing a diagram, the camera games menu, and the puppy mascot.",
    ),
    "02-every-kind-of-mind": dict(
        title="Homework ends in tears? It might be the format, not your child | Learnigo",
        caption="""If homework ends in tears, the problem might be the format, not your child.

Learnigo reads every question aloud, keeps rounds short and never puts a clock on a child unless they switch one on. Your child plays to beat their own best, and you can see how they're doing, day by day.

Designed with dyslexia and ADHD in mind, in 14 languages, and free for families.""",
        hashtags="#HomeworkHelp #Dyslexia #ADHD #Parenting #LearningAtHome #Learnigo",
        keywords="homework tears, homework help for kids, dyslexia homework help, ADHD homework, learning games for kids, reading aloud, parenting tips, learning at home",
        alt="Handwritten notebook text 'If homework ends in tears, the problem might be the format, not your child', then the Learnigo English learning screen with labels 'Every question read aloud', 'Short, 10-question rounds' and 'No time pressure', a cheering puppy and the words 'Beat your own best'.",
    ),
    "03-schools-and-teachers": dict(
        title="One class, 30 ways of learning: inclusive learning platform for schools | Learnigo",
        caption="""One class. Thirty children. Thirty ways of learning.

Learnigo is an inclusive learning platform for schools, tutors and teachers: the same practice for every child, the way they need it, with audio on every question and no time pressure.

Teachers upload their own questions. School admins approve them and set up classes, subjects and timetables. Progress shows rounds, streaks and skills for every child. 14 languages, nothing to install.

Private teachers start free. Schools: talk to us at solutions@futuresightanalytics.eu""",
        hashtags="#InclusiveEducation #SEND #Teachers #SENCO #EdTech #Learnigo",
        keywords="inclusive classroom, learning platform for schools, differentiated learning, SEN resources, SENCO tools, tutoring platform, teacher question upload, student progress tracking",
        alt="Thirty colourful shapes, each different, under the words 'One class. Thirty children. Thirty ways of learning.', then the Learnigo app and the feature lists for teachers and schools with highlighted lines.",
    ),
    "04-ai-teacher": dict(
        title="This AI teacher answers by drawing | AI teacher for kids | Learnigo",
        caption="""An AI teacher for kids that answers by drawing.

A child typed "Why do plants need sunlight?" and Learnigo's AI teacher drew the leaf, the water, the light and the sugar on a board, then explained it out loud. Children can tap any part of the drawing to hear more.

Ask by voice or by typing. No reading needed, in the child's own language. Free to try.""",
        hashtags="#AITeacher #AIforKids #ScienceForKids #Dyslexia #EdTech #Learnigo",
        keywords="AI teacher for kids, AI tutor for children, why do plants need sunlight, photosynthesis for kids, science for kids, learning with dyslexia, voice learning app",
        alt="Vertical video: 'Ask anything. Get a lesson drawn just for you.' with the puppy, then real footage of Learnigo's AI teacher typing 'Why do plants need sunlight?' and drawing a labelled photosynthesis diagram on a dark board.",
    ),
    "05-learn-by-moving": dict(
        title="69 camera learning games: brain breaks and movement for kids | Learnigo",
        caption="""Some kids learn best when they move.

Learnigo's camera games need just a webcam: children reach, freeze, trace and copy their way through letters, numbers, memory and everyday skills. 69 games in 8 groups, five levels each.

Bigger targets, more time, seated or one-handed play: all adjustable. Nothing is recorded or uploaded, and the camera never leaves the device.""",
        hashtags="#BrainBreaks #MovementBreaks #OccupationalTherapy #SEN #ActiveLearning #Learnigo",
        keywords="camera games for kids, movement learning games, brain breaks for kids, active learning, occupational therapy activities, motor skills games, webcam games for kids, SEN activities",
        alt="Vertical video: 'Some kids learn best when they move.' with a playing puppy, then the Learnigo Game Zone on a phone with the words Reach, Freeze, Trace, Copy, the eight game groups, a checklist of adjustable settings, and 'Nothing is recorded or uploaded'.",
    ),
    "m1-born-curious": dict(
        title="Every child is born curious | A short film about learning for all",
        caption="""Every child is born curious. Somewhere along the way, some of them stop asking.

Not because they can't learn, but because learning was built for one kind of mind. The child who reads slowly is called behind. The child who can't sit still is called difficult.

What if learning met them where they are? Words read aloud when reading is hard. More time when time is the problem. Moving when sitting still won't do.

Learning should be basic, like clean water, and easy, like play: for every child, in every home, in every language.""",
        hashtags="#EducationForAll #Neurodiversity #InclusiveEducation #EveryChildCanLearn #Learnigo",
        keywords="education for all, every child can learn, inclusive education, neurodiversity, learning differences, dyslexia, ADHD, curiosity, short film about education",
        alt="Hand-drawn animation on paper: a child looks up at question marks, a sky, a plant and the moon; the questions fall away; children of different shapes face one narrow door; sticky notes saying 'behind' and 'difficult' fall off; a book, a clock and a jumping child; a water glass and a kite; children on a hill under stars; Learnigo sign-off.",
    ),
    "m2-dear-child": dict(
        title="Dear child who learns differently: a letter",
        caption="""To the child who reads a little slower: you are not behind. You are on your own path.

To the child who can't sit still: moving is part of how you think.

To the child who needs the question twice: asking again is how learning works.

You don't have to change to fit learning. Learning should change to fit you.

With love, the people building Learnigo.""",
        hashtags="#Dyslexia #ADHD #Neurodiversity #LearningDifferences #Parenting #Learnigo",
        keywords="letter to my child, dyslexia support, ADHD child, learning differences, neurodivergent kids, encouragement for kids, parenting",
        alt="A handwritten letter on lined paper, written line by line: 'Dear child, to the child who reads a little slower, you are not behind…', ending 'Learning should change to fit you. With love, the people building Learnigo', with small doodles and the puppy mascot.",
    ),
    "m3-same-wonder": dict(
        title='"Why?" in 14 languages | Every child deserves to learn in their own language',
        caption="""Why? ¿Por qué? Pourquoi? なぜ? Different words, the same wonder.

Every child deserves to learn in the language they dream in. Learnigo works in 14 languages today: English, Spanish, Portuguese, French, Italian, German, Dutch, Russian, Turkish, Chinese, Japanese, Korean, Indonesian and Vietnamese.

14 languages today. Every child, tomorrow.""",
        hashtags="#Multilingual #BilingualKids #Languages #EducationForAll #Learnigo",
        keywords="why in different languages, multilingual children, bilingual kids, learning in your own language, education for all, language learning for kids",
        alt="Hand-drawn globe surrounded by the word 'Why?' in 14 languages, with children gathering around it and the line 'Every child deserves to learn in the language they dream in.'",
    ),
    "m4-ten-minutes": dict(
        title="Ten minutes after dinner: small daily learning habits for kids",
        caption="""Ten minutes, after dinner.

No flashcards. No tears. Just a story, a game, a question answered out loud. Learning that feels like part of the day, not a battle at the end of it.

Small, easy, every day. That's how big things grow.""",
        hashtags="#LearningAtHome #Parenting #DailyHabits #HomeworkWithoutTears #Learnigo",
        keywords="learning at home, daily learning habit for kids, homework without tears, family routine, ten minutes a day, parenting tips",
        alt="Hand-drawn evening room with a lamp, a sofa and a night window, a child reading; thought bubbles with a book, a star and a question mark; a week of ticks from Monday to Friday; a sprout growing in a pot; the sleepy puppy.",
    ),
}

count = 0
for vid, v in VIDEOS.items():
    mp4 = os.path.join(ROOT, "renders", f"{vid}.mp4")
    if not os.path.exists(mp4):
        print("skip (no render):", vid)
        continue
    text = f"""{v['title']}

{v['caption']}

Start free: {LINK.format(id=vid)}

{v['hashtags']}

---
SEARCH TITLE: {v['title']}
KEYWORDS: {v['keywords']}
ALT TEXT: {v['alt']}
NOTE: On LinkedIn, leave out the "Start free" link line and post it as the first comment (links in the post text cut reach).
NOTE: Learnigo is an educational practice platform, not a diagnostic or medical service.
"""
    with open(os.path.join(ROOT, "renders", f"{vid}.caption.txt"), "w") as f:
        f.write(text)
    count += 1
    print(f"ok  renders/{vid}.caption.txt  (title {len(v['title'])}, caption {len(v['caption'])} chars)")
print(f"{count} caption files")
