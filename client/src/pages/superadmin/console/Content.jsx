// Content (SUP-030, SUP-032): the built-in Learnigo question banks with
// translation coverage, browse, edit and tag; and the AI Teacher's content.
// An organisation's own uploaded questions are approved by its admin, not here.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable, usePane } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, dateTime } from "./api";
import { Facts, Field, Loadable, Modal, Notice, Pager, Panel, Pill, TabBody, Tabs } from "./ui";
import s from "./console.module.css";

const EDIT = [["prompt", "Prompt", "textarea"], ["instruction", "Instruction", "textarea"], ["audio_text", "Spoken text", "textarea"], ["question", "Question (older format)", "textarea"], ["answer", "Answer (older format)", "input"], ["difficulty_band", "Difficulty band", "input"]];

function Editor({ bank, id, onClose, onSaved }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const q = useLoad(`/content/banks/${bank.module}/${bank.subject}/${encodeURIComponent(id)}`);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const Q = q.data?.question;
  const f = form || (Q ? { ...Object.fromEntries(EDIT.map(([k]) => [k, Q[k] ?? ""])), level: Q.level ?? "", staffTags: (Q.staffTags || []).join(", ") } : null);
  const save = async () => {
    try {
      const body = {};
      for (const [k] of EDIT) if ((Q[k] ?? "") !== f[k]) body[k] = f[k];
      if (String(Q.level ?? "") !== String(f.level)) body.level = Number(f.level);
      const tags = f.staffTags.split(",").map((x) => x.trim()).filter(Boolean);
      if (tags.join(",") !== (Q.staffTags || []).join(",")) body.staffTags = tags;
      if (!Object.keys(body).length) { onClose(); return; }
      await api.patch(`/content/banks/${bank.module}/${bank.subject}/${encodeURIComponent(id)}`, body);
      onSaved(); onClose();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal wide title={t("sa.ct.edit", "Edit {{id}}", { id })} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button><Button onClick={save}>{t("sa.save", "Save changes")}</Button></>}>
      <Loadable state={q}>
        {f && (
          <>
            <Notice tone="alert">{err}</Notice>
            <Facts items={[[t("sa.ct.interaction", "Interaction"), Q.interaction || "—"], [t("sa.ct.translations", "Translations"), Object.keys(Q.translations || {}).join(", ") || "—"], [t("sa.ct.updated", "Updated"), dateTime(Q.updatedAt)]]} />
            {EDIT.filter(([k]) => (Q[k] != null && Q[k] !== "") || ["prompt", "instruction"].includes(k)).map(([k, label, kind]) => (
              <Field key={k} label={t(`sa.ct.f.${k}`, label)}>
                {kind === "textarea" ? <textarea className={s.textarea} rows={2} value={f[k]} onChange={(e) => setForm({ ...f, [k]: e.target.value })} /> : <input className={s.input} value={f[k]} onChange={(e) => setForm({ ...f, [k]: e.target.value })} />}
              </Field>
            ))}
            <div className={s.grid2}>
              <Field label={t("sa.ct.level", "Level (1–5)")}><input className={s.input} type="number" min={1} max={5} value={f.level} onChange={(e) => setForm({ ...f, level: e.target.value })} /></Field>
              <Field label={t("sa.ct.tags", "Staff tags (comma separated)")} hint={t("sa.ct.tagsHint", "e.g. review, wrong-key, too-easy")}><input className={s.input} value={f.staffTags} onChange={(e) => setForm({ ...f, staffTags: e.target.value })} /></Field>
            </div>
            <details><summary className={s.label}>{t("sa.ct.answer", "Correct answer (read-only here)")}</summary><pre className={`${s.mono}`}>{JSON.stringify(Q.correct_answer ?? Q.answer ?? null, null, 2)}</pre></details>
          </>
        )}
      </Loadable>
    </Modal>
  );
}

