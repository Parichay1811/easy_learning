// My announcements (FND-052): newest first, unread marked, read when opened.
//
//   <AnnouncementsPanel role="parent" limit={10} />
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBullhorn, FaExternalLinkAlt } from 'react-icons/fa';
import { api } from './commsApi';
import usePoll from './usePoll';
import { relTime, fullTime } from './time';
import { EmptyState } from '../dashboard';
import s from './comms.module.css';

export default function AnnouncementsPanel({ role, limit = 10, title, pollMs = 60_000, compact = false }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState(null);
  const [next, setNext] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});

  const load = useCallback(async (before) => {
    try {
      const r = await api(`/announcements?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`, { role });
      setItems((prev) => (before && prev ? [...prev, ...r.items] : r.items));
      setNext(r.nextBefore);
      setUnread(r.unread);
      setError('');
    } catch (e) {
      setError(e.status === 401 ? t('comms.signedOut', { defaultValue: 'Please sign in again.' }) : t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' }));
    }
  }, [role, limit, t]);

  usePoll(() => load(), pollMs, [role, limit]);

  const read = useCallback((a) => {
    if (a.readAt) return;
    setItems((list) => list.map((x) => (x.id === a.id ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnread((n) => Math.max(0, n - 1));
    api(`/announcements/${a.id}/read`, { role, method: 'POST' }).catch(() => {});
  }, [role]);

  // Short ones are fully visible, so they count as read once shown.
  useEffect(() => {
    if (!items) return;
    items.filter((a) => !a.readAt && a.body.length <= 280).forEach(read);
  }, [items, read]);

  const toggle = (a) => { setOpen((o) => ({ ...o, [a.id]: !o[a.id] })); read(a); };

  return (
    <section className={s.card} aria-labelledby="comms-ann-title">
      <div className={s.cardPad} style={{ paddingBottom: 8 }}>
        <div className={s.row}>
          <h2 id="comms-ann-title" className={s.h2} style={{ margin: 0 }}>{title || t('comms.ann.title', { defaultValue: 'Announcements' })}</h2>
          {unread > 0 && <span className={s.count}><span className={s.srOnly}>{t('comms.msg.unreadN', { count: unread, defaultValue: '{{count}} unread' })}</span><span aria-hidden="true">{unread}</span></span>}
        </div>
      </div>
      {error && <p className={s.err} role="alert" style={{ margin: '0 18px 12px' }}>{error}</p>}
      {!items && !error && <p className={s.empty}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
      {items && !items.length && (
        <div style={{ padding: '0 18px 18px' }}>
          <EmptyState compact icon={FaBullhorn} title={t('comms.ann.emptyTitle', { defaultValue: 'No announcements' })} text={t('comms.ann.empty', { defaultValue: 'News from the school and Learnigo will appear here.' })} />
        </div>
      )}
      {items && items.length > 0 && (
        <ul className={s.list}>
          {items.map((a) => {
            const long = a.body.length > 280;
            return (
              <li key={a.id} className={`${s.ann} ${a.readAt ? '' : s.annUnread}`}>
                <h3 className={s.h3}>{!a.readAt && <span className={s.srOnly}>{t('comms.unread', { defaultValue: 'Unread:' })} </span>}{a.title}</h3>
                <p className={s.annMeta}>
                  {[a.authorName, a.label].filter(Boolean).join(' · ')} · <time dateTime={a.sentAt || a.receivedAt} title={fullTime(a.sentAt || a.receivedAt, i18n.language)}>{relTime(a.sentAt || a.receivedAt, i18n.language)}</time>
                </p>
                {!compact && <p className={`${s.annBody} ${long && !open[a.id] ? s.annBodyClamp : ''}`}>{a.body}</p>}
                <div className={s.row} style={{ marginTop: 6 }}>
                  {!compact && long && <button type="button" className={s.linkBtn} aria-expanded={Boolean(open[a.id])} onClick={() => toggle(a)}>{open[a.id] ? t('comms.ann.less', { defaultValue: 'Show less' }) : t('comms.ann.more', { defaultValue: 'Read more' })}</button>}
                  {a.link && <a className={s.linkBtn} href={a.link} onClick={() => read(a)} {...(/^https?:/.test(a.link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{t('comms.ann.open', { defaultValue: 'Open' })} <FaExternalLinkAlt aria-hidden="true" style={{ fontSize: '0.75em' }} /></a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {next && <p style={{ textAlign: 'center', margin: '8px 0 14px' }}><button type="button" className={s.linkBtn} onClick={() => load(next)}>{t('comms.more', { defaultValue: 'Show older' })}</button></p>}
    </section>
  );
}
