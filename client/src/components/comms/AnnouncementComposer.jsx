// Write an announcement (FND-052) and see how many people read the ones sent.
// The audiences offered are the ones the server says this person may use:
//   super admin: everyone / a segment; admin: school, groups, units, parents of a grade, staff;
//   teacher: their own groups (and those learners' parents).
//
//   <AnnouncementComposer role="teacher" />
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBullhorn } from 'react-icons/fa';
import { api } from './commsApi';
import { relTime } from './time';
import { Button } from '../dashboard';
import s from './comms.module.css';

const PLANS = ['free', 'family_plus', 'solo_free', 'solo_pro', 'institute', 'enterprise'];

export default function AnnouncementComposer({ role, showSent = true, onSent }) {
  const { t, i18n } = useTranslation();
  const [opts, setOpts] = useState(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [grade, setGrade] = useState('');
  const [includeParents, setIncludeParents] = useState(true);
  const [includeStaff, setIncludeStaff] = useState(true);
  const [roles, setRoles] = useState(['parent', 'teacher', 'admin']);
  const [orgKind, setOrgKind] = useState('');
  const [plans, setPlans] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [when, setWhen] = useState('');
  const [until, setUntil] = useState('');
  const [reach, setReach] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [sentKey, setSentKey] = useState(0);
  const [minLocal] = useState(() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });

  useEffect(() => {
    api('/announcements/audiences', { role })
      .then((r) => { setOpts(r); setType(r.types[0]); })
      .catch((e) => setError(e.status === 403 ? t('comms.ann.notAllowed', { defaultValue: "You can't send announcements from this account." }) : t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' })));
  }, [role, t]);

  const audience = useMemo(() => ({
    type,
    ids: type === 'group' ? groups : type === 'unit' ? units : [],
    grade, includeParents, includeStaff,
    ...(type === 'segment' || type === 'platform' ? { roles } : {}),
    ...(type === 'segment' ? { orgKind, plans } : {}),
  }), [type, groups, units, grade, includeParents, includeStaff, roles, orgKind, plans]);

  const ready = Boolean(type) && (type !== 'group' || groups.length > 0) && (type !== 'unit' || units.length > 0) && (type !== 'grade_parents' || Boolean(grade));

  // "Will reach N people": a dry run on the server, debounced.
  useEffect(() => {
    if (!ready) return undefined;
    const h = setTimeout(() => {
      api('/announcements', { role, method: 'POST', body: { title: 'preview', body: 'preview', audience, dryRun: true } })
        .then((r) => setReach(r.recipients)).catch(() => setReach(null));
    }, 300);
    return () => clearTimeout(h);
  }, [audience, ready, role]);

  const TYPE_LABEL = {
    platform: t('comms.ann.type.platform', { defaultValue: 'Everyone on Learnigo' }),
    segment: t('comms.ann.type.segment', { defaultValue: 'A segment' }),
    org: t('comms.ann.type.org', { defaultValue: 'Whole school' }),
    unit: t('comms.ann.type.unit', { defaultValue: 'Campus, grade or section' }),
    group: role === 'teacher' ? t('comms.ann.type.myGroups', { defaultValue: 'My groups' }) : t('comms.ann.type.group', { defaultValue: 'Groups' }),
    grade_parents: t('comms.ann.type.grade', { defaultValue: 'Parents of a grade' }),
    staff: t('comms.ann.type.staff', { defaultValue: 'Staff only' }),
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || !title.trim() || !body.trim()) return;
    setBusy(true); setError(''); setDone('');
    try {
      const r = await api('/announcements', {
        role, method: 'POST',
        body: { title: title.trim(), body: body.trim(), link: link.trim() || undefined, audience, publishAt: when ? new Date(when).toISOString() : undefined, expiresAt: until ? new Date(until).toISOString() : undefined },
      });
      const a = r.announcement;
      setDone(a.status === 'scheduled'
        ? t('comms.ann.scheduled', { defaultValue: 'Scheduled. It will go out at the time you chose.' })
        : t('comms.ann.sent', { count: a.recipientCount, defaultValue: 'Sent to {{count}} people.' }));
      setTitle(''); setBody(''); setLink(''); setWhen(''); setUntil('');
      setSentKey((k) => k + 1);
      onSent?.(a);
    } catch (err) {
      setError(err.status === 429 ? t('comms.ann.slowDown', { defaultValue: 'You have sent many announcements in the last hour. Please try again later.' }) : err.message);
    } finally { setBusy(false); }
  };

  const toggleIn = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <>
      <section className={`${s.card} ${s.cardPad}`} aria-labelledby="comms-compose-title">
        <h2 id="comms-compose-title" className={s.h2}><FaBullhorn aria-hidden="true" style={{ marginRight: 8, color: 'var(--d-accent-ink)' }} />{t('comms.ann.compose', { defaultValue: 'New announcement' })}</h2>
        {!opts && !error && <p className={s.muted}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
        {error && <p className={s.err} role="alert">{error}</p>}
        {done && <p className={s.ok} role="status">{done}</p>}
        {opts && (
          <form onSubmit={submit}>
            <fieldset className={s.fieldset}>
              <legend>{t('comms.ann.to', { defaultValue: 'Who should get it?' })}</legend>
              <div className={s.chips} role="radiogroup">
                {opts.types.filter((x) => x !== 'unit' || opts.units?.length).map((x) => (
                  <label key={x} className={`${s.chip} ${type === x ? s.chipOn : ''}`}>
                    <input type="radio" name="ann-type" value={x} checked={type === x} onChange={() => setType(x)} />{TYPE_LABEL[x]}
                  </label>
                ))}
              </div>
            </fieldset>

            {type === 'group' && (
              <fieldset className={s.fieldset}>
                <legend>{t('comms.ann.whichGroups', { defaultValue: 'Which groups?' })}</legend>
                {opts.groups.length ? (
                  <div className={s.chips}>
                    {opts.groups.map((g) => (
                      <label key={g.id} className={`${s.chip} ${groups.includes(g.id) ? s.chipOn : ''}`}>
                        <input type="checkbox" checked={groups.includes(g.id)} onChange={() => toggleIn(groups, setGroups, g.id)} />{g.name}
                      </label>
                    ))}
                  </div>
                ) : <p className={s.muted}>{t('comms.ann.noGroups', { defaultValue: 'You have no groups yet.' })}</p>}
              </fieldset>
            )}
            {type === 'unit' && (
              <fieldset className={s.fieldset}>
                <legend>{t('comms.ann.whichUnits', { defaultValue: 'Which part of the school?' })}</legend>
                <div className={s.chips}>
                  {opts.units.map((u) => (
                    <label key={u.id} className={`${s.chip} ${units.includes(u.id) ? s.chipOn : ''}`}>
                      <input type="checkbox" checked={units.includes(u.id)} onChange={() => toggleIn(units, setUnits, u.id)} />{u.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {type === 'grade_parents' && (
              <label className={s.field} style={{ maxWidth: 320 }}>
                <span>{t('comms.ann.grade', { defaultValue: 'Grade' })}</span>
                <select className={s.select} value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">{t('comms.ann.chooseGrade', { defaultValue: 'Choose a grade' })}</option>
                  {opts.grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            )}
            {['group', 'unit', 'org'].includes(type) && (
              <div className={s.row} style={{ marginBottom: 10 }}>
                <label className={s.toggle}><input type="checkbox" checked={includeParents} onChange={(e) => setIncludeParents(e.target.checked)} />{t('comms.ann.parents', { defaultValue: 'Parents (verified links only)' })}</label>
                <label className={s.toggle}><input type="checkbox" checked={includeStaff} onChange={(e) => setIncludeStaff(e.target.checked)} />{type === 'org' ? t('comms.ann.staff', { defaultValue: 'Staff' }) : t('comms.ann.teachers', { defaultValue: 'Their teachers' })}</label>
              </div>
            )}
            {(type === 'segment' || type === 'platform') && (
              <fieldset className={s.fieldset}>
                <legend>{t('comms.ann.roles', { defaultValue: 'Which people?' })}</legend>
                <div className={s.chips}>
                  {['parent', 'teacher', 'admin'].map((r) => (
                    <label key={r} className={`${s.chip} ${roles.includes(r) ? s.chipOn : ''}`}>
                      <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleIn(roles, setRoles, r)} />{t(`comms.role.${r}s`, { defaultValue: { parent: 'Parents', teacher: 'Teachers', admin: 'School admins' }[r] })}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {type === 'segment' && (
              <div className={s.grid2}>
                <label className={s.field}>
                  <span>{t('comms.ann.orgKind', { defaultValue: 'Kind of organisation' })}</span>
                  <select className={s.select} value={orgKind} onChange={(e) => setOrgKind(e.target.value)}>
                    <option value="">{t('comms.ann.any', { defaultValue: 'Any' })}</option>
                    <option value="institute">{t('comms.ann.institutes', { defaultValue: 'Schools and centres' })}</option>
                    <option value="solo">{t('comms.ann.solo', { defaultValue: 'Solo tutors' })}</option>
                  </select>
                </label>
                <fieldset className={s.fieldset}>
                  <legend>{t('comms.ann.plans', { defaultValue: 'Plans (none = all)' })}</legend>
                  <div className={s.chips}>
                    {PLANS.map((p) => (
                      <label key={p} className={`${s.chip} ${plans.includes(p) ? s.chipOn : ''}`}>
                        <input type="checkbox" checked={plans.includes(p)} onChange={() => toggleIn(plans, setPlans, p)} />{p.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
            <p className={s.small} aria-live="polite" style={{ margin: '0 0 14px' }}>
              {ready && reach != null && <span className={s.reach}>{t('comms.ann.reach', { count: reach, defaultValue: 'Will reach {{count}} people.' })}</span>}
              {ready && reach === 0 && <span className={s.muted}> {t('comms.ann.reachZero', { defaultValue: 'Nobody matches yet (parents count once their link is verified).' })}</span>}
            </p>

            <label className={s.field}>
              <span>{t('comms.ann.titleLabel', { defaultValue: 'Title' })}</span>
              <input className={s.input} required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('comms.ann.titlePh', { defaultValue: 'School trip on Friday' })} />
            </label>
            <label className={s.field}>
              <span>{t('comms.ann.bodyLabel', { defaultValue: 'Message' })}</span>
              <textarea className={s.textarea} required maxLength={5000} rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <div className={s.grid2}>
              <label className={s.field}>
                <span>{t('comms.ann.link', { defaultValue: 'Link (optional)' })}</span>
                <input className={s.input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… or /parent-dashboard" pattern="(/\S*|https://\S+)" />
              </label>
              <label className={s.field}>
                <span>{t('comms.ann.when', { defaultValue: 'Send later (optional)' })}</span>
                <input className={s.input} type="datetime-local" min={minLocal} value={when} onChange={(e) => setWhen(e.target.value)} />
              </label>
              <label className={s.field}>
                <span>{t('comms.ann.until', { defaultValue: 'Hide after (optional)' })}</span>
                <input className={s.input} type="datetime-local" min={when || minLocal} value={until} onChange={(e) => setUntil(e.target.value)} />
              </label>
            </div>
            <Button type="submit" disabled={busy || !ready || !title.trim() || !body.trim()}>
              {when ? t('comms.ann.schedule', { defaultValue: 'Schedule' }) : t('comms.ann.send', { defaultValue: 'Send now' })}
            </Button>
          </form>
        )}
      </section>
      {showSent && opts && <SentAnnouncements role={role} key={sentKey} lang={i18n.language} />}
    </>
  );
}

// What I (or my school) sent, with read rates.
function SentAnnouncements({ role, lang }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);

  const load = useCallback(() => {
    api(`/announcements/sent?limit=10&page=${page}`, { role }).then(setData).catch(() => setData({ items: [], pages: 0 }));
  }, [role, page]);
  useEffect(load, [load]);

  const showReport = async (a) => {
    if (report?.announcement?.id === a.id) { setReport(null); return; }
    setReport(await api(`/announcements/${a.id}/report`, { role }).catch(() => null));
  };
  const cancel = async (a) => { await api(`/announcements/${a.id}`, { role, method: 'DELETE' }).catch(() => {}); load(); };

  if (!data) return null;
  return (
    <section className={`${s.card} ${s.cardPad}`} aria-labelledby="comms-sent-title">
      <h2 id="comms-sent-title" className={s.h2}>{t('comms.ann.sentTitle', { defaultValue: 'Sent announcements' })}</h2>
      {!data.items.length && <p className={s.muted}>{t('comms.ann.noneSent', { defaultValue: 'Nothing sent yet.' })}</p>}
      <ul className={s.list}>
        {data.items.map((a) => (
          <li key={a.id} className={s.ann} style={{ paddingLeft: 0 }}>
            <div className={s.row}>
              <h3 className={s.h3} style={{ flex: '1 1 200px' }}>{a.title}</h3>
              <span className={`${s.statusPill} ${a.status === 'sent' ? s.statusSent : a.status === 'scheduled' ? s.statusScheduled : ''}`}>{t(`comms.ann.status.${a.status}`, { defaultValue: a.status })}</span>
            </div>
            <p className={s.annMeta}>{[a.label, a.authorName && !a.mine ? a.authorName : '', relTime(a.sentAt || a.publishAt, lang)].filter(Boolean).join(' · ')}</p>
            {a.status === 'sent' && (
              <div className={s.row}>
                <div className={s.bar} style={{ flex: '1 1 160px', maxWidth: 260 }} role="img" aria-label={t('comms.ann.readRate', { rate: a.readRate ?? 0, defaultValue: '{{rate}} % read' })}>
                  <div className={s.barFill} style={{ width: `${a.readRate || 0}%` }} />
                </div>
                <span className={s.small}>{t('comms.ann.readOf', { read: a.readCount, total: a.recipientCount, defaultValue: '{{read}} of {{total}} read' })}</span>
                <button type="button" className={s.linkBtn} aria-expanded={report?.announcement?.id === a.id} onClick={() => showReport(a)}>{t('comms.ann.details', { defaultValue: 'Details' })}</button>
              </div>
            )}
            {a.status === 'scheduled' && <button type="button" className={s.linkBtn} onClick={() => cancel(a)}>{t('comms.ann.cancel', { defaultValue: 'Cancel' })}</button>}
            {report?.announcement?.id === a.id && (
              <div className={s.small} style={{ marginTop: 8 }}>
                {Object.entries(report.byRole).map(([r, v]) => <div key={r}>{t(`comms.role.${r}s`, { defaultValue: r })}: {v.read} / {v.total}</div>)}
                {report.notYetRead?.length > 0 && <p className={s.muted}>{t('comms.ann.notYet', { defaultValue: 'Not read yet:' })} {report.notYetRead.map((x) => x.name).filter(Boolean).slice(0, 30).join(', ')}{report.notYetRead.length > 30 ? '…' : ''}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {data.pages > 1 && (
        <div className={s.row}>
          <button type="button" className={s.linkBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('comms.prev', { defaultValue: 'Newer' })}</button>
          <span className={s.small}>{page} / {data.pages}</span>
          <button type="button" className={s.linkBtn} disabled={page >= data.pages} onClick={() => setPage(page + 1)}>{t('comms.next', { defaultValue: 'Older' })}</button>
        </div>
      )}
    </section>
  );
}
