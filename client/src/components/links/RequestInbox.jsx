// The requests waiting for me (Accept / No thanks) and the ones I sent (Waiting /
// said yes / Cancel). The same component for every role; `viewer` picks the words
// and `audience="kid"` makes them simpler and the buttons bigger.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sfx, haptic } from "../../utils/sounds";
import { daysLeft } from "./useLinks";
import { incomingText, outgoingText } from "./linkText";
import s from "./links.module.css";

const ICON = { family: "🏠", class: "🍎", staff: "🏫", enrol: "🎒" };
const AGES = Array.from({ length: 16 }, (_, i) => i + 3);

function Incoming({ r, viewer, kid, groups, links, onAccepted, onMessage }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [age, setAge] = useState(r.child?.age ? String(r.child.age) : "");
  const [group, setGroup] = useState(groups?.length === 1 ? groups[0].id : "");
  const [err, setErr] = useState("");
  const needsAge = viewer === "parent" && r.kind === "family" && !r.child?.age;
  const needsGroup = viewer === "teacher" && r.kind === "class" && (groups?.length || 0) > 1;
  const name = r.from.name || r.from.email;

  const accept = async () => {
    sfx.select(); haptic("success");
    setBusy(true); setErr("");
    const body = {};
    if (viewer === "parent" && age) body.age = Number(age);
    if (viewer === "teacher" && group) body.groupId = group;
    const res = await links.accept(r.id, body);
    setBusy(false);
    if (!res.ok) { sfx.error(); return setErr(res.message || t("links.failed", { defaultValue: "That didn't work. Please try again." })); }
    onMessage(kid
      ? t("links.doneKid", { defaultValue: "Yay! You're connected with {{name}}. 🎉", name })
      : t("links.done", { defaultValue: "Done: you're connected with {{name}}.", name }));
    onAccepted?.(res, r);
  };
  const decline = async () => {
    sfx.close(); haptic("light");
    setBusy(true); setErr("");
    const res = await links.decline(r.id);
    setBusy(false);
    if (!res.ok) return setErr(res.message || t("links.failed", { defaultValue: "That didn't work. Please try again." }));
    onMessage(kid ? t("links.declinedKid", { defaultValue: "Okay! We told them no thanks." }) : t("links.declined", { defaultValue: "Declined. Nothing was shared." }));
  };

  const joinWord = r.kind === "class" || r.kind === "enrol" || r.kind === "staff";
  return (
    <li className={`${s.req} ${kid ? s.kid : ""}`}>
      <span className={s.bubble} data-kind={r.kind} aria-hidden="true">{ICON[r.kind] || "🤝"}</span>
      <p className={s.what}>{incomingText(t, r, viewer)}</p>
      <p className={s.who}>
        {r.from.name ? `${r.from.email}` : ""}{r.org?.name && r.from.role === "teacher" && viewer === "student" ? ` · ${r.org.name}` : ""}
        {kid ? <><br />{t("links.kidSafety", { defaultValue: "Only say yes if you know them." })}</> : ` · ${t("links.validFor", { defaultValue: "{{count}} days left to answer", defaultValue_one: "{{count}} day left to answer", count: daysLeft(r.expiresAt) })}`}
      </p>
      {(needsAge || needsGroup || (viewer === "teacher" && r.kind === "class" && groups?.length === 1) || (viewer === "teacher" && r.kind === "class" && groups && !groups.length)) && (
        <div className={s.extra}>
          {needsAge && (
            <label className={s.field} style={{ flex: "0 1 220px" }}>
              {t("links.howOld", { defaultValue: "How old is {{name}}?", name })}
              <select className={s.select} value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">{t("links.choose", { defaultValue: "Choose…" })}</option>
                {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          )}
          {needsGroup && (
            <label className={s.field} style={{ flex: "1 1 220px" }}>
              {t("links.whichGroup", { defaultValue: "Which group do they join?" })}
              <select className={s.select} value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">{t("links.choose", { defaultValue: "Choose…" })}</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.emoji ? `${g.emoji} ` : ""}{g.name}</option>)}
              </select>
            </label>
          )}
          {viewer === "teacher" && r.kind === "class" && groups?.length === 1 && <span className={s.fine}>{t("links.joinsGroup", { defaultValue: "They join {{group}}.", group: groups[0].name })}</span>}
          {viewer === "teacher" && r.kind === "class" && groups && !groups.length && <span className={s.fine}>{t("links.firstGroup", { defaultValue: "You have no group yet: we'll make one called “My students” for them." })}</span>}
        </div>
      )}
      {err && <p className={s.err} role="alert" style={{ gridColumn: "1 / -1" }}>{err}</p>}
      <div className={s.answers}>
        <button type="button" data-sound="none" className={`${s.btn} ${kid ? s.big : ""}`} onClick={accept} disabled={busy || (needsAge && !age) || (needsGroup && !group)}>
          <span aria-hidden="true">✓</span> {kid ? (joinWord ? t("links.yesJoin", { defaultValue: "Yes, join" }) : t("links.yesAccept", { defaultValue: "Yes, accept" })) : t("links.accept", { defaultValue: "Accept" })}
        </button>
        <button type="button" data-sound="none" className={`${s.ghost} ${kid ? s.big : ""}`} onClick={decline} disabled={busy}>
          {kid ? t("links.noThanks", { defaultValue: "No thanks" }) : t("links.decline", { defaultValue: "Decline" })}
        </button>
      </div>
    </li>
  );
}

function Outgoing({ list, links, onMessage }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(null);
  const cancel = async (r) => {
    setBusy(r.id);
    const res = await links.cancel(r.id);
    setBusy(null);
    onMessage(res.ok ? t("links.cancelled", { defaultValue: "Request cancelled." }) : res.message);
  };
  return (
    <ul className={s.sent}>
      {list.map((r) => (
        <li key={r.id} className={s.sentRow}>
          <span>{outgoingText(t, r)}</span>
          {r.status === "pending" && <span className={`${s.pill} ${s.pillWait}`}>⏳ {t("links.daysLeft", { defaultValue: "{{count}} days left", defaultValue_one: "{{count}} day left", count: daysLeft(r.expiresAt) })}</span>}
          {r.status === "accepted" && <span className={`${s.pill} ${s.pillGood}`}>✓ {t("links.connected", { defaultValue: "Connected" })}</span>}
          {r.status === "pending" && <button type="button" data-sound="close" className={`${s.ghost} ${s.small}`} disabled={busy === r.id} onClick={() => cancel(r)}>{t("links.cancel", { defaultValue: "Cancel" })}</button>}
        </li>
      ))}
    </ul>
  );
}

// links: the useLinks() result. kinds: only these request kinds (e.g. ["staff"]).
export default function RequestInbox({
  links, viewer, audience = "grownup", kinds, groups, onAccepted, title, outgoingTitle,
  showIncoming = true, showOutgoing = true, maxOutgoing = 6, hideWhenEmpty = true,
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const kid = audience === "kid";
  const keep = (r) => !kinds || kinds.includes(r.kind);
  const incoming = (links.data?.incoming || []).filter(keep);
  const outgoing = (links.data?.outgoing || []).filter(keep).filter((r) => r.status !== "cancelled").slice(0, maxOutgoing);
  const g = groups || links.data?.groups;
  if (hideWhenEmpty && !message && !(showIncoming && incoming.length) && !(showOutgoing && outgoing.length)) return null;

  return (
    <div className={s.box}>
      {message && <p className={s.ok} role="status">{message}</p>}
      {showIncoming && incoming.length > 0 && (
        <section className={s.box} aria-label={title || t("links.forYou", { defaultValue: "Requests for you" })}>
          <h3 className={s.title}>{title || t("links.forYou", { defaultValue: "Requests for you" })} <span className={s.count}>{incoming.length}</span></h3>
          <ul className={s.list}>
            {incoming.map((r) => <Incoming key={r.id} r={r} viewer={viewer} kid={kid} groups={g} links={links} onAccepted={onAccepted} onMessage={setMessage} />)}
          </ul>
        </section>
      )}
      {showOutgoing && outgoing.length > 0 && (
        <section className={s.box} aria-label={outgoingTitle || t("links.sentByYou", { defaultValue: "Requests you sent" })}>
          <h3 className={s.title} style={{ fontSize: "1rem" }}>{outgoingTitle || t("links.sentByYou", { defaultValue: "Requests you sent" })}</h3>
          <Outgoing list={outgoing} links={links} onMessage={setMessage} />
        </section>
      )}
    </div>
  );
}
