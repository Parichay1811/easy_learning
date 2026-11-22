# Why Learnigo teaches the way it does

This document gives the research behind each design decision in Learnigo's
learning engine and interface. For each principle it covers:

- the evidence;
- what Learnigo actually does with it, with the code location;
- the benefit we expect;
- how we will know whether it works;
- the limits of the evidence.

Research findings are kept apart from **product hypotheses**: numbers and
rules we chose that the research does not prescribe, and that must be
tested with real learners.

Sources were checked in November 2026. The page and issue numbers are those
of the published articles. Where we only saw an abstract or a secondary
summary, we say so.

## 1. Scaffolding, and fading it out

**Evidence.** Wood, Bruner and Ross (1976, *Journal of Child Psychology and
Psychiatry* 17(2), 89-100) described tutoring as "scaffolding": doing the
parts of a task a child can't do yet, then handing them back. Two further
lines of research refine this:

- **Worked examples and fading.** Worked examples help beginners. Removing
  their steps gradually ("fading", Renkl & Atkinson) works better than
  switching abruptly to problems.
- **Expertise reversal.** For learners who already know the material, the
  same support can get in the way (Kalyuga). Salden et al. (2010,
  *Instructional Science*) found that fading adapted to each student beat a
  fixed fading schedule, on both the immediate and the delayed test. We saw
  only the abstract.

**What Learnigo does.** Each skill has a support step that changes approach
rather than repeating the same question
(`server/services/learning/support.js`):

| Step | Approach |
|---|---|
| 0 | words |
| 1 | pictures |
| 2 | step by step |
| 3 | an easier related item |
| 4 | come back tomorrow |

- An independent right answer moves the skill one step back down, so help
  fades as the learner succeeds.
- Hints are offered, never forced.
- Per-skill diagnostic probes mean a learner who already knows a skill
  skips the beginner support for it. This addresses the expertise-reversal
  risk.

**Expected benefit.** Fewer failed attempts in a row, and success later
without help.

**How we measure.** Two signals:

- The share of right answers given independently (no hints, first try),
  week by week, per skill. The parent evidence panel's "on their own vs with
  help" chart shows this.
- How many skills return to support step 0 after a struggle.

**Limits.** Most fading studies are lab or short classroom studies in maths
and science, with older students. We have no direct evidence for our exact
five steps. The order is a product decision.

## 2. Zone of proximal development and the "right difficulty"

**Evidence.** Vygotsky (1978, *Mind in Society*) described the zone of
proximal development: what a child can do with help but not yet alone. It is
a framework, not a number. People often cite the "85% rule" (Wilson,
Shenhav, Straccia & Cohen, 2019, *Nature Communications* 10, 4646) as the
ideal success rate. That paper proves it only for gradient-descent learning
on **two-choice** classification problems, and tests it on neural networks
and a model of perceptual learning. The authors leave more complex learning
as an open question, and did not claim it applies to schoolwork.

**What Learnigo does.** Rounds aim for a **target success band**,
75-90% by default (`server/config/learning.js`, `targetBand`):

- If recent success is above the band, the next round leans harder.
- If it is below, the round leans easier.
- Every tilt is written to the decision log.

The band is configurable.

**Product hypothesis, not a finding.** The 75-90% band and its 20-attempt
window are our starting choice.

**How we measure.** We compare three things across different band
settings, as a pilot:

- delayed review success (retention);
- rounds abandoned part-way;
- how quickly skills are mastered.

**Limits.** Success rates on multiple-choice items include lucky guesses
(see section 4), so the band is computed on graded items with a discount
for chance.

## 3. Mastery learning

**Evidence.** Kulik, Kulik and Bangert-Drowns (1990, *Review of Educational
Research* 60(2), 265-299) pooled 108 controlled evaluations and found that
mastery programmes raised exam performance. Slavin (1987) found little
support on standardised tests for group-based mastery learning, so the
literature is contested. The Education Endowment Foundation's Toolkit
estimates about **+5 months** of progress, larger in maths and science than
in reading. It rates the security of that evidence as **low**, with results
that vary widely.

**What Learnigo does.**

- A level goes up only after at least 12 graded attempts on at least 2
  different days, at 85% or better (`levelPolicy.js`).
- A skill is "mastered" only with real evidence: right answers on at least
  2 different items, including one beyond simple recognition where the skill
  has such items, plus a delayed recall in Leitner box 2 or higher.
- Levels never go down automatically; only a suggestion is made.

**Product hypotheses.** 85%, 12 attempts and 2 days are our choices, not
prescribed by the research.

**How we measure.** Success on the first delayed review after a skill is
marked mastered (retention). Also, how often a mastered skill is later
missed.

**Limits.** The low security rating and the contested results are real.
Mastery here supports the learner's progress; it is not a guarantee.

## 4. Telling knowing from guessing

**Evidence.** Bayesian Knowledge Tracing (Corbett & Anderson, 1995, *User
Modeling and User-Adapted Interaction* 4, 253-278) models the chance of
guessing right without knowing, and of slipping despite knowing. On a
two-option question, chance alone gives 50% right.

**What Learnigo does.**

