// The skill map: every skill the learner has practised, per subject, in four clear states
// (mastered · quick review due · practising · worth more practice) plus "not started yet at this
// level". From the learning engine's own skill rows (the `skills` block of …/insights).
// Each state has an icon and a word, never colour alone; teachers also see the mix-up text.
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheckCircle, FaRedoAlt, FaSeedling, FaBullseye } from "react-icons/fa";
import EmptyState from "../components/dashboard/EmptyState";
import Skeleton from "../components/dashboard/Skeleton";
import { subjectLabel, subjectOf } from "../components/dashboard/constants";
import { tx } from "./strings.js";
import { day, listOf } from "./fmt.js";
import s from "./insights.module.css";

const STATES = ["practise", "review", "practising", "secure"];
const SHORT = 5;
const ICON = { secure: FaCheckCircle, review: FaRedoAlt, practising: FaSeedling, practise: FaBullseye };

export function StateLabel({ state }) {
  const { t } = useTranslation();
  const Icon = ICON[state];
  return <span className={s.state} data-s={state}>{Icon && <Icon aria-hidden="true" />}{tx(t, `skills.state.${state}`)}</span>;
}

export default function SkillMapPanel({ data, loading, error, name = "", audience = "parent", headingLevel = 2 }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const H = `h${headingLevel}`;
  const first = String(name || "").split(" ")[0];
  const [filter, setFilter] = useState("all");
  // Long lists start short on every screen: the skills worth practising come first.
  const [open, setOpen] = useState(() => new Set());
  const toggle = (k) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const subjects = useMemo(() => data?.skills?.subjects || [], [data]);
  const totals = useMemo(() => {
    const o = { practise: 0, review: 0, practising: 0, secure: 0 };
    for (const sub of subjects) for (const k of STATES) o[k] += sub.counts[k] || 0;
    return o;
  }, [subjects]);

  let body;
  if (loading && !data) body = <Skeleton variant="chart" />;
  else if (error && !data) body = <EmptyState compact tone="error" title={tx(t, "glance.loadError")} text={error} />;
  else if (!subjects.length) body = <EmptyState compact icon="🌱" title={tx(t, "skills.none")} text={tx(t, "skills.noneText", { name: first })} />;
  else {
    body = (
      <>
        <div className={s.filters} role="group" aria-label={tx(t, "skills.filter")}>
          {["all", ...STATES].map((k) => (
            <button key={k} type="button" className={s.filter} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {k === "all" ? tx(t, "skills.all") : <><StateIcon state={k} />{tx(t, `skills.state.${k}`)}</>}
              <span>({k === "all" ? Object.values(totals).reduce((a, b) => a + b, 0) : totals[k]})</span>
            </button>
          ))}
        </div>
        <div className={s.subjects}>
          {subjects.map((sub) => {
            const all = sub.skills.filter((x) => filter === "all" || x.state === filter);
            const expanded = open.has(sub.subject) || all.length <= SHORT + 1;
            const list = expanded ? all : all.slice(0, SHORT);
            const meta = subjectOf(sub.subject);
            return (
              <section key={sub.subject} className={s.subject} aria-label={subjectLabel(t, sub.subject)}>
                <div className={s.subjectHead}>
                  <h4><span className={s.swatch} style={{ background: meta?.color }} aria-hidden="true" />{subjectLabel(t, sub.subject)}</h4>
                  <span className={s.small}>{tx(t, "skills.level", { level: sub.level })}</span>
                </div>
                <ul className={s.counts} aria-label={tx(t, "skills.count", { n: sub.skills.length })}>
                  {STATES.filter((k) => sub.counts[k]).map((k) => (
                    <li key={k} className={s.count}><StateIcon state={k} />{tx(t, `skills.state.${k}`)}: {sub.counts[k]}</li>
                  ))}
                </ul>
                {list.length ? (
                  <ul className={s.skillList}>
                    {list.map((x) => (
                      <li key={x.id} className={s.skill}>
                        <span className={s.skillName}>{x.name}</span>
                        <StateLabel state={x.state} />
                        <span className={s.bar} role="img" aria-label={`${Math.round(x.mastery * 100)}%`}><span style={{ width: `${Math.max(3, Math.round(x.mastery * 100))}%` }} /></span>
                        <span className={s.skillMeta}>
                          {[
                            tx(t, "skills.right", { correct: x.correct, count: x.attempts }),
                            x.masteredAt ? tx(t, "skills.masteredOn", { date: day(x.masteredAt) }) : null,
                            x.mixups ? tx(t, "skills.mixups", { count: x.mixups }) : null,
                            x.strategy ? tx(t, "skills.explainedAs", { strategy: tx(t, `strategy.${x.strategy}`) }) : null,
                          ].filter(Boolean).join(" · ")}
                          {audience === "teacher" && x.mixup ? <><br />“{x.mixup}”</> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className={s.emptyLine}>{tx(t, "skills.empty")}</p>}
                {all.length > SHORT + 1 && (
                  <button type="button" className={`${s.filter} ${s.more}`} aria-expanded={expanded} onClick={() => toggle(sub.subject)}>
                    {expanded ? tx(t, "skills.showLess") : tx(t, "skills.showAll", { count: all.length - SHORT })}
                  </button>
                )}
                {sub.upcoming?.length > 0 && filter === "all" && (
                  <p className={s.upcoming}>{tx(t, "skills.upcoming", { names: listOf(sub.upcoming.map((u) => u.name), i18n.language) })}</p>
                )}
              </section>
            );
          })}
        </div>
        <details className={s.details}>
          <summary>{tx(t, "skills.legend")}</summary>
          <ul className={s.legend}>
            {STATES.map((k) => <li key={k}><StateLabel state={k} /><span>{tx(t, `skills.stateHelp.${k}`)}</span></li>)}
          </ul>
        </details>
      </>
    );
  }
  return (
    <section className={s.card} aria-labelledby={id}>
      <H id={id} className={s.title}>{tx(t, "skills.title", { name: first })}</H>
      <p className={s.sub}>{tx(t, "skills.sub", { name: first })}</p>
      {body}
    </section>
  );
}

function StateIcon({ state }) {
  const Icon = ICON[state];
  return Icon ? <Icon aria-hidden="true" /> : null;
}
