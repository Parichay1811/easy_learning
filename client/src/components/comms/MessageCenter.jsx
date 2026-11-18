// Messages between linked people (FND-051): parent <-> teacher of their child,
// parent <-> school office, teacher <-> school office. Thread list + conversation,
// one pane at a time on phones. The server decides who may write to whom.
//
//   <MessageCenter role="parent" initialThreadId={params.get('thread')} />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaFileAlt, FaFlag, FaImage, FaPaperclip, FaPaperPlane, FaPen, FaTimes } from 'react-icons/fa';
import { api, download } from './commsApi';
import usePoll from './usePoll';
import { relTime, fullTime } from './time';
import { Button } from '../dashboard';
import s from './comms.module.css';

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const initial = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();

export default function MessageCenter({ role, initialThreadId, pollMs = 20_000, height }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [threads, setThreads] = useState(null);
  const [threadsNext, setThreadsNext] = useState(null);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState(initialThreadId || null);
  const [composing, setComposing] = useState(false);
  const [phonePane, setPhonePane] = useState(initialThreadId ? 'conv' : 'list');

  const ROLE = {
    parent: t('comms.role.parent', { defaultValue: 'Parent' }),
    teacher: t('comms.role.teacher', { defaultValue: 'Teacher' }),
    admin: t('comms.role.admin', { defaultValue: 'School office' }),
  };

  const loadThreads = useCallback(async (before) => {
    try {
      const r = await api(`/messages/threads?limit=30${before ? `&before=${encodeURIComponent(before)}` : ''}`, { role });
      setThreads((prev) => (before && prev ? [...prev, ...r.items] : r.items));
      setThreadsNext(r.nextBefore);
      setListError('');
    } catch (e) {
      setListError(e.status === 401 ? t('comms.signedOut', { defaultValue: 'Please sign in again.' }) : t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' }));
    }
  }, [role, t]);

  usePoll(() => loadThreads(), pollMs, [role]);

  const open = (id) => { setSelected(id); setComposing(false); setPhonePane('conv'); };
  const startNew = () => { setComposing(true); setSelected(null); setPhonePane('conv'); };
  const back = () => { setPhonePane('list'); loadThreads(); };
  const current = threads?.find((x) => x.id === selected) || null;

  return (
    <section className={`${s.card} ${s.mc} ${phonePane === 'conv' ? s.mcPhoneConv : s.mcPhoneList}`} style={height ? { '--mc-height': height } : undefined} aria-label={t('comms.msg.title', { defaultValue: 'Messages' })}>
      <div className={s.mcList}>
        <div className={s.mcListHead}>
          <h2 className={s.h2} style={{ margin: 0 }}>{t('comms.msg.title', { defaultValue: 'Messages' })}</h2>
          <span className={s.spacer} />
          <Button size="sm" icon={FaPen} onClick={startNew}>{t('comms.msg.new', { defaultValue: 'New' })}</Button>
        </div>
        <div className={s.mcScroll}>
          {listError && <p className={s.err} role="alert">{listError}</p>}
          {!threads && !listError && <p className={s.empty}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
          {threads && !threads.length && (
            <div className={s.empty}>
              <p style={{ marginTop: 0 }}>{t('comms.msg.none', { defaultValue: 'No conversations yet.' })}</p>
              <Button variant="soft" onClick={startNew}>{t('comms.msg.startFirst', { defaultValue: 'Write your first message' })}</Button>
            </div>
          )}
          {threads && threads.length > 0 && (
            <ul className={s.list}>
              {threads.map((th) => (
                <li key={th.id}>
                  <button type="button" className={`${s.thread} ${th.id === selected ? s.threadOn : ''}`} aria-current={th.id === selected ? 'true' : undefined} onClick={() => open(th.id)}>
                    <span className={s.avatar} aria-hidden="true">{initial(th.with.name)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className={s.tName}><span className={s.tNameText}>{th.with.name}</span><span className={s.roleTag}>{ROLE[th.with.role]}</span></span>
                      <span className={s.tSub}>
                        {th.childName ? `${t('comms.msg.about', { defaultValue: 'About' })} ${th.childName} · ` : ''}
                        {th.lastFromMe ? `${t('comms.msg.you', { defaultValue: 'You' })}: ` : ''}{th.lastPreview}
                      </span>
                    </span>
                    <span className={s.tMeta}>
                      <time dateTime={th.lastMessageAt} title={fullTime(th.lastMessageAt, lang)}>{relTime(th.lastMessageAt, lang)}</time>
                      {th.unread > 0 && <span className={s.count}><span className={s.srOnly}>{t('comms.msg.unreadN', { count: th.unread, defaultValue: '{{count}} unread' })}</span><span aria-hidden="true">{th.unread}</span></span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {threadsNext && <p style={{ textAlign: 'center' }}><button type="button" className={s.linkBtn} onClick={() => loadThreads(threadsNext)}>{t('comms.more', { defaultValue: 'Show older' })}</button></p>}
        </div>
      </div>

      {composing
        ? <NewConversation role={role} ROLE={ROLE} onBack={back} onStarted={(th) => { setComposing(false); setThreads((list) => [th, ...(list || []).filter((x) => x.id !== th.id)]); setSelected(th.id); }} />
        : selected
          ? <Conversation key={selected} role={role} threadId={selected} summary={current} ROLE={ROLE} onBack={back} pollMs={pollMs} onActivity={() => loadThreads()} />
          : (
            <div className={`${s.conv} ${s.convEmpty}`}>
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--d-ink)' }}>{t('comms.msg.pick', { defaultValue: 'Pick a conversation' })}</p>
                <p>{t('comms.msg.pickHint', { defaultValue: 'Or start a new one with a teacher or the school office.' })}</p>
              </div>
            </div>
          )}
    </section>
  );
}

// ── One conversation ─────────────────────────────────────────────────────────
function Conversation({ role, threadId, summary, ROLE, onBack, pollMs, onActivity }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [data, setData] = useState(null);
  const [older, setOlder] = useState([]);
  const [olderNext, setOlderNext] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [reporting, setReporting] = useState(null);
  const body = useRef(null);
  const atBottom = useRef(true);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const r = await api(`/messages/threads/${threadId}/messages?limit=30`, { role });
      setData(r);
      if (firstLoad.current) { setOlderNext(r.nextBefore); firstLoad.current = false; }
      if (r.notice) setNotice(r.notice);
      setError('');
    } catch (e) {
      setError(e.status === 404 ? t('comms.msg.gone', { defaultValue: 'This conversation is not available.' }) : t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' }));
    }
  }, [threadId, role, t]);

  usePoll(load, pollMs, [threadId]);

  const loadOlder = async () => {
    const r = await api(`/messages/threads/${threadId}/messages?limit=30&before=${encodeURIComponent(olderNext)}`, { role });
    atBottom.current = false;
    setOlder((o) => [...r.items, ...o]);
    setOlderNext(r.nextBefore);
  };

  const messages = useMemo(() => {
    const seen = new Set();
    return [...older, ...(data?.items || [])].filter((m) => (seen.has(m.id) ? false : seen.add(m.id)));
  }, [older, data]);

  useEffect(() => {
    const el = body.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onScroll = () => {
    const el = body.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const sent = (msg, n) => {
    atBottom.current = true;
    setData((d) => ({ ...d, items: [...(d?.items || []), msg] }));
    if (n) setNotice(n);
    onActivity();
  };

  const thread = data?.thread || summary;
  let lastDay = '';

  return (
    <div className={s.conv}>
      <div className={s.convHead}>
        <button type="button" className={`${s.iconBtn} ${s.backBtn}`} onClick={onBack} aria-label={t('comms.msg.back', { defaultValue: 'Back to conversations' })}><FaArrowLeft aria-hidden="true" /></button>
        {thread && <span className={s.avatar} aria-hidden="true">{initial(thread.with.name)}</span>}
        <div style={{ minWidth: 0 }}>
          <h3 className={s.h3} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread?.with.name || '…'}</h3>
          {thread && <div className={`${s.muted} ${s.small}`}>{ROLE[thread.with.role]}{thread.childName ? ` · ${t('comms.msg.about', { defaultValue: 'About' })} ${thread.childName}` : ''}{thread.subject ? ` · ${thread.subject}` : ''}</div>}
        </div>
      </div>
      <div className={s.convBody} ref={body} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions">
        {olderNext && <button type="button" className={s.linkBtn} style={{ alignSelf: 'center' }} onClick={loadOlder}>{t('comms.msg.older', { defaultValue: 'Show earlier messages' })}</button>}
        {error && <p className={s.err} role="alert">{error}</p>}
        {!data && !error && <p className={s.empty}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
        {messages.map((m) => {
          const day = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(m.createdAt));
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <FragmentWithDay key={m.id} day={showDay ? day : null}>
              <div className={`${s.bubbleRow} ${m.fromMe ? s.mine : s.theirs}`}>
                <span className={s.srOnly}>{m.fromMe ? t('comms.msg.youSaid', { defaultValue: 'You said:' }) : `${thread?.with.name || ''}:`}</span>
                <div className={`${s.bubble} ${m.hidden ? s.hiddenMsg : ''}`}>
                  {m.hidden ? t('comms.msg.hidden', { defaultValue: 'This message was removed by the school after a report.' }) : m.body}
                  {m.attachments?.length > 0 && (
                    <div className={s.files}>
                      {m.attachments.map((a) => (
                        <button key={a.index} type="button" className={s.file} onClick={() => download(a.url.replace(/^\/api/, ''), { role, filename: a.name, open: a.type.startsWith('image/') })}>
                          {a.type.startsWith('image/') ? <FaImage aria-hidden="true" /> : <FaFileAlt aria-hidden="true" />}
                          <span>{a.name}</span>
                          <span className={s.muted}>({Math.max(1, Math.round(a.size / 1024))} KB)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={s.bMeta}>
                  <time dateTime={m.createdAt} title={fullTime(m.createdAt, lang)}>{new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(m.createdAt))}</time>
                  {m.fromMe && <span>{m.read ? t('comms.msg.seen', { defaultValue: '✓✓ Seen' }) : t('comms.msg.sent', { defaultValue: '✓ Sent' })}</span>}
                  {!m.fromMe && !m.hidden && (
                    <button type="button" className={s.linkBtn} style={{ minHeight: 28, padding: '2px 6px', fontSize: '0.76rem', color: 'var(--d-muted)' }} onClick={() => setReporting(m)} aria-label={t('comms.msg.reportLabel', { defaultValue: 'Report this message' })}>
                      <FaFlag aria-hidden="true" /> {t('comms.msg.report', { defaultValue: 'Report' })}
                    </button>
                  )}
                </div>
              </div>
            </FragmentWithDay>
          );
        })}
      </div>
      {notice?.text && <p className={s.note} style={{ margin: '0 12px 8px' }} role="status">{notice.text}</p>}
      <Composer onSend={async (form) => {
        const r = await api(`/messages/threads/${threadId}/messages`, { role, method: 'POST', form });
        sent(r.message, r.notice);
      }} />
      {reporting && <ReportDialog role={role} message={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

function FragmentWithDay({ day, children }) {
  return (
    <>
      {day && <div className={s.day} role="separator">{day}</div>}
      {children}
    </>
  );
}

// ── Composer (text + attachments) ────────────────────────────────────────────
function Composer({ onSend, placeholder, autoFocus }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const area = useRef(null);

  const pick = (list) => {
    const next = [...files];
    for (const f of list) {
      if (!TYPES.includes(f.type)) { setError(t('comms.msg.badType', { defaultValue: 'Only photos (JPEG, PNG, WEBP, GIF) and PDF files can be attached.' })); continue; }
      if (f.size > MAX_BYTES) { setError(t('comms.msg.tooBig', { defaultValue: 'Each file must be 5 MB or smaller.' })); continue; }
      if (next.length >= MAX_FILES) { setError(t('comms.msg.tooMany', { defaultValue: 'Up to 3 files per message.' })); break; }
      next.push(f);
    }
    setFiles(next);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (busy || (!text.trim() && !files.length)) return;
    setBusy(true); setError('');
    const form = new FormData();
    form.append('body', text.trim());
    files.forEach((f) => form.append('files', f, f.name));
    try {
      await onSend(form, text.trim());
      setText(''); setFiles([]);
      if (area.current) area.current.style.height = '';
    } catch (err) {
      setError(err.status === 429 ? t('comms.msg.slowDown', { defaultValue: 'You are sending messages very fast. Please wait a minute.' }) : (err.message || t('comms.msg.sendFailed', { defaultValue: "Couldn't send. Please try again." })));
    } finally { setBusy(false); }
  };

  const grow = (el) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; };

  return (
    <form className={s.composer} onSubmit={submit}>
      {(files.length > 0 || error) && (
        <div className={s.pending}>
          {error && <span className={s.err} role="alert" style={{ margin: 0 }}>{error}</span>}
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className={s.pendingChip}>
              {f.name}
              <button type="button" className={s.iconBtn} style={{ width: 32, height: 32, fontSize: '0.8rem' }} aria-label={t('comms.msg.removeFile', { name: f.name, defaultValue: 'Remove {{name}}' })} onClick={() => setFiles(files.filter((_, j) => j !== i))}><FaTimes aria-hidden="true" /></button>
            </span>
          ))}
        </div>
      )}
      <button type="button" className={s.iconBtn} onClick={() => fileInput.current?.click()} aria-label={t('comms.msg.attach', { defaultValue: 'Attach a photo or PDF' })}><FaPaperclip aria-hidden="true" /></button>
      <input ref={fileInput} type="file" hidden multiple accept={TYPES.join(',')} onChange={(e) => { pick([...e.target.files]); e.target.value = ''; }} />
      <label className={s.srOnly} htmlFor="comms-composer">{t('comms.msg.write', { defaultValue: 'Write a message' })}</label>
      <textarea
        id="comms-composer" ref={area} className={s.textarea} rows={1} maxLength={4000} value={text} autoFocus={autoFocus}
        placeholder={placeholder || t('comms.msg.placeholder', { defaultValue: 'Write a message…' })}
        onChange={(e) => { setText(e.target.value); grow(e.target); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
      />
      <button type="submit" className={s.sendBtn} disabled={busy || (!text.trim() && !files.length)} aria-label={t('comms.msg.send', { defaultValue: 'Send' })}><FaPaperPlane aria-hidden="true" /></button>
    </form>
  );
}

// ── Start a conversation ─────────────────────────────────────────────────────
function NewConversation({ role, ROLE, onBack, onStarted }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState(null);
  const [q, setQ] = useState('');
  const [to, setTo] = useState(null);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const ctl = new AbortController();
    const h = setTimeout(() => {
      api(`/messages/contacts?limit=100${q ? `&q=${encodeURIComponent(q)}` : ''}`, { role, signal: ctl.signal })
        .then((r) => setContacts(r.items))
        .catch((e) => { if (e.name !== 'AbortError') setError(t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' })); });
    }, q ? 250 : 0);
    return () => { clearTimeout(h); ctl.abort(); };
  }, [q, role, t]);

  return (
    <div className={s.conv}>
      <div className={s.convHead}>
        <button type="button" className={`${s.iconBtn} ${to ? '' : s.backBtn}`} onClick={to ? () => setTo(null) : onBack} aria-label={t('comms.msg.back', { defaultValue: 'Back' })}><FaArrowLeft aria-hidden="true" /></button>
        <h3 className={s.h3}>{to ? to.name : t('comms.msg.newTitle', { defaultValue: 'New message' })}</h3>
      </div>
      {!to ? (
        <div className={s.mcScroll} style={{ padding: 16 }}>
          <label className={s.field}>
            <span>{t('comms.msg.who', { defaultValue: 'Who do you want to write to?' })}</span>
            <input className={s.input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('comms.msg.search', { defaultValue: 'Search by name, child or subject' })} />
          </label>
          {error && <p className={s.err} role="alert">{error}</p>}
          {!contacts && !error && <p className={s.muted}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
          {contacts && !contacts.length && (
            <p className={s.muted}>{q
              ? t('comms.msg.noMatch', { defaultValue: 'Nobody matches that search.' })
              : t('comms.msg.noContacts', { defaultValue: "There's nobody to message yet. Once your child's link is verified and their school uses Learnigo messages, their teachers appear here." })}</p>
          )}
          {contacts && contacts.length > 0 && (
            <ul className={s.list}>
              {contacts.map((c) => (
                <li key={`${c.key}|${c.studentId || ''}`}>
                  <button type="button" className={s.thread} disabled={c.canStart === false} onClick={() => setTo(c)} style={c.canStart === false ? { cursor: 'not-allowed', opacity: 0.75 } : undefined}>
                    <span className={s.avatar} aria-hidden="true">{initial(c.name)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className={s.tName}><span className={s.tNameText}>{c.name}</span><span className={s.roleTag}>{ROLE[c.role]}</span></span>
                      <span className={s.tSub}>
                        {[c.childName && `${t('comms.msg.about', { defaultValue: 'About' })} ${c.childName}`, c.subject, c.groups?.join(', ')].filter(Boolean).join(' · ')}
                        {c.canStart === false && ` · ${t('comms.msg.parentsStart', { defaultValue: 'At this school, parents start conversations' })}`}
                      </span>
                    </span>
                    <span />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className={s.convBody}>
            {to.officeHours && (
              <p className={s.note} role="note">
                {to.outsideOfficeHours
                  ? t('comms.msg.outsideHours', { hours: to.officeHours, defaultValue: 'Staff usually reply during office hours ({{hours}}). You can still write now.' })
                  : t('comms.msg.officeHours', { hours: to.officeHours, defaultValue: 'Office hours: {{hours}}.' })}
              </p>
            )}
            <label className={s.field} style={{ maxWidth: 520 }}>
              <span>{t('comms.msg.subject', { defaultValue: 'Subject (optional)' })}</span>
              <input className={s.input} value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} />
            </label>
            {to.childName && <p className={`${s.muted} ${s.small}`}>{t('comms.msg.aboutChild', { child: to.childName, defaultValue: 'This conversation is about {{child}}.' })}</p>}
            {error && <p className={s.err} role="alert">{error}</p>}
          </div>
          <Composer autoFocus placeholder={t('comms.msg.firstPlaceholder', { name: to.name, defaultValue: 'Write to {{name}}…' })} onSend={async (form) => {
            form.append('to', to.key);
            if (to.studentId) form.append('studentId', to.studentId);
            if (subject.trim()) form.append('subject', subject.trim());
            try {
              const r = await api('/messages/threads', { role, method: 'POST', form });
              onStarted(r.thread);
            } catch (e) { setError(e.message); throw e; }
          }} />
        </>
      )}
    </div>
  );
}

// ── Report a message ─────────────────────────────────────────────────────────
function ReportDialog({ role, message, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('inappropriate');
  const [note, setNote] = useState('');
  const [state, setState] = useState('');
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const REASONS = {
    inappropriate: t('comms.flag.inappropriate', { defaultValue: 'Inappropriate' }),
    abuse: t('comms.flag.abuse', { defaultValue: 'Abusive or threatening' }),
    safety: t('comms.flag.safety', { defaultValue: "A child's safety" }),
    spam: t('comms.flag.spam', { defaultValue: 'Spam' }),
    other: t('comms.flag.other', { defaultValue: 'Something else' }),
  };
  const send = async (e) => {
    e.preventDefault();
    setState('busy');
    try { await api(`/messages/${message.id}/flag`, { role, method: 'POST', body: { reason, note } }); setState('done'); }
    catch { setState('error'); }
  };
  return (
    <div className={s.dialogBack} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${s.card} ${s.cardPad} ${s.dialog}`} role="dialog" aria-modal="true" aria-labelledby="comms-report-title">
        <h2 id="comms-report-title" className={s.h2}>{t('comms.flag.title', { defaultValue: 'Report this message' })}</h2>
        {state === 'done' ? (
          <>
            <p className={s.ok} role="status">{t('comms.flag.done', { defaultValue: 'Thank you. The school will review it. The sender is not told who reported it.' })}</p>
            <Button onClick={onClose}>{t('comms.close', { defaultValue: 'Close' })}</Button>
          </>
        ) : (
          <form onSubmit={send}>
            <p className={s.muted}>{t('comms.flag.intro', { defaultValue: 'The school office and Learnigo will look at it.' })}</p>
            <label className={s.field}>
              <span>{t('comms.flag.reason', { defaultValue: 'What is wrong?' })}</span>
              <select ref={first} className={s.select} value={reason} onChange={(e) => setReason(e.target.value)}>
                {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span>{t('comms.flag.note', { defaultValue: 'Anything to add? (optional)' })}</span>
              <textarea className={s.textarea} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {state === 'error' && <p className={s.err} role="alert">{t('comms.flag.failed', { defaultValue: "Couldn't send the report. Please try again." })}</p>}
            <div className={s.row}>
              <Button type="submit" disabled={state === 'busy'}>{t('comms.flag.send', { defaultValue: 'Send report' })}</Button>
              <Button variant="ghost" onClick={onClose}>{t('comms.cancel', { defaultValue: 'Cancel' })}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