- A right answer on a two- or three-option item earns less mastery credit
  (`chanceDiscount`).
- Mastery needs right answers on different items, at different stages.
- Response speed is **never** treated as evidence. It is not stored in the
  profile and does not count towards mastery.

**Product hypothesis.** The size of the discount. We do not fit full BKT
parameters yet, because there is not enough data per skill.

**How we measure.** We check whether skills "mastered" mainly through true/false
items are kept as well at review as other skills.

## 5. Spaced repetition

**Evidence.** In Cepeda, Pashler, Vul, Wixted and Rohrer (2006,
*Psychological Bulletin* 132(3), 354-380), spaced practice beat massed
practice across 839 assessments. The best gap grows with how long the
learning has to last. With children, Vlach and Sandhofer (2012, *Child
Development* 83(4), 1137-1144) found that spaced science lessons (food
chains, ages 5-7) improved generalisation of both simple and complex
concepts. Dunlosky et al. (2013, *Psychological Science in the Public
Interest* 14(1), 4-58) rated distributed practice "high utility". The IES
practice guide by Pashler et al. (2007, NCER 2007-2004) recommends spacing
learning over time.

**What Learnigo does.** It runs Leitner boxes with intervals of 0, 1, 3, 7,
14 and 30 days (`spacing.js`):

- A skill moves up a box only when it was due and answered independently.
- A miss sends it back to box 0.
- Reviews that are due get places in the next round and come first in
  "What next?".

**Product hypothesis.** The exact intervals.

**How we measure.** Review success by box and by week. Parents see this as
"retention".

## 6. Retrieval practice

**Evidence.** In Roediger and Karpicke (2006, *Psychological Science* 17(3),
249-255):

- Students who were tested remembered more after 2 days and 1 week than
  students who restudied.
- The restudy group did better at 5 minutes.
- Restudying made students *feel* more confident without helping them
  remember.

Dunlosky et al. (2013) rate practice testing "high utility". The IES guide
recommends quizzing to promote learning.

**What Learnigo does.**

- Learning happens by answering questions, not by rereading.
- Reviews are questions, not summaries.
- The daily discovery and the mini challenge are also retrieval.

**How we measure.** Delayed review success compared with the learner's first
attempts on the same skill.

## 7. Interleaving

**Evidence.** Rohrer, Dedrick, Hartwig and Cheung (2020, *Journal of
Educational Psychology* 112(1), 40-52) ran a pre-registered cluster
randomised trial: 787 students in 54 maths classes. The same problems were
practised either interleaved or blocked:

- On a delayed, unannounced test, the interleaved classes scored 61%
  against 38% for blocked practice (d = 0.83).
- The What Works Clearinghouse accepted the study without reservations.

Dunlosky et al. rate interleaving "moderate", because evidence outside maths
is thinner.

**What Learnigo does.** A round mixes review, practice, prerequisite,
stretch and new items across several skills (`round.js`). The order puts a
familiar item first, each easier item just before the skill it prepares, and
the stretch item about two-thirds of the way in.

**Product hypothesis.** The mix per pace (gentle, steady or brisk).

**Limits.** The strongest evidence is for maths problems that look alike. We
apply it to all subjects.

## 8. Cognitive load

**Evidence.**

- **Cognitive load theory.** Sweller (1988, *Cognitive Science* 12(2),
  257-285) proposed that working memory is limited. Instruction should
  avoid loading it with things that don't serve learning.
- **Seductive details.** "Interesting but irrelevant" material can reduce
  learning (Harp & Mayer, 1998). Rey's 2012 meta-analysis reports small to
  medium harm to recall and transfer, in about two-thirds of studies. We saw
  this through secondary summaries.

**What Learnigo does.**

- One question at a time, with one new idea at a time: new skills are
  limited per round.
