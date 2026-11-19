// ADM-041 Teacher overview: support, not ranking. Sorted by name, with class size and
// starting level for context. ADM-024: hand a teacher's groups to someone else.
// Two sub-tabs (?pane=): the teachers, and connect-by-email requests and invitations.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaExchangeAlt, FaUserPlus } from "react-icons/fa";
import { Button, TimeRangeBar, DataTable, Skeleton, InfoTip, EmptyState, SubTabs, SubPanel, usePane, fmtDuration, fmtDate, NO_DATA } from "../../../components/dashboard";
import { api, useLoad } from "./api";
import { useSchoolRange } from "./useSchoolRange";
import { useSchool } from "./context";
import { Health, Dialog, Field, Result } from "./bits";
import { useLinks, RequestInbox, InviteByEmail } from "../../../components/links";
import s from "./school.module.css";

// The list keeps to the screen on tall screens and scrolls inside (same as PeoplePage):
// --fit-h is the room left between the list and the bottom of the page.
function useFitHeight() {
  const [el, setEl] = useState(null);
  useEffect(() => {
    if (!el) return undefined;
    const root = el.closest("[data-scroll-root]");
    const main = el.closest("main");
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top - (root ? root.getBoundingClientRect().top - root.scrollTop : 0);
        const pad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
        el.style.setProperty("--fit-h", `${Math.floor((root ? root.clientHeight : window.innerHeight) - top - pad - 6)}px`);
      });
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (main) ro?.observe(main);
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener("resize", fit); };
  }, [el]);
  return setEl; // a callback ref: works for lists that appear later too
}

