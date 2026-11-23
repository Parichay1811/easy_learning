import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { badgeName, badgeDesc, badgeEvidence, badgeIcon, msgText, isGrowth } from "./words";
import s from "./journey.module.css";

/**
 * A quiet note that a badge was just earned: a growth badge (the learn reply's
 * `achievements`: [{ id, key, params, text }]) or one of the other badges (the
 * round reply's `badges`: [{ id, name, icon, description, category }]). No sound and no fanfare: it is
 * shown between activities (the end of a round, after the discovery), says
 * what the learner did, and goes away by itself after a few seconds (it waits
 * while a pointer or the keyboard is on it). Screen readers hear it once.
 *
 *   <GrowthToast badges={[{ id: "growth_comeback", text: "..." }]} onDone={() => ...} />
 */
export default function GrowthToast({ badges, onDone, ms = 8000 }) {
  const { t } = useTranslation();
  const list = (Array.isArray(badges) ? badges : []).filter((b) => b && b.id);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; });
  const b = list[index];

  useEffect(() => {
    if (!b || hold) return undefined;
    const id = setTimeout(() => {
      if (index + 1 < list.length) setIndex(index + 1);
      else doneRef.current?.();
    }, ms);
    return () => clearTimeout(id);
  }, [b, hold, index, list.length, ms]);

  if (!b) return null;
  // The reply's { key, params, text } is the badge's name (…name) or a line about it (…evidence);
  // the badge's own name comes from its id either way.
  // A badge with a category that is not "growth" is one of the other badges (named from its id).
  const classic = typeof b.category === "string" && !isGrowth(b);
  const isName = typeof b.key === "string" && b.key.endsWith(".name");
  const name = classic ? badgeName(t, b) : isName ? msgText(t, b) : badgeName(t, { ...b, category: "growth", name: b.name || (b.key ? "" : b.text) || b.id });
  const why = classic ? badgeDesc(t, b) : (b.key && !isName) ? msgText(t, b) : badgeEvidence(t, b);
  const close = () => {
    if (index + 1 < list.length) setIndex(index + 1);
    else doneRef.current?.();
  };
  return (
    <div
      className={s.toast}
      role="status"
      data-growth-toast={b.id}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <span className={s.medal} aria-hidden="true">{badgeIcon(b)}</span>
      <span className={s.toastText}>
        <b>{classic
          ? t("journey.growth.toastBadge", { defaultValue: "New badge: {{name}}", name })
          : t("journey.growth.toast", { defaultValue: "New growth badge: {{name}}", name })}</b>
        {why && <span>{why}</span>}
      </span>
      <button type="button" className={s.toastClose} onClick={close} aria-label={t("journey.growth.close", "Close")} data-sound="close">
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}
