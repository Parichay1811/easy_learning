import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus, FaEnvelope, FaUserPlus, FaUserMinus } from "react-icons/fa";
import { Button, EmptyState, Sheet, SubTabs, SubPanel, PanelHead, usePane, fmtDate, fmtDuration } from "../../components/dashboard";
import { useLoad, avatarOf, STICKERS, sendChildRequest, childRequestFor } from "./parentApi";
import { useLinks, RequestInbox } from "../../components/links";
import AddChildSheet from "./AddChildSheet";
import LoginCard from "./LoginCard";
import s from "./parent.module.css";

const STATUS = { verified: ["pillGood", "✓", "Linked"], pending: ["pillWait", "⏳", "Waiting to accept"], revoked: ["pillOff", "✕", "Removed"] };

// Family (PAR-001, PAR-003, PAR-060..062), one sub-tab per task so each fits a screen:
// Children (cards, add a child) · Requests (by email, invitations) · Grown-ups (co-guardians)
// · Goal · Cheers · Badges. The last four are for the child picked in the top bar.
// Deep links: ?tab=family&add=1 opens "Add a child"; &edit=goal opens the Goal tab.
const PANES = ["children", "requests", "grownups", "goal", "cheers", "badges"];
export default function ParentFamily({ api, kids, child, invites, onChanged, onSelect, onSetup, go }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.fam.${k}`, { defaultValue: d, ...o });
  const [params, setParams] = useSearchParams();
  const [pane0, setPane] = usePane(child ? PANES : PANES.slice(0, 2));
  // Home's "Change goal" links here with &edit=goal: open the goal tab (and keep Back working).
  const wantsGoal = params.get("edit") === "goal" && Boolean(child);
  const pane = wantsGoal ? "goal" : pane0;
  useEffect(() => {
    if (!wantsGoal) return;
    setParams((p) => { const n = new URLSearchParams(p); n.delete("edit"); n.set("pane", "goal"); return n; }, { replace: true });
  }, [wantsGoal, setParams]);

  const [adding, setAdding] = useState(params.get("add") === "1" ? "start" : null);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState("");
  const [codeFor, setCodeFor] = useState(null);
  const [card, setCard] = useState(null);
  // Requests by email (services/linkRequests.js): from children who asked me, and the ones I sent.
  const links = useLinks("parent", { poll: 30000 });
  const reloadAll = async () => { await Promise.all([onChanged(), links.reload()]); };
  const incoming = links.data?.incoming || [];
  const sent = (links.data?.outgoing || []).filter((r) => r.kind === "family" && r.status !== "cancelled");
  const waiting = incoming.length + invites.length;
  // Co-guardians of the chosen child: loaded here so the tab's "Invite" button knows who may invite.
  const guardians = useLoad(api.get, child && pane === "grownups" ? `/children/${child._id}/guardians` : null);
  const first = child?.name.split(" ")[0];

  const openAdd = (door) => setAdding(door || "start");
  const closeAdd = (msg) => {
    setAdding(null);
    if (typeof msg === "string") setNotice(msg);
    setParams((p) => { const n = new URLSearchParams(p); n.delete("add"); return n; });
  };

  const accept = async (inv) => {
    const r = await api.post("/guardian-invites/accept", { inviteId: inv.id });
    setNotice(r.success ? T("accepted", "You can now follow {{name}}'s learning.", { name: inv.childName }) : r.message);
    onChanged();
  };

  const resend = async (c) => {
    const r = await sendChildRequest(api, { name: c.name, age: c.age, email: c.email });
    setNotice(r.success ? T("resent", "We sent {{name}} a new request. Ask them to open Dashboard → My people and tap Accept.", { name: c.name.split(" ")[0] }) : r.message);
    reloadAll();
  };
  const cancelRequest = async (c, req) => {
    const r = await links.cancel(req.id);
    setNotice(r.ok ? T("requestCancelled", "Request cancelled.") : r.message);
    onChanged();
  };

  const remove = async (c) => {
    const verified = c.linkStatus === "verified";
    if (!window.confirm(verified ? T("confirmStop", "Stop following {{name}}? Their learning stays with them; you can link again with a new code.", { name: c.name }) : T("confirmRemove", "Remove {{name}} from your list?", { name: c.name }))) return;
    const r = verified ? await api.post(`/children/${c._id}/revoke`) : await api.del(`/children/${c._id}`);
    setNotice(r.success ? T("removed", "Done.") : r.message);
    onChanged();
  };

  const newCard = async (c) => {
    if (!window.confirm(T("confirmCard", "Make a new login card for {{name}}? The old code and pictures stop working.", { name: c.name }))) return;
    const r = await api.post(`/children/${c._id}/managed/reset`);
    if (r.success) setCard({ name: c.name, avatar: c.avatar, loginCode: r.loginCode, pictures: r.picturePassword });
    else setNotice(r.message);
  };

  // The tab's main action, top right of the tab row (under it on phones).
  const action = {
    children: <Button icon={FaPlus} data-sound="open" onClick={() => openAdd()}>{T("add", "Add a child")}</Button>,
    requests: <Button icon={FaEnvelope} data-sound="open" onClick={() => openAdd("email")}>{T("sendRequest", "Send a request")}</Button>,
    grownups: guardians.data?.youArePrimary ? <Button icon={FaUserPlus} data-sound="open" onClick={() => setInviting(true)}>{t("parent.guard.inviteShort", { defaultValue: "Invite a grown-up" })}</Button> : null,
  }[pane];

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{T("title", "Family")}</h1>
          <p className={s.famSub}>{T("sub", "Your children, the people who follow them, goals and cheers.")}</p>
        </div>
      </div>
      <SubTabs label={T("tabs", "Family")} value={pane} onChange={setPane} actions={action}
        tabs={[
          { id: "children", label: T("tab.children", "Children") },
          { id: "requests", label: T("tab.requests", "Requests"), badge: waiting || undefined },
          child && { id: "grownups", label: T("tab.grownups", "Grown-ups") },
          child && { id: "goal", label: T("tab.goal", "Goal") },
          child && { id: "cheers", label: T("tab.cheers", "Cheers") },
          child && { id: "badges", label: T("tab.badges", "Badges") },
        ]} />
      {notice && <p className={s.notice} role="status">{notice}</p>}

      <SubPanel id="children" value={pane}>
        {waiting > 0 && (
          <div className={s.famNudge} role="status">
            <span aria-hidden="true" className={s.famNudgeIcon}>💌</span>
            <span className={s.famNudgeText}>{T("waitingN", "{{count}} requests are waiting for you.", { count: waiting, defaultValue_one: "1 request is waiting for you." })}</span>
            <Button size="sm" variant="soft" onClick={() => setPane("requests")}>{T("seeRequests", "See requests")}</Button>
          </div>
        )}
        {kids.length === 0 ? (
          <div className={s.card}>
            <EmptyState icon="👨‍👩‍👧" title={T("emptyT", "Add your first child")} text={T("emptyD", "Create an account for a young child in a minute, or link a child who already learns on Learnigo.")} actionLabel={T("add", "Add a child")} onAction={() => openAdd()} />
          </div>
        ) : (
          <div className={s.kids}>
            {kids.map((c) => {
              const req = childRequestFor(links.data?.outgoing, c);
              return <KidCard key={c._id} api={api} c={c} T={T} selected={child?._id === c._id} request={req}
                onOpen={() => { onSelect(c._id); go("home", { child: c._id }); }} onCode={() => setCodeFor(c)} onRemove={() => remove(c)}
                onCard={() => newCard(c)} onSetup={() => onSetup(c)} onResend={() => resend(c)} onCancelRequest={() => cancelRequest(c, req)} />;
            })}
          </div>
        )}
      </SubPanel>

      <SubPanel id="requests" value={pane}>
        <RequestInbox links={links} viewer="parent" showOutgoing={false}
          title={T("kidRequests", "Your children asked you to follow them")}
          onAccepted={() => { onChanged(); setNotice(T("acceptedKid", "Linked! Their learning is on your Home page now.")); }} />
        {invites.length > 0 && (
          <section className={s.card} aria-labelledby="inv-h">
            <div className={s.cardHead}><h2 id="inv-h">{T("invites", "Invitations for you")}</h2></div>
            <ul className={s.list}>
              {invites.map((inv) => (
                <li key={inv.id}>
                  <span>{T("inviteText", "{{from}} invited you to follow {{name}}'s learning", { from: inv.fromName || T("someone", "A guardian"), name: inv.childName })}</span>
                  <Button size="sm" onClick={() => accept(inv)}>{T("accept", "Accept")}</Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <RequestInbox links={links} viewer="parent" kinds={["family"]} showIncoming={false} maxOutgoing={10}
          outgoingTitle={T("sentTitle", "Requests you sent")} />
        {!waiting && !sent.length && links.data && (
          <div className={s.card}>
            <EmptyState icon="💌" title={T("noRequests", "No requests right now")}
              text={T("noRequestsD", "When your child asks you to follow their learning, or another parent invites you, it shows up here.")} />
          </div>
        )}
      </SubPanel>

      {child && (
        <>
          <SubPanel id="grownups" value={pane}>
            <Guardians api={api} child={child} g={guardians} inviting={inviting} onCloseInvite={() => setInviting(false)} />
          </SubPanel>

          <SubPanel id="goal" value={pane}>
            <PanelHead className={s.famHead} title={T("forChild", "For {{name}}", { name: child.name })}
              text={T("goalHelp", "A small weekly goal helps a habit grow. {{name}} sees it on their home screen.", { name: first })} />
            <div className={s.famNarrow}><GoalEditor key={`g${child._id}`} api={api} child={child} onChanged={onChanged} focus={wantsGoal} /></div>
          </SubPanel>

          <SubPanel id="cheers" value={pane}>
            <PanelHead className={s.famHead} title={T("forChild", "For {{name}}", { name: child.name })}
              text={T("cheersHelp", "A sticker and a kind word. {{name}} sees it next time they open Learnigo.", { name: first })} />
            <div className={s.famNarrow}><Cheers key={`c${child._id}`} api={api} child={child} /></div>
          </SubPanel>

          <SubPanel id="badges" value={pane}>
            <PanelHead className={s.famHead} title={T("forChild", "For {{name}}", { name: child.name })}
              text={T("badgesHelp", "Badges and milestones {{name}} has reached so far.", { name: first })} />
            <Achievements key={`a${child._id}`} api={api} child={child} />
          </SubPanel>
        </>
      )}

      {adding && <AddChildSheet api={api} door={adding === "start" ? null : adding} onClose={closeAdd} onDone={reloadAll} />}
      {codeFor && <CodeSheet api={api} c={codeFor} onClose={(msg) => { setCodeFor(null); if (msg) setNotice(msg); onChanged(); }} />}
      {card && (
        <div className={s.backdrop} role="presentation" onClick={() => setCard(null)}>
          <div className={s.sheet} role="dialog" aria-modal="true" aria-label={T("cardT", "New login card")} onClick={(e) => e.stopPropagation()}>
            <div className={s.sheetHead}><h2>{T("cardT", "New login card")}</h2><button type="button" className={s.iconBtn} aria-label={T("close", "Close")} onClick={() => setCard(null)}>✕</button></div>
            <LoginCard {...card} />
          </div>
        </div>
      )}
    </>
  );
}

function KidCard({ api, c, T, selected, request, onOpen, onCode, onRemove, onCard, onSetup, onResend, onCancelRequest }) {
  const verified = c.linkStatus === "verified";
  const g = useLoad(api.get, verified ? `/children/${c._id}/goal` : null);
  const [cls, icon, word] = STATUS[c.linkStatus] || STATUS.pending;
  const waiting = !verified && request?.status === "pending";
  const p = g.data?.progress;
  return (
    <article className={`${s.card} ${s.kid}`} style={selected ? { outline: "3px solid var(--d-accent)" } : undefined}>
      <div className={s.kidTop}>
        <span className={`${s.avatar} ${s.avatarBig}`} aria-hidden="true">{avatarOf(c)}</span>
        <div style={{ minWidth: 0 }}>
          <h3>{c.name}</h3>
          <span className={`${s.pill} ${s[cls]}`}><span aria-hidden="true">{icon}</span> {T(c.linkStatus && c.linkStatus !== "pending" ? `status.${c.linkStatus}` : "status.waitAccept", word)}</span>
          {c.guardianRole === "co" && <span className={s.pill} style={{ marginLeft: 6 }}>{T("coGuardian", "Co-guardian")}</span>}
          {c.managedLearnerId && <span className={s.pill} style={{ marginLeft: 6 }}>{T("managed", "Child account")}</span>}
        </div>
      </div>
      {verified && (
        <div className={s.kidStats}>
          <span><strong>{p ? fmtDuration(p.minutes) : "—"}</strong> {T("thisWeek", "this week")}</span>
          {p && g.data?.goal && <span><strong>{p.daysMet}/{p.daysPerWeek}</strong> {T("goalDays", "goal days")}</span>}
          <span>{T("age", "Age {{n}}", { n: c.age })}{c.grade ? ` · ${c.grade}` : ""}</span>
        </div>
      )}
      {!verified && c.linkStatus !== "revoked" && (
        <p className={`${s.muted} ${s.small}`} style={{ margin: 0 }}>
          {waiting
            ? T("waitingHelp", "We sent {{name}} a request. Ask them to open Learnigo → Dashboard → My people and tap Accept.", { name: c.name.split(" ")[0] })
            : request?.status === "declined"
              ? T("declinedHelp", "{{name}} said no thanks to the request. You can ask again, or use a link code.", { name: c.name.split(" ")[0] })
              : T("pendingHelp2", "Send {{name}} a request, or ask for their link code: Dashboard → My people → Link code.", { name: c.name.split(" ")[0] })}
        </p>
      )}
      <div className={s.row}>
        {verified && <Button size="sm" onClick={onOpen}>{T("open", "See learning")}</Button>}
        {!verified && !waiting && <Button size="sm" onClick={onResend}>{request ? T("askAgain", "Ask again") : T("sendRequest", "Send a request")}</Button>}
        {!verified && <Button size="sm" variant="soft" onClick={onCode}>{T("enterCode", "Enter link code")}</Button>}
        {waiting && <Button size="sm" variant="ghost" data-sound="close" onClick={onCancelRequest}>{T("cancelRequest", "Cancel request")}</Button>}
        {verified && <Button size="sm" variant="soft" onClick={onSetup}>{T("settings", "Settings")}</Button>}
        {verified && c.managedLearnerId && c.guardianRole !== "co" && <Button size="sm" variant="soft" onClick={onCard}>{T("newCard", "New login card")}</Button>}
        {!waiting && !(verified && c.managedLearnerId && c.guardianRole !== "co") && <Button size="sm" variant="ghost" icon={FaUserMinus} className={s.kidStop} title={verified ? T("stop", "Stop following") : T("remove", "Remove")} onClick={onRemove}>{verified ? T("stop", "Stop following") : T("remove", "Remove")}</Button>}
      </div>
    </article>
  );
}

function CodeSheet({ api, c, onClose }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.fam.${k}`, { defaultValue: d, ...o });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await api.post(`/children/${c._id}/verify`, { code });
    setBusy(false);
    if (!r.success) return setError(r.message);
    onClose(T("linkedNow", "{{name}} is linked.", { name: c.name }));
  };
  return (
    <div className={s.backdrop} role="presentation" onClick={() => onClose()}>
      <form className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="code-h" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={s.sheetHead}><h2 id="code-h">{T("codeTitle", "Link {{name}}", { name: c.name })}</h2><button type="button" className={s.iconBtn} aria-label={T("close", "Close")} onClick={() => onClose()}>✕</button></div>
        <p style={{ margin: 0 }}>{T("codeWhere", "Ask {{name}} to open Dashboard → My people → Link code and tap “Show my link code”.", { name: c.name.split(" ")[0] })}</p>
        <label className={s.field}>{T("code", "Link code")}<input className={s.input} value={code} onChange={(e) => setCode(e.target.value)} required minLength={6} maxLength={8} autoComplete="one-time-code" placeholder="K7P4XQ" /></label>
        <p className={`${s.muted} ${s.small}`}>{T("codeHelp", "The code works once and lasts 24 hours.")}</p>
        {error && <p className={s.error} role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? T("linking", "Linking…") : T("link", "Link")}</Button>
      </form>
    </div>
  );
}

