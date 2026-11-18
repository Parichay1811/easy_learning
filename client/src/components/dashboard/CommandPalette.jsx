import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import { searchItems } from './paletteSearch';
import s from './palette.module.css';

const MAX_RECENT = 5;
const readRecent = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const writeRecent = (key, ids) => { try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* storage may be blocked */ } };

/**
 * Search everything and jump (DSN-002). Press Ctrl/Cmd+K anywhere, or use the button
 * (a search icon on phones). Give it what the signed-in person may reach:
 *
 *   <CommandPalette scope="teacher" items={[
 *     { id: 'new-test', label: 'Create a test', group: 'Actions', to: '/teacher/tests/new', keywords: ['quiz'] },
 *     { id: 'g-5b', label: 'Year 5 Maths', group: 'Groups', hint: '24 students', to: '/teacher/groups/5b' },
 *     { id: 'x', label: 'Export results', group: 'Actions', onSelect: () => exportCsv() },
 *   ]} />
 *
 * Props: { items:[{id,label,group,hint,icon,keywords,to|onSelect}], scope (recent-items key),
 *          placeholder, open, onOpenChange (to control it yourself), hideTrigger, hotkey = true }
 * Permissions are the caller's job: only pass items the person is allowed to open.
 */
export default function CommandPalette({ items = [], scope = 'dash', placeholder, open: controlled, onOpenChange, hideTrigger, hotkey = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlled ?? innerOpen;
  const setOpen = useCallback((v) => { if (controlled === undefined) setInnerOpen(v); onOpenChange?.(v); }, [controlled, onOpenChange]);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const recentKey = `dash.palette.recent.${scope}`;
  const [recent, setRecent] = useState(() => readRecent(recentKey));
  const listId = useId();
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  // The overlay lives outside the shell, so when it mounts it takes the shell's theme with it.
  const takeTheme = useCallback((el) => {
    if (!el) return;
    const theme = (triggerRef.current?.closest('[data-theme]') || document.documentElement).getAttribute('data-theme');
    if (theme) el.setAttribute('data-theme', theme);
  }, []);
  const results = useMemo(() => searchItems(items, query, { recent }), [items, query, recent]);

  useEffect(() => {
    if (!hotkey) return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(!open); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey, open, setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const trigger = triggerRef.current;
    return () => { document.body.style.overflow = prev; trigger?.focus?.(); };
  }, [open]);

  const close = () => { setOpen(false); setQuery(''); setActive(0); };

  const choose = (item) => {
    const next = [item.id, ...recent.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
    setRecent(next); writeRecent(recentKey, next);
    close();
    if (item.onSelect) item.onSelect(item);
    else if (item.to) navigate(item.to);
  };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault(); // keep focus in the dialog
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const label = placeholder || t('dash.palette.placeholder', { defaultValue: 'Search people, groups, tests and pages…' });
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // Group headings are worked out before rendering: one per run of items in the same group.
  const rows = results.map((item, i) => {
    const group = item.recent ? t('dash.palette.recent', { defaultValue: 'Recent' }) : item.group || '';
    const prevItem = results[i - 1];
    const prevGroup = prevItem ? (prevItem.recent ? t('dash.palette.recent', { defaultValue: 'Recent' }) : prevItem.group || '') : null;
    return { item, heading: group !== prevGroup ? group : null };
  });
  return (
    <>
      {!hideTrigger && (
        <button type="button" ref={triggerRef} className={s.trigger} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t('dash.palette.open', { defaultValue: 'Search' })}>
          <FaSearch aria-hidden="true" />
          <span className={s.triggerText}>{t('dash.palette.search', { defaultValue: 'Search' })}</span>
          <kbd className={s.kbd} aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
      )}
      {open && createPortal(
        <div className={`dash ${s.overlay}`} ref={takeTheme} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className={s.dialog} role="dialog" aria-modal="true" aria-label={t('dash.palette.title', { defaultValue: 'Search everything' })}>
            <div className={s.inputRow}>
              <FaSearch aria-hidden="true" className={s.inputIcon} />
              <input
                ref={inputRef} className={s.input} value={query} placeholder={label} autoComplete="off" spellCheck="false"
                role="combobox" aria-expanded="true" aria-controls={listId} aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onInputKey}
              />
              <button type="button" className={s.esc} onClick={close} aria-label={t('dash.palette.close', { defaultValue: 'Close search' })}>Esc</button>
            </div>
            <ul className={s.list} id={listId} role="listbox" aria-label={t('dash.palette.results', { defaultValue: 'Results' })}>
              {rows.map(({ item, heading }, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} role="presentation">
                    {heading && <p className={s.group} aria-hidden="true">{heading}</p>}
                    <div id={`${listId}-${i}`} role="option" aria-selected={i === active} className={`${s.option} ${i === active ? s.optionOn : ''}`} onMouseMove={() => setActive(i)} onClick={() => choose(item)}>
                      {Icon && <Icon aria-hidden="true" className={s.optionIcon} />}
                      <span className={s.optionLabel}>{item.label}</span>
                      {item.hint && <span className={s.optionHint}>{item.hint}</span>}
                    </div>
                  </li>
                );
              })}
              {results.length === 0 && (
                <li role="presentation" className={s.none}>{t('dash.palette.none', { defaultValue: 'Nothing found for “{{q}}”. Try a name, a group or a page.', q: query })}</li>
              )}
            </ul>
            <p className={s.foot} aria-hidden="true">↑↓ {t('dash.palette.move', { defaultValue: 'to move' })} · ↵ {t('dash.palette.open2', { defaultValue: 'to open' })} · Esc {t('dash.palette.close2', { defaultValue: 'to close' })}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
