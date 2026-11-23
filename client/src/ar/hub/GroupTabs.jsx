/**
 * The eight game groups as a real tab list.
 *
 * One Tab stop for the whole row (roving tabindex: only the chosen group is in
 * the Tab order), then Left/Right (Up/Down too, for two-switch users), Home and
 * End move between groups. Selection follows focus, so a switch user scanning
 * the row sees each group's games straight away; switching is instant and
 * nothing is lost by it.
 *
 * The chosen group is never shown by colour alone: it turns into a solid
 * white card, gets a thick bar underneath and a notch pointing at its games,
 * and is aria-selected.
 *
 * Each tab says in plain words what its games practise (the line under the
 * name). On a phone there is no room for eight of those, so the line is kept
 * for screen readers there and shown for the chosen group in the panel head.
 */
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCheck } from 'react-icons/fa'
import { tGroup } from '../core/arText'
import { groupLine, tabId, PANEL_ID } from './hubText'
import { haptic } from '../core/feedback'
import styles from './GroupTabs.module.css'

export default function GroupTabs({ groups, selected, onSelect, byGroup }) {
  const { t } = useTranslation()
  const refs = useRef({})

  const move = (to) => {
    const id = groups[(to + groups.length) % groups.length].id
    onSelect(id)
    refs.current[id]?.focus()
    haptic('tap')
  }

  const onKeyDown = (e) => {
    const i = groups.findIndex((g) => g.id === selected)
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    switch (e.key) {
      case 'ArrowRight':
        move(rtl ? i - 1 : i + 1)
        break
      case 'ArrowLeft':
        move(rtl ? i + 1 : i - 1)
        break
      case 'ArrowDown':
        move(i + 1)
        break
      case 'ArrowUp':
        move(i - 1)
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(groups.length - 1)
        break
      default:
        return
    }
    e.preventDefault()
  }

  return (
    <div className={styles.box}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={t('ar.hub.groupsAriaLabel', 'Game groups')}
        onKeyDown={onKeyDown}
      >
        {groups.map((gr) => {
          const on = gr.id === selected
          const st = byGroup[gr.id]
          const pct = st?.possible ? Math.round((st.levels / st.possible) * 100) : 0
          const done = Boolean(st?.possible && st.levels >= st.possible)
          return (
            <button
              key={gr.id}
              ref={(el) => {
                refs.current[gr.id] = el
              }}
              type="button"
              role="tab"
              id={tabId(gr.id)}
              aria-selected={on}
              aria-controls={PANEL_ID}
              tabIndex={on ? 0 : -1}
              className={`${styles.tab} ${on ? styles.on : ''}`}
              data-color={gr.color}
              data-sound="tab"
              onClick={() => {
                if (!on) {
                  onSelect(gr.id)
                  haptic('tap')
                }
              }}
            >
              <span className={styles.ring} style={{ '--p': pct }} aria-hidden>
                <span className={styles.ringIn}>
                  <gr.icon />
                </span>
                {done && (
                  <span className={styles.ringDone}>
                    <FaCheck />
                  </span>
                )}
              </span>
              <span className={styles.text}>
                <span className={styles.nameShort}>{tGroup(gr.id, 'short', gr.short)}</span>
                <span className={styles.nameFull}>{tGroup(gr.id, 'title', gr.title)}</span>
                <span className={styles.line}>{groupLine(gr.id)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
