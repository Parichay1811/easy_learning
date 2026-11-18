// Scheduled emails (FND-061): the weekly parent digest, the Monday teacher
// summary and the monthly school summary. Data comes in ready-made from
// services/digests.js; these only lay it out (inline styles, tables).
const { t, duration } = require('../../i18n/emails')
const { layout, button, tiles, para, callout, divider, dashboardUrl, esc, FONT, C } = require('./layout')

const signed = (n, unit = '') => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}${unit}`

// One child's section: story, 4 tiles, one idea.
function childSection(locale, c) {
  const L = (k, p) => t(locale, k, { child: c.name, ...p })
  const cur = c.cur, prev = c.prev
  let story
  if (!cur.answered && !cur.minutes) story = L('parent.story_none')
  else {
    story = L('parent.story_time', { time: duration(cur.minutes) })
    if (prev && prev.minutes > 0) {
      const d = Math.round(cur.minutes - prev.minutes)
      if (d >= 5) story += L('parent.story_more', { minutes: d })
      else if (d <= -5) story += L('parent.story_less')
    }
    story += cur.accuracy != null ? L('parent.story_answers', { answered: cur.answered, accuracy: cur.accuracy }) : L('parent.story_end')
  }
  const dMin = prev ? Math.round(cur.minutes - prev.minutes) : null
  const dAns = prev ? cur.answered - prev.answered : null
  const dAcc = prev && cur.accuracy != null && prev.accuracy != null ? cur.accuracy - prev.accuracy : null
  const tileList = [
    { value: duration(cur.minutes), label: L('parent.tile_time'), ...(dMin ? { delta: `${signed(dMin)} min`, up: dMin > 0 } : {}) },
    { value: String(cur.answered), label: L('parent.tile_answered'), ...(dAns ? { delta: signed(dAns), up: dAns > 0 } : {}) },
    { value: cur.accuracy == null ? '—' : `${cur.accuracy} %`, label: L('parent.tile_accuracy'), ...(dAcc ? { delta: `${signed(dAcc)} pts`, up: dAcc > 0 } : {}) },
    { value: L('parent.tile_days_value', { days: cur.activeDays }), label: L('parent.tile_days') },
  ]
  const idea = ideaText(locale, c)
  // A quiet week gets the story and an idea, not a row of zeros.
  const quiet = !cur.answered && !cur.minutes
  const html = para(c.name, { size: 20, bold: true, margin: '8px 0 6px' })
    + para(story, { color: C.ink })
    + (quiet ? '' : tiles(tileList))
    + callout(L('parent.idea'), idea)
    + button(c.url, L('parent.button'))
  const text = [`${c.name}`, story, quiet ? '' : tileList.map((x) => `${x.label}: ${x.value}${x.delta ? ` (${x.delta} ${t(locale, 'parent.vs_last_week')})` : ''}`).join('\n'), `${L('parent.idea')}: ${idea}`, c.url].join('\n')
  return { html, text }
}

const IDEA_ORDER = ['practise_next', 'no_activity', 'accuracy_down', 'time_down', 'streak', 'strongest', 'time_up']

function ideaText(locale, c) {
  const pick = IDEA_ORDER.map((k) => c.insights.find((i) => i.key === k)).find(Boolean)
  if (!pick) return t(locale, 'idea.default', { child: c.name })
  const p = pick.params || {}
  return t(locale, `idea.${pick.key}`, {
    child: c.name, days: p.days, accuracy: p.accuracy,
    module: p.module ? t(locale, `module.${p.module}`) : '', subject: p.subject ? t(locale, `subject.${p.subject}`) : '',
  })
}

// children: [{ name, cur, prev, insights, url }]
function parentWeeklyEmail({ locale = 'en', name, children, unsubscribeUrl }) {
  const subject = children.length === 1 ? t(locale, 'parent.subject_one', { child: children[0].name }) : t(locale, 'parent.subject_many')
  const sections = children.map((c) => childSection(locale, c))
  const content = para(name ? t(locale, 'common.hi', { name: name.split(' ')[0] }) : t(locale, 'common.hi_anon'))
    + para(t(locale, 'parent.intro'), { color: C.soft })
    + sections.map((s) => s.html).join(divider())
  const names = children.map((c) => c.name)
  const why = names.length === 1 ? t(locale, 'parent.why', { child: names[0] })
    : t(locale, 'parent.why_many', { children: `${names.slice(0, -1).join(', ')} ${t(locale, 'common.and')} ${names[names.length - 1]}` })
  const html = layout({ locale, title: subject, preheader: t(locale, 'parent.preheader'), content, unsubscribeUrl, why, settingsUrl: dashboardUrl('parent', '?tab=settings') })
  const text = [name ? t(locale, 'common.hi', { name: name.split(' ')[0] }) : t(locale, 'common.hi_anon'), '', t(locale, 'parent.intro'), '', ...sections.map((s) => s.text + '\n'), why, unsubscribeUrl ? `${t(locale, 'common.unsubscribe')}: ${unsubscribeUrl}` : ''].join('\n')
  return { subject, html, text }
}

// groups: [{ name, learners, active, minutes, accuracy, nudge: ['Ravi K.'] }]
function teacherWeeklyEmail({ locale = 'en', name, groups, unsubscribeUrl }) {
  const learners = groups.reduce((s, g) => s + g.learners, 0)
  const active = groups.reduce((s, g) => s + g.active, 0)
  const subject = t(locale, 'teacher.subject', { active, learners })
  const rows = groups.map((g) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font-family:${FONT}">`
    + `<div style="font-size:17px;font-weight:600;color:${C.ink}">${esc(g.name)}</div>`
    + `<div style="font-size:14px;line-height:20px;color:${C.soft};margin-top:2px">${esc(t(locale, 'teacher.group_line', { active: g.active, learners: g.learners, minutes: Math.round(g.minutes), accuracy: g.accuracy == null ? '—' : `${g.accuracy} %` }))}</div>`
    + `<div style="font-size:14px;line-height:20px;color:${g.nudge.length ? C.warn : C.good};margin-top:4px">${esc(g.nudge.length ? t(locale, 'teacher.nudge', { names: g.nudge.join(', ') }) : t(locale, 'teacher.none_nudge'))}</div>`
    + '</td></tr>').join('')
  const content = para(name ? t(locale, 'common.hi', { name }) : t(locale, 'common.hi_anon'))
    + para(t(locale, 'teacher.intro'), { color: C.soft })
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
    + button(dashboardUrl('teacher'), t(locale, 'teacher.button'))
  const text = [t(locale, 'teacher.intro'), '', ...groups.map((g) => `${g.name}: ${t(locale, 'teacher.group_line', { active: g.active, learners: g.learners, minutes: Math.round(g.minutes), accuracy: g.accuracy == null ? '—' : `${g.accuracy} %` })}${g.nudge.length ? `\n  ${t(locale, 'teacher.nudge', { names: g.nudge.join(', ') })}` : ''}`), '', dashboardUrl('teacher'), unsubscribeUrl ? `${t(locale, 'common.unsubscribe')}: ${unsubscribeUrl}` : ''].join('\n')
  return { subject, html: layout({ locale, title: subject, preheader: t(locale, 'teacher.intro'), content, unsubscribeUrl, settingsUrl: dashboardUrl('teacher') }), text }
}

