// ADM-020 Bulk import: upload -> map columns -> dry run -> import. Re-importing
// the same file updates people instead of duplicating them.
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload, FaDownload } from "react-icons/fa";
import { Button, DataTable } from "../../../components/dashboard";
import { api } from "./api";
import { Field, Result } from "./bits";
import s from "./school.module.css";

const STEPS = ["upload", "map", "check", "done"];

export default function ImportWizard() {
  const { t } = useTranslation();
  const [kind, setKind] = useState("students");
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null); // upload response
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const input = useRef(null);
  const stepLabel = { upload: t("school.import.s1", { defaultValue: "1 Upload" }), map: t("school.import.s2", { defaultValue: "2 Match columns" }), check: t("school.import.s3", { defaultValue: "3 Check (dry run)" }), done: t("school.import.s4", { defaultValue: "4 Imported" }) };

  const send = async (f) => {
    if (!f) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData(); fd.append("kind", kind); fd.append("file", f);
      const r = await api.upload("/import/upload", fd);
      setFile(r); setMapping(r.mapping); setStep("map");
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const check = async () => {
    setBusy(true); setError(null);
    try { setPreview(await api.post(`/import/${file.importId}/preview`, { kind, mapping })); setStep("check"); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const commit = async () => {
    setBusy(true); setError(null);
    try { setDone(await api.post(`/import/${file.importId}/commit`, { kind, mapping })); setStep("done"); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const reset = () => { setStep("upload"); setFile(null); setPreview(null); setDone(null); setError(null); };
  const fields = file?.fields?.[kind] || [];
  const sampleOf = (i) => (file?.sample || []).map((r) => r[i]).filter(Boolean).slice(0, 3).join(" · ");
  const idx = STEPS.indexOf(step);

  return (
    <div className={s.page}>
      <ol className={s.steps} aria-label={t("school.import.progress", { defaultValue: "Import steps" })}>
        {STEPS.map((k, i) => <li key={k} className={`${s.step} ${i === idx ? s.stepOn : i < idx ? s.stepDone : ""}`} aria-current={i === idx ? "step" : undefined}>{stepLabel[k]}</li>)}
      </ol>
      {error && <p role="alert" className={s.errorText}>{error}</p>}

      {step === "upload" && (
        <section className={s.card}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={s.label}>{t("school.import.what", { defaultValue: "What are you importing?" })}</legend>
            <div className={s.row}>
              {["students", "teachers"].map((k) => (
                <label key={k} className={s.check}><input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} /><span>{k === "students" ? t("school.import.students", { defaultValue: "Students (with parent emails)" }) : t("school.import.teachers", { defaultValue: "Teachers" })}</span></label>
              ))}
            </div>
          </fieldset>
          <div className={`${s.drop} ${dragOver ? s.dropActive : ""}`} style={{ marginTop: 12 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); send(e.dataTransfer.files?.[0]); }}>
            <FaFileUpload size={34} aria-hidden="true" />
            <p className={s.strong}>{t("school.import.drop", { defaultValue: "Drop a .csv or .xlsx file here" })}</p>
            <p className={s.muted}>{t("school.import.limits", { defaultValue: "Up to 5,000 rows and 5 MB. The first row must be the column names." })}</p>
            <input ref={input} type="file" accept=".csv,.xlsx" className="d-sr-only" id="imp-file" onChange={(e) => send(e.target.files?.[0])} />
            <div className={s.actions} style={{ justifyContent: "center" }}>
              <Button disabled={busy} onClick={() => input.current?.click()}>{busy ? t("school.import.reading", { defaultValue: "Reading…" }) : t("school.import.choose", { defaultValue: "Choose a file" })}</Button>
              <Button variant="ghost" icon={FaDownload} onClick={() => api.download(`/import/template?kind=${kind}`, `learnigo-${kind}-template.csv`)}>{t("school.import.template", { defaultValue: "Download a template" })}</Button>
            </div>
          </div>
        </section>
      )}

      {step === "map" && file && (
        <section className={s.card} aria-labelledby="map-h">
          <h2 id="map-h" className={s.cardTitle}>{t("school.import.mapTitle", { defaultValue: "Which column holds what?" })}</h2>
          <p className={s.cardSub}>{t("school.import.mapSub", { defaultValue: "{{f}}: {{n}} rows. We guessed what we could; check the ones marked required.", f: file.filename, n: file.rowCount })}</p>
          <div className={s.formGrid}>
            {fields.map((fd) => (
              <Field key={fd.key} id={`map-${fd.key}`} label={`${fd.label}${fd.required ? " *" : ""}`} hint={mapping[fd.key] != null ? sampleOf(mapping[fd.key]) : t("school.import.notMapped", { defaultValue: "Not in this file" })}>
                <select id={`map-${fd.key}`} className={s.select} value={mapping[fd.key] ?? ""} aria-describedby={`map-${fd.key}-hint`}
                  onChange={(e) => setMapping((m) => { const n = { ...m }; if (e.target.value === "") delete n[fd.key]; else n[fd.key] = Number(e.target.value); return n; })}>
                  <option value="">{t("school.import.skip", { defaultValue: "— not in file —" })}</option>
                  {file.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div className={s.actions}>
            <Button disabled={busy} onClick={check}>{t("school.import.dryRun", { defaultValue: "Check the file (nothing is saved yet)" })}</Button>
            <Button variant="ghost" onClick={reset}>{t("school.import.restart", { defaultValue: "Start again" })}</Button>
          </div>
        </section>
      )}

      {step === "check" && preview && (
        <section className={s.card} aria-labelledby="chk-h">
          <h2 id="chk-h" className={s.cardTitle}>{t("school.import.checkTitle", { defaultValue: "Dry run: here's what would happen" })}</h2>
          <div className={s.row} style={{ marginBottom: 12 }}>
            <span className={`${s.pill} ${s.pillGood}`}>{t("school.import.create", { defaultValue: "{{n}} new", n: preview.summary.create })}</span>
            <span className={s.pill}>{t("school.import.update", { defaultValue: "{{n}} updated", n: preview.summary.update })}</span>
            <span className={`${s.pill} ${preview.summary.skip ? s.pillAlert : ""}`}>{t("school.import.skipN", { defaultValue: "{{n}} skipped (errors)", n: preview.summary.skip })}</span>
            <span className={`${s.pill} ${preview.summary.warnings ? s.pillAttention : ""}`}>{t("school.import.warnN", { defaultValue: "{{n}} with warnings", n: preview.summary.warnings })}</span>
            {kind === "students" && <span className={s.pill}>{t("school.import.parentsN", { defaultValue: "{{n}} parent emails", n: preview.summary.parents })}</span>}
          </div>
          {preview.seatProblem && <div className={`${s.banner} ${s.alert}`}><p>{preview.seatProblem.message}</p></div>}
          {preview.newUnits?.length > 0 && <p className={s.small}>{t("school.import.newUnits", { defaultValue: "New classes will be created: {{list}}", list: preview.newUnits.join(", ") })}</p>}
          <DataTable
            caption={t("school.import.rowsCaption", { defaultValue: "Rows with problems first" })}
            rows={preview.rows.slice(0, 300)} getRowKey={(r) => r.row}
            columns={[
              { key: "row", label: t("school.import.row", { defaultValue: "Row" }), align: "end" },
              { key: "name", label: t("school.people.name", { defaultValue: "Name" }), render: (r) => r.values.name || "—" },
              { key: "email", label: t("school.invites.email", { defaultValue: "Email" }), render: (r) => r.values.email || "—" },
              ...(kind === "students" ? [{ key: "cls", label: t("school.people.class", { defaultValue: "Class" }), render: (r) => [r.values.grade, r.values.section].filter(Boolean).join(" › ") || "—" }] : []),
              { key: "action", label: t("school.import.action", { defaultValue: "Will" }), render: (r) => <span className={`${s.pill} ${r.action === "skip" ? s.pillAlert : r.action === "create" ? s.pillGood : ""}`}>{t(`school.import.act.${r.action}`, { defaultValue: { create: "Add", update: "Update", skip: "Skip" }[r.action] })}</span> },
              { key: "notes", label: t("school.import.notes", { defaultValue: "Notes" }), render: (r) => [...r.errors.map((x) => `✖ ${x}`), ...r.warnings.map((x) => `⚠ ${x}`)].join(" · ") || "—" },
            ]}
          />
          <div className={s.actions}>
            <Button disabled={busy || Boolean(preview.seatProblem) || !(preview.summary.create + preview.summary.update)} onClick={commit}>
              {t("school.import.go", { defaultValue: "Import {{n}} people", n: preview.summary.create + preview.summary.update })}
            </Button>
            <Button variant="ghost" onClick={() => setStep("map")}>{t("school.import.back", { defaultValue: "Change the columns" })}</Button>
          </div>
        </section>
      )}

      {step === "done" && done && (
        <section className={s.card}>
          <h2 className={s.cardTitle}>{t("school.import.doneTitle", { defaultValue: "Imported" })}</h2>
          <Result result={{ ok: true, text: kind === "students"
            ? t("school.import.doneStudents", { defaultValue: "{{c}} added, {{u}} updated, {{s}} skipped. {{p}} parents added.", c: done.result.created, u: done.result.updated, s: done.result.skipped, p: done.result.parentsCreated })
            : t("school.import.doneTeachers", { defaultValue: "{{c}} added, {{u}} updated, {{s}} skipped.", c: done.result.created, u: done.result.updated, s: done.result.skipped }) }} />
          {done.result.errors?.length > 0 && <p className={s.errorText}>{done.result.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join(" · ")}</p>}
          {done.result.unknownUnits?.length > 0 && <p className={s.small}>{t("school.import.unknownUnits", { defaultValue: "Units we couldn't find: {{list}}", list: done.result.unknownUnits.map((u) => u.unit).join(", ") })}</p>}
          <div className={s.actions}>
            {kind === "students" && <Button to="/admin-school/people/parents">{t("school.import.nextInvite", { defaultValue: "Next: invite parents" })}</Button>}
            <Button variant="ghost" onClick={reset}>{t("school.import.another", { defaultValue: "Import another file" })}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
