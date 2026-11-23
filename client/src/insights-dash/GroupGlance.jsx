// A teacher's group at a glance (GET /teacher/groups/:id/insights?days=7|28):
//   part="overview": headline, the period in numbers, what is going well (+ a link to "help")
//   part="help":     who might need a check-in (with reasons and numbers), skills the group finds
//                    hard (plan a lesson, make a practice group), mix-ups shared across the group
// For planning, never ranking: lists are in name order and no child's score is set against another's.
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserClock, FaChalkboardTeacher, FaPuzzlePiece, FaStar, FaMagic, FaRedo, FaArrowRight } from "react-icons/fa";
import Button from "../components/dashboard/Button";
import Skeleton from "../components/dashboard/Skeleton";
import EmptyState from "../components/dashboard/EmptyState";
import { subjectLabel } from "../components/dashboard/constants";
import { fmtDate } from "../components/dashboard/format";
import { tx } from "./strings.js";
import { renderer, shareMeasure, countStatus } from "./render.js";
import { PeriodToggle, Measure } from "./parts.jsx";
import { day, listOf } from "./fmt.js";
import s from "./insights.module.css";

function Head({ title, sub, icon: Icon, id }) {
  return (
    <div>
      <h3 id={id} className={s.h3} style={{ display: "flex", alignItems: "center", gap: 8 }}>{Icon && <Icon aria-hidden="true" />}{title}</h3>
      {sub && <p className={s.sub}>{sub}</p>}
    </div>
  );
}

function CheckIns({ list, r, onStudent }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <section className={s.card} aria-labelledby={id}>
      <Head id={id} icon={FaUserClock} title={tx(t, "group.checkTitle")} sub={tx(t, "group.checkSub")} />
      {list.length ? (
        <ul className={s.people}>
          {list.map((c) => (
            <li key={c.student.id} className={s.person}>
              <button type="button" className={s.personName} onClick={() => onStudent?.(c.student.id)}>{c.student.name}<FaArrowRight aria-hidden="true" /></button>
              <ul className={s.reasons}>{c.reasons.map((x) => <li key={x.key}>{r.reason(x)}</li>)}</ul>
              <p className={s.action}><strong>{tx(t, "group.tryThis")}:</strong> {r.action(c.reasons[0])}</p>
            </li>
          ))}
        </ul>
      ) : <EmptyState compact icon="🌤️" title={tx(t, "group.checkNone")} text={tx(t, "group.checkNoneText")} />}
    </section>
  );
}

function HardSkills({ list, rules, onStudent, onMakeGroup }) {
  const { t } = useTranslation();
  const id = useId();
  const [made, setMade] = useState({});
  const make = async (h) => {
    const res = await onMakeGroup?.(h);
    if (res) setMade((m) => ({ ...m, [h.skill]: res }));
  };
  return (
    <section className={s.card} aria-labelledby={id}>
      <Head id={id} icon={FaChalkboardTeacher} title={tx(t, "group.hardTitle")} sub={tx(t, "group.hardSub", { min: rules?.groupMin ?? 2, share: Math.round((rules?.groupHardShare ?? 0.3) * 100) })} />
      {list.length ? (
        <ul className={s.people}>
          {list.map((h) => (
            <li key={h.skill} className={s.person}>
              <strong style={{ fontSize: "1.05rem" }}>{h.name} <span className={s.small}>· {subjectLabel(t, h.subject)}</span></strong>
              <span className={s.small}>{tx(t, "group.hardCount", { hard: h.findingHard, practising: h.practising, secure: h.secure })}</span>
              {h.mixup && <p className={s.action}>{tx(t, "group.commonMixup", { text: h.mixup.text, count: h.mixup.students })}</p>}
              {h.action && <p className={s.action}><strong>{tx(t, "group.tryThis")}:</strong> {h.action}</p>}
              <ul className={s.chips} aria-label={h.name}>
                {h.students.map((st) => (
                  <li key={st.id}><button type="button" className={s.chip} onClick={() => onStudent?.(st.id)}>{st.name} · {st.correct}/{st.attempts}</button></li>
                ))}
              </ul>
              {onMakeGroup && (made[h.skill]
                ? <p className={s.notice} role="status">{made[h.skill]}</p>
                : <div><Button variant="soft" icon={FaMagic} onClick={() => make(h)}>{tx(t, "group.makeGroup")}</Button></div>)}
            </li>
          ))}
        </ul>
      ) : <EmptyState compact icon="✅" title={tx(t, "group.hardNone")} text={tx(t, "group.hardNoneText")} />}
    </section>
  );
}

function Mixups({ list, rules, onStudent }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <section className={s.card} aria-labelledby={id}>
      <Head id={id} icon={FaPuzzlePiece} title={tx(t, "group.mixTitle")} sub={tx(t, "group.mixSub", { min: rules?.groupMin ?? 2 })} />
      {list.length ? (
        <ul className={s.people}>
          {list.map((m) => (
            <li key={`${m.skillId}|${m.text}`} className={s.person}>
              <strong>“{m.text}”</strong>
              <span className={s.small}>{m.skill} · {subjectLabel(t, m.subject)} · {tx(t, "group.mixTimes", { count: m.times })}</span>
              {m.action && <p className={s.action}><strong>{tx(t, "group.tryThis")}:</strong> {m.action}</p>}
              <ul className={s.chips} aria-label={m.text}>
                {m.students.map((st) => <li key={st.id}><button type="button" className={s.chip} onClick={() => onStudent?.(st.id)}>{st.name}</button></li>)}
              </ul>
            </li>
          ))}
        </ul>
      ) : <p className={s.emptyLine}>{tx(t, "group.mixNone")}</p>}
    </section>
  );
}

