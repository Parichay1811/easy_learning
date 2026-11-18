// Feature flags and module switches (SUP-042). Modules can be switched on or
// off for the whole platform or a plan (one org: on its page); new features roll
// out by percentage. Every change asks why and is audited.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, ago } from "./api";
import { Field, Loadable, Modal, Panel, Pill, ReasonDialog } from "./ui";
import s from "./console.module.css";

const STATES = ["default", "on", "off"];

function Editor({ flag, modules, plans, onClose, onSaved }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const [f, setF] = useState({ key: flag?.key || "", kind: flag?.kind || "module", description: flag?.description || "", platform: flag?.platform || "default", plans: { ...(flag?.plans || {}) }, orgs: Object.entries(flag?.orgs || {}).map(([k, v]) => `${k}=${v}`).join("\n"), rollout: flag?.rollout ?? 0 });
  const [asking, setAsking] = useState(false);
  const save = async (reason) => {
    const orgs = {};
    for (const line of f.orgs.split(/\n|,/).map((x) => x.trim()).filter(Boolean)) { const [k, v] = line.split("="); orgs[k.trim()] = (v || "on").trim(); }
    const plansOut = Object.fromEntries(plans.map((p) => [p, f.plans[p] || "default"]));
    await api.put(`/ops/flags/${encodeURIComponent(f.key)}`, { kind: f.kind, description: f.description, platform: f.platform, plans: plansOut, ...(f.kind === "feature" ? { rollout: Number(f.rollout), orgs } : {}), reason });
    onSaved(); onClose();
  };
  return (
    <Modal wide title={flag ? t("sa.fl.edit", "Edit {{k}}", { k: flag.key }) : t("sa.fl.new", "New flag")} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button><Button onClick={() => setAsking(true)} disabled={!f.key}>{t("sa.save", "Save changes")}</Button></>}>
      {!flag && (
        <div className={s.grid2}>
          <Field label={t("sa.fl.kind", "Kind")}><select className={s.select} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, key: "" })}><option value="module">{t("sa.fl.module", "Plan module switch")}</option><option value="feature">{t("sa.fl.feature", "New feature (rollout)")}</option></select></Field>
          <Field label={t("sa.fl.key", "Key")}>
            {f.kind === "module" ? <select className={s.select} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })}><option value="">—</option>{Object.entries(modules).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}</select>
              : <input className={s.input} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value.toLowerCase() })} placeholder="new-report-pdf" />}
          </Field>
        </div>
      )}
      <Field label={t("sa.fl.desc", "Description")}><input className={s.input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label={t("sa.fl.platform", "Whole platform")} hint={f.kind === "module" ? t("sa.fl.killHint", "Off is a kill switch: it wins over plans and org overrides.") : ""}>
        <select className={s.select} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}>{STATES.map((x) => <option key={x} value={x}>{t(`sa.fl.s.${x}`, { default: "As plans say", on: "On for everyone", off: "Off for everyone" }[x])}</option>)}</select>
      </Field>
      <fieldset className={s.panel} style={{ boxShadow: "none", background: "var(--d-card-alt)", border: 0 }}>
        <legend className={s.label}>{t("sa.fl.perPlan", "Per plan")}</legend>
        <div className={s.grid3}>{plans.map((p) => (
          <Field key={p} label={p}><select className={s.select} value={f.plans[p] || "default"} onChange={(e) => setF({ ...f, plans: { ...f.plans, [p]: e.target.value } })}>{STATES.map((x) => <option key={x} value={x}>{t(`sa.fl.p.${x}`, { default: "No rule", on: "On", off: "Off" }[x])}</option>)}</select></Field>
        ))}</div>
      </fieldset>
      {f.kind === "feature" && (
        <div className={s.grid2}>
          <Field label={t("sa.fl.rollout", "Rollout: {{n}} % of organisations", { n: f.rollout })}><input type="range" min={0} max={100} step={5} value={f.rollout} onChange={(e) => setF({ ...f, rollout: e.target.value })} /></Field>
          <Field label={t("sa.fl.orgs", "Per organisation (one per line: orgId=on|off)")}><textarea className={s.textarea} rows={3} value={f.orgs} onChange={(e) => setF({ ...f, orgs: e.target.value })} /></Field>
        </div>
      )}
      {asking && <ReasonDialog title={t("sa.fl.why", "Why this change?")} onClose={() => setAsking(false)} onConfirm={save} />}
    </Modal>
  );
}

