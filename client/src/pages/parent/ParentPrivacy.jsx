import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Skeleton, EmptyState, fmtDate, fmtNumber, SubTabs, SubPanel, usePane, Sheet } from "../../components/dashboard";
import { useLoad } from "./parentApi";
import s from "./parent.module.css";

const ACTION = {
  created_child_account: "Child account created", guardian_consent: "Guardian consent given", link_verified: "Link confirmed",
  co_guardian_linked: "Co-guardian joined", link_revoked: "Link removed",
};

// Privacy centre (PAR-090, FND-070, FND-071) in three sub-tabs: what we keep and who sees it,
// the consent history, and your rights (download, delete, stop following).
export default function ParentPrivacy({ api, child, onChanged }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.priv.${k}`, { defaultValue: d, ...o });
  const [pane, setPane] = usePane(["data", "access", "consent", "rights"]);
  const pv = useLoad(api.get, `/children/${child._id}/privacy`);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [askDelete, setAskDelete] = useState(false);
  const d = pv.data;
  const first = child.name.split(" ")[0];
  const openDelete = d?.requests?.find((r) => r.kind === "delete" && ["pending", "processing"].includes(r.status));

  const exportAll = async () => {
    setBusy(true); setMsg(null);
    const ok = await api.download(`/children/${child._id}/export`, "learnigo-data.json");
    setBusy(false);
    setMsg(ok ? { ok: true, text: T("exported", "Downloaded. The file contains everything we hold about {{name}}.", { name: first }) } : { ok: false, text: T("exportFail", "The download didn't work. Please try again.") });
    pv.reload();
  };
  const requestDelete = async (e) => {
    e.preventDefault();
    const r = await api.post(`/children/${child._id}/delete-request`, { confirm, reason });
    setMsg(r.success ? { ok: true, text: T("requested", "Request received. {{name}}'s account will be deleted after 30 days. You can cancel until then.", { name: first }) } : { ok: false, text: r.message });
    if (r.success) { setAskDelete(false); setConfirm(""); pv.reload(); }
  };
  const cancelDelete = async () => {
    const r = await api.del(`/children/${child._id}/delete-request/${openDelete.id}`);
    setMsg(r.success ? { ok: true, text: T("cancelled", "Cancelled. Nothing will be deleted.") } : { ok: false, text: r.message });
    pv.reload();
  };
  const revoke = async () => {
    if (!window.confirm(T("revokeConfirm", "Stop following {{name}}? You will no longer see their learning.", { name: first }))) return;
    const r = await api.post(`/children/${child._id}/revoke`);
    setMsg(r.success ? { ok: true, text: T("revoked", "Your link was removed.") } : { ok: false, text: r.message });
    if (r.success) onChanged?.();
  };

  if (pv.loading && !d) return <><Skeleton variant="rect" height={120} /><Skeleton variant="rect" height={220} /></>;
  if (pv.error) return <div className={s.card}><EmptyState tone="error" title={T("error", "Couldn't load the privacy centre")} text={pv.error} actionLabel={T("retry", "Try again")} onAction={pv.reload} /></div>;

  return (
    <>
      <div className={s.pageHead}><div><h1>{T("title", "Privacy centre")}</h1><p>{T("sub", "What we keep about {{name}}, who can see it, and your rights.", { name: first })}</p></div></div>
      {msg && <p className={msg.ok ? s.notice : s.warn} role="status">{msg.text}</p>}
      <SubTabs label={T("tabs", "Privacy centre")} value={pane} onChange={setPane}
        tabs={[
          { id: "data", label: T("tab.data", "What we keep"), short: T("tab.dataShort", "Data") },
          { id: "access", label: T("tab.access", "Who can see it"), short: T("tab.accessShort", "Access") },
          { id: "consent", label: T("tab.consent", "Consent history"), short: T("tab.consentShort", "Consent") },
          { id: "rights", label: T("tab.rights", "Your rights"), short: T("tab.rightsShort", "Rights") },
        ]} />

      <SubPanel id="data" value={pane}>
        <section className={s.card} aria-labelledby="pv-store">
          <div className={s.cardHead}><h2 id="pv-store">{T("store", "What we store")}</h2></div>
          <ul className={s.list}>
            {d.stored.map((x) => (
              <li key={x.key}><span><strong>{T(`st.${x.key}`, x.label)}</strong><br /><span className={`${s.muted} ${s.small}`}>{T(`st.${x.key}D`, x.detail)}</span></span><span className={s.pill}>{fmtNumber(x.count)}</span></li>
            ))}
          </ul>
          <h3 style={{ fontSize: "1rem", margin: "14px 0 6px" }}>{T("never", "What we never store")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>{d.notStored.map((x, i) => <li key={i}>{T(`ns.${i}`, x)}</li>)}</ul>
        </section>
      </SubPanel>

      <SubPanel id="access" value={pane}>
        <section className={s.card} aria-labelledby="pv-who">
          <div className={s.cardHead}><h2 id="pv-who">{T("who", "Who can see {{name}}'s learning", { name: first })}</h2></div>
          <ul className={s.list}>
            {d.whoCanSee.map((w, i) => (
              <li key={i}>
                <span><span aria-hidden="true">{w.kind === "guardian" ? "👪 " : w.kind === "school" ? "🏫 " : "🧑‍🏫 "}</span>
                  {w.name}{w.you ? ` (${T("you", "you")})` : ""}{w.subject ? ` · ${w.subject}` : ""}{w.group ? ` · ${w.group}` : ""}
                  <br /><span className={`${s.muted} ${s.small}`}>{w.kind === "guardian" ? T("guardian", "Guardian") : w.kind === "school" ? T("school", "School") : T("teacher", "Teacher")}{w.since ? ` · ${T("since", "since {{d}}", { d: fmtDate(String(w.since).slice(0, 10), { style: "short" }) })}` : ""}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={`${s.muted} ${s.small}`}>{T("whoNote", "Schools and teachers see learning done for them. Parents see everything their own child does. Nobody else can.")}</p>
          {d.schoolLinked && <p className={`${s.muted} ${s.small}`}>{T("schoolNote", "To end a school's access, contact the school: they created or confirmed this link.")}</p>}
        </section>
      </SubPanel>

      <SubPanel id="consent" value={pane}>
        <section className={s.card} aria-labelledby="pv-consent">
          <div className={s.cardHead}><h2 id="pv-consent">{T("consent", "Consent history")}</h2></div>
          {d.consentHistory.length ? (
            <ul className={s.list}>
              {d.consentHistory.map((c, i) => (
                <li key={i}><span>{T(`ca.${c.action}`, ACTION[c.action] || c.action)}{c.note ? ` · ${c.note}` : ""}<br /><span className={`${s.muted} ${s.small}`}>{c.guardian || c.by}{c.version ? ` · ${T("policy", "policy {{v}}", { v: c.version })}` : ""}</span></span>
                  <time className={`${s.muted} ${s.small}`} dateTime={c.at}>{fmtDate(String(c.at).slice(0, 10), { style: "short" })}</time></li>
              ))}
            </ul>
          ) : <p className={s.muted}>{T("noConsent", "No records yet.")}</p>}
        </section>
      </SubPanel>

      <SubPanel id="rights" value={pane}>
        <div className={s.grid2}>
          <section className={s.card} aria-labelledby="pv-export">
            <div className={s.cardHead}><h2 id="pv-export">{T("exportT", "Download all data")}</h2></div>
            <p className={s.muted} style={{ marginTop: 0 }}>{T("exportD", "A complete copy of everything we hold about {{name}}, as a JSON file you can keep or give to another service.", { name: first })}</p>
            <Button onClick={exportAll} disabled={busy}>{busy ? T("preparing", "Preparing…") : T("export", "Download data")}</Button>
          </section>

          <section className={`${s.card} ${s.danger}`} aria-labelledby="pv-delete">
            <div className={s.cardHead}><h2 id="pv-delete">{T("deleteT", "Delete {{name}}'s account", { name: first })}</h2></div>
            {openDelete ? (
              <>
                <p className={s.warn}>{openDelete.status === "processing"
                  ? T("processing", "Approved. Everything will be erased on {{d}}.", { d: fmtDate(String(openDelete.dueAt).slice(0, 10), { style: "long" }) })
                  : T("pending", "Deletion requested. It happens on {{d}} unless you cancel.", { d: fmtDate(String(openDelete.dueAt).slice(0, 10), { style: "long" }) })}</p>
                {openDelete.status === "pending" && <Button variant="soft" onClick={cancelDelete}>{T("cancel", "Cancel the deletion")}</Button>}
              </>
            ) : !d.youArePrimary ? (
              <p className={s.muted}>{T("onlyMain", "Only the main guardian can ask to delete the account. You can remove your own link below.")}</p>
            ) : (
              <>
                <p className={s.muted} style={{ marginTop: 0 }}>{T("deleteD", "Erase the account and all learning data. You have 30 days to change your mind.")}</p>
                <button type="button" className={s.dangerBtn} onClick={() => setAskDelete(true)}>{T("deleteBtn", "Delete the account…")}</button>
              </>
            )}
            {!(d.managed && d.youArePrimary) && (
              <div style={{ marginTop: 16 }}>
                <Button variant="ghost" size="sm" onClick={revoke}>{T("revoke", "Stop following {{name}}", { name: first })}</Button>
              </div>
            )}
          </section>
        </div>
      </SubPanel>

      {askDelete && !openDelete && d.youArePrimary && (
        <Sheet size="sm" title={T("deleteT", "Delete {{name}}'s account", { name: first })} onClose={() => setAskDelete(false)}>
          <form onSubmit={requestDelete} className={s.stack}>
            <p style={{ margin: 0 }}>{T("deleteWarn", "All of {{name}}'s learning, badges and settings will be erased after a 30-day grace period. This can't be undone afterwards.", { name: first })}</p>
            {d.schoolLinked && <p className={s.warn}>{T("deleteSchool", "{{name}} is also linked to a school, so the school will be asked to confirm.", { name: first })}</p>}
            <label className={s.field}>{T("why", "Why are you leaving? (optional)")}<input className={s.input} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></label>
            <label className={s.field}>{T("type", "Type {{name}} to confirm", { name: child.name })}<input className={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" data-autofocus /></label>
            {msg && !msg.ok && <p className={s.warn} role="alert">{msg.text}</p>}
            <div className={s.row}>
              <button type="submit" className={s.dangerBtn} disabled={confirm.trim().toLowerCase() !== child.name.trim().toLowerCase()}>{T("confirmDelete", "Request deletion")}</button>
              <Button type="button" variant="ghost" onClick={() => setAskDelete(false)}>{T("keep", "Keep the account")}</Button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
