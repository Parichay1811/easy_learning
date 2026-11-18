import { useTranslation } from "react-i18next";
import { avatarOf } from "./parentApi";
import s from "./parent.module.css";

// Avatars at the top: one tap switches child (PAR-003). Scrolls sideways on phones.
export default function ChildSwitcher({ kids, selected, onSelect }) {
  const { t } = useTranslation();
  return (
    <div className={s.switcher} role="group" aria-label={t("parent.switcher", { defaultValue: "Choose a child" })}>
      {kids.map((c) => (
        <button key={c._id} type="button" className={s.switchBtn} aria-pressed={c._id === selected} onClick={() => onSelect(c._id)}>
          <span className={s.avatar} aria-hidden="true">{avatarOf(c)}</span>
          <span className={s.switchName}>{c.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
