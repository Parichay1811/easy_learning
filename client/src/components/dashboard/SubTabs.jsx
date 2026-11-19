import { useEffect, useId, useRef } from 'react';
import { sfx } from '../../utils/sounds';
import { renderIcon } from './shellUtils';
import s from './subtabs.module.css';

/**
 * A row of sub-tabs (a segmented control) for one page: role=tablist, arrow keys,
 * Home / End, the chosen tab scrolled into view. Long rows scroll sideways
 * instead of wrapping. `actions` sit at the end of the row (the page's main
 * "Add …" button), and drop under the tabs on narrow screens.
 *
 *   <SubTabs label="Child's learning" value={pane} onChange={setPane}
 *     tabs={[{ id: 'summary', label: 'Summary', short: 'Home', icon: FaHome, badge: 2 }, …]}
 *     actions={<Button icon={FaPlus}>Add</Button>} />
 *   <SubPanel id="summary" value={pane}>…</SubPanel>
 *
 * `short` is an optional shorter label used on phones. Panels find their tab
 * through the shared id prefix: pass the same `idBase` to both when a page has
 * more than one SubTabs row. When the row is wider than the screen it scrolls
 * sideways and fades at the edge that has more tabs.
 */
export default function SubTabs({ tabs, value, onChange, label, actions, idBase = 'pane', sticky = true, className = '' }) {
  const listRef = useRef(null);
  const barRef = useRef(null);
  const first = useRef(true);
  const visible = tabs.filter(Boolean);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector('[aria-selected="true"]');
    // Bring the chosen tab into the row's view: scroll the row only, never the page.
    if (el && list.scrollWidth > list.clientWidth) {
      const l = el.offsetLeft - list.offsetLeft;
      if (l < list.scrollLeft + 8 || l + el.offsetWidth > list.scrollLeft + list.clientWidth - 8) {
        list.scrollTo({ left: Math.max(0, l - 8) });
      }
    }
    // A new tab chosen while the row is stuck under the top bar: show the new tab from its top.
    if (first.current) { first.current = false; return; }
    const bar = barRef.current;
    const scroller = bar?.closest('[data-scroll-root]');
    if (bar && scroller && sticky) {
      const top = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      const pinned = parseFloat(getComputedStyle(bar).top) || 0;
      if (top <= pinned + 1 && scroller.scrollTop > 0) {
        // where the row sits when not stuck
        bar.style.position = 'static';
        const natural = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        bar.style.position = '';
        if (natural - pinned < scroller.scrollTop) scroller.scrollTo({ top: Math.max(0, natural - pinned - 6) });
      }
    }
  }, [value, sticky]);

  // Fades at the edges that hide more tabs (set on the element, no re-render).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const mark = () => {
      const max = list.scrollWidth - list.clientWidth;
      const at = Math.abs(list.scrollLeft);
      list.dataset.more = max <= 2 ? '' : at < 2 ? 'end' : at > max - 2 ? 'start' : 'both';
    };
    mark();
    list.addEventListener('scroll', mark, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mark) : null;
    ro?.observe(list);
    return () => { list.removeEventListener('scroll', mark); ro?.disconnect(); };
  }, []);

  const onKey = (e) => {
    const i = visible.findIndex((t) => t.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    let j = null;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) j = (i + 1) % visible.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) j = (i - 1 + visible.length) % visible.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = visible.length - 1;
    if (j == null) return;
    e.preventDefault();
    sfx.tab();
    onChange(visible[j].id);
    requestAnimationFrame(() => listRef.current?.querySelector(`#${CSS.escape(`${idBase}-tab-${visible[j].id}`)}`)?.focus());
  };

  return (
    <div ref={barRef} className={`${s.bar} ${sticky ? s.sticky : ''} ${className}`} data-print="hide">
      <div ref={listRef} className={s.list} role="tablist" aria-label={label} onKeyDown={onKey}>
        {visible.map((t) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              id={`${idBase}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${idBase}-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              aria-label={t.short ? t.label : undefined}
              className={`${s.tab} ${on ? s.on : ''}`}
              onClick={() => { if (!on) onChange(t.id); }}
            >
              {t.icon && <span className={s.icon}>{renderIcon(t.icon)}</span>}
              {t.short ? (
                <>
                  <span className={`${s.label} ${s.long}`}>{t.label}</span>
                  <span className={`${s.label} ${s.short}`} aria-hidden="true">{t.short}</span>
                </>
              ) : <span className={s.label}>{t.label}</span>}
              {t.badge != null && t.badge !== 0 && t.badge !== '' && <span className={s.badge}>{t.badge}</span>}
            </button>
          );
        })}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}

/** The content of one sub-tab. Only the open one is rendered. */
export function SubPanel({ id, value, idBase = 'pane', className = '', children }) {
  if (id !== value) return null;
  return (
    <div id={`${idBase}-panel-${id}`} role="tabpanel" aria-labelledby={`${idBase}-tab-${id}`} tabIndex={-1} className={`${s.panel} ${className}`}>
      {children}
    </div>
  );
}

/**
 * The head of a tab: a title, one line of help, and the main action(s) on the
 * right (they wrap under the text on phones, never over it).
 */
export function PanelHead({ title, text, actions, as, className = '' }) {
  const id = useId();
  const Heading = as || 'h2';
  return (
    <div className={`${s.head} ${className}`}>
      <div className={s.headText}>
        {title && <Heading id={id} className={s.headTitle}>{title}</Heading>}
        {text && <p className={s.headHelp}>{text}</p>}
      </div>
      {actions && <div className={s.headActions}>{actions}</div>}
    </div>
  );
}
