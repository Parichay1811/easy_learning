// How this account hears about each kind of thing (FND-050): instant, a daily
// digest, or off; plus pausing all email. Saves as soon as something changes.
//
//   <NotificationPrefs role="teacher" />
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './commsApi';
import '../dashboard/tokens.css';
import s from './comms.module.css';

export default function NotificationPrefs({ role, title }) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api('/notification-prefs', { role }).then(setPrefs).catch(() => setError(t('comms.loadFailed', { defaultValue: 'Could not load. Try again.' })));
  }, [role, t]);

  const save = async (patch, optimistic) => {
    const before = prefs;
    setPrefs(optimistic);
    setSaved('');
    try {
      const r = await api('/notification-prefs', { role, method: 'PUT', body: patch });
      setPrefs(r);
      setSaved(t('comms.prefs.saved', { defaultValue: 'Saved' }));
      setError('');
    } catch {
      setPrefs(before);
      setError(t('comms.prefs.saveFailed', { defaultValue: "Couldn't save that change. Please try again." }));
    }
  };

  const setMode = (kind, mode) => save({ kinds: { [kind]: mode } }, { ...prefs, kinds: prefs.kinds.map((k) => (k.kind === kind ? { ...k, mode } : k)) });
  const setEmailOff = (emailOff) => save({ emailOff }, { ...prefs, emailOff });

  const MODE_LABEL = {
    instant: t('comms.prefs.instant', { defaultValue: 'Instant' }),
    digest: t('comms.prefs.digest', { defaultValue: 'Daily digest' }),
    off: t('comms.prefs.off', { defaultValue: 'Off' }),
  };

  return (
    <section className={`${s.card} ${s.cardPad}`} aria-labelledby="comms-prefs-title">
      <h2 id="comms-prefs-title" className={s.h2}>{title || t('comms.prefs.title', { defaultValue: 'Notifications' })}</h2>
      <p className={`${s.muted} ${s.small}`} style={{ marginTop: 0 }}>
        {t('comms.prefs.intro', { defaultValue: 'Choose how you hear about each thing. Instant shows it in the bell and emails you; daily digest collects the emails into one each evening.' })}
      </p>
      {error && <p className={s.err} role="alert">{error}</p>}
      <p className={s.srOnly} aria-live="polite">{saved}</p>
      {!prefs && !error && <p className={s.muted}>{t('comms.loading', { defaultValue: 'Loading…' })}</p>}
      {prefs && (
        <>
          <label className={s.toggle}>
            <input type="checkbox" checked={prefs.emailOff} onChange={(e) => setEmailOff(e.target.checked)} />
            {t('comms.prefs.pauseEmail', { defaultValue: 'Pause all emails (the bell still works)' })}
          </label>
          <div role="list">
            {prefs.kinds.map((k) => {
              const modes = k.scheduled ? ['instant', 'off'] : prefs.modes || ['instant', 'digest', 'off'];
              const labelId = `pref-${k.kind}`;
              return (
                <div className={s.prefRow} role="listitem" key={k.kind}>
                  <div className={s.prefLabel}>
                    <div id={labelId} style={{ fontWeight: 600 }}>{t(`comms.kind.${k.kind}`, { defaultValue: k.label })}</div>
                    {k.locked && <div className={`${s.muted} ${s.small}`}>{t('comms.prefs.locked', { defaultValue: 'Always on, to keep your account safe.' })}</div>}
                    {k.scheduled && <div className={`${s.muted} ${s.small}`}>{t('comms.prefs.scheduled', { defaultValue: 'An email on a fixed day.' })}</div>}
                  </div>
                  <div className={s.seg} role="radiogroup" aria-labelledby={labelId}>
                    {modes.map((m) => (
                      <label key={m}>
                        <input type="radio" name={labelId} value={m} checked={k.mode === m} disabled={k.locked || (prefs.emailOff && k.scheduled)} onChange={() => setMode(k.kind, m)} />
                        <span>{k.scheduled && m === 'instant' ? t('comms.prefs.on', { defaultValue: 'On' }) : MODE_LABEL[m]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
