// The school admin's dashboard (docs/todo/ADMIN.md): one shell, role-aware nav,
// approval / plan / seat banners (ADM-002), and the school pages. Staff
// (coordinator, office, viewer) use the same app and see only what their role allows.
import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaHome, FaSitemap, FaUsers, FaChalkboardTeacher, FaChartBar, FaQuestionCircle, FaCog, FaSignOutAlt,
  FaExclamationTriangle, FaCheckCircle, FaHourglassHalf, FaArrowLeft, FaComments, FaBullhorn,
} from "react-icons/fa";
import { DashboardShell, Skeleton, EmptyState, Button } from "../../../components/dashboard";
import { NotificationBell, MessageCenter, NotificationPrefs, AnnouncementComposer, AnnouncementsPanel } from "../../../components/comms";
import { useLoad } from "./api";
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
  if (!status) return null;
  const out = [];
  const st = status.org?.status;
  if (st === "pending") {
    out.push({ tone: "attention", icon: FaHourglassHalf, text: t("school.banner.pending", { defaultValue: "Your school is waiting for approval by Learnigo. You can set everything up now; students see your content once it is approved." }) });
  } else if (st === "rejected") {
    out.push({
      tone: "alert", icon: FaExclamationTriangle,
      text: t("school.banner.rejected", { defaultValue: "Your registration was not approved: {{reason}}", reason: status.org.rejectionReason || "no reason given" }),
      action: access.role === "admin" ? { label: t("school.banner.resubmit", { defaultValue: "Edit and resubmit" }), to: "/admin-dashboard" } : null,
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
        <div key={i} className={`${s.banner} ${s[b.tone]}`}>
          <b.icon className={`${s.bannerIcon} ${s[`${b.tone}Ink`]}`} aria-hidden="true" />
          <p className={s.grow}>{b.text}</p>
          {b.action && <Button size="sm" variant="soft" to={b.action.to}>{b.action.label}</Button>}
        </div>
      ))}
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
  const access = useLoad("/access");
  const status = useLoad("/status", { skip: !access.data });

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
  const nav = !a ? [] : [
    ctx.can("analytics.read") && { key: "overview", label: t("school.nav.overview", { defaultValue: "Overview" }), icon: FaHome, to: BASE },
    ctx.can("tree.read") && ctx.has("org.tree") && { key: "tree", label: t("school.nav.tree", { defaultValue: "School tree" }), icon: FaSitemap, to: `${BASE}/tree` },
    ctx.can("people.read") && { key: "people", label: t("school.nav.people", { defaultValue: "People" }), icon: FaUsers, to: `${BASE}/people` },
    ctx.can("analytics.read") && { key: "teachers", label: t("school.nav.teachers", { defaultValue: "Teachers" }), icon: FaChalkboardTeacher, to: `${BASE}/teachers` },
    ctx.can("analytics.read") && { key: "insights", label: t("school.nav.insights", { defaultValue: "Insights" }), icon: FaChartBar, to: `${BASE}/insights` },
    ctx.can("questions.review") && { key: "questions", label: t("school.nav.questions", { defaultValue: "Questions" }), icon: FaQuestionCircle, to: `${BASE}/questions` },
    ctx.isAdmin && { key: "messages", label: t("school.nav.messages", { defaultValue: "Messages" }), icon: FaComments, to: `${BASE}/messages` },
    ctx.isAdmin && { key: "announcements", label: t("school.nav.announcements", { defaultValue: "Announcements" }), icon: FaBullhorn, to: `${BASE}/announcements` },
    ctx.isAdmin && { key: "settings", label: t("school.nav.settings", { defaultValue: "Settings" }), icon: FaCog, to: `${BASE}/settings` },
  ].filter(Boolean);

  const seg = location.pathname.slice(BASE.length).split("/")[1] || "overview";
  const active = { units: "overview", students: "people", setup: "overview" }[seg] || seg;
  const home = ctx.can("analytics.read") ? BASE : `${BASE}/people`;

  return (
    <SchoolCtx.Provider value={ctx}>
      <DashboardShell
        brand={{ label: "LEARNIGO", to: home }}
        nav={nav}
        active={active}
        bell={ctx.isAdmin ? <NotificationBell role="admin" /> : null}
        contextSwitcher={a && (
          <span className={`${s.pill} ${s.ctxPill}`} title={`${a.org.name} · ${a.roleLabel}`}>
            {a.org.logoUrl ? <img src={a.org.logoUrl} alt="" width="20" height="20" style={{ borderRadius: 6 }} /> : null}
            <span className={s.ctxText}>{a.org.name} · {a.roleLabel}</span>
          </span>
        )}
        user={(
          <div className={s.row}>
            {ctx.isAdmin && <Button size="sm" variant="ghost" icon={FaArrowLeft} to="/admin-dashboard" className={s.phoneIcon} aria-label={t("school.classic", { defaultValue: "Classic view" })}>{t("school.classic", { defaultValue: "Classic view" })}</Button>}
            <Button size="sm" variant="ghost" icon={FaSignOutAlt} onClick={logout} className={s.phoneIcon} aria-label={t("school.logout", { defaultValue: "Sign out" })}>{t("school.logout", { defaultValue: "Sign out" })}</Button>
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
                <Route path="messages" element={ctx.isAdmin ? <><MessageCenter role="admin" initialThreadId={new URLSearchParams(location.search).get("thread") || undefined} /><NotificationPrefs role="admin" /></> : <Navigate to={home} replace />} />
                <Route path="announcements" element={ctx.isAdmin ? <><AnnouncementComposer role="admin" /><AnnouncementsPanel role="admin" compact /></> : <Navigate to={home} replace />} />
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
