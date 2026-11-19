// The school admin's dashboard (docs/todo/ADMIN.md): one shell, role-aware nav,
// approval / plan / seat banners (ADM-002), and the school pages. Staff
// (coordinator, office, viewer) use the same app and see only what their role allows.
import { lazy, Suspense, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaHome, FaSitemap, FaUsers, FaChalkboardTeacher, FaChartBar, FaQuestionCircle, FaCog, FaSignOutAlt,
  FaExclamationTriangle, FaCheckCircle, FaHourglassHalf, FaArrowLeft, FaComments, FaBullhorn, FaBell, FaPaperPlane, FaInbox,
} from "react-icons/fa";
import { DashboardShell, Skeleton, EmptyState, Button, SubTabs, SubPanel, usePane, WelcomeToast } from "../../../components/dashboard";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { NotificationBell, MessageCenter, NotificationPrefs, AnnouncementComposer, AnnouncementsPanel } from "../../../components/comms";
import { useLoad } from "./api";
import { useLinks } from "../../../components/links";
import { BASE, SchoolCtx } from "./context";
import s from "./school.module.css";

const OverviewPage = lazy(() => import("./OverviewPage"));
const TreePage = lazy(() => import("./TreePage"));
const PeoplePage = lazy(() => import("./PeoplePage"));
const TeachersPage = lazy(() => import("./TeachersPage"));
const InsightsPage = lazy(() => import("./InsightsPage"));
const StudentPage = lazy(() => import("./StudentPage"));
const ReviewPage = lazy(() => import("./ReviewPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const SetupPage = lazy(() => import("./SetupPage"));


function StatusBanners({ status, access }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!status) return null;
  const out = [];
  const st = status.org?.status;
  // New schools are approved automatically (self-serve), so there is no "waiting for approval"
  // banner any more: only a school Learnigo turned down or paused sees one.
  if (status.org?.suspendedAt || st === "suspended") {
    out.push({ tone: "alert", icon: FaExclamationTriangle, text: t("school.banner.suspended", { defaultValue: "Learnigo has paused your school's account. Please contact us so we can sort it out together." }) });
  } else if (st === "rejected") {
    out.push({
      tone: "alert", icon: FaExclamationTriangle,
      text: t("school.banner.rejected", { defaultValue: "Your registration was not approved: {{reason}}", reason: status.org.rejectionReason || "no reason given" }),
      action: access.role === "admin" ? { label: t("school.banner.resubmit", { defaultValue: "Edit and resubmit" }), to: "/admin-dashboard?section=org" } : null,
    });
  }
  const seats = status.seats;
  if (seats?.state === "full") {
    out.push({ tone: "alert", icon: FaExclamationTriangle, text: t("school.banner.seatsFull", { defaultValue: "All {{bought}} seats are in use. Adding students is paused until you buy more seats or mark leavers. Learning carries on for everyone.", bought: seats.bought }) });
  } else if (seats?.state === "warning") {
    out.push({ tone: "attention", icon: FaExclamationTriangle, text: t("school.banner.seatsWarn", { defaultValue: "{{used}} of {{bought}} seats used ({{percent}} %).", ...seats }) });
  }
  if (status.trialDaysLeft != null) {
    out.push({ tone: status.trialDaysLeft <= 3 ? "attention" : "good", icon: FaCheckCircle, text: t("school.banner.trial", { defaultValue: "{{plan}} trial: {{days}} days left.", plan: status.plan?.label, days: status.trialDaysLeft }) });
  }
  if (!out.length) return null;
  return (
    <div className={s.page} style={{ gap: 10 }} role="region" aria-label={t("school.banner.region", { defaultValue: "School status" })}>
      {out.map((b, i) => (
        <div key={i} className={`${s.banner} ${s[b.tone]} ${open ? s.bannerOpen : ""}`}>
          <b.icon className={`${s.bannerIcon} ${s[`${b.tone}Ink`]}`} aria-hidden="true" />
          <p className={`${s.grow} ${s.bannerText}`}>{b.text}</p>
          <button type="button" className={s.bannerMore} aria-expanded={open} data-sound="toggle" onClick={() => setOpen((v) => !v)}>
            {open ? t("school.banner.less", { defaultValue: "Less" }) : t("school.banner.more", { defaultValue: "More" })}
          </button>
          {b.action && <Button size="sm" variant="soft" to={b.action.to}>{b.action.label}</Button>}
        </div>
      ))}
    </div>
  );
}

// Messages: the conversations, and (a tab away) how the admin hears about things.
function MessagesPage({ thread }) {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["inbox", "alerts"]);
  return (
    <div className={s.page}>
      <SubTabs label={t("school.nav.messages", { defaultValue: "Messages" })} value={pane} onChange={setPane}
        tabs={[
          { id: "inbox", label: t("school.msg.inbox", { defaultValue: "Conversations" }), icon: FaComments },
          { id: "alerts", label: t("school.msg.alerts", { defaultValue: "How I get notified" }), icon: FaBell },
        ]} />
      <SubPanel id="inbox" value={pane}><MessageCenter role="admin" initialThreadId={thread || undefined} /></SubPanel>
      <SubPanel id="alerts" value={pane}><NotificationPrefs role="admin" /></SubPanel>
    </div>
  );
}

