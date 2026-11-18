// Tests and practice sets list, with "start from a template" (TCH-030/060).
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaChartBar, FaPen, FaCopy, FaArchive } from "react-icons/fa";
import { Button, EmptyState, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, fmtWhen } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

export default function TestsHome({ kind = "test" }) {
  const api = useTeacherApi();
  const tt = useT();
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [presets, setPresets] = useState([]);
  const [locked, setLocked] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([api.get(`/tests?kind=${kind}`), api.get("/tests/presets")]);
    if (r.locked) { setLocked(r.locked); return; }
    if (!r.ok) { setError(r.message || tt("loadError", "Could not load. Try again.")); setTests([]); return; }
    setTests(r.tests);
    setPresets((p.presets || []).filter((x) => x.kind === kind));
  }, [api, kind, tt]);

  useEffect(() => { Promise.resolve().then(() => { setTests(null); return load(); }); }, [load]);

  const create = async (preset) => {
    const title = preset ? preset.title : kind === "practice" ? tt("home.newPractice", "New practice set") : tt("home.newTest", "New test");
    const r = await api.post("/tests", { title, kind, preset: preset?.key });
    if (r.ok) navigate(`/teacher/tests/${r.test._id}/edit`);
    else setError(r.message);
  };
  const duplicate = async (t) => { const r = await api.post(`/tests/${t._id}/duplicate`, {}); if (r.ok) navigate(`/teacher/tests/${r.test._id}/edit`); };
  const archive = async (t) => {
    if (!window.confirm(tt("home.archiveConfirm", "Archive \"{{title}}\"? Students will no longer see it.", { title: t.title }))) return;
    await api.del(`/tests/${t._id}`);
    load();
  };

  if (locked) return <Locked module={locked} />;

  const statusChip = (t) => {
    if (t.isTemplate) return <span className={s.chip}>{tt("status.template", "Template")}</span>;
    if (t.status === "draft") return <span className={s.chip}>{tt("status.draft", "Draft")}</span>;
    if (t.window === "upcoming") return <span className={`${s.chip} ${s.chipAccent}`}>{tt("status.upcoming", "Opens soon")}</span>;
    if (t.window === "closed") return <span className={s.chip}>{tt("status.closed", "Closed")}</span>;
    return <span className={`${s.chip} ${s.chipGood}`}>{tt("status.open", "Open")}</span>;
  };

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{kind === "practice" ? tt("home.practiceTitle", "Practice sets") : tt("home.title", "Tests")}</h1>
          <p>{kind === "practice"
            ? tt("home.practiceSub", "Calm practice that counts towards mastery, not grades.")
            : tt("home.sub", "Build a test in minutes, set the rules, and see who needs help the moment they finish.")}</p>
        </div>
        <div className={s.actions}>
          <Button icon={FaPlus} onClick={() => create(null)}>{kind === "practice" ? tt("home.newPractice", "New practice set") : tt("home.newTest", "New test")}</Button>
        </div>
      </div>

      {error && <p className={`${s.notice} ${s.noticeError}`} role="alert">{error}</p>}

      {presets.length > 0 && (
        <section className={s.card} aria-labelledby="presets-h">
          <h2 id="presets-h">{tt("home.templates", "Start from a template")}</h2>
          <div className={s.grid3}>
            {presets.map((p) => (
              <button key={p.key} type="button" className={s.listRow} style={{ flexDirection: "column", alignItems: "flex-start", cursor: "pointer", textAlign: "left" }} onClick={() => create(p)}>
                <span className={s.title}>{tt(`preset.${p.key}`, p.title)}</span>
                <span className={s.small}>{tt(`preset.${p.key}Text`, p.description)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={s.card} aria-labelledby="list-h">
        <h2 id="list-h">{kind === "practice" ? tt("home.yourPractice", "Your practice sets") : tt("home.yourTests", "Your tests")}</h2>
        {!tests ? <Skeleton variant="text" lines={4} /> : tests.length === 0 ? (
          <EmptyState title={tt("home.emptyTitle", "Nothing here yet")} text={tt("home.emptyText", "Pick a template above or start from scratch.")} actionLabel={tt("home.newTest", "New test")} onAction={() => create(null)} compact />
        ) : (
          <ul className={s.list}>
            {tests.map((t) => (
              <li key={t._id} className={s.listRow}>
                <div className={s.grow}>
                  <div className={s.chips} style={{ alignItems: "center" }}>
                    <span className={`${s.title} ${s.ellipsis}`}>{t.title}</span>
                    {statusChip(t)}
                    {t.needsMarking > 0 && <span className={`${s.chip} ${s.chipWarn}`}>{tt("home.toMark", "{{n}} to mark", { n: t.needsMarking })}</span>}
                  </div>
                  <div className={s.small}>
                    {tt("home.questions", "{{count}} questions", { count: t.questionCount, defaultValue_one: "{{count}} question" })}
                    {t.status === "published" && <> · {tt("home.done", "{{finished}} of {{assigned}} finished", { finished: t.finished, assigned: t.assigned })}</>}
                    {t.average != null && <> · {tt("home.avg", "average {{avg}} %", { avg: t.average })}</>}
                    {t.closesAt && <> · {tt("home.closes", "closes {{when}}", { when: fmtWhen(t.closesAt) })}</>}
                  </div>
                </div>
                <div className={s.itemTools}>
                  {t.status === "published" && <Button size="sm" variant="soft" icon={FaChartBar} to={`/teacher/tests/${t._id}`}>{tt("home.results", "Results")}</Button>}
                  <button type="button" className={s.iconBtn} onClick={() => navigate(`/teacher/tests/${t._id}/edit`)} aria-label={tt("home.edit", "Edit {{title}}", { title: t.title })}><FaPen aria-hidden="true" /></button>
                  <button type="button" className={s.iconBtn} onClick={() => duplicate(t)} aria-label={tt("home.duplicate", "Duplicate {{title}}", { title: t.title })}><FaCopy aria-hidden="true" /></button>
                  <button type="button" className={s.iconBtn} onClick={() => archive(t)} aria-label={tt("home.archive", "Archive {{title}}", { title: t.title })}><FaArchive aria-hidden="true" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
