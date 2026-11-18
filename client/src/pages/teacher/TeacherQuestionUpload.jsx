import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaCloudUploadAlt, FaFileDownload, FaEye, FaFileExcel } from "react-icons/fa";
import { Button, DataTable, EmptyState } from "../../components/dashboard";
import { MODULES, SUBJECTS, moduleLabel, subjectLabel } from "../../components/dashboard/constants";
import QuestionBatchDetailModal from "../../components/Admin/QuestionBatchDetailModal";
import s from "./teacher.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const STATUS = {
  pending: { cls: s.badgeAttention, word: "Waiting for review" },
  approved: { cls: s.badgeGood, word: "Approved" },
  rejected: { cls: s.badgeAlert, word: "Sent back" },
};

// Spreadsheet upload of questions (TCH-020 classic path): pick a module and a
// subject, fill the template, choose the groups. The school admin reviews them.
export default function TeacherQuestionUpload({ get, post, postForm, token }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`teacher.upload.${k}`, { defaultValue: d, ...o });
  const [module, setModule] = useState("read");
  const [subject, setSubject] = useState("english");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [viewUploadId, setViewUploadId] = useState(null);
  const [fileKey, setFileKey] = useState(0);

  const loadUploads = useCallback(async () => {
    const d = await get("/questions/uploads");
    if (d.success) setUploads(d.batches);
  }, [get]);

  const loadBatches = useCallback(async () => {
    const d = await get("/batches");
    if (d.success) setMyBatches(d.batches);
  }, [get]);

  useEffect(() => {
    (async () => { await Promise.all([loadUploads(), loadBatches()]); })();
  }, [loadUploads, loadBatches]);

  const batchNameById = (id) => myBatches.find((b) => b._id === id)?.name || id;
  const toggleBatch = (id) => setSelectedBatchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/teacher/questions/template?module=${module}&subject=${subject}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("template");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module}-${subject}-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(T("templateError", "Could not download the template. Please try again."));
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError(T("needFile", "Choose the filled-in .xlsx file first.")); return; }
    if (selectedBatchIds.length === 0) { setError(T("needGroup", "Pick at least one group who should see these questions.")); return; }
    setUploading(true);
    setError("");
    setResult(null);
    const formData = new FormData();
    formData.append("module", module);
    formData.append("subject", subject);
    formData.append("file", file);
    formData.append("batchIds", JSON.stringify(selectedBatchIds));
    const d = await postForm("/questions/upload", formData);
    setUploading(false);
    if (!d.success) { setError(d.message || T("failed", "Upload failed")); if (d.rowErrors) setResult(d); return; }
    setResult(d);
    setFile(null);
    setFileKey((k) => k + 1);
    setSelectedBatchIds([]);
    loadUploads();
  };

  const mod = (k) => moduleLabel(t, k);
  const sub = (k) => subjectLabel(t, k);

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{T("title", "Upload questions")}</h1>
          <p>{T("lede", "Add many questions at once from a spreadsheet. Your school admin checks them before students see them.")}</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className={s.uploadSteps}>
        <section className={`${s.card} ${s.step}`} aria-labelledby="up-step1">
          <h2 id="up-step1" className={s.stepTitle}><span className={s.stepNum}>1</span>{T("step1", "What are the questions for?")}</h2>
          <p className={s.fieldLabel}>{T("subject", "Subject")}</p>
          <div className={s.pickRow} role="radiogroup" aria-label={T("subject", "Subject")}>
            {SUBJECTS.map((x) => (
              <button key={x.key} type="button" role="radio" aria-checked={subject === x.key}
                className={`${s.pick} ${subject === x.key ? s.pickOn : ""}`} style={{ "--pc": x.fill }} onClick={() => setSubject(x.key)}>
                <img src={x.art} alt="" width="44" height="44" />
                <span>{sub(x.key)}</span>
              </button>
            ))}
          </div>
          <p className={s.fieldLabel}>{T("module", "Skill")}</p>
          <div className={s.pickRow} role="radiogroup" aria-label={T("module", "Skill")}>
            {MODULES.map((m) => (
              <button key={m.key} type="button" role="radio" aria-checked={module === m.key}
                className={`${s.pick} ${s.pickSmall} ${module === m.key ? s.pickOn : ""}`} style={{ "--pc": m.fill }} onClick={() => setModule(m.key)}>
                <span className={s.pickIcon}><m.Icon aria-hidden="true" /></span>
                <span>{mod(m.key)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={`${s.card} ${s.step}`} aria-labelledby="up-step2">
          <h2 id="up-step2" className={s.stepTitle}><span className={s.stepNum}>2</span>{T("step2", "Fill in the template")}</h2>
          <p className={s.muted}>{T("step2Text", "Each row is one question. The template already has the right columns for {{module}} · {{subject}}.", { module: mod(module), subject: sub(subject) })}</p>
          <Button variant="soft" icon={FaFileDownload} onClick={handleDownloadTemplate} disabled={downloading}>
            {downloading ? T("downloading", "Downloading…") : T("download", "Download the {{module}} · {{subject}} template", { module: mod(module), subject: sub(subject) })}
          </Button>
        </section>

        <section className={`${s.card} ${s.step}`} aria-labelledby="up-step3">
          <h2 id="up-step3" className={s.stepTitle}><span className={s.stepNum}>3</span>{T("step3", "Upload and choose who sees them")}</h2>
          <label className={s.dropZone}>
            <FaFileExcel aria-hidden="true" className={s.dropIcon} />
            <span className={s.dropText}>{file ? file.name : T("chooseFile", "Choose the filled-in .xlsx file")}</span>
            <input key={fileKey} type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <fieldset className={s.groupPick}>
            <legend className={s.fieldLabel}>{T("groups", "Visible to these groups")}</legend>
            {myBatches.length === 0 ? (
              <p className={s.muted}>{T("noGroups", "You have no groups yet. Ask your school admin to add you to one.")}</p>
            ) : (
              <div className={s.chips}>
                {myBatches.map((b) => (
                  <label key={b._id} className={`${s.checkChip} ${selectedBatchIds.includes(b._id) ? s.checkChipOn : ""}`}>
                    <input type="checkbox" checked={selectedBatchIds.includes(b._id)} onChange={() => toggleBatch(b._id)} />
                    {b.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {error && <p className={s.error} role="alert">{error}</p>}
          <div>
            <Button type="submit" variant="cta" icon={FaCloudUploadAlt} disabled={uploading}>
              {uploading ? T("uploading", "Uploading…") : T("upload", "Upload questions")}
            </Button>
          </div>
        </section>
      </form>

      {result && (
        <section className={s.card} role="status">
          <h2 className={s.h2}>{T("resultTitle", "Upload result")}</h2>
          <p>
            {T("resultText", "{{count}} questions sent for review", { count: result.insertedCount || 0, defaultValue_one: "{{count}} question sent for review" })}
            {result.skippedCount ? T("skipped", ", {{count}} rows skipped", { count: result.skippedCount, defaultValue_one: ", {{count}} row skipped" }) : ""}.
          </p>
          {result.rowErrors?.length > 0 && (
            <DataTable
              caption={T("rowErrors", "Rows that need fixing")}
              columns={[
                { key: "row", label: T("row", "Row"), align: "end" },
                { key: "field", label: T("field", "Field") },
                { key: "message", label: T("problem", "Problem") },
              ]}
              rows={result.rowErrors}
              getRowKey={(r) => `${r.row}-${r.field}`}
            />
          )}
        </section>
      )}

      <section className={s.card} aria-labelledby="up-mine">
        <h2 id="up-mine" className={s.h2}>{T("mine", "My uploads")}</h2>
        {uploads.length === 0 ? (
          <EmptyState compact title={T("noneTitle", "No uploads yet")} text={T("none", "Your first spreadsheet of questions will show up here with its review status.")} />
        ) : (
          <DataTable
            columns={[
              { key: "module", label: T("what", "Skill · subject"), render: (r) => `${mod(r.module)} · ${sub(r.subject)}` },
              { key: "batches", label: T("groupsCol", "Groups"), render: (r) => (r.batchIds || []).map(batchNameById).join(", ") || "—" },
              { key: "originalFilename", label: T("file", "File") },
              { key: "rowCount", label: T("rows", "Questions"), align: "end", sortable: true, render: (r) => `${r.rowCount}${r.skippedRowCount ? ` (+${r.skippedRowCount} ${T("skippedShort", "skipped")})` : ""}` },
              { key: "status", label: T("status", "Status"), render: (r) => <span className={`${s.badge} ${STATUS[r.status]?.cls || ""}`}>{T(`st.${r.status}`, STATUS[r.status]?.word || r.status)}</span> },
              { key: "createdAt", label: T("when", "Uploaded"), sortable: true, sortValue: (r) => new Date(r.createdAt).getTime(), render: (r) => new Date(r.createdAt).toLocaleDateString() },
              { key: "open", label: T("open", "Open"), header: <span className="d-sr-only">{T("open", "Open")}</span>, render: (r) => <Button size="sm" variant="ghost" icon={FaEye} onClick={(e) => { e.stopPropagation(); setViewUploadId(r._id); }}>{T("view", "View")}</Button> },
            ]}
            rows={uploads}
            getRowKey={(r) => r._id}
            defaultSort={{ key: "createdAt", dir: "desc" }}
          />
        )}
      </section>

      {viewUploadId && (
        <QuestionBatchDetailModal batchId={viewUploadId} get={get} post={post} onClose={() => setViewUploadId(null)} />
      )}
    </>
  );
}
