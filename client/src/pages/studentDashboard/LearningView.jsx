import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FaSeedling, FaListUl, FaBullseye, FaChartLine, FaPen, FaStar, FaLightbulb, FaCheck, FaTimes, FaPlay, FaRedo,
} from 'react-icons/fa'
import Mascot from '../../components/Mascot/Mascot'
import Sheet from '../../components/dashboard/Sheet'
import Button from '../../components/dashboard/Button'
import {
  LevelBadge, LevelPicker, SkillList, NextUpCard, GoalList, WeeklyProgress,
  SUBJECTS, SUBJECT_META, MAX_LEVEL, levelLabel, lockedText, practiseHref, skillName, sourceText, statusText, subjectName,
  goalsForServer, shortDate, suggestionText, weeksFromAnswers, weeksFromRounds, tFresh, levelHowText,
} from '../../components/learning'
import TabBar from './TabBar'
import { useMedia } from './hooks'
import { learnFetch } from './learnApi'
import c from './common.module.css'
import s from './LearningView.module.css'

// What each suggestion says (the engine's words, in this language) and the two answers.
function suggestionWords(t, sg) {
  const answers = {
    level_up: [t('studentDash.learning.suggest.levelUpYes', 'Yes, move me up'), t('studentDash.learning.suggest.notYet', 'Not yet')],
    level_down: [t('studentDash.learning.suggest.levelDownYes', 'Yes, please'), t('studentDash.learning.suggest.stay', "No, I'll stay")],
    review: [t('studentDash.learning.suggest.reviewYes', 'Okay'), t('studentDash.learning.suggest.later', 'Later')],
    break: [t('studentDash.learning.suggest.breakYes', 'Good idea'), t('studentDash.learning.suggest.keepGoing', 'Keep going')],
  }[sg.type] || [t('studentDash.learning.suggest.yes', 'Yes'), t('studentDash.learning.suggest.no', 'No, thanks')]
  return { subject: sg.subject ? subjectName(t, sg.subject) : '', text: suggestionText(t, sg), yes: answers[0], no: answers[1] }
}

