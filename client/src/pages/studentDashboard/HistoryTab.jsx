import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  FaStar, FaRegStar, FaListUl, FaCheckCircle, FaCalendarAlt, FaBook, FaClock, FaChartLine, FaCheck, FaTimes,
} from 'react-icons/fa'
import { GiCrossedSwords } from 'react-icons/gi'
import Mascot from '../../components/Mascot/Mascot'
import TabBar from './TabBar'
import { ReadOnlyContext } from './context'
import { fmtDay, fmtDayTime, fmtMinutes, localDateStr, moduleColor, moduleIcon, moduleName, prefersReducedMotion, subjectName } from './helpers'
import c from './common.module.css'
import h from './HistoryTab.module.css'

function FirstGame({ title, text }) {
  const { t } = useTranslation()
  const readOnly = useContext(ReadOnlyContext)
  return (
    <div className={`${c.card} ${c.empty}`}>
      <Mascot size="clamp(50px, 16vh, 140px)" mood="idle" />
      <h3>{title}</h3>
      <p>{text}</p>
      {!readOnly && <Link to="/home" className={c.cta}>{t('studentDash.playFirst', 'Play your first game')}</Link>}
    </div>
  )
}

// ── Rounds ─────────────────────────────────────────────────────────────────────
function Rounds({ rounds }) {
  const { t, i18n } = useTranslation()
  if (!rounds.length) {
    return <FirstGame title={t('studentDash.history.noRoundsTitle', 'No rounds yet')} text={t('studentDash.history.noRounds', 'Finish a round of 10 questions and your stars will show up here!')} />
  }
  return (
    <div className={`${c.card} ${h.list}`}>
      <ol className={`${c.scroll} ${h.listScroll}`}>
        {rounds.map((r, i) => {
          const warrior = r.mode === 'warrior'
          const Icon = warrior ? GiCrossedSwords : moduleIcon(r.module)
          const stars = Math.max(0, Math.min(10, r.stars || 0))
          return (
            <Motion.li
              key={r._id || i}
              className={h.round}
              style={{ '--m': moduleColor(r.module) }}
              data-mode={warrior ? (r.passed ? 'passed' : 'failed') : 'practice'}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.035 }}
            >
              <span className={h.rIcon} aria-hidden="true"><Icon /></span>
              <div className={h.rTop}>
                <b>{moduleName(t, r.module)}</b>
                {r.subject && r.subject !== 'general' && <span className={h.rSub}>{subjectName(t, r.subject)}</span>}
              </div>
              <span className={`${c.pill} ${h.mode}`}>
                {warrior
                  ? (r.passed ? t('studentDash.history.passed', 'Warrior · Passed!') : t('studentDash.history.notYet', 'Warrior · Not yet'))
                  : t('studentDash.history.practice', 'Practice')}
              </span>
              <time className={h.when} dateTime={r.completedAt}>{fmtDayTime(r.completedAt, i18n.language)}</time>
              <div className={h.rStars}>
                <span className={c.stars} aria-hidden="true">
                  {Array.from({ length: 10 }, (_, si) => (si < stars ? <FaStar key={si} className={c.starOn} /> : <FaRegStar key={si} className={c.starOff} />))}
                </span>
                <b>{t('studentDash.history.stars', '{{n}}/10', { n: stars })}</b>
                {r.bonusStars > 0 && (
                  <span className={h.bonus}>{t('studentDash.history.bonus', '+{{bonus}} speed bonus · {{total}} total stars', { bonus: r.bonusStars, total: r.totalStars })}</span>
                )}
              </div>
            </Motion.li>
          )
        })}
      </ol>
    </div>
  )
}