function Bank({ bank, languages, onBack }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ q: "", level: "", missing: "", tag: "" });
  const list = useLoad(`/content/banks/${bank.module}/${bank.subject}${qs({ ...filters, page, limit: 25 })}`);
  const [editing, setEditing] = useState(null);
  const L = list.data;
  return (
    <Panel title={`${bank.module} · ${bank.subject}`} sub={t("sa.ct.bankSub", "{{n}} built-in questions", { n: bank.builtIn })} actions={<Button size="sm" variant="ghost" onClick={onBack}>← {t("sa.ct.allBanks", "All banks")}</Button>}>
      <form className={s.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setFilters({ ...filters, q }); }}>
        <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.ct.ph", "Id or words in the question")} /></Field>
        <Field label={t("sa.ct.level", "Level (1–5)")}><select className={s.select} value={filters.level} onChange={(e) => { setPage(1); setFilters({ ...filters, level: e.target.value }); }}><option value="">{t("sa.all", "All")}</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label={t("sa.ct.missing", "Missing translation")}><select className={s.select} value={filters.missing} onChange={(e) => { setPage(1); setFilters({ ...filters, missing: e.target.value }); }}><option value="">{t("sa.any", "Any")}</option>{languages.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
        <Field label={t("sa.ct.tag", "Tag")}><input className={s.input} value={filters.tag} onChange={(e) => { setPage(1); setFilters({ ...filters, tag: e.target.value }); }} /></Field>
        <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
      </form>
      <Loadable state={list} empty={L && !L.rows.length ? { title: t("sa.ct.none", "No questions match.") } : null}>
        {L && (
          <>
            <DataTable caption={t("sa.ct.questions", "Questions")} rows={L.rows} getRowKey={(r) => r.id} onRowClick={(r) => setEditing(r.id)} columns={[
              { key: "id", label: "Id", render: (r) => <span className={s.mono}>{r.id}</span> },
              { key: "prompt", label: t("sa.ct.f.prompt", "Prompt"), render: (r) => String(r.prompt || r.question || r.sentence || r.text || r.instruction || "—").slice(0, 120) },
              { key: "level", label: t("sa.ct.lvl", "Level"), align: "end" },
              { key: "translations", label: t("sa.ct.translations", "Translations"), render: (r) => r.translations.join(" ") || "—" },
              { key: "staffTags", label: t("sa.ct.tagsCol", "Tags"), render: (r) => <span className={s.row}>{(r.staffTags || []).map((x) => <Pill key={x}>{x}</Pill>)}</span> },
            ]} />
            <Pager page={L.page} limit={25} total={L.total} onPage={setPage} />
          </>
        )}
      </Loadable>
      {editing && <Editor bank={bank} id={editing} onClose={() => setEditing(null)} onSaved={() => list.reload({ quiet: true })} />}
    </Panel>
  );
}

// Phones get one "Translations" column instead of a column per language.
function useNarrow() {
  const q = "(max-width: 700px)";
  const [n, setN] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const on = () => setN(m.matches); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  return n;
}
const trTone = (pct) => (pct >= 90 ? "good" : pct >= 40 ? "attention" : "alert");

function Banks() {
  const { t } = useTranslation();
  const narrow = useNarrow();
  const b = useLoad("/content/banks");
  const [open, setOpen] = useState(null);
  const B = b.data;
  if (open) return <Bank bank={open} languages={B.languages} onBack={() => setOpen(null)} />;
  return (
    <Panel title={t("sa.ct.banks", "Question banks")} sub={t("sa.ct.banksSub", "Learnigo's own banks. Organisations' uploads are counted but stay with their admins.")} actions={<Button size="sm" variant="ghost" onClick={() => b.reload()}>{t("sa.refresh", "Refresh")}</Button>}>
      <Loadable state={b}>
        {B && <DataTable caption={t("sa.ct.banks", "Question banks")} rows={B.rows} getRowKey={(r) => `${r.module}_${r.subject}`} onRowClick={setOpen} columns={[
          { key: "bank", label: t("sa.ct.bank", "Bank"), render: (r) => <span className={s.strong}>{r.module} · {r.subject}</span> },
          { key: "builtIn", label: t("sa.ct.builtIn", "Built-in"), align: "end" },
          { key: "orgUploads", label: t("sa.ct.orgUploads", "Org uploads"), align: "end" },
          { key: "tagged", label: t("sa.ct.tagged", "Tagged"), align: "end" },
          ...(narrow
            ? [{ key: "tr", label: t("sa.ct.translations", "Translations"), render: (r) => <span className={s.pillWrap}>{B.languages.filter((l) => r.translations[l]?.pct != null).map((l) => <Pill key={l} tone={trTone(r.translations[l].pct)}>{l.toUpperCase()} {r.translations[l].pct} %</Pill>)}{!B.languages.some((l) => r.translations[l]?.pct != null) && "—"}</span> }]
            : B.languages.map((l) => ({ key: `tr_${l}`, label: l.toUpperCase(), align: "end", sortValue: (r) => r.translations[l]?.pct ?? -1, render: (r) => (r.translations[l]?.pct == null ? "—" : <Pill tone={trTone(r.translations[l].pct)}>{r.translations[l].pct} %</Pill>) }))),
        ]} />}
      </Loadable>
      <p className={`${s.small} ${s.muted}`}>{t("sa.ct.qualityLater", "Quality flags from item analysis (likely wrong key, too easy, confusing) come with the test item analysis; until then staff tags mark questions to review.")}</p>
    </Panel>
  );
}