// Announcements: write one (and see what was sent), or read what came in.
function AnnouncementsPage() {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["send", "received"]);
  return (
    <div className={s.page}>
      <SubTabs label={t("school.nav.announcements", { defaultValue: "Announcements" })} value={pane} onChange={setPane}
        tabs={[
          { id: "send", label: t("school.ann.send", { defaultValue: "Send news" }), icon: FaPaperPlane },
          { id: "received", label: t("school.ann.received", { defaultValue: "Received" }), icon: FaInbox },
        ]} />
      <SubPanel id="send" value={pane}><AnnouncementComposer role="admin" /></SubPanel>
      <SubPanel id="received" value={pane}><AnnouncementsPanel role="admin" compact /></SubPanel>
    </div>
  );
}

function Loading() {
  return (
    <div className={s.page} aria-busy="true">
      <Skeleton variant="text" width="40%" />
      <div className={s.tiles}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="tile" />)}</div>
      <Skeleton variant="chart" />
    </div>
  );
}

export default function SchoolApp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser } = useAdminAuth();
  const access = useLoad("/access");
  const status = useLoad("/status", { skip: !access.data });
  // "Connect by email" requests from teachers who want to join: counted on the Teachers entry.
  const links = useLinks("admin", { poll: 60000, enabled: Boolean(access.data) });
  const linkRequests = links.data?.incoming?.length || 0;

  const ctx = useMemo(() => {
    const a = access.data;
    const can = (perm) => Boolean(a && (a.perms.includes("*") || a.perms.includes(perm)));
    const has = (mod) => Boolean(a && a.modules.includes(mod));
    return { access: a, can, has, isAdmin: a?.role === "admin", reloadStatus: status.reload };
  }, [access.data, status.reload]);

  const logout = () => {
    try { localStorage.removeItem("admin_jwt"); } catch { /* ignore */ }
    navigate("/admin-login");
  };

  if (access.error) {
    const signedOut = access.error.status === 401;
    return (
      <div className="dash" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "var(--d-canvas)" }}>
        <div style={{ maxWidth: 520 }}>
          <EmptyState
            tone="error"
            title={signedOut ? t("school.signedOut", { defaultValue: "Please sign in" }) : access.error.code === "NO_ORG" ? t("school.noOrg", { defaultValue: "Register your school first" }) : t("school.loadError", { defaultValue: "We couldn't open your school" })}
            text={signedOut ? t("school.signedOutText", { defaultValue: "Your session ended or your access changed." }) : access.error.message}
            actionLabel={signedOut ? t("school.signIn", { defaultValue: "Sign in" }) : t("school.openClassic", { defaultValue: "Open the admin dashboard" })}
            to={signedOut ? "/admin-login" : "/admin-dashboard"}
          />
        </div>
      </div>
    );
  }

  const a = access.data;
  const g = {
    see: t("school.navGroup.see", { defaultValue: "See" }),
    manage: t("school.navGroup.manage", { defaultValue: "Manage" }),
    review: t("school.navGroup.review", { defaultValue: "Check" }),
    talk: t("school.navGroup.talk", { defaultValue: "Talk" }),
    setup: t("school.navGroup.setup", { defaultValue: "Set up" }),
  };
  // Grouped by task; the first four are what the phone's tab bar shows.
  const nav = !a ? [] : [
    ctx.can("analytics.read") && { key: "overview", group: g.see, label: t("school.nav.overview", { defaultValue: "Overview" }), icon: FaHome, to: BASE },
    ctx.can("analytics.read") && { key: "insights", group: g.see, label: t("school.nav.insights", { defaultValue: "Insights" }), icon: FaChartBar, to: `${BASE}/insights` },
    ctx.can("people.read") && { key: "people", group: g.manage, label: t("school.nav.people", { defaultValue: "People" }), icon: FaUsers, to: `${BASE}/people` },
    ctx.can("tree.read") && ctx.has("org.tree") && { key: "tree", group: g.manage, label: t("school.nav.tree", { defaultValue: "School tree" }), icon: FaSitemap, to: `${BASE}/tree` },
    ctx.can("analytics.read") && { key: "teachers", group: g.manage, label: t("school.nav.teachers", { defaultValue: "Teachers" }), icon: FaChalkboardTeacher, to: `${BASE}/teachers`, badge: linkRequests || undefined },
    ctx.can("questions.review") && { key: "questions", group: g.review, label: t("school.nav.questions", { defaultValue: "Questions" }), icon: FaQuestionCircle, to: `${BASE}/questions` },
    ctx.isAdmin && { key: "messages", group: g.talk, label: t("school.nav.messages", { defaultValue: "Messages" }), icon: FaComments, to: `${BASE}/messages` },
    ctx.isAdmin && { key: "announcements", group: g.talk, label: t("school.nav.announcements", { defaultValue: "Announcements" }), icon: FaBullhorn, to: `${BASE}/announcements` },
    ctx.isAdmin && { key: "settings", group: g.setup, label: t("school.nav.settings", { defaultValue: "Settings" }), icon: FaCog, to: `${BASE}/settings` },
  ].filter(Boolean);

  const seg = location.pathname.slice(BASE.length).split("/")[1] || "overview";
  const active = { units: "overview", students: "people", setup: "overview" }[seg] || seg;
  const home = ctx.can("analytics.read") ? BASE : `${BASE}/people`;

  return (
    <SchoolCtx.Provider value={ctx}>
      <DashboardShell
        brand={{ label: "LEARNIGO", role: t("school.brandRole", { defaultValue: "School" }), to: home }}
        nav={nav}
        active={active}
        bell={ctx.isAdmin ? <NotificationBell role="admin" /> : null}
        contextSwitcher={a && (
          <span className={`${s.pill} ${s.ctxPill}`} title={`${a.org.name} · ${a.roleLabel}`}>
            {a.org.logoUrl ? <img src={a.org.logoUrl} alt="" width="20" height="20" style={{ borderRadius: 6 }} /> : null}
            <span className={s.ctxText}>{a.org.name}<span className={s.ctxRole}> · {a.roleLabel}</span></span>
          </span>
        )}
        user={(
          <div className={s.row}>
            {ctx.isAdmin && <Button size="sm" variant="ghost" icon={FaArrowLeft} to="/admin-dashboard" className={s.phoneIcon} aria-label={t("school.classic", { defaultValue: "Classic view" })}>{t("school.classic", { defaultValue: "Classic view" })}</Button>}
            <Button size="sm" variant="ghost" icon={FaSignOutAlt} onClick={logout} className={s.phoneIcon} aria-label={t("school.logout", { defaultValue: "Sign out" })}>{t("school.logout", { defaultValue: "Sign out" })}</Button>
            {/* In a shell slot, so moving between pages doesn't cut the hello short. */}
            {a && <WelcomeToast name={adminUser?.name} place="school" />}
          </div>
        )}
      >
        {!a ? <Loading /> : (
          <>
            <StatusBanners status={status.data} access={a} />
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route index element={ctx.can("analytics.read") ? <OverviewPage /> : <Navigate to={`${BASE}/people`} replace />} />
                <Route path="units/:unitId" element={<OverviewPage />} />
                <Route path="tree" element={<TreePage />} />
                <Route path="people/*" element={<PeoplePage />} />
                <Route path="students/:id" element={<StudentPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="questions" element={<ReviewPage />} />
                <Route path="messages" element={ctx.isAdmin ? <MessagesPage thread={new URLSearchParams(location.search).get("thread")} /> : <Navigate to={home} replace />} />
                <Route path="announcements" element={ctx.isAdmin ? <AnnouncementsPage /> : <Navigate to={home} replace />} />
                <Route path="settings" element={ctx.isAdmin ? <SettingsPage /> : <Navigate to={home} replace />} />
                <Route path="setup" element={ctx.isAdmin ? <SetupPage /> : <Navigate to={home} replace />} />
                <Route path="*" element={<Navigate to={home} replace />} />
              </Routes>
            </Suspense>
          </>
        )}
      </DashboardShell>
    </SchoolCtx.Provider>
  );
}