// ── Answers ────────────────────────────────────────────────────────────────────
function Answers({ answers, loaded }) {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useState('practice')
  const list = answers.filter((a) => (mode === 'warrior' ? a.mode === 'warrior' : a.mode !== 'warrior'))
  return (
    <div className={`${c.card} ${h.list}`}>
      <div className={h.filters} role="group" aria-label={t('studentDash.history.answerMode', 'Which answers')}>
        <button type="button" aria-pressed={mode === 'practice'} onClick={() => setMode('practice')} data-sound="toggle">
          <FaBook aria-hidden="true" /> {t('studentDash.history.practice', 'Practice')}
        </button>
        <button type="button" aria-pressed={mode === 'warrior'} onClick={() => setMode('warrior')} data-sound="toggle">
          <GiCrossedSwords aria-hidden="true" /> {t('studentDash.history.warrior', 'Warrior')}
        </button>
      </div>
      <div className={`${c.scroll} ${h.listScroll}`}>
        {!loaded ? (
          <p className={h.note}>{t('dashboard.loading')}</p>
        ) : list.length === 0 ? (
          <p className={h.note}>
            {mode === 'warrior'
              ? t('studentDash.history.noWarrior', 'No warrior mode answers yet. Try warrior mode!')
              : t('studentDash.history.noPractice', 'No practice answers recorded yet. Play some modules!')}
          </p>
        ) : (
          <ul className={h.answers}>
            {list.map((a, i) => (
              <li key={a._id || i} className={h.answer} data-correct={a.correct || undefined}>
                <div className={h.aTop}>
                  <span>{moduleName(t, a.module)}{a.subject && a.subject !== 'general' ? ` · ${subjectName(t, a.subject)}` : ''}</span>
                  <time dateTime={a.timestamp}>{fmtDayTime(a.timestamp, i18n.language)}</time>
                </div>
                <p className={h.q}>{a.question}</p>
                <div className={h.aBottom}>
                  <span className={h.you}>
                    {a.correct ? <FaCheck aria-hidden="true" /> : <FaTimes aria-hidden="true" />}
                    <span className={c.srOnly}>{a.correct ? t('studentDash.history.right', 'Right') : t('studentDash.history.wrong', 'Not quite')}: </span>
                    {t('studentDash.history.you', 'You: {{answer}}', { answer: a.userAnswer || '—' })}
                  </span>
                  {!a.correct && <span className={h.right}>{t('studentDash.history.answer', 'Answer: {{answer}}', { answer: a.correctAnswer })}</span>}
                  {a.xpEarned > 0 && <span className={h.xp}>+{a.xpEarned} XP</span>}
                  {a.mode === 'warrior' && a.timeTaken != null && (
                    <span className={h.time} data-speed={a.timeTaken <= 10 ? 'fast' : a.timeTaken <= 20 ? 'ok' : 'slow'}>
                      <FaClock aria-hidden="true" /> {a.timeTaken}s
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Calendar (year heatmap) + XP chart ────────────────────────────────────────
function Heatmap({ activity, year }) {
  const { t, i18n } = useTranslation()
  const scrollRef = useRef(null)
  const [pick, setPick] = useState(null)

  const { weeks, months, max } = useMemo(() => {
    const byDay = {}
    activity.forEach((a) => { byDay[localDateStr(a.date)] = { xp: a.totalXP || 0, minutes: a.totalMinutes || 0 } })
    const thisYear = new Date().getFullYear()
    const first = new Date(year, 0, 1)
    const last = year < thisYear ? new Date(year, 11, 31) : new Date()
    const start = new Date(first)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // back to Monday
    const cols = []
    const monthsOut = []
    let lastMonth = -1
    for (let d = new Date(start); d <= last; ) {
      const col = []
      for (let i = 0; i < 7; i += 1) {
        const key = localDateStr(d)
        const inYear = d.getFullYear() === year && d <= last
        col.push(inYear ? { date: key, ...(byDay[key] || { xp: 0, minutes: 0 }) } : null)
        if (inYear && d.getDate() === 1 && d.getMonth() !== lastMonth) {
          lastMonth = d.getMonth()
          monthsOut.push({ col: cols.length, label: d.toLocaleString(i18n.language || undefined, { month: 'short' }) })
        }
        d.setDate(d.getDate() + 1)
      }
      cols.push(col)
    }
    const top = Math.max(1, ...Object.values(byDay).map((v) => v.xp))
    return { weeks: cols, months: monthsOut, max: top }
  }, [activity, year, i18n.language])

  // Start at today (the right end).
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [weeks])

  const level = (xp) => {
    if (!xp) return 0
    const r = xp / max
    return r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4
  }

  return (
    <div className={h.heat}>
      <div ref={scrollRef} className={h.heatScroll}>
        <div className={h.heatInner} style={{ '--cols': weeks.length }}>
          <div className={h.months} aria-hidden="true">
            {months.map((m) => <span key={m.col} style={{ gridColumn: `${m.col + 1} / span 4` }}>{m.label}</span>)}
          </div>
          <div className={h.grid} onMouseLeave={() => setPick(null)}>
            {weeks.map((col, wi) => (
              <div key={wi} className={h.col}>
                {col.map((cell, di) => (cell
                  ? (
                    <span
                      key={cell.date}
                      className={h.cell}
                      data-l={level(cell.xp)}
                      title={`${fmtDay(cell.date, i18n.language)}: ${cell.xp} XP · ${fmtMinutes(cell.minutes)}`}
                      onMouseEnter={() => setPick(cell)}
                      onClick={() => setPick(cell)}
                    />
                  )
                  : <span key={`x${di}`} className={h.cellBlank} />))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={h.heatFoot}>
        <span className={h.readout} aria-live="polite">
          {pick ? `${fmtDay(pick.date, i18n.language)}: ${pick.xp} XP · ${fmtMinutes(pick.minutes)}` : t('studentDash.history.tapDay', 'Tap a day to see it')}
        </span>
        <span className={h.legend} aria-hidden="true">
          {t('dashboard.heatmap.less')}
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className={h.cell} data-l={l} />)}
          {t('dashboard.heatmap.more')}
        </span>
      </div>
    </div>
  )
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={h.tip}>
      <strong>{label}</strong>
      <span>{payload[0].value} XP</span>
    </div>
  )
}

function Calendar({ activity, performance, stats, selectedYear, yearOptions, onYearChange }) {
  const { t, i18n } = useTranslation()
  const thisYear = new Date().getFullYear()
  const data = useMemo(() => performance.map((p) => ({ date: fmtDay(p.date, i18n.language), xp: p.totalXP })), [performance, i18n.language])
  const [chartReady, setChartReady] = useState(false)
  // Let the panel finish sliding in before Recharts measures its box.
  useEffect(() => { const id = setTimeout(() => setChartReady(true), 60); return () => clearTimeout(id) }, [])

  return (
    <div className={h.calendar}>
      <section className={`${c.card} ${h.heatCard}`} aria-labelledby="sd-heat-title">
        <div className={h.heatHead}>
          <h3 id="sd-heat-title" className={c.cardTitle}>
            <FaCalendarAlt aria-hidden="true" />
            <span className={h.heatTitle}>{selectedYear === thisYear ? t('dashboard.heatmap.titleCurrent', { year: selectedYear }) : t('dashboard.heatmap.titlePast', { year: selectedYear })}</span>
          </h3>
          {yearOptions?.length > 0 && (
            <select className={h.year} value={selectedYear} onChange={(e) => onYearChange?.(Number(e.target.value))} aria-label={t('studentDash.history.year', 'Year')}>
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
        <div className={h.heatStats}>
          <span className={c.pill} style={{ background: 'var(--d-grass-soft)', color: 'var(--d-grass-ink)' }}>
            <FaCheckCircle aria-hidden="true" /> {t('dashboard.heatmap.activeDays', { count: activity.length })}
          </span>
          {selectedYear === thisYear && stats?.peakTimeLabel && (
            <span className={c.pill} style={{ background: 'var(--d-sky-soft)', color: 'var(--d-sky-ink)' }}>
              <FaClock aria-hidden="true" /> {t('dashboard.heatmap.mostActive', { time: stats.peakTimeLabel })}
            </span>
          )}
          {selectedYear === thisYear && stats?.todayMinutes > 0 && (
            <span className={c.pill} style={{ background: 'var(--d-sun-soft)', color: 'var(--d-sun-ink)' }}>
              {t('dashboard.heatmap.today', { time: fmtMinutes(stats.todayMinutes) })}
            </span>
          )}
        </div>
        <Heatmap activity={activity} year={selectedYear} />
      </section>

      <section className={`${c.card} ${h.chartCard}`} aria-labelledby="sd-chart-title">
        <h3 id="sd-chart-title" className={c.cardTitle}><FaChartLine aria-hidden="true" /> {t('studentDash.history.chartTitle', 'XP in the last 30 days')}</h3>
        {data.length === 0 ? (
          <p className={h.note}>{t('dashboard.performance.empty')}</p>
        ) : (
          <div className={h.chartBox}>
            <div className={h.chartAbs}>
              {chartReady && (
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 160 }}>
                  <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sdXpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#40c057" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#40c057" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6edf5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#5a6680', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
                    <YAxis tick={{ fill: '#5a6680', fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="xp" stroke="#2f9e44" strokeWidth={3} fill="url(#sdXpGrad)" dot={{ r: 3, fill: '#2f9e44', strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={900} isAnimationActive={!prefersReducedMotion()} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function HistoryTab({
  rounds, answers, answersLoaded, onOpenAnswers, activity, performance, stats,
  selectedYear, yearOptions, onYearChange, isNew,
}) {
  const { t } = useTranslation()
  const [view, setView] = useState('rounds')
  const views = [
    { key: 'rounds', label: t('studentDash.history.rounds', 'Rounds'), Icon: FaStar },
    { key: 'answers', label: t('studentDash.history.answers', 'Answers'), Icon: FaListUl },
    { key: 'calendar', label: t('studentDash.history.calendar', 'Calendar'), Icon: FaCalendarAlt },
  ]
  const change = (key) => {
    setView(key)
    if (key === 'answers') onOpenAnswers?.()
  }

  return (
    <div className={c.panel}>
      <TabBar variant="seg" tabs={views} active={view} onChange={change} idPrefix="sd-history" label={t('studentDash.history.views', 'History views')} className={h.seg} />
      <div role="tabpanel" id={`sd-history-panel-${view}`} aria-labelledby={`sd-history-tab-${view}`} className={h.view}>
        {view === 'rounds' && <Rounds rounds={rounds} />}
        {view === 'answers' && <Answers answers={answers} loaded={answersLoaded} />}
        {view === 'calendar' && (isNew && !activity.length && !performance.length
          ? <FirstGame title={t('studentDash.history.noDaysTitle', 'Your calendar is ready')} text={t('dashboard.performance.empty')} />
          : <Calendar activity={activity} performance={performance} stats={stats} selectedYear={selectedYear} yearOptions={yearOptions} onYearChange={onYearChange} />)}
      </div>
    </div>
  )
}
