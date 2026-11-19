// Unified support inbox (SUP-060): contact messages, admin chats and parent
// chats in one list, with assignment, status, tags, canned replies and
// internal notes, linking to the person or organisation.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, ago, dateTime } from "./api";
import { Field, Loadable, Notice, Panel, Pill, Segmented, StatusPill } from "./ui";
import s from "./console.module.css";

const KIND = { contact: "Contact form", admin_chat: "Admin chat", parent_chat: "Parent chat" };

function Thread({ kind, refId, go, onChanged, canned }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const th = useLoad(`/support/threads/${kind}/${encodeURIComponent(refId)}`);
  const [reply, setReply] = useState("");
  const [resolve, setResolve] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [msg, setMsg] = useState({ tone: "good", text: "" });
  const T = th.data;
  const run = async (fn, ok) => { try { await fn(); setMsg({ tone: "good", text: ok }); th.reload({ quiet: true }); onChanged(); } catch (e) { setMsg({ tone: "alert", text: e.message }); } };
  return (
    <Loadable state={th}>
      {T && (
        <div className={s.stack}>
          <div className={s.row}>
            <h3 style={{ margin: 0 }}>{T.head.title}</h3>
            <Pill>{t(`sa.sup.kind.${kind}`, KIND[kind])}</Pill>
            <StatusPill status={T.meta.status} />
            <span className={s.spacer} />
            {T.links.org && <button type="button" className={s.linkBtn} onClick={() => go("orgs", { org: T.links.org.id })}>{T.links.org.name}</button>}
            {T.links.person && <button type="button" className={s.linkBtn} onClick={() => go("people", { q: T.head.email || T.links.person.name, person: `${T.links.person.role}:${T.links.person.id}` })}>{T.links.person.name}</button>}
          </div>
          <p className={`${s.small} ${s.muted}`}>{[T.head.who, T.head.email, T.head.role, T.head.orgName].filter(Boolean).join(" · ")}{T.head.attachmentUrl && <> · <a href={T.head.attachmentUrl} target="_blank" rel="noreferrer">{t("sa.sup.attachment", "attachment")}</a></>}</p>
          <Notice tone={msg.tone} onClose={() => setMsg({ text: "" })}>{msg.text}</Notice>
          <div className={s.messages} aria-label={t("sa.sup.messages", "Messages")} role="log">
            {T.messages.map((m, i) => <div key={i} className={`${s.msg} ${m.from === "superadmin" ? s.msgMine : ""}`}>{m.text}<span className={s.msgMeta}>{m.from === "superadmin" ? t("sa.sup.us", "Learnigo") : m.from} · {dateTime(m.at)}</span></div>)}
          </div>
          <div className={s.row}>
            <Field label={t("sa.sup.status", "Status")}>
              <select className={s.select} value={T.meta.status} onChange={(e) => run(() => api.patch(`/support/threads/${kind}/${encodeURIComponent(refId)}`, { status: e.target.value }), t("sa.sup.updated", "Updated."))}>
                {["open", "pending", "resolved"].map((x) => <option key={x} value={x}>{t(`sa.status.${x}`, x)}</option>)}
              </select>
            </Field>
            <Field label={t("sa.sup.assignee", "Assigned to")}>
              <span className={s.row}>
                <span>{T.meta.assigneeName || t("sa.sup.nobody", "nobody")}</span>
                <Button size="sm" variant="ghost" onClick={() => run(() => api.patch(`/support/threads/${kind}/${encodeURIComponent(refId)}`, { assigneeId: T.meta.assigneeName ? "" : "me" }), t("sa.sup.updated", "Updated."))}>{T.meta.assigneeName ? t("sa.sup.unassign", "Unassign") : t("sa.sup.takeIt", "Assign to me")}</Button>
              </span>
            </Field>
          </div>
          <form className={s.stack} onSubmit={(e) => { e.preventDefault(); if (reply.trim()) run(async () => { await api.post(`/support/threads/${kind}/${encodeURIComponent(refId)}/reply`, { message: reply, resolve }); setReply(""); }, t("sa.sup.sent", "Reply sent.")); }}>
            {canned.length > 0 && <div className={s.chipsRow} role="group" aria-label={t("sa.sup.canned", "Canned replies")}>{canned.map((c) => <button key={c.key} type="button" className={s.chipBtn} onClick={() => setReply(c.text)}>{c.key}</button>)}</div>}
            <Field label={kind === "contact" ? t("sa.sup.replyEmail", "Reply (sent by email)") : t("sa.sup.reply", "Reply")}><textarea className={s.textarea} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} /></Field>
            <div className={s.row}>
              <label className={s.check}><input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} /> {t("sa.sup.resolveAfter", "Mark resolved")}</label>
              <span className={s.spacer} />
              <Button type="submit" size="sm" disabled={!reply.trim()}>{t("sa.sup.send", "Send reply")}</Button>
            </div>
          </form>
          <h4 className={s.label}>{t("sa.sup.notes", "Internal notes (only staff see these)")}</h4>
          {T.meta.notes?.length > 0 && <ul className={s.list}>{T.meta.notes.map((n, i) => <li key={i} className={s.listItem}><span>{n.text}</span><span className={`${s.small} ${s.muted}`}>{n.by} · {ago(n.at)}</span></li>)}</ul>}
          <form className={s.row} onSubmit={(e) => { e.preventDefault(); if (noteText.trim()) run(async () => { await api.post(`/support/threads/${kind}/${encodeURIComponent(refId)}/notes`, { text: noteText }); setNoteText(""); }, t("sa.sup.noted", "Note added.")); }}>
            <input className={`${s.input} ${s.search}`} aria-label={t("sa.sup.addNote", "Add a note")} placeholder={t("sa.sup.addNote", "Add a note")} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <Button type="submit" size="sm" variant="soft">{t("sa.sup.note", "Add note")}</Button>
          </form>
        </div>
      )}
    </Loadable>
  );
}