- The comfort settings remove motion, video and decoration ("fewer
  distractions").
- Narration scripts are capped at 50 words, and at 35 for listening items.
- Narration must stay on the question. Its stories set a real-world scene;
  they don't add new facts.
- Achievement notices are held back until a question is finished.

**How we measure.** Rounds abandoned part-way, and whether learners turn
narration off or on (both can be logged as settings without content).

**Limits.** The seductive-details effect depends on time pressure and prior
knowledge. A short story frame is a calculated risk, and we keep it short
for that reason.

## 9. Conversational narration and everyday contexts

**Evidence.**

- **Conversational style.** Ginns, Martin and Marsh (2013, *Educational
  Psychology Review*) pooled 3,312 students and found that instructional
  text in a conversational style improved retention (d = 0.30) and transfer
  (d = 0.54). It did not improve interest. The effects faded in sessions
  longer than about 35 minutes.
- **Personalised contexts.** Walkington (2013, *Journal of Educational
  Psychology* 105(4), 932-945) rewrote algebra story problems around
  students' interests, keeping the maths the same. Students solved them
  faster and more accurately, especially those who were struggling.
  Walkington herself warns that easier personalised problems don't by
  themselves prove more learning.

**What Learnigo does.**

- Every question has its own spoken script, addressed to the learner as
  "you". It keeps the same facts, options and difficulty as the screen and
  never gives away the answer.
- The new **everyday-curiosity** items (stage 0) start from daily life: an
  umbrella in the rain, ice melting, mixing paint.

**Product hypotheses.** That a story frame helps learners with literacy
difficulties as well as adding warmth. That everyday items before abstract
ones help learners start. We have no direct test of either yet.

**How we measure.** In a pilot, compare success and abandonment with scripts
against reading the screen text aloud. Also track how often learners use
"Read to me".

## 10. Motivation: autonomy, competence, relatedness

**Evidence.**

- **Self-determination theory.** Ryan and Deci (2000, *American
  Psychologist* 55(1), 68-78) set out three needs: autonomy, competence and
  relatedness.
- **Tangible rewards.** Deci, Koestner and Ryan (1999, *Psychological
  Bulletin* 125(6), 627-668; 128 studies) found that tangible rewards for
  engagement, completion or performance reduced free-choice intrinsic
  motivation. Cameron and Pierce contest this.
- **Gamification.** Sailer and Homner (2020, *Educational Psychology Review*
  32, 77-112) found positive effects of gamification on learning outcomes.
  Many of the underlying studies were weak, and the effects varied with the
  design. Game fiction and social interaction mattered.

**What Learnigo does.**

| Need | In Learnigo |
|---|---|
| Autonomy | Real choices: Continue, Review, or Something new; several recommendations instead of one path; learners can pick their level |
| Competence | Truthful feedback about what they did; growth badges that record their evidence |
| Relatedness | One warm teacher voice, and a companion that remembers what was hard |

There are no rankings and no streak penalties. There are no new awards for
studying late at night or early in the morning; badges already earned stay.

**How we measure.** Which recommendations children choose, voluntary
returns, and discoveries completed. Never time on the app as a goal.

**Limits.** Badges are extrinsic. We tie them to learning (a comeback, a
review, independent problem solving), not to time or volume. The research
still warns that they can reduce interest in the task itself, so we watch
for that.

## 11. Formative assessment and feedback

**Evidence.**

- **Formative assessment.** Black and Wiliam (1998, *Assessment in
  Education* 5(1), 7-74) reviewed evidence that formative assessment raises
  achievement.
- **Levels of feedback.** Hattie and Timperley (2007, *Review of
  Educational Research* 77(1), 81-112) distinguish feedback about the task,
  the process, self-regulation and the self. Praise of the self is the least
  effective.
- **Feedback can backfire.** Kluger and DeNisi (1996, *Psychological
  Bulletin* 119(2), 254-284) found that about a third of feedback
  interventions lowered performance.
- **EEF rating.** The EEF rates feedback as high impact for very low cost.
- **Praise for intelligence.** Mueller and Dweck (1998) found that praising
  children's intelligence, rather than their effort, harmed their
  motivation after setbacks. Later mindset-intervention studies show smaller
  and more variable effects.

**What Learnigo does.**

- Feedback names what the learner did ("You remembered the rule from
  yesterday"), never labels them. The messages are varied and only claimed
  when true.
- Wrong answers bring a calm "try again" and a different approach.
- A repeated misconception (the same wrong idea twice) triggers a short
  explanation of that idea, taken from the item's own analysis, instead of
  another near-identical question.
- Error patterns feed the engine, and guardians and teachers in plain
  language.

**How we measure.**

- Misconceptions seen, then resolved: right on the same skill later,
  without the same error.
- Success after an explanation compared with success after a plain retry.

## 12. Continuity and recommendations

**Evidence.** We know of no direct trials of welcome-back messages. This
section is design, grounded in sections 5, 6 and 10: reviews when they are
due, real choices, and no guilt.

**What Learnigo does.**

- An unfinished round can be resumed.
- The welcome-back message is built only from stored history and never
  mentions missed days.
- "What next?" is ranked: unfinished work, then reviews due, then
  prerequisite support, then the next concept, then a challenge, then
  today's discovery, then something new. Each comes with a reason a child
  can understand.

**Product hypothesis.** The order.

**How we measure.** Which recommendation is chosen, and whether the round it
starts is finished.

## Things we deliberately do not do

- **Use response time to lower a level or to mark mastery.** It's unfair to
  slow readers, learners using assistive technology, and anyone thinking
  carefully. It was also an explicit requirement for the platform.
- **Rank children against each other, or use streaks that punish a missed
  day.**
- **Give scores that look like ability or IQ measures.** Parents see levels,
  skills, success rates with sample sizes, and retention: what was observed,
  not who the child is.
- **Claim learning gains we haven't measured.** Every insight sentence cites
  the recorded numbers behind it.

## What still needs real-world testing

1. Every threshold marked as a product hypothesis above, in a pilot with
   real learners and with consent.
2. Narration scripts compared with reading the screen aloud, especially for
   learners with reading difficulties.
3. Stage 0 everyday items as a first step compared with starting straight
   at stage 1.
4. The templated narration in languages other than English, which needs
   native speakers to review it.
5. Whether growth badges keep or erode interest over months.

The decision log (`learningdecisions`), the evidence block and the
privacy-preserving answer history provide the data for these comparisons.
There is no personal data beyond what the engine already keeps.