function AiTeacher() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const a = useLoad("/content/ai-teacher");
  const [msg, setMsg] = useState("");
  const A = a.data;
  if (A && !A.available) return <Panel title={t("sa.ct.ai", "AI Teacher")}><p className={s.muted}>{A.message || t("sa.an.aiOff", "The AI Teacher is not running on this server.")}</p></Panel>;
  return (
    <Loadable state={a}>
      {A && (
        <>
          <Panel title={t("sa.ct.ai", "AI Teacher")} sub={t("sa.ct.aiSub", "Read from the assistant's own admin data (also at /ai-assistant/admin.html).")}>
            <Notice tone="good" onClose={() => setMsg("")}>{msg}</Notice>
            <Facts items={[
              [t("sa.ct.ready", "Ready"), A.health?.ready ? t("sa.yes", "Yes") : t("sa.no", "No")],
              [t("sa.ct.voice", "Voice"), A.health?.voice || "—"], [t("sa.ct.hearing", "Hearing"), String(A.health?.hearing ?? "—")],
              [t("sa.ct.model", "Model"), A.health?.model || (A.health?.llm ? "on" : "off")],
              [t("sa.ct.packs", "Lesson packs"), A.packs ? `${A.packs.total} (${A.packs.reviewed} reviewed, ${A.packs.draft} draft)` : "—"],
              [t("sa.ct.kb", "Knowledge cards"), A.health?.kb?.cards ?? "—"],
              [t("sa.ct.tts", "Voice cache"), A.tts ? `${A.tts.cached} cached · ${A.tts.made} made` : "—"],
            ]} />
          </Panel>
          <div className={s.grid2}>
            <Panel title={t("sa.an.missing", "Asked for, but no lesson yet")}>
              {A.todos.filter((x) => !x.done).length ? <ul className={s.list}>{A.todos.filter((x) => !x.done).slice(0, 30).map((x) => (
                <li key={x.key} className={s.listItem}><span>{x.text} <Pill tone="attention">{x.count}×</Pill></span><Button size="sm" variant="ghost" onClick={async () => { try { await api.post("/content/ai-teacher/todos/done", { key: x.key }); setMsg(t("sa.ct.doneMsg", "Marked as covered.")); a.reload({ quiet: true }); } catch (e) { setMsg(e.message); } }}>{t("sa.ct.covered", "Covered")}</Button></li>
              ))}</ul> : <p className={s.muted}>{t("sa.none", "None.")}</p>}
            </Panel>
            <Panel title={t("sa.ct.topics", "Topics asked most (recent)")}>
              <ul className={s.list}>{A.topTopics.map((x) => <li key={x.topic} className={s.listItem}><span>{x.topic}</span><span className={s.num}>{x.n}</span></li>)}</ul>
              <h3 className={s.label}>{t("sa.ct.heard", "\"Heard\" fixes queue")}</h3>
              {A.heard?.length ? <ul className={s.list}>{A.heard.slice(0, 20).map((h, i) => <li key={i} className={s.listItem}><span className={s.mono}>{typeof h === "string" ? h : JSON.stringify(h)}</span></li>)}</ul> : <p className={s.muted}>{t("sa.none", "None.")}</p>}
            </Panel>
          </div>
        </>
      )}
    </Loadable>
  );
}

export default function Content() {
  const { t } = useTranslation();
  const [tab, setTab] = usePane(["banks", "ai", "public"]);
  return (
    <>
      <Tabs label={t("sa.nav.content", "Content")} value={tab} onChange={setTab} tabs={[{ key: "banks", label: t("sa.ct.banks", "Question banks") }, { key: "ai", label: t("sa.ct.ai", "AI Teacher") }, { key: "public", label: t("sa.ct.public", "Public bank submissions") }]} />
      <TabBody value={tab}>
        {tab === "banks" && <Banks />}
        {tab === "ai" && <AiTeacher />}
        {tab === "public" && <Panel title={t("sa.ct.public", "Public bank submissions")}><p className={s.muted}>{t("sa.ct.publicNot", "Not available yet: teachers cannot share questions publicly until the question-sharing feature (TCH-025) exists. Organisation question approval stays with each organisation's admin.")}</p></Panel>}
      </TabBody>
    </>
  );
}