// Weekly goal and family reward (PAR-012, PAR-060). The child sees it on their home screen.
function GoalEditor({ api, child, onChanged, focus }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.goalEd.${k}`, { defaultValue: d, ...o });
  const g = child.weeklyGoal || {};
  const [form, setForm] = useState({ minutesPerDay: g.minutesPerDay || 20, daysPerWeek: g.daysPerWeek || 5, reward: g.reward || "", rewardEmoji: g.rewardEmoji || "🍕" });
  const [msg, setMsg] = useState(null);
  const ref = useRef(null);
  useEffect(() => { if (focus) ref.current?.scrollIntoView({ behavior: "smooth" }); }, [focus]);
  const save = async (e) => {
    e.preventDefault();
    const r = await api.patch(`/children/${child._id}/settings`, { weeklyGoal: { ...form, minutesPerDay: Number(form.minutesPerDay), daysPerWeek: Number(form.daysPerWeek) } });
    setMsg(r.success ? { ok: true, text: T("saved", "Saved. {{name}} will see the goal on their home screen.", { name: child.name.split(" ")[0] }) } : { ok: false, text: r.message });
    if (r.success) onChanged();
  };
  return (
    <form ref={ref} className={s.card} onSubmit={save} aria-labelledby="goal-ed-h">
      <div className={s.cardHead}><h2 id="goal-ed-h">{T("title", "Weekly goal and reward")}</h2></div>
      <div className={`${s.formGrid} ${s.goalGrid}`}>
        <label className={s.field}>{T("minutes", "Minutes a day")}
          <select className={s.select} value={form.minutesPerDay} onChange={(e) => setForm({ ...form, minutesPerDay: e.target.value })}>
            {[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{fmtDuration(m)}</option>)}
          </select>
        </label>
        <label className={s.field}>{T("days", "Days a week")}
          <select className={s.select} value={form.daysPerWeek} onChange={(e) => setForm({ ...form, daysPerWeek: e.target.value })}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className={s.field} style={{ gridColumn: "1 / -1" }}>{T("reward", "Family reward (optional)")}
          <span className="hint" style={{ color: "var(--d-muted)", fontWeight: 400, fontSize: "0.875rem" }}>{T("rewardHint", "Something to look forward to, like “pizza night” or “park on Sunday”.")}</span>
          <input className={s.input} value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} maxLength={80} />
        </label>
        <div className={s.choices} role="group" aria-label={T("emoji", "Reward picture")} style={{ gridColumn: "1 / -1" }}>
          {["🍕", "🎡", "🍦", "🎬", "📚", "⚽", "🎨", "🎁"].map((x) => <button key={x} type="button" className={s.choice} aria-pressed={form.rewardEmoji === x} aria-label={x} onClick={() => setForm({ ...form, rewardEmoji: x })}>{x}</button>)}
        </div>
      </div>
      <div className={s.row} style={{ marginTop: 12 }}>
        <Button type="submit">{T("save", "Save goal")}</Button>
        {msg && <p className={msg.ok ? s.ok : s.error} role="status">{msg.text}</p>}
      </div>
    </form>
  );
}

// Cheer button (PAR-061): a sticker, a kind word, optionally a short voice note.
function Cheers({ api, child }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.cheer.${k}`, { defaultValue: d, ...o });
  const list = useLoad(api.get, `/children/${child._id}/cheers`);
  const [sticker, setSticker] = useState("star");
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState(null);
  const [rec, setRec] = useState(null);
  const [msg, setMsg] = useState(null);
  const canRecord = typeof window !== "undefined" && "MediaRecorder" in window && navigator.mediaDevices?.getUserMedia;

  const record = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
      const chunks = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
        const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
        setVoice({ b64, type: blob.type, url: URL.createObjectURL(blob) });
        setRec(null);
      };
      r.start();
      setRec(r);
      setTimeout(() => { if (r.state === "recording") r.stop(); }, 15000);
    } catch {
      setMsg({ ok: false, text: T("noMic", "We couldn't use the microphone.") });
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const r = await api.post(`/children/${child._id}/cheers`, { sticker, message, ...(voice ? { voice: voice.b64, voiceType: voice.type } : {}) });
    setMsg(r.success ? { ok: true, text: T("sent", "Sent! {{name}} sees it next time they open Learnigo.", { name: child.name.split(" ")[0] }) } : { ok: false, text: r.message });
    if (r.success) { setMessage(""); setVoice(null); list.reload(); }
  };

  return (
    <form className={s.card} onSubmit={send} aria-labelledby="cheer-h">
      <div className={s.cardHead}><h2 id="cheer-h">{T("title", "Send a cheer")}</h2></div>
      <div className={s.stickers} role="group" aria-label={T("sticker", "Sticker")}>
        {Object.entries(STICKERS).map(([k, e]) => <button key={k} type="button" className={s.choice} aria-pressed={sticker === k} aria-label={k} onClick={() => setSticker(k)}>{e}</button>)}
      </div>
      <label className={s.field} style={{ marginTop: 12 }}>{T("message", "A few kind words")}
        <input className={s.input} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140} placeholder={T("placeholder", "So proud of you!")} />
      </label>
      <div className={s.row} style={{ marginTop: 12 }}>
        {canRecord && <Button type="button" variant="soft" onClick={record}>{rec ? <><span className={s.recDot} aria-hidden="true" /> {T("stop", "Stop recording")}</> : voice ? T("again", "Record again") : T("record", "🎙️ Add a voice note")}</Button>}
        {voice && <audio controls src={voice.url} style={{ height: 40, maxWidth: "100%" }} />}
      </div>
      <div className={s.row} style={{ marginTop: 12 }}>
        <Button type="submit" disabled={Boolean(rec)}>{T("send", "Send cheer")}</Button>
        {msg && <p className={msg.ok ? s.ok : s.error} role="status">{msg.text}</p>}
      </div>
      {list.data?.cheers?.length > 0 && (
        <ul className={s.cheerList} style={{ marginTop: 12 }} aria-label={T("recent", "Recent cheers")}>
          {list.data.cheers.slice(0, 4).map((c) => (
            <li key={c.id} className={s.cheerItem}>
              <span aria-hidden="true" style={{ fontSize: "1.4rem" }}>{STICKERS[c.sticker]}</span>
              <span style={{ flex: 1 }}>{c.message || T("noText", "(sticker)")}{c.hasVoice ? " 🎙️" : ""}</span>
              <span className={`${s.muted} ${s.small}`}>{c.seenAt ? T("seen", "Seen") : T("waiting", "Not seen yet")}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

// Co-guardians (FND-013, PAR-003). `g` is the /guardians load (the page owns it, so the
// tab's "Invite a grown-up" button shows only for the main guardian); the invite is a sheet.
function Guardians({ api, child, g, inviting, onCloseInvite }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.guard.${k}`, { defaultValue: d, ...o });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState(null);
  const invite = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await api.post(`/children/${child._id}/guardians/invite`, { email });
    setBusy(false);
    if (!r.success) return setErr(r.message);
    setMsg({ ok: true, text: T("sent", "Invitation sent to {{email}}.", { email }) });
    setEmail("");
    g.reload();
    onCloseInvite();
  };
  const remove = async (row) => {
    if (!window.confirm(T("confirm", "Remove {{name}}? They will no longer see {{child}}'s learning.", { name: row.name || row.email, child: child.name }))) return;
    const r = await api.del(`/children/${child._id}/guardians/${row.id}`);
    setMsg(r.success ? { ok: true, text: T("removed", "Removed.") } : { ok: false, text: r.message });
    g.reload();
  };
  const cancel = async (inv) => { await api.del(`/children/${child._id}/guardians/invites/${inv.id}`); g.reload(); };
  const HOW = { school: T("how.school", "linked by the school"), child_code: T("how.code", "linked with a code"), child_request: T("how.request", "accepted by email"), parent_created: T("how.created", "created the account"), co_guardian: T("how.invited", "invited") };
  const first = child.name.split(" ")[0];

  return (
    <section className={s.card} aria-labelledby="guard-h">
      <div className={s.cardHead}><h2 id="guard-h">{T("title", "Who follows {{name}}", { name: first })}</h2></div>
      <p className={`${s.muted} ${s.small}`} style={{ margin: "0 0 4px" }}>{T("help", "Grown-ups who can see {{name}}'s learning. Invite a partner, grandparent or carer to follow along too.", { name: first })}</p>
      <ul className={s.list} aria-busy={g.loading || undefined}>
        {(g.data?.guardians || []).map((row) => (
          <li key={row.id}>
            <span>{row.name || row.email}{row.you ? ` (${T("you", "you")})` : ""}<br />
              <span className={`${s.muted} ${s.small}`}>{row.role === "co" ? T("co", "Co-guardian") : T("main", "Main guardian")} · {HOW[row.verifiedBy] || ""}{row.since ? ` · ${fmtDate(String(row.since).slice(0, 10), { style: "short" })}` : ""}</span></span>
            {row.removable && <Button size="sm" variant="ghost" onClick={() => remove(row)}>{T("remove", "Remove")}</Button>}
          </li>
        ))}
        {(g.data?.invites || []).map((inv) => (
          <li key={inv.id}>
            <span>{inv.email}<br /><span className={`${s.muted} ${s.small}`}>{T("pending", "Invitation sent, valid until {{d}}", { d: fmtDate(String(inv.expiresAt).slice(0, 10), { style: "short" }) })}</span></span>
            <Button size="sm" variant="ghost" data-sound="close" onClick={() => cancel(inv)}>{T("cancel", "Cancel")}</Button>
          </li>
        ))}
      </ul>
      {g.data && !g.data.youArePrimary && <p className={`${s.muted} ${s.small}`}>{T("onlyMain", "Only the main guardian can invite or remove others.")}</p>}
      {g.error && <p className={s.error} role="alert">{g.error}</p>}
      {msg && <p className={msg.ok ? s.ok : s.error} role="status" style={{ marginTop: 8 }}>{msg.text}</p>}
      {inviting && (
        <Sheet size="sm" title={T("inviteTitle", "Invite a grown-up to follow {{name}}", { name: first })}
          text={T("inviteHelp", "They get an email, sign in with that address and can see {{name}}'s learning. You can remove them at any time.", { name: first })}
          onClose={() => { setErr(""); onCloseInvite(); }}>
          <form onSubmit={invite} className={s.stack}>
            <label className={s.field}>{T("invite", "Invite another parent or carer")}
              <input className={s.input} type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={T("emailPh", "their email")} />
            </label>
            {err && <p className={s.error} role="alert">{err}</p>}
            <div className={s.row}><Button type="submit" disabled={busy}>{busy ? T("sending", "Sending…") : T("send", "Send invite")}</Button></div>
          </form>
        </Sheet>
      )}
    </section>
  );
}

// Achievements wall (PAR-062) and milestone moments (PAR-082).
function Achievements({ api, child }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.ach.${k}`, { defaultValue: d, ...o });
  const a = useLoad(api.get, `/children/${child._id}/dashboard/achievements`);
  const m = useLoad(api.get, `/children/${child._id}/analytics/milestones`);
  const list = a.data?.data || [];
  const earned = list.filter((x) => x.earned).sort((x, y) => new Date(y.earnedAt) - new Date(x.earnedAt));
  const next = list.filter((x) => !x.earned);
  // Newest first; the latest few, the rest a tap away (keeps the tab to about one screen).
  const moments = [...(m.data?.milestones || [])].reverse();
  const [allMoments, setAllMoments] = useState(false);
  const shown = allMoments ? moments : moments.slice(0, 4);
  return (
    <div className={s.achGrid}>
      <section className={s.card} aria-labelledby="ach-h">
        <div className={s.cardHead}><h2 id="ach-h">{T("title", "Badges")}</h2><span className={s.pill}>{earned.length} / {list.length || "—"}</span></div>
        <ul className={`${s.badges} ${s.badgesFit}`}>
          {earned.map((b) => (
            <li key={b.id} className={s.badge}>
              <span className={s.badgeIcon} aria-hidden="true">{b.icon}</span>
              <strong>{t(`dash.badge.${b.id}`, { defaultValue: b.name })}</strong>
              <span className={`${s.muted} ${s.small}`}>{fmtDate(String(b.earnedAt).slice(0, 10), { style: "short" })}</span>
            </li>
          ))}
          {next.map((b) => (
            <li key={b.id} className={`${s.badge} ${s.badgeLocked}`}>
              <span className={s.badgeIcon} aria-hidden="true">{b.icon}</span>
              <strong>{t(`dash.badge.${b.id}`, { defaultValue: b.name })}</strong>
              <span className={`${s.muted} ${s.small} ${s.badgeNext}`}>{T("next", "Next: {{d}}", { d: b.description })}</span>
            </li>
          ))}
        </ul>
        {/* Phones show the wall as small tiles; the next badge to earn is spelled out once here. */}
        {next[0] && <p className={`${s.small} ${s.nextUp}`} aria-hidden="true">{T("nextUp", "Next up: {{name}}. {{d}}", { name: t(`dash.badge.${next[0].id}`, { defaultValue: next[0].name }), d: next[0].description })}</p>}
        {!list.length && !a.loading && <p className={s.muted}>{T("none", "Badges appear as your child learns.")}</p>}
      </section>
      <section className={s.card} aria-labelledby="ms-h">
        <div className={s.cardHead}><h2 id="ms-h">{T("moments", "Milestones")}</h2></div>
        {moments.length ? (
          <ul className={s.milestones}>
            {shown.map((x) => (
              <li key={x.key} className={s.milestone}>
                <span aria-hidden="true" style={{ fontSize: "1.5rem" }}>{x.icon}</span>
                <span>{t(`parent.milestone.${x.key}`, { defaultValue: x.text })}</span>
                <time dateTime={x.date}>{fmtDate(x.date, { style: "short" })}</time>
              </li>
            ))}
          </ul>
        ) : null}
        {moments.length > shown.length && (
          <div className={s.row} style={{ marginTop: 10 }}>
            <Button size="sm" variant="ghost" data-sound="toggle" onClick={() => setAllMoments(true)}>{T("allMoments", "Show all {{n}}", { n: moments.length })}</Button>
          </div>
        )}
        {!moments.length && <p className={s.muted}>{T("noMoments", "The first milestone is the first day of learning. It's coming!")}</p>}
      </section>
    </div>
  );
}