export default function Flags({ role }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const list = useLoad("/ops/flags");
  const [plan, setPlan] = useState("institute");
  const preview = useLoad(`/ops/flags/preview?plan=${plan}`);
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const canEdit = ["owner", "engineer"].includes(role);
  const L = list.data;
  return (
    <>
      <Panel title={t("sa.fl.title", "Feature flags")} sub={t("sa.fl.sub", "Precedence: plan → plan rule → platform on → organisation override → platform off (kill switch).")} actions={canEdit && <Button size="sm" onClick={() => setEditing({})}>{t("sa.fl.new", "New flag")}</Button>}>
        <Loadable state={list} empty={L && !L.flags.length ? { title: t("sa.fl.none", "No flags yet."), text: t("sa.fl.noneText", "Every module follows the plans.") } : null}>
          {L && <DataTable caption={t("sa.fl.title", "Feature flags")} rows={L.flags} getRowKey={(f) => f.key} onRowClick={canEdit ? (f) => setEditing(f) : undefined} columns={[
            { key: "key", label: t("sa.fl.key", "Key"), render: (f) => <span><span className={`${s.strong} ${s.mono}`}>{f.key}</span><br /><span className={`${s.small} ${s.muted}`}>{f.description || L.modules[f.key] || ""}</span></span> },
            { key: "kind", label: t("sa.fl.kind", "Kind"), render: (f) => <Pill tone={f.kind === "module" ? "accent" : "neutral"}>{f.kind}</Pill> },
            { key: "platform", label: t("sa.fl.platform", "Whole platform"), render: (f) => <Pill tone={f.platform === "off" ? "alert" : f.platform === "on" ? "good" : "neutral"}>{f.platform}</Pill> },
            { key: "plans", label: t("sa.fl.perPlan", "Per plan"), render: (f) => Object.entries(f.plans || {}).map(([p, v]) => `${p}: ${v}`).join(", ") || "—" },
            { key: "rollout", label: t("sa.fl.roll", "Rollout"), align: "end", render: (f) => (f.kind === "feature" ? `${f.rollout} %` : "—") },
            { key: "updatedAt", label: t("sa.fl.changed", "Changed"), render: (f) => `${ago(f.updatedAt)} · ${f.updatedBy}` },
            ...(canEdit ? [{ key: "x", label: "", render: (f) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDel(f); }}>{t("sa.delete", "Delete")}</Button> }] : []),
          ]} />}
        </Loadable>
      </Panel>
      <Panel title={t("sa.fl.preview", "Who gets what")} sub={t("sa.fl.previewSub", "Effective modules for a plan right now, and why. For one organisation, open it in Organisations.")} actions={
        <select className={s.select} aria-label={t("sa.col.plan", "Plan")} value={plan} onChange={(e) => setPlan(e.target.value)}>{(L?.plans || ["institute"]).map((p) => <option key={p}>{p}</option>)}</select>
      }>
        <Loadable state={preview}>
          {preview.data && <DataTable caption={t("sa.fl.preview", "Who gets what")} rows={Object.entries(preview.data.allModules).map(([k, v]) => ({ k, v, on: preview.data.modules.includes(k), why: preview.data.why[k] }))} getRowKey={(r) => r.k} columns={[
            { key: "v", label: t("sa.col.module", "Module"), render: (r) => <span>{r.v} <span className={`${s.mono} ${s.muted}`}>{r.k}</span></span> },
            { key: "on", label: t("sa.col.now", "Now"), render: (r) => (r.on ? <Pill tone="good">{t("sa.on", "On")}</Pill> : <Pill>{t("sa.off", "Off")}</Pill>) },
            { key: "why", label: t("sa.col.why", "Why"), render: (r) => r.why || "—" },
          ]} />}
        </Loadable>
      </Panel>
      {editing && L && <Editor flag={editing.key ? editing : null} modules={L.modules} plans={L.plans} onClose={() => setEditing(null)} onSaved={() => { list.reload(); preview.reload(); }} />}
      {del && <ReasonDialog danger title={t("sa.fl.delete", "Delete {{k}}", { k: del.key })} onClose={() => setDel(null)} onConfirm={async () => { await api.del(`/ops/flags/${encodeURIComponent(del.key)}`); list.reload(); preview.reload(); }} />}
    </>
  );
}
