import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaInfo } from 'react-icons/fa';
import s from './cards.module.css';

/**
 * The "how is this calculated?" bubble. Opens on hover, focus or click, closes
 * on Escape or an outside click. `children` is the explanation.
 *
 *   <InfoTip>Minutes with at least one answered question.</InfoTip>
 */
export default function InfoTip({ children, label, className = '', align = 'start' }) {
  const { t } = useTranslation();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const id = useId();
  const ref = useRef(null);
  const open = pinned || hover || focus;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setHover(false);
        setFocus(false);
      }
    };
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setPinned(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  if (!children) return null;
  return (
    <span
      ref={ref}
      className={`${s.tipWrap} ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className={s.tipBtn}
        aria-label={label || t('dash.info.aria', { defaultValue: 'How is this calculated?' })}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      >
        <FaInfo aria-hidden="true" />
      </button>
      {open && (
        <span role="tooltip" id={id} className={`${s.tipPop} ${align === 'end' ? s.tipEnd : ''}`}>
          {children}
        </span>
      )}
    </span>
  );
}
