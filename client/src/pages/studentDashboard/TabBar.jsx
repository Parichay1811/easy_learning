import { useRef } from 'react'
import { sfx, haptic } from '../../utils/sounds'
import s from './TabBar.module.css'

/**
 * Accessible tabs (WAI-ARIA tabs pattern, automatic activation): one tab stop,
 * arrow keys / Home / End move between tabs. Clicks get their "tab" sound from
 * the site's global listener (role=tab); keyboard moves play it here.
 *
 *   variant="main"  the big game-menu bar (bottom on phones, side rail on wide)
 *   variant="seg"   a small segmented switch inside a tab
 */
export default function TabBar({ tabs, active, onChange, idPrefix, label, variant = 'main', vertical = false, className = '' }) {
  const refs = useRef({})

  const move = (e) => {
    const i = tabs.findIndex((t) => t.key === active)
    let next = null
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) next = (i + 1) % tabs.length
    else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next == null) return
    e.preventDefault()
    const key = tabs[next].key
    onChange(key)
    sfx.tab()
    haptic('light')
    refs.current[key]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={`${variant === 'seg' ? s.seg : s.bar} ${className}`}
      onKeyDown={move}
    >
      {tabs.map(({ key, label: text, Icon, hue, badge }) => {
        const on = key === active
        return (
          <button
            key={key}
            ref={(el) => { refs.current[key] = el }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${key}`}
            aria-controls={`${idPrefix}-panel-${key}`}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            data-tab={key}
            className={variant === 'seg' ? s.segBtn : s.tab}
            style={hue ? { '--hue': hue.fill, '--hue-soft': hue.soft, '--hue-ink': hue.ink, '--hue-on': hue.on || '#fff', '--hue-lip': hue.lip } : undefined}
            onClick={() => { if (!on) onChange(key) }}
          >
            {Icon && (
              <span className={variant === 'seg' ? s.segIcon : s.icon} aria-hidden="true">
                <Icon />
                {badge ? <span className={s.dot} /> : null}
              </span>
            )}
            <span className={variant === 'seg' ? s.segText : s.text}>{text}</span>
            {badge ? <span className={s.srOnly}>{` (${badge})`}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