// s: { org, month, learners, active, minutesPerLearner, accuracy, atRisk, story, logoUrl }
function adminMonthlyEmail({ locale = 'en', name, s, unsubscribeUrl }) {
  const subject = t(locale, 'admin.subject', { org: s.org, month: s.month })
  const content = para(name ? t(locale, 'common.hi', { name }) : t(locale, 'common.hi_anon'))
    + para(t(locale, 'admin.intro'), { color: C.soft })
    + para(s.story)
    + tiles([
      { value: `${s.active} / ${s.learners}`, label: t(locale, 'admin.tile_active') },
      { value: String(s.minutesPerLearner), label: t(locale, 'admin.tile_minutes') },
      { value: s.accuracy == null ? '—' : `${s.accuracy} %`, label: t(locale, 'admin.tile_accuracy') },
      { value: String(s.atRisk), label: t(locale, 'admin.tile_risk') },
    ])
    + button(dashboardUrl('admin'), t(locale, 'admin.button'))
  const text = [t(locale, 'admin.intro'), s.story, `${t(locale, 'admin.tile_active')}: ${s.active} / ${s.learners}`, `${t(locale, 'admin.tile_minutes')}: ${s.minutesPerLearner}`, `${t(locale, 'admin.tile_accuracy')}: ${s.accuracy ?? '—'} %`, `${t(locale, 'admin.tile_risk')}: ${s.atRisk}`, dashboardUrl('admin'), unsubscribeUrl ? `${t(locale, 'common.unsubscribe')}: ${unsubscribeUrl}` : ''].join('\n')
  return { subject, html: layout({ locale, title: subject, preheader: s.story, content, unsubscribeUrl, logoUrl: s.logoUrl, orgName: s.org, settingsUrl: dashboardUrl('admin') }), text }
}

module.exports = { parentWeeklyEmail, teacherWeeklyEmail, adminMonthlyEmail, ideaText }
