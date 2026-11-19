import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import { sfx } from '../../utils/sounds';
import s from './sheet.module.css';

// Open sheets, newest last: Escape and the focus trap belong to the top one only.
const stack = [];

/**
 * A dialog for adding / editing / inviting: centred on wide screens, a sheet
 * that slides up from the bottom on phones. Escape, the close button and a tap
 * outside close it; focus goes to the first field and back to the opener after.
 * Plays the open / close sounds.
 *
 *   {open && <Sheet title="Add a child" onClose={() => setOpen(false)} footer={<Button>Save</Button>}>…</Sheet>}
 *
 * Props: title, text (one line under the title), onClose, footer (buttons, kept
 * visible at the bottom), size 'sm' | 'md' | 'lg', theme (passed to the .dash scope).
 */
export default function Sheet({ title, text, onClose, footer, size = 'md', theme, className = '', children }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const prev = document.activeElement;
    const me = {};
    stack.push(me);
    sfx.open();
    const first = ref.current?.querySelector('[data-autofocus], input:not([type=hidden]), select, textarea');
    (first || ref.current?.querySelector('button'))?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (stack[stack.length - 1] !== me) return;
      if (e.key === 'Escape') { e.stopPropagation(); sfx.close(); closeRef.current?.(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const f = [...ref.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const [a, z] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      stack.splice(stack.indexOf(me), 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const close = () => { sfx.close(); onClose?.(); };

  return createPortal(
    <div className="dash" data-theme={theme} style={{ display: 'contents' }}>
      <div className={s.wrap} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div ref={ref} className={`${s.sheet} ${s[size] || ''} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className={s.head}>
            <div className={s.headText}>
              <h2 id={titleId} className={s.title}>{title}</h2>
              {text && <p className={s.text}>{text}</p>}
            </div>
            <button type="button" className={s.close} onClick={close} data-sound="none" aria-label={t('dash.sheet.close', { defaultValue: 'Close' })}>
              <FaTimes aria-hidden="true" />
            </button>
          </div>
          <div className={s.body}>{children}</div>
          {footer && <div className={s.foot}>{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
