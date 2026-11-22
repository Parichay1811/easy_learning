// The panel's word parts: this week's insight sentences, tricky spots worked
// through, the engine's recent decisions in plain language, and the activity
// that matters (never time on screen).
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaRegLightbulb, FaCheck, FaSeedling, FaArrowUp, FaUserCheck, FaHandsHelping, FaSearch, FaBalanceScale, FaComments, FaStar,
  FaFlagCheckered, FaCalendarCheck, FaCompass, FaMapSigns, FaInfoCircle,
} from "react-icons/fa";
import { fmtDate, fmtNumber } from "../../dashboard";
import { skillName, generalTip } from "../levels";
import { say, isPlaceholder, pickInsights } from "./model";
import c from "./evidence.module.css";

const day = (at) => (at ? fmtDate(String(at).slice(0, 10), { style: "day" }) : "");

/** "This week": the engine's insight sentences, each citing its own numbers. */
export function Insights({ insights, name, className = "" }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const [all, setAll] = useState(false);
  const more = insights.filter((m) => !isPlaceholder(m)).length;
  return (
    <section className={`${c.card} ${c.insights} ${className}`} aria-labelledby={id}>
      <h3 id={id}>{t("evidence.insights.title", "What the numbers show this week")}</h3>
      <ul className={c.insightList}>
        {(all ? insights.filter((m) => !isPlaceholder(m)) : pickInsights(insights, 4)).map((m, i) => (
          <li key={`${m.key || "i"}-${i}`}>
            <span className={c.insightIcon} aria-hidden="true"><FaRegLightbulb /></span>
            <span>{say(t, m, "learn.insight", i18n.language)}</span>
          </li>
        ))}
      </ul>
      <div className={c.insightFoot}>
        <p className={c.fine}>{t("evidence.insights.fine", { defaultValue: "Each sentence is built only from {{name}}'s recorded answers.", name })}</p>
        {more > 4 && (
          <button type="button" className={c.linkBtn} aria-expanded={all} onClick={() => setAll((v) => !v)}>
            {all ? t("evidence.insights.fewer", "Show fewer") : t("evidence.insights.all", { defaultValue: "Show all {{n}}", n: more })}
          </button>
        )}
      </div>
    </section>
  );
}

/** Tricky spots (misconceptions): what helps at home, and whether it is sorted out yet. */
export function Misconceptions({ data, name, audience = "parent", className = "" }) {
  const { t } = useTranslation();
  const id = useId();
  const { seen, resolved, items } = data;
  return (
    <section className={`${c.card} ${className}`} aria-labelledby={id}>
      <h3 id={id}>{t("evidence.mis.title", "Tricky spots worked through")}</h3>
      {seen > 0 ? (
        <p className={c.cardSub}><span className={c.big}>{resolved}</span> {t("evidence.mis.of", { defaultValue: "of {{n}} sorted out", n: seen })}</p>
      ) : null}
      {items.length ? (
        <ul className={c.list}>
          {items.slice(0, 6).map((m, i) => (
            <li key={`${m.skill || m.skillName}-${i}`} className={c.item}>
              <span className={`${c.itemIcon} ${m.resolvedAt ? c.itemIconGood : ""}`} aria-hidden="true">{m.resolvedAt ? <FaCheck /> : <FaSeedling />}</span>
              <div className={c.itemBody}>
                <div className={c.itemTitle}>
                  <span>{skillName(t, { id: m.skill, name: m.skillName })}</span>
                  <span className={`${c.status} ${m.resolvedAt ? c.statusGood : ""}`}>
                    {m.resolvedAt
                      ? t("evidence.mis.resolved", { defaultValue: "Sorted out, {{d}}", d: day(m.resolvedAt) })
                      : t("evidence.mis.working", "Still working on it")}
                  </span>
                </div>
                <p>{m.parentNote || generalTip(t, m.subject, audience === "teacher" ? "teacher" : "guardian")}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={c.sectionEmpty}>{seen > 0
          ? t("evidence.mis.noDetails", "Details appear here as soon as we have them.")
          : t("evidence.mis.none", { defaultValue: "No repeated mix-ups so far. When {{name}} makes the same slip a few times, you'll see what helps here.", name })}</p>
      )}
    </section>
  );
}

const DECISION_ICON = {
  level_up: FaArrowUp, level_suggest: FaRegLightbulb, level_set: FaUserCheck, support_step: FaHandsHelping, probe: FaSearch,
  band_tilt: FaBalanceScale, misconception_explained: FaComments, mastered: FaStar,
};
const DECISION_TEXT = {
  level_up: "Moved up a level after steady practice.",
  level_suggest: "Suggested a level change for a grown-up to decide.",
  level_set: "A grown-up or teacher set the level.",
  support_step: "Added more help on a skill that felt tricky.",
  probe: "Asked a couple of questions to see what was already known.",
  band_tilt: "Made questions a little easier or harder to keep them comfortable.",
  misconception_explained: "Explained a mix-up that kept coming back.",
  mastered: "A skill counted as mastered.",
};

/** What Learnigo changed, and why, in plain language. */
export function Decisions({ decisions, className = "" }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  return (
    <section className={`${c.card} ${className}`} aria-labelledby={id}>
      <h3 id={id}>{t("evidence.dec.title", "What Learnigo changed, and why")}</h3>
      {decisions.length ? (
        <ul className={c.list}>
          {decisions.slice(0, 6).map((d, i) => {
            const Icon = DECISION_ICON[d.type] || FaInfoCircle;
            const text = say(t, d.reason, "learn.decision", i18n.language) || t(`evidence.dec.type.${d.type}`, DECISION_TEXT[d.type] || "");
            return (
              <li key={`${d.at}-${i}`} className={c.item}>
                <span className={c.itemIcon} aria-hidden="true"><Icon /></span>
                <div className={c.itemBody}>
                  {d.at && <span className={c.when}><time dateTime={String(d.at)}>{day(d.at)}</time></span>}
                  <p style={{ marginTop: 0 }}>{text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={c.sectionEmpty}>{t("evidence.dec.none", "When Learnigo moves a level or adds help, you'll see what it did and the numbers behind it.")}</p>
      )}
    </section>
  );
}

/** Activity that matters: rounds, days, discoveries, things explored by choice. Never screen time. */
export function Activity({ activity, className = "" }) {
  const { t } = useTranslation();
  const id = useId();
  const a = activity || {};
  const tiles = [
    { key: "rounds", Icon: FaFlagCheckered, label: t("evidence.act.rounds", "Rounds finished"), v: a.rounds },
    { key: "days", Icon: FaCalendarCheck, label: t("evidence.act.days", "Days with learning"), v: a.days },
    { key: "discoveries", Icon: FaCompass, label: t("evidence.act.discoveries", "Daily discoveries"), v: a.discoveries },
    { key: "explored", Icon: FaMapSigns, label: t("evidence.act.explored", "Skills explored"), v: a.explored },
  ];
  return (
    <section className={`${c.card} ${className}`} aria-labelledby={id}>
      <h3 id={id}>{t("evidence.act.title", "Activity that matters")}</h3>
      <ul className={c.tiles} style={{ listStyle: "none", padding: 0, marginBottom: 0 }}>
        {tiles.map((x) => {
          const Icon = x.Icon;
          return (
            <li key={x.key} className={c.tile}>
              <Icon aria-hidden="true" />
              <strong>{x.v == null ? "—" : fmtNumber(x.v)}</strong>
              <span>{x.label}</span>
            </li>
          );
        })}
      </ul>
      <p className={c.fine}>{t("evidence.act.fine", "Time on screen never counts as progress here.")}</p>
    </section>
  );
}
