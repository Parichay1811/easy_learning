import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import Mascot from '../Mascot/Mascot';
import { welcome } from '../../utils/greetings';
import s from './welcome.module.css';

/**
 * The AI teacher says hello once per visit (utils/greetings speaks it) and the
 * puppy shows the same words in a bubble for a few seconds.
 *
 *   <WelcomeToast name={parentUser?.name} place="parent" />
 *
 * Renders nothing when the greeting was already said in this visit, or until
 * `ready` is true (e.g. wait for the name to load).
 */
export default function WelcomeToast({ name, place, ready = true, duration = 7000 }) {
  const { t } = useTranslation();
  const said = useRef(null);
  const [line, setLine] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ready || said.current !== null) return;
    said.current = welcome({ name, place }) || '';
    if (said.current) setLine(said.current);
  }, [ready, name, place]);

  useEffect(() => {
    if (!line) return undefined;
    const a = setTimeout(() => setLeaving(true), duration);
    const b = setTimeout(() => setLine(null), duration + 400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [line, duration]);

  if (!line) return null;
  return createPortal(
    <div className="dash" style={{ display: 'contents' }}>
      <div className={`${s.toast} ${leaving ? s.leaving : ''}`} role="status" aria-live="polite" data-print="hide">
        <Mascot size={64} mood="wave" butterfly={false} className={s.pup} />
        <p className={s.bubble}>{line}</p>
        <button type="button" className={s.close} data-sound="close" onClick={() => { setLeaving(true); setTimeout(() => setLine(null), 300); }} aria-label={t('dash.welcome.close', { defaultValue: 'Close the greeting' })}>
          <FaTimes aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