export default function Support({ go, params, setParams }) {
  const { t } = useTranslation();
  const status = params.get("status") ?? "open";
  const assignee = params.get("assignee") || "";
  const open = params.get("thread");
  const inbox = useLoad(`/support/inbox${qs({ status, assignee, limit: 50 })}`, { pollMs: 30_000 });
  const settings = useLoad("/settings/platform");
  const canned = settings.data?.settings?.["support.cannedReplies"]?.value || [];
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) { if (v != null) n.set(k, v); else n.delete(k); } n.set("section", "support"); return n; });
  const C = inbox.data?.counts;
  const [kind, refId] = open ? [open.split(":")[0], open.slice(open.indexOf(":") + 1)] : [];
  return (
    <div className={`${s.split} ${s.inbox}`} data-open={open ? "1" : "0"}>
      <Panel title={t("sa.sup.title", "Support inbox")}>
        <Segmented label={t("sa.sup.filter", "Filter")} value={assignee || status} onChange={(k) => (["me", "none"].includes(k) ? set({ assignee: k, status: "" }) : set({ status: k, assignee: null }))} options={[
          { key: "open", label: t("sa.status.open", "Open"), badge: C?.open }, { key: "pending", label: t("sa.sup.waiting", "Waiting") },
          { key: "me", label: t("sa.sup.mine", "Mine"), badge: C?.mine }, { key: "none", label: t("sa.sup.unassigned", "Unassigned") }, { key: "", label: t("sa.all", "All") },
        ]} />
        <Loadable state={inbox} empty={inbox.data && !inbox.data.rows.length ? { title: t("sa.sup.empty", "Inbox zero."), text: t("sa.sup.emptyText", "Nothing here right now.") } : null}>
          <ul className={`${s.list} ${s.inboxList}`}>
            {(inbox.data?.rows || []).map((r) => {
              const key = `${r.kind}:${r.ref}`;
              return (
                <li key={key}>
                  <button type="button" className={s.listItem} style={{ width: "100%", border: open === key ? "2px solid var(--d-accent)" : "2px solid transparent", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => set({ thread: key })} aria-current={open === key ? "true" : undefined}>
                    <span style={{ minWidth: 0 }}>
                      <span className={s.strong}>{r.title}</span>{r.unread > 0 && <> <Pill tone="alert">{t("sa.sup.new", "{{n}} new", { n: r.unread })}</Pill></>}<br />
                      <span className={`${s.small} ${s.muted}`}>{t(`sa.sup.kind.${r.kind}`, KIND[r.kind])} · {r.assigneeName || t("sa.sup.unassigned", "Unassigned")}</span><br />
                      <span className={s.small}>{String(r.last || "").slice(0, 90)}</span>
                    </span>
                    <span className={`${s.small} ${s.muted}`} style={{ whiteSpace: "nowrap" }}>{ago(r.lastAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Loadable>
      </Panel>
      <Panel>
        {open && <div className={s.narrowOnly}><button type="button" className={s.linkBtn} data-sound="back" onClick={() => set({ thread: null })}>← {t("sa.sup.back", "Back to the inbox")}</button></div>}
        {open ? <Thread key={open} kind={kind} refId={refId} go={go} canned={canned} onChanged={() => inbox.reload({ quiet: true })} /> : <p className={s.muted}>{t("sa.sup.pick", "Pick a conversation on the left.")}</p>}
      </Panel>
    </div>
  );
}