// Connect by email (services/linkRequests.js): invite a teacher. Nobody is added until they accept.
function InviteTeacherSheet({ links, onClose }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  return (
    <Dialog title={t("school.teachers.addTitle", { defaultValue: "Add teachers" })}
      text={t("school.teachers.addSub", { defaultValue: "Type a teacher's email. They get an invitation and tap Accept, then they're in your school. Teachers can also ask to join by typing your email." })} onClose={onClose}>
      <InviteByEmail id="invite-teacher"
        label={t("school.teachers.email", { defaultValue: "Teacher's email (the one they sign in with)" })}
        placeholder={t("school.teachers.emailPh", { defaultValue: "teacher@yourschool.org" })}
        button={t("school.teachers.invite", { defaultValue: "Send invitation" })}
        onSend={async (email) => { const r = await links.send({ to: "teacher", email, name: name.trim() }); if (r.ok) setName(""); return r; }}
        sentText={(email) => t("school.teachers.sent", { defaultValue: "Invitation sent to {{email}}. They appear in the list as soon as they accept.", email })}>
        <Field id="invite-teacher-name" label={t("school.teachers.nameOpt", { defaultValue: "Name (optional)" })}>
          <input id="invite-teacher-name" className={s.input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </Field>
      </InviteByEmail>
    </Dialog>
  );
}

// Teachers who asked to join (Accept / Decline) and the invitations the school sent.
function TeacherRequests({ links, onChanged }) {
  const { t } = useTranslation();
  const waiting = (links.data?.incoming || []).filter((r) => r.kind === "staff").length;
  const sent = (links.data?.outgoing || []).some((r) => r.kind === "staff" && r.status !== "cancelled");
  return (
    <>
      <RequestInbox links={links} viewer="admin" kinds={["staff"]} showOutgoing={false}
        title={t("school.teachers.asking", { defaultValue: "Teachers who want to join" })} onAccepted={onChanged} />
      <RequestInbox links={links} viewer="admin" kinds={["staff"]} showIncoming={false} maxOutgoing={30}
        outgoingTitle={t("school.teachers.invitesSent", { defaultValue: "Invitations sent" })} />
      {links.data && !waiting && !sent && (
        <EmptyState icon="💌" title={t("school.requests.none", { defaultValue: "No requests or invitations yet" })}
          text={t("school.teachers.noneWaiting", { defaultValue: "No invitations or requests yet. Teachers who ask to join show up here." })} />
      )}
    </>
  );
}

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
  const write = can("people.write");
  const [pane, setPane] = usePane(write ? ["teachers", "requests"] : ["teachers"]);
  const { tr, query } = useSchoolRange({ defaultRange: "month" });
  const data = useLoad(`/school/teachers${query}`);
  const links = useLinks("admin", { poll: 30000, enabled: write });
  const waiting = (links.data?.incoming || []).filter((r) => r.kind === "staff").length;
  const fit = useFitHeight();
  const [inviting, setInviting] = useState(false);
  const [moving, setMoving] = useState(null);
  const [result, setResult] = useState(null);
  const rows = data.data?.teachers || [];
  const pts = (v) => (v == null ? NO_DATA : `${v > 0 ? "▲ +" : v < 0 ? "▼ " : ""}${v} pts`);
  const columns = [
    { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true, render: (r) => <><div className={s.strong}>{r.name}</div><div className={`${s.small} ${s.muted}`}>{r.groups.map((g) => g.name).join(", ") || t("school.teachers.noGroups", { defaultValue: "No groups yet" })}</div></> },
    { key: "students", label: t("school.teachers.students", { defaultValue: "Students" }), align: "end", sortable: true },
    { key: "engagement", label: t("school.engagement", { defaultValue: "Engagement" }), sortable: true, sortValue: (r) => r.engagement ?? -1, render: (r) => <Health value={r.engagement} /> },
    { key: "minutesPerStudent", label: t("school.teachers.minutes", { defaultValue: "Min / student" }), align: "end", sortable: true, render: (r) => (r.minutesPerStudent != null ? fmtDuration(r.minutesPerStudent) : NO_DATA) },
    { key: "growth", label: t("school.teachers.growth", { defaultValue: "Class growth" }), sortable: true, sortValue: (r) => r.growth ?? -999, render: (r) => (
      <><div className={s.strong}>{pts(r.growth)}</div><div className={`${s.small} ${s.muted}`}>{r.startingAccuracy != null ? t("school.teachers.from", { defaultValue: "from {{a}} % to {{b}} %", a: r.startingAccuracy, b: r.accuracy }) : t("school.teachers.noStart", { defaultValue: "not enough answers yet" })}</div></>
    ) },
    { key: "questions", label: t("school.teachers.content", { defaultValue: "Questions · tests" }), align: "end", render: (r) => (
      <><div>{r.questions}{r.approvalRate != null ? ` · ${r.approvalRate} % ${t("school.teachers.approved", { defaultValue: "approved" })}` : ""}</div><div className={`${s.small} ${s.muted}`}>{r.testsAvailable ? t("school.teachers.testsN", { defaultValue: "{{n}} tests", n: r.tests }) : t("school.teachers.testsSoon", { defaultValue: "tests: coming soon" })}</div></>
    ) },
    { key: "lastActive", label: t("school.teachers.last", { defaultValue: "Last active" }), sortable: true, render: (r) => (r.lastActive ? fmtDate(r.lastActive.slice(0, 10)) : r.signedIn ? NO_DATA : t("school.teachers.never", { defaultValue: "Never signed in" })) },
    ...(write ? [{ key: "act", label: "", render: (r) => r.groups.length > 0 && <button type="button" className={s.iconBtn} onClick={() => setMoving(r)} aria-label={t("school.teachers.transferX", { defaultValue: "Hand over {{name}}'s groups", name: r.name })} title={t("school.teachers.transfer", { defaultValue: "Hand over groups" })}><FaExchangeAlt /></button> }] : []),
  ];

  const list = (
    <>
      {waiting > 0 && (
        <div className={s.nudgeLine} role="status">
          <span aria-hidden="true">💌</span>
          <span className={s.grow}>{t("school.teachers.waitingN", { defaultValue: "{{count}} teachers want to join your school.", defaultValue_one: "1 teacher wants to join your school.", count: waiting })}</span>
          <Button size="sm" variant="soft" onClick={() => setPane("requests")}>{t("school.teachers.seeRequests", { defaultValue: "See requests" })}</Button>
        </div>
      )}
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} compact="auto" />
      <Result result={result} />
      <div ref={fit} className={s.listFit}>
        {data.loading ? <Skeleton variant="chart" /> : data.error ? <p className={s.errorText}>{data.error.message}</p> : (
          <DataTable className={`${s.rows} ${write ? s.rowsAct : ""}`} caption={t("school.teachers.caption", { defaultValue: "{{n}} teachers, sorted by name", n: rows.length })} columns={columns} rows={rows} getRowKey={(r) => r.id} defaultSort={{ key: "name", dir: "asc" }} />
        )}
      </div>
    </>
  );

  return (
    <div className={`${s.page} ${s.pageTight}`}>
      <div className={s.head}>
        <div className={s.grow}>
          <h1 className={s.title}>{t("school.teachers.title", { defaultValue: "Teachers" })}</h1>
          <p className={`${s.sub} ${s.subOptional}`}>{t("school.teachers.sub", { defaultValue: "Where can we help? Each class is compared with itself, not with other classes." })}</p>
        </div>
        <InfoTip align="end">
          {data.data?.note ? <>{data.data.note} </> : null}
          {t("school.teachers.columnsNote", { defaultValue: "Marking turnaround and parent reply time appear once tests and messaging are in use." })}
        </InfoTip>
      </div>
      {write ? (
        <>
          <SubTabs label={t("school.teachers.title", { defaultValue: "Teachers" })} value={pane} onChange={setPane}
            tabs={[
              { id: "teachers", label: t("school.teachers.tabList", { defaultValue: "Teachers" }) },
              { id: "requests", label: t("school.people.tabRequests", { defaultValue: "Requests & invites" }), short: t("school.people.tabRequestsShort", { defaultValue: "Requests" }), badge: waiting || undefined },
            ]}
            actions={<Button icon={FaUserPlus} data-sound="open" onClick={() => setInviting(true)}>{t("school.teachers.inviteBtn", { defaultValue: "Invite a teacher" })}</Button>} />
          <SubPanel id="teachers" value={pane}>{list}</SubPanel>
          <SubPanel id="requests" value={pane}><TeacherRequests links={links} onChanged={() => data.reload()} /></SubPanel>
        </>
      ) : list}
      {inviting && <InviteTeacherSheet links={links} onClose={() => setInviting(false)} />}
      {moving && <TransferDialog from={moving} teachers={rows} onClose={() => setMoving(null)} onDone={(text) => { setResult({ ok: true, text }); data.reload(); }} />}
    </div>
  );
}
