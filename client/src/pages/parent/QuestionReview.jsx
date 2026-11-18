import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, Skeleton, fmtDate, subjectLabel, moduleLabel } from "../../components/dashboard";
import s from "./parent.module.css";

const FILTERS = ["all", "wrong", "hint", "slow"];
const optText = (o) => (o == null ? "" : typeof o === "object" ? o.text || o.label || o.value || o.word || JSON.stringify(o) : String(o));
const plain = (v) => {
  if (v == null) return "";
  try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(optText).join(", ") : typeof p === "object" ? Object.values(p).map(optText).join(", ") : String(p); } catch { return String(v); }
};

// The question as the child saw it, on the wooden board (PAR-033).
function Board({ a, t }) {
  const c = a.card;
  const opts = Array.isArray(c?.options) ? c.options.slice(0, 8).map(optText) : [];
  const chosen = plain(a.userAnswer), right = plain(a.correctAnswer);
  return (
    <div className={s.board} role="img" aria-label={t("parent.q.board", { defaultValue: "Question card: {{q}}", q: [c?.instruction, c?.prompt || a.question].filter(Boolean).join(" ") })}>
      {c?.instruction && <p className={s.boardInstr}>{c.instruction}</p>}
      <p className={s.boardPrompt}>{c?.prompt || c?.audio_text || a.question || "…"}</p>
      {opts.length > 0 && (
        <div className={s.boardOpts} aria-hidden="true">
          {opts.map((o, i) => (
            <span key={i} className={`${s.boardOpt} ${o === right ? s.boardOptRight : ""} ${o === chosen ? s.boardOptChosen : ""}`}>{o}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionReview({ api, child, subject, module, onClear }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.q.${k}`, { defaultValue: d, ...o });
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState({ list: [], loading: true, error: null, next: null, slowAfter: null });

  const fetchPage = useCallback(async (before) => {
    const qs = new URLSearchParams({ filter, limit: "12" });
    if (subject) qs.set("subject", subject);
    if (module) qs.set("module", module);
    if (before) qs.set("before", before);
    return api.get(`/children/${child._id}/answers?${qs}`);
  }, [api, child._id, filter, subject, module]);
  const apply = (d, before) => setState((x) => (d.success
    ? { list: before ? [...x.list, ...d.answers] : d.answers, loading: false, error: null, next: d.nextBefore, slowAfter: d.slowAfterSec }
    : { ...x, loading: false, error: d.message }));
  useEffect(() => {
    let live = true;
    (async () => { const d = await fetchPage(); if (live) apply(d); })();
    return () => { live = false; };
  }, [fetchPage]);
  const load = async (before) => {
    setState((x) => ({ ...x, loading: true, error: null }));
    apply(await fetchPage(before), before);
  };

  const label = { all: T("f.all", "All"), wrong: T("f.wrong", "Not right yet"), hint: T("f.hint", "Needed a hint"), slow: T("f.slow", "Took longer") };
  const first = child.name.split(" ")[0];

  return (
    <section className={s.card} aria-labelledby="p-q-h" id="p-questions">
      <div className={s.cardHead}>
        <h2 id="p-q-h">{T("title", "The questions behind the numbers")}</h2>
        {(subject || module) && (
          <span className={s.row}>
            <span className={s.pill}>{[module && moduleLabel(t, module), subject && subjectLabel(t, subject)].filter(Boolean).join(" · ")}</span>
            <Button variant="ghost" size="sm" onClick={onClear}>{T("clear", "Show all areas")}</Button>
          </span>
        )}
      </div>
      <div className={s.filters} role="group" aria-label={T("filter", "Show")}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className={s.filterBtn} aria-pressed={filter === f} onClick={() => { setState((x) => ({ ...x, loading: true, list: [] })); setFilter(f); }}>{label[f]}</button>
        ))}
      </div>
      {filter === "slow" && state.slowAfter && <p className={`${s.muted} ${s.small}`}>{T("slowRule", "Longer than {{n}} seconds: about twice {{name}}'s usual time.", { n: Math.round(state.slowAfter), name: first })}</p>}
      <div style={{ marginTop: 12 }}>
        {state.error && <EmptyState compact tone="error" title={T("error", "Couldn't load the questions")} text={state.error} actionLabel={T("retry", "Try again")} onAction={() => load()} />}
        {!state.error && !state.loading && !state.list.length && (
          <EmptyState compact icon="📭" title={filter === "all" ? T("none", "No answers yet") : T("noneFilter", "Nothing here. That's good news!")} text={filter === "all" ? T("noneText", "Answers appear here after {{name}} plays a module.", { name: first }) : undefined} />
        )}
        <ul className={s.answers}>
          {state.list.map((a) => (
            <li key={a.id} className={s.answer}>
              <Board a={a} t={t} />
              <dl className={s.answerMeta}>
                <dt>{T("their", "{{name}}'s answer", { name: first })}</dt>
                <dd>{a.correct ? "✓ " : "○ "}{plain(a.userAnswer) || "—"}</dd>
                {!a.correct && <><dt>{T("right", "Right answer")}</dt><dd>{plain(a.correctAnswer) || "—"}</dd></>}
                <dt>{T("time", "Time")}</dt>
                <dd>{a.timeSec != null ? T("secs", "{{n}} s", { n: a.timeSec }) : "—"}{a.slow ? ` · ${T("slowTag", "took longer")}` : ""}</dd>
                <dt>{T("where", "Where")}</dt>
                <dd>{moduleLabel(t, a.module)} · {subjectLabel(t, a.subject)}{a.mode === "warrior" ? ` · ${T("warrior", "Warrior")}` : ""}</dd>
                {a.hintsUsed > 0 && <><dt>{T("hints", "Hints")}</dt><dd>{a.hintsUsed}</dd></>}
                <dt>{T("when", "When")}</dt>
                <dd>{fmtDate(String(a.at).slice(0, 10), { style: "short" })} {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</dd>
              </dl>
            </li>
          ))}
        </ul>
        {state.loading && <Skeleton variant="rect" height={160} />}
        {state.next && !state.loading && <div style={{ marginTop: 12 }}><Button variant="soft" onClick={() => load(state.next)}>{T("more", "Show more")}</Button></div>}
      </div>
    </section>
  );
}