function Wins({ wins, days, rules, onStudent }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const names = (arr) => listOf(arr.map((x) => x.name), i18n.language);
  const habit = Math.ceil(days * (rules?.habitShare ?? 4 / 7));
  const empty = !wins.mastered.length && !wins.steady.length && !wins.improving.length;
  return (
    <section className={s.card} aria-labelledby={id}>
      <Head id={id} icon={FaStar} title={tx(t, "group.winsTitle")} />
      {empty ? <p className={s.emptyLine}>{tx(t, "group.winsNone")}</p> : (
        <ul className={s.winList}>
          {wins.mastered.slice(0, 4).map((m) => (
            <li key={m.skill} className={s.winRow}>
              <strong>{tx(t, "group.winsMastered", { skill: m.name, count: m.students.length })}</strong>
              <ul className={s.chips}>{m.students.map((st) => <li key={st.id}><button type="button" className={s.chip} onClick={() => onStudent?.(st.id)}>{st.name}</button></li>)}</ul>
            </li>
          ))}
          {wins.steady.length > 0 && <li className={s.winRow}><span>{tx(t, "group.winsSteady", { days: habit, names: names(wins.steady), count: wins.steady.length })}</span></li>}
          {wins.improving.length > 0 && <li className={s.winRow}><span>{tx(t, "group.winsImproving", { names: names(wins.improving) })}</span></li>}
        </ul>
      )}
    </section>
  );
}

export default function GroupGlance({ data, loading, error, onRetry, days = 7, onDays, part = "overview", onStudent, onMakeGroup, onSeeHelp }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const r = useMemo(() => renderer({ t, day, list: (a) => listOf(a, i18n.language), audience: "teacher", subject: (k) => subjectLabel(t, k) }), [t, i18n.language]);
  const P = data?.period;
  const m = data?.measures;

  let body = null;
  if (loading && !data) body = <Skeleton variant="rect" height={140} />;
  else if (error && !data) {
    body = (
      <div role="alert">
        <EmptyState compact tone="error" title={tx(t, "glance.loadError")} text={error} />
        {onRetry && <Button variant="soft" icon={FaRedo} onClick={onRetry}>{tx(t, "glance.retry")}</Button>}
      </div>
    );
  }
  const ft = m ? shareMeasure(t, m.firstTry, data?.rules?.minAnswers ?? 20) : null;
  const before = (v) => (v == null ? null : tx(t, "measure.before", { value: v }));
  const aStatus = m ? countStatus(m.active.cur, m.active.prev) : null;
  const qStatus = m ? countStatus(m.answered.cur, m.answered.prev) : null;

  return (
    <div className={s.stack}>
      <section className={s.card} aria-labelledby={id} aria-busy={loading || undefined}>
        <div className={s.head}>
          <div>
            <p className={s.eyebrow}>{tx(t, "glance.eyebrow")}</p>
            <h2 id={id} className={s.title}>{tx(t, "group.title", { count: days })}</h2>
            {P && <p className={s.sub}>{tx(t, "group.sub", { range: fmtDate({ from: P.from, to: P.to }, { style: "day" }), prev: fmtDate({ from: P.prev.from, to: P.prev.to }, { style: "day" }) })}</p>}
          </div>
          {onDays && <PeriodToggle value={days} onChange={onDays} />}
        </div>
        {body}
        {data && (
          <>
            <p className={s.headline}>{r.groupHeadline(data.headline)}</p>
            {part === "overview" && (
              <ul className={`${s.measures} ${s.measures4}`}>
                <Measure label={tx(t, "group.active")} value={tx(t, "group.activeValue", { cur: m.active.cur, of: m.active.of })} status={aStatus} statusLabel={aStatus && tx(t, `measure.${aStatus}`)} before={before(m.active.prev)} />
                <Measure label={tx(t, "group.answered")} value={m.answered.cur} status={qStatus} statusLabel={qStatus && tx(t, `measure.${qStatus}`)} before={before(m.answered.prev)} />
                <Measure label={tx(t, "group.firstTry")} value={ft.value == null ? null : `${ft.value}%`} status={ft.status} statusLabel={ft.statusLabel} before={ft.prev != null ? before(`${ft.prev}%`) : null} why={ft.why} />
                <Measure label={tx(t, "group.mastered")} value={tx(t, "group.masteredValue", { count: m.mastered })} />
              </ul>
            )}
            {data.students > data.withLogin && <p className={s.small} style={{ marginTop: 10 }}>{tx(t, "group.noLogin", { count: data.students - data.withLogin })}</p>}
            {part === "overview" && onSeeHelp && (data.checkIns.length > 0 || data.hardSkills.length > 0) && (
              <div className={s.foot}><Button variant="soft" icon={FaArrowRight} onClick={onSeeHelp}>{tx(t, "group.seeHelp")}</Button></div>
            )}
          </>
        )}
      </section>
      {data && part === "overview" && <Wins wins={data.wins} days={data.period.days} rules={data.rules} onStudent={onStudent} />}
      {data && part === "help" && (
        <>
          <div className={s.groupGrid}>
            <CheckIns list={data.checkIns} r={r} onStudent={onStudent} />
            <HardSkills list={data.hardSkills} rules={data.rules} onStudent={onStudent} onMakeGroup={onMakeGroup} />
          </div>
          <Mixups list={data.mixups} rules={data.rules} onStudent={onStudent} />
        </>
      )}
    </div>
  );
}
