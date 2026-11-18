// Shared organisation bits: flag pills and the health score bar.
import { useTranslation } from "react-i18next";
import { Pill } from "./ui";
import s from "./console.module.css";
import { FLAG_LABEL } from "./labels";

export function FlagPills({ flags }) {
  const { t } = useTranslation();
  return <span className={s.row} style={{ minWidth: 120 }}>{flags.map((f) => <Pill key={f} tone={FLAG_LABEL[f]?.[1] || "neutral"}>{t(`sa.flag.${f}`, FLAG_LABEL[f]?.[0] || f)}</Pill>)}</span>;
}

export function HealthBar({ value }) {
  const { t } = useTranslation();
  if (value == null) return <span className={s.muted}>{t("sa.health.new", "New")}</span>;
  const tone = value >= 60 ? "good" : value >= 35 ? "attention" : "alert";
  const word = { good: t("sa.health.good", "good"), attention: t("sa.health.watch", "watch"), alert: t("sa.health.atRisk", "at risk") }[tone];
  return (
    <span className={s.row} style={{ flexWrap: "nowrap" }}>
      <span className={s.bar} aria-hidden="true" style={{ width: 70 }}><span className={s.barFill} style={{ width: `${value}%`, background: `var(--d-${tone})` }} /></span>
      <span className={s.num}>{value}</span><span className={`${s.small} ${s.muted}`}>{word}</span>
    </span>
  );
}
