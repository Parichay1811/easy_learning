import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBookOpen, FaCheck, FaChevronDown, FaClipboardCheck, FaCommentDots, FaGamepad, FaRegCircle, FaTimes, FaTrophy } from 'react-icons/fa';
import { subjectLabel, subjectOf } from '../constants';
import { fmtDate, fmtDuration } from '../format';
import s from './charts.module.css';

const KINDS = {
  session: { Icon: FaBookOpen, label: 'Lesson' },
  test: { Icon: FaClipboardCheck, label: 'Test' },
  game: { Icon: FaGamepad, label: 'Game' },
  milestone: { Icon: FaTrophy, label: 'Milestone' },
  message: { Icon: FaCommentDots, label: 'Message' },
};

function Row({ ev }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const k = KINDS[ev.kind] || { Icon: FaRegCircle, label: 'Event' };
  const time = ev.time ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(ev.time)) : '';
  const expandable = ev.details && ev.details.length > 0;
  const head = (
    <>
      <span className={`${s.tlIcon} ${s[`tl_${ev.kind}`] || ''}`}><k.Icon aria-hidden="true" /></span>
      <span className={s.tlMain}>
        <span className={s.tlTitle}>
          <span className="d-sr-only">{t(`dash.tl.${ev.kind}`, { defaultValue: k.label })}: </span>
          {ev.title}
        </span>
        {ev.subtitle && <span className={s.tlSub}>{ev.subtitle}</span>}
      </span>
      <span className={s.tlMeta}>
        {ev.subject && (
          <span className={s.tlSubject} style={{ '--sc': subjectOf(ev.subject).fill }}>
            <span className={s.subjectDot} aria-hidden="true" />{subjectLabel(t, ev.subject)}
          </span>
        )}
        {ev.minutes != null && <span className={s.tlDur}>{fmtDuration(ev.minutes)}</span>}
        {time && <time dateTime={ev.time} className={s.tlTime}>{time}</time>}
      </span>
      {expandable && <FaChevronDown aria-hidden="true" className={`${s.tlChevron} ${open ? s.tlOpen : ''}`} />}
    </>
  );
  return (
    <li className={s.tlItem}>
      {expandable ? (
        <button type="button" className={s.tlHead} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>{head}</button>
      ) : (
        <div className={s.tlHead}>{head}</div>
      )}
      {expandable && open && (
        <ul id={id} className={s.tlDetails}>
          {ev.details.map((d, i) => (
            <li key={i}>
              {d.ok === true && <span className={s.tlOk}><FaCheck aria-hidden="true" /><span className="d-sr-only">{t('dash.tl.correct', { defaultValue: 'Correct' })}</span></span>}
              {d.ok === false && <span className={s.tlNo}><FaTimes aria-hidden="true" /><span className="d-sr-only">{t('dash.tl.incorrect', { defaultValue: 'Not yet' })}</span></span>}
              <span>{d.label}</span>
              {d.value != null && <strong>{d.value}</strong>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * "What happened, in order?" Sessions and events grouped by day, newest first.
 * Rows with `details` expand to show the answers.
 *
 *   <Timeline events={[{ id: 'e1', time: '2026-11-17T16:20:00', kind: 'session', subject: 'maths',
 *                        title: 'Fractions practice', subtitle: '12 questions, 10 correct', minutes: 18,
 *                        details: [{ label: '1/2 + 1/4 = ?', value: '3/4', ok: true }] }]} />
 *
 * Props: events [{id, time (ISO), kind: 'session'|'test'|'game'|'milestone'|'message', title,
 *        subtitle?, minutes?, subject?, details?: [{label, value?, ok?: boolean}]}], max (default 200).
 */
export default function Timeline({ events = [], max = 200, label }) {
  const { t } = useTranslation();
  const groups = useMemo(() => {
    const sorted = [...events].slice(0, 2000).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, max);
    const map = new Map();
    sorted.forEach((e) => {
      const day = String(e.time).slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(e);
    });
    return [...map.entries()];
  }, [events, max]);

  if (!groups.length) return null;
  return (
    <div className={s.timeline} role="group" aria-label={label || t('dash.tl.label', { defaultValue: 'Timeline of learning events' })}>
      {groups.map(([day, list]) => (
        <section key={day} className={s.tlDay}>
          <h4 className={s.tlDayTitle}>{fmtDate(day, { style: 'long' })}</h4>
          <ol className={s.tlList}>
            {list.map((ev) => <Row key={ev.id} ev={ev} />)}
          </ol>
        </section>
      ))}
    </div>
  );
}