// A level looks after itself: it starts from the learner's first answers and the
// engine moves it up as they practise. The learner may still adjust it (their
// choice is kept on purpose: docs/learning/RESEARCH.md §10). So the card says
// how a level came about, and the button reads as what it is: an optional
// adjust, not something the learner has to set.
//  - A phone (`eachRow`): every row says it ("Set from your answers", "You
//    chose this level"); the sentence under the list is not shown there.
//  - Wider screens: one sentence under the list says it for all three. (The
//    card is exactly as tall as its three rows and two lines of words: a line
//    more in a row would push that sentence out of sight.)
function Levels({ profile, onChange, onAsk, eachRow = false }) {
  const { t, i18n } = useTranslation()
  return (
    <ul className={s.levelList}>
      {SUBJECTS.map((subj) => {
        const lv = profile?.levels?.[subj] || {}
        const meta = SUBJECT_META[subj]
        return (
          <li key={subj} className={s.levelRow} style={{ '--sk': meta.color, '--sk-soft': meta.soft, '--sk-ink': meta.ink }}>
            <LevelBadge
              level={lv.level} subject={subj} showSubject locked={lv.locked} size="sm" className={s.badge}
              note={lv.locked ? sourceText(t, lv.lockedBy || lv.source, 'me') : statusText(t, lv.status, 'me')}
              how={eachRow && !lv.locked && lv.level != null ? levelHowText(t, i18n, lv.source) : ''}
            />
            <button
              type="button"
              className={s.change}
              onClick={() => (lv.locked ? onAsk(subj) : onChange(subj))}
              aria-label={tFresh(t, i18n, 'studentDash.learning.adjustAria', 'Adjust my {{subject}} level', 'studentDash.learning.changeAria', { subject: subjectName(t, subj) })}
            >
              <FaPen aria-hidden="true" /> <span>{tFresh(t, i18n, 'studentDash.learning.adjust', 'Adjust', 'studentDash.learning.change')}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Suggestions({ list, onAnswer, busy }) {
  const { t } = useTranslation()
  if (!list?.length) return null
  return (
    <ul className={s.suggestions} aria-label={t('studentDash.learning.suggestionsLabel', 'Ideas from Learnigo')}>
      {list.slice(0, 1).map((sg) => {
        const w = suggestionWords(t, sg)
        return (
          <li key={sg.id} className={s.suggestion}>
            <span className={s.suggestIcon} aria-hidden="true"><FaLightbulb /></span>
            <span className={s.suggestText}>{w.subject && <b>{w.subject}: </b>}{w.text}</span>
            <span className={s.suggestBtns}>
              <button type="button" className={s.yes} disabled={busy} onClick={() => onAnswer(sg, true)}><FaCheck aria-hidden="true" /> {w.yes}</button>
              <button type="button" className={s.no} disabled={busy} onClick={() => onAnswer(sg, false)}><FaTimes aria-hidden="true" /> {w.no}</button>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Wins({ wins }) {
  const { t, i18n } = useTranslation()
  if (!wins?.length) return null
  return (
    <div className={s.wins}>
      <h4 className={s.miniTitle}><FaStar aria-hidden="true" /> {t('studentDash.learning.wins', 'Recent wins')}</h4>
      <ul>
        {wins.slice(0, 3).map((w, i) => (
          <li key={`${w.skill}-${i}`}>
            <span>{t('studentDash.learning.win', { defaultValue: 'You got the hang of {{skill}}', skill: skillName(t, { id: w.skill, name: w.name }) })}</span>
            {w.at && <small>{shortDate(w.at, i18n.language)}</small>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Skills({ data, readOnly }) {
  const { t } = useTranslation()
  const [which, setWhich] = useState('practise')
  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data])
  const practise = useMemo(() => {
    const out = new Map()
    for (const x of data?.needsPractice || []) out.set(x.skill || x.id, { ...skills.find((k) => k.id === (x.skill || x.id)), ...x, id: x.skill || x.id })
    for (const k of skills) if (k.state === 'review_due' && !out.has(k.id)) out.set(k.id, k)
    return [...out.values()]
  }, [data, skills])
  const mastered = skills.filter((k) => k.state === 'mastered')
  const views = [
    { key: 'practise', label: t('studentDash.learning.toPractise', 'To practise'), Icon: FaRedo },
    { key: 'got', label: t('studentDash.learning.gotIt', 'Got it!'), Icon: FaCheck },
  ]
  const list = which === 'practise' ? practise : mastered
  return (
    <div className={s.skills}>
      <TabBar variant="seg" tabs={views} active={which} onChange={setWhich} idPrefix="sd-skills" label={t('studentDash.learning.skillsViews', 'My skills')} className={s.miniSeg} />
      <div role="tabpanel" id={`sd-skills-panel-${which}`} aria-labelledby={`sd-skills-tab-${which}`} className={`${c.scroll} ${s.skillScroll}`}>
        <SkillList
          skills={list}
          who="me"
          showSubject
          showState={which === 'practise'}
          showMisconception={false}
          action={readOnly || which !== 'practise' ? undefined : (sk) => (
            <Link to={practiseHref(sk, data?.next)} className={s.practise} aria-label={t('studentDash.learning.practiseAria', { defaultValue: 'Practise {{skill}} now', skill: skillName(t, sk) })}>
              <FaPlay aria-hidden="true" /> {t('studentDash.learning.practise', 'Practise now')}
            </Link>
          )}
          empty={(
            <p className={s.emptyLine}>
              {which === 'practise'
                ? (skills.length
                  ? t('studentDash.learning.nothingToPractise', 'Nothing needs extra practice right now. Nice!')
                  : t('studentDash.learning.noSkillsYet', 'Play a round and your skills will show up here.'))
                : t('studentDash.learning.noMastered', 'Skills you master will collect here. Every round helps!')}
            </p>
          )}
        />
      </div>
    </div>
  )
}

// The weeks: the engine's weekly totals when the profile has them, else worked
// out here from the latest answers (or game rounds).
function OverTime({ history }) {
  const { t } = useTranslation()
  const [weeks, setWeeks] = useState(null)
  const own = Array.isArray(history) && history.length ? history : null
  useEffect(() => {
    if (own) return undefined
    let live = true
    ;(async () => {
      const a = await learnFetch('/dashboard/answers?limit=200')
      let w = a.ok ? weeksFromAnswers(a.data || [], 8) : []
      if (!w.length) {
        const r = await learnFetch('/dashboard/rounds?limit=100')
        w = r.ok ? weeksFromRounds(r.data || [], 8) : []
      }
      if (live) setWeeks(w)
    })()
    return () => { live = false }
  }, [own])
  if (!own && weeks == null) return <p className={s.emptyLine} role="status">{t('studentDash.learning.loadingWeeks', 'Counting your weeks…')}</p>
  return <WeeklyProgress history={own || weeks} who="me" height={130} className={s.weekly} />
}

/**
 * "My learning" (Progress tab): my level in each subject, what's next,
 * Learnigo's ideas, skills to practise and the ones I've got, my goals and my
 * weeks. Wide screens show it all at once; phones show one part at a time.
 *
 *   <LearningView learn={useLearnProfile()} readOnly={false} />
 */
export default function LearningView({ learn, readOnly = false }) {
  const { t, i18n } = useTranslation()
  const wide = useMedia('(orientation: landscape) and (min-width: 1200px) and (min-height: 560px)')
  const tablet = useMedia('(orientation: portrait) and (min-width: 700px) and (min-height: 900px)')
  const compact = !wide && !tablet
  const [part, setPart] = useState('me')
  const [editing, setEditing] = useState(null) // { subject, locked }
  const [pick, setPick] = useState(null)
  const [sheetMsg, setSheetMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState('')
  const data = learn?.data
  const profile = data?.profile
  // The little "Saved" line fades after a few seconds (screen readers heard it already).
  useEffect(() => {
    if (!said) return undefined
    const id = setTimeout(() => setSaid(''), 5000)
    return () => clearTimeout(id)
  }, [said])

  if (learn?.loading && !data) {
    return (
      <div className={`${c.card} ${c.empty}`} role="status">
        <Mascot size="clamp(50px, 14vh, 110px)" mood="think" />
        <p>{t('studentDash.learning.loading', 'Getting your learning ready…')}</p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className={`${c.card} ${c.empty}`}>
        <Mascot size="clamp(50px, 14vh, 110px)" mood="idle" />
        <h3>{t('studentDash.learning.errorTitle', 'This part is taking a nap')}</h3>
        <p>{t('studentDash.learning.error', "We couldn't load your learning just now. Your stars and badges are safe.")}</p>
        <button type="button" className={c.soft} onClick={learn?.reload}><FaRedo aria-hidden="true" /> {t('dashboard.retry', 'Try again')}</button>
      </div>
    )
  }

  const openChange = (subject) => {
    const lv = profile?.levels?.[subject] || {}
    setEditing({ subject, locked: false })
    setPick(lv.level ?? null)
    setSheetMsg('')
  }
  const openLocked = (subject) => { setEditing({ subject, locked: true }); setSheetMsg('') }
  const close = () => { setEditing(null); setSheetMsg('') }

  const saveLevel = async () => {
    if (!editing || pick == null) return
    setBusy(true)
    const r = await learn.save({ levels: { [editing.subject]: pick } })
    setBusy(false)
    if (r.ok) {
      setSaid(t('studentDash.learning.levelSaved', { defaultValue: 'Your {{subject}} level is now {{level}}.', subject: subjectName(t, editing.subject), level: levelLabel(t, pick) }))
      close()
    } else if (r.status === 409) {
      // A grown-up fixed this level in the meantime: say so kindly.
      setEditing((e) => ({ ...e, locked: true }))
      learn.reload()
    } else {
      setSheetMsg(t('studentDash.learning.saveError', "That didn't save. Please try again."))
    }
  }

  const answerSuggestion = async (sg, accept) => {
    setBusy(true)
    const r = await learn.answer(sg.id, accept)
    setBusy(false)
    if (r.ok) setSaid(accept ? t('studentDash.learning.suggestDone', 'Done! Thanks for telling us.') : t('studentDash.learning.suggestNo', "Okay, we'll keep things as they are."))
    else if (r.code === 'LEVEL_LOCKED') setSaid(lockedText(t, profile?.levels?.[sg.subject]?.lockedBy || profile?.levels?.[sg.subject]?.source))
    else if (r.code === 'NO_CONTENT') setSaid(t('studentDash.learning.noContent', "There's nothing at that level yet. More is on its way!"))
    else setSaid(t('studentDash.learning.saveError', "That didn't save. Please try again."))
  }

  const saveGoals = async (goals) => {
    const r = await learn.save({ goals: goalsForServer(goals) }, (d) => ({ ...d, profile: { ...d.profile, goals } }))
    setSaid(r.ok ? t('studentDash.learning.goalsSaved', 'Goals saved.') : t('studentDash.learning.saveError', "That didn't save. Please try again."))
  }

  const suggestions = (profile?.suggestions || []).filter((x) => x && x.id)
  const lv = editing ? profile?.levels?.[editing.subject] || {} : null

  const levelsCard = (
    <section className={`${c.card} ${s.card} ${s.levelsCard}`} aria-labelledby="sd-ml-levels">
      <h3 id="sd-ml-levels" className={c.cardTitle}><FaSeedling aria-hidden="true" /> {t('studentDash.learning.levels', 'My levels')}</h3>
      <Levels profile={profile} onChange={openChange} onAsk={openLocked} eachRow={compact} />
      <p className={s.levelHelp}>
        {tFresh(t, i18n, 'studentDash.learning.levelAuto', 'Learnigo sets your level from your answers. You can adjust it whenever you like.', 'studentDash.learning.levelHelp')}
      </p>
    </section>
  )
  const nextCard = (
    <section className={`${c.card} ${s.card} ${s.nextCol}`} aria-label={t('studentDash.learning.whatsNext', "What's next")}>
      <NextUpCard next={data.next} skills={data.skills} readOnly={readOnly}
        empty={<p className={s.emptyLine}>{t('studentDash.learning.noNext', 'Play any round and Learnigo will suggest what to do next.')}</p>} />
      <Suggestions list={readOnly ? [] : suggestions} onAnswer={answerSuggestion} busy={busy} />
      <Wins wins={data.wins} />
    </section>
  )
  const skillsCard = (
    <section className={`${c.card} ${s.card} ${s.skillsCard}`} aria-labelledby="sd-ml-skills">
      <h3 id="sd-ml-skills" className={c.cardTitle}><FaListUl aria-hidden="true" /> {t('studentDash.learning.skills', 'My skills')}</h3>
      <Skills data={data} readOnly={readOnly} />
    </section>
  )
  const goalsCard = (
    <section className={`${c.card} ${s.card} ${s.goalsCard}`} aria-labelledby="sd-ml-goals">
      <h3 id="sd-ml-goals" className={c.cardTitle}><FaBullseye aria-hidden="true" /> {t('studentDash.learning.goals', 'My goals')}</h3>
      <div className={`${c.scroll} ${s.goalScroll}`}>
        <GoalList goals={profile?.goals || []} onChange={saveGoals} who="me" disabled={readOnly} compact />
      </div>
    </section>
  )
  const timeCard = (
    <section className={`${c.card} ${s.card} ${s.timeCard}`} aria-labelledby="sd-ml-time">
      <h3 id="sd-ml-time" className={c.cardTitle}><FaChartLine aria-hidden="true" /> {t('studentDash.learning.overTime', 'My weeks')}</h3>
      <OverTime history={data.history} />
    </section>
  )

  const parts = [
    { key: 'me', label: t('studentDash.learning.partMe', 'Levels'), Icon: FaSeedling },
    { key: 'skills', label: t('studentDash.learning.partSkills', 'Skills'), Icon: FaListUl },
    { key: 'goals', label: t('studentDash.learning.partGoals', 'Goals'), Icon: FaBullseye },
    { key: 'time', label: t('studentDash.learning.partTime', 'Weeks'), Icon: FaChartLine },
  ]

  return (
    <div className={s.root} data-layout={wide ? 'wide' : tablet ? 'tablet' : 'compact'}>
      <p className={c.srOnly} role="status" aria-live="polite">{said}</p>
      {compact ? (
        <>
          <TabBar variant="seg" tabs={parts} active={part} onChange={setPart} idPrefix="sd-ml" label={t('studentDash.learning.parts', 'My learning')} className={s.partSeg} />
          <div role="tabpanel" id={`sd-ml-panel-${part}`} aria-labelledby={`sd-ml-tab-${part}`} className={s.part} data-part={part}>
            {part === 'me' && <>{levelsCard}{nextCard}</>}
            {part === 'skills' && skillsCard}
            {part === 'goals' && goalsCard}
            {part === 'time' && timeCard}
          </div>
        </>
      ) : (
        <div className={s.grid}>
          {levelsCard}
          {nextCard}
          {skillsCard}
          {goalsCard}
          {timeCard}
        </div>
      )}
      {said && <p className={s.said} aria-hidden="true">{said}</p>}

      {editing && (
        <Sheet
          theme="light"
          size="sm"
          title={editing.locked
            ? t('studentDash.learning.lockedTitle', { defaultValue: 'Your {{subject}} level', subject: subjectName(t, editing.subject) })
            : tFresh(t, i18n, 'studentDash.learning.adjustTitle', 'Adjust my {{subject}} level', 'studentDash.learning.changeTitle', { subject: subjectName(t, editing.subject) })}
          text={editing.locked ? undefined : tFresh(t, i18n, 'studentDash.learning.adjustText', 'A level is where you are in your learning, not your age. Learnigo sets it from your answers, so you never have to. If it feels too easy or too hard, pick the one that feels right; you can change it again any time.', 'studentDash.learning.changeText2')}
          onClose={close}
          footer={editing.locked ? (
            <Button onClick={close}>{t('studentDash.learning.ok', 'Okay')}</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>{t('studentDash.learning.cancel', 'Cancel')}</Button>
              <Button onClick={saveLevel} disabled={busy || pick == null || pick === lv?.level}>{busy ? t('studentDash.learning.saving', 'Saving…') : t('studentDash.learning.save', 'Save')}</Button>
            </>
          )}
        >
          {editing.locked ? (
            <div className={s.lockedNote}>
              <LevelBadge level={lv?.level} subject={editing.subject} locked />
              <p>{lockedText(t, lv?.lockedBy || lv?.source)}</p>
            </div>
          ) : (
            <>
              <LevelPicker
                legend={t('studentDash.learning.pickLegend', { defaultValue: 'My {{subject}} level', subject: subjectName(t, editing.subject) })}
                hideLegend
                subject={editing.subject}
                value={pick}
                current={lv?.level}
                max={lv?.ceiling ?? MAX_LEVEL}
                onChange={setPick}
              />
              {sheetMsg && <p className={s.sheetError} role="alert">{sheetMsg}</p>}
            </>
          )}
        </Sheet>
      )}
    </div>
  )
}
