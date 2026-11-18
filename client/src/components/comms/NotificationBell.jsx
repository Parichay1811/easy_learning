// The bell for every dashboard (FND-050). Unread count polled every ~25 s,
// a dropdown with the latest notifications, mark read / read all, and links
// through to whatever the notification is about.
//
//   <NotificationBell role="parent" onOpenSettings={() => setTab('settings')} />
// `role` is optional: without it the signed-in token for the current page is used.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBell, FaCog } from 'react-icons/fa';
import { api } from './commsApi';
import usePoll from './usePoll';
import { relTime, fullTime } from './time';
import '../dashboard/tokens.css';
import s from './comms.module.css';

export default function NotificationBell({ role, pollMs = 25_000, onOpenSettings, onNavigate }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [next, setNext] = useState(null);
  const [error, setError] = useState('');
  const [place, setPlace] = useState(null);
  const wrap = useRef(null);
  const btn = useRef(null);
  const panel = useRef(null);
  const panelId = useId();

  usePoll(async () => {
    const r = await api('/notifications/unread-count', { role });
    setCount(r.count || 0);
  }, pollMs, [role]);

  const load = useCallback(async (before) => {
    try {
      setError('');
      const r = await api(`/notifications?limit=15${before ? `&before=${encodeURIComponent(before)}` : ''}`, { role });
      setItems((prev) => (before && prev ? [...prev, ...r.items] : r.items));
      setNext(r.nextBefore);
      setCount(r.unread || 0);
    } catch (e) {
      setError(e.status === 401 ? t('comms.signedOut', { defaultValue: 'Please sign in again.' }) : t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' }));
    }
  }, [role, t]);

  // Close on outside click and Escape; return focus to the bell.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrap.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markRead = async (n) => {
    if (n.readAt) return;
    setItems((list) => list.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
    setCount((c) => Math.max(0, c - 1));
    await api(`/notifications/${n._id}/read`, { role, method: 'POST' }).catch(() => {});
  };

  const openItem = async (n) => {
    await markRead(n);
    if (!n.link) return;
    setOpen(false);
    if (onNavigate) onNavigate(n.link, n);
    else if (/^https?:\/\//.test(n.link)) window.location.assign(n.link);
    else navigate(n.link);
  };

  const readAll = async () => {
    setItems((list) => list?.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
    setCount(0);
    await api('/notifications/read-all', { role, method: 'POST' }).catch(() => {});
  };

  // The panel is portalled to <body> (the shell's top bar would clip it), so it
  // is placed under the bell here and carries the kit tokens and theme with it.
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btn.current.getBoundingClientRect();
    const phone = window.innerWidth <= 560;
    setPlace({ style: phone ? undefined : { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) }, theme: btn.current.closest('[data-theme]')?.getAttribute('data-theme') || undefined });
    load();
    setOpen(true);
  };

  const label = count
    ? t('comms.bell.labelCount', { count, defaultValue: 'Notifications, {{count}} unread' })
    : t('comms.bell.label', { defaultValue: 'Notifications' });

  return (
    <div className={s.bellWrap} ref={wrap}>
      <button ref={btn} type="button" className={s.iconBtn} aria-label={label} aria-expanded={open} aria-controls={panelId} onClick={toggle}>
        <FaBell aria-hidden="true" />
        {count > 0 && <span className={s.badge} aria-hidden="true">{count > 99 ? '99+' : count}</span>}
      </button>
      <span className={s.srOnly} aria-live="polite">{count ? label : ''}</span>
      {open && createPortal(
        <div className="dash" data-theme={place?.theme} style={{ background: 'none' }}>
        <div id={panelId} ref={panel} className={s.pop} style={place?.style} role="dialog" aria-label={t('comms.bell.title', { defaultValue: 'Notifications' })}>
          <div className={s.popHead}>
            <h2 className={s.h3}>{t('comms.bell.title', { defaultValue: 'Notifications' })}</h2>
            <span className={s.spacer} />
            <button type="button" className={s.linkBtn} onClick={readAll} disabled={!count}>{t('comms.bell.readAll', { defaultValue: 'Mark all read' })}</button>
          </div>
          <div className={s.popBody}>
            {error && <p className={s.err} role="alert">{error}</p>}
            {!items && !error && <p className={s.empty}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
            {items && !items.length && (
              <p className={s.empty}>{t('comms.bell.empty', { defaultValue: "You're all caught up. New messages, results and announcements will show here." })}</p>
            )}
            {items && items.length > 0 && (
              <ul className={s.list}>
                {items.map((n) => (
                  <li key={n._id}>
                    <button type="button" className={`${s.item} ${n.readAt ? '' : s.itemUnread}`} onClick={() => openItem(n)}>
                      <span className={`${s.dot} ${n.readAt ? s.dotRead : ''}`} aria-hidden="true" />
                      <span>
                        <span className={s.itemTitle}>
                          {!n.readAt && <span className={s.srOnly}>{t('comms.unread', { defaultValue: 'Unread:' })} </span>}
                          {n.title}
                        </span>
                        {n.body && <span className={s.itemBody}>{n.body}</span>}
                        <time className={s.itemTime} dateTime={n.createdAt} title={fullTime(n.createdAt, i18n.language)}>{relTime(n.createdAt, i18n.language)}</time>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={s.popFoot}>
            {onOpenSettings ? (
              <button type="button" className={s.linkBtn} onClick={() => { setOpen(false); onOpenSettings(); }}>
                <FaCog aria-hidden="true" /> {t('comms.bell.settings', { defaultValue: 'Settings' })}
              </button>
            ) : <span />}
            {next && <button type="button" className={s.linkBtn} onClick={() => load(next)}>{t('comms.more', { defaultValue: 'Show older' })}</button>}
          </div>
        </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
