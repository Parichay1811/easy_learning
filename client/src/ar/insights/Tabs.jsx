/**
 * An accessible tab row: role=tablist, one tab in the Tab order (roving
 * tabindex), arrow keys (mirrored in right-to-left languages), Home and End.
 * Panels use `${idBase}-panel-${id}` and are labelled by `${idBase}-tab-${id}`.
 *
 *   <Tabs idBase="ins" label="Report sections" value={tab} onChange={setTab}
 *     tabs={[{ id: 'glance', label: 'At a glance', icon: <FaEye /> }]} className={…} tabClass={…} activeClass={…} />
 */
import { useRef } from 'react'

export default function Tabs({ tabs, value, onChange, label, idBase, className, tabClass, activeClass, iconOnlyLabel = false }) {
  const refs = useRef({})
  const onKey = (e, i) => {
    const rtl = typeof document !== 'undefined' && document.dir === 'rtl'
    const n = tabs.length
    let j = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = rtl && e.key === 'ArrowRight' ? (i - 1 + n) % n : (i + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = rtl && e.key === 'ArrowLeft' ? (i + 1) % n : (i - 1 + n) % n
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = n - 1
    if (j == null) return
    e.preventDefault()
    const next = tabs[j]
    onChange(next.id)
    refs.current[next.id]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={className}>
      {tabs.map((tab, i) => {
        const on = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[tab.id] = el }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${tab.id}`}
            aria-selected={on}
            aria-controls={`${idBase}-panel`}
            tabIndex={on ? 0 : -1}
            className={`${tabClass || ''} ${on ? activeClass || '' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKey(e, i)}
            title={iconOnlyLabel ? tab.label : undefined}
            data-sound="tab"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
