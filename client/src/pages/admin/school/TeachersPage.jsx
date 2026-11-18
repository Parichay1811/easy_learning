// ADM-041 Teacher overview: support, not ranking. Sorted by name, with class size and
// starting level for context. ADM-024: hand a teacher's groups to someone else.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaExchangeAlt } from "react-icons/fa";
import { Button, TimeRangeBar, DataTable, Skeleton, InfoTip, fmtDuration, fmtDate, NO_DATA } from "../../../components/dashboard";
import { api, useLoad } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { useSchool } from "./context";
import { Health, Dialog, Field, Result } from "./bits";
import s from "./school.module.css";

function TransferDialog({ from, teachers, onClose, onDone }) {
  const { t } = useTranslation();
  const [to, setTo] = useState("");
  const [result, setResult] = useState(null);
  const go = async () => {
    try { const r = await api.post(`/tutors/${from.id}/transfer`, { toTutorId: to }); onDone(t("school.teachers.transferred", { defaultValue: "{{n}} groups handed over.", n: r.moved })); onClose(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <Dialog title={t("school.teachers.transferTitle", { defaultValue: "Hand over {{name}}'s groups", name: from.name })} onClose={onClose}>
      <p className={s.cardSub}>{from.groups.map((g) => g.name).join(", ") || t("school.none", { defaultValue: "None yet" })}</p>
      <Field id="tr-to" label={t("school.teachers.to", { defaultValue: "New teacher" })}>
        <select id="tr-to" className={s.select} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">{t("school.choose", { defaultValue: "Choose…" })}</option>
          {teachers.filter((x) => x.id !== from.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </Field>
      <Result result={result} />
      <div className={s.actions}>
        <Button disabled={!to} onClick={go}>{t("school.teachers.handOver", { defaultValue: "Hand over" })}</Button>
        <Button variant="ghost" onClick={onClose}>{t("school.cancel", { defaultValue: "Cancel" })}</Button>
      </div>
    </Dialog>
  );
}

export default function TeachersPage() {
  const { t } = useTranslation();
  const { can } = useSchool();
  const { tr, query } = useSchoolRange({ defaultRange: "month" });
  const data = useLoad(`/school/teachers${query}`);
  const [moving, setMoving] = useState(null);
  const [result, setResult] = useState(null);
  const rows = data.data?.teachers || [];
  const pts = (v) => (v == null ? NO_DATA : `${v > 0 ? "▲ +" : v < 0 ? "▼ " : ""}${v} pts`);
  const columns = [
    { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true, render: (r) => <><div className={s.strong}>{r.name}</div><div className={`${s.small} ${s.muted}`}>{r.groups.map((g) => g.name).join(", ") || t("school.teachers.noGroups", { defaultValue: "No groups yet" })}</div></> },
    { key: "students", label: t("school.teachers.students", { defaultValue: "Students" }), align: "end", sortable: true },
    { key: "engagement", label: t("school.engagement", { defaultValue: "Engagement" }), sortable: true, sortValue: (r) => r.engagement ?? -1, render: (r) => <Health value={r.engagement} /> },
    { key: "minutesPerStudent", label: t("school.teachers.minutes", { defaultValue: "Min / student" }), align: "end", sortable: true, render: (r) => (r.minutesPerStudent != null ? fmtDuration(r.minutesPerStudent) : NO_DATA) },
    { key: "startingAccuracy", label: t("school.teachers.start", { defaultValue: "Starting level" }), align: "end", render: (r) => (r.startingAccuracy != null ? `${r.startingAccuracy} %` : NO_DATA) },
    { key: "growth", label: t("school.teachers.growth", { defaultValue: "Class growth" }), align: "end", sortable: true, sortValue: (r) => r.growth ?? -999, render: (r) => pts(r.growth) },
    { key: "questions", label: t("school.teachers.questions", { defaultValue: "Questions (approved)" }), align: "end", render: (r) => (r.questions ? `${r.questions}${r.approvalRate != null ? ` (${r.approvalRate} %)` : ""}` : "0") },
    { key: "tests", label: t("school.teachers.tests", { defaultValue: "Tests" }), align: "end", render: (r) => (r.testsAvailable ? r.tests : <span title={t("school.teachers.testsSoon", { defaultValue: "Tests arrive with the Tests module" })}>0</span>) },
    { key: "lastActive", label: t("school.teachers.last", { defaultValue: "Last active" }), sortable: true, render: (r) => (r.lastActive ? fmtDate(r.lastActive.slice(0, 10)) : r.signedIn ? NO_DATA : t("school.teachers.never", { defaultValue: "Never signed in" })) },
    ...(can("people.write") ? [{ key: "act", label: "", render: (r) => r.groups.length > 0 && <button type="button" className={s.iconBtn} onClick={() => setMoving(r)} aria-label={t("school.teachers.transferX", { defaultValue: "Hand over {{name}}'s groups", name: r.name })} title={t("school.teachers.transfer", { defaultValue: "Hand over groups" })}><FaExchangeAlt /></button> }] : []),
  ];
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.teachers.title", { defaultValue: "Teachers" })}</h1>
          <p className={s.sub}>{t("school.teachers.sub", { defaultValue: "Where can we help? Each class is compared with itself, not with other classes." })}</p>
        </div>
        <InfoTip>{data.data?.note || ""}</InfoTip>
      </div>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} />
      <Result result={result} />
      {data.loading ? <Skeleton variant="chart" /> : data.error ? <p className={s.errorText}>{data.error.message}</p> : (
        <DataTable caption={t("school.teachers.caption", { defaultValue: "{{n}} teachers, sorted by name", n: rows.length })} columns={columns} rows={rows} getRowKey={(r) => r.id} defaultSort={{ key: "name", dir: "asc" }} />
      )}
      <p className={`${s.small} ${s.muted}`}>{t("school.teachers.columnsNote", { defaultValue: "Marking turnaround and parent reply time appear once tests and messaging are in use." })}</p>
      {moving && <TransferDialog from={moving} teachers={rows} onClose={() => setMoving(null)} onDone={(text) => { setResult({ ok: true, text }); data.reload(); }} />}
    </div>
  );
}
