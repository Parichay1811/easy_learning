// The platform console (SUPER_ADMIN.md): one frame, sections by staff role,
// a live bar on top. The section lives in the URL (?section=orgs&org=…), so a
// link shares the exact view.
import { lazy, Suspense, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBuilding, FaChartLine, FaClipboardCheck, FaCog, FaComments, FaFlag, FaHeartbeat, FaHome, FaHistory,
  FaMoneyBillWave, FaQuestionCircle, FaSignOutAlt, FaUserShield, FaUsers, FaChild, FaUserSecret, FaBullhorn,
} from "react-icons/fa";
import { DashboardShell, Skeleton } from "../../../components/dashboard";
import { NotificationBell, AnnouncementComposer, AnnouncementsPanel } from "../../../components/comms";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { API, useLoad, money } from "./api";
import s from "./console.module.css";

const Overview = lazy(() => import("./Overview"));
const Orgs = lazy(() => import("./Orgs"));
const Approvals = lazy(() => import("./Approvals"));
const People = lazy(() => import("./People"));
const Families = lazy(() => import("./Families"));
const Analytics = lazy(() => import("./Analytics"));
const Support = lazy(() => import("./Support"));
const Privacy = lazy(() => import("./Privacy"));
const Content = lazy(() => import("./Content"));
const Billing = lazy(() => import("./Billing"));
const Health = lazy(() => import("./Health"));
const Flags = lazy(() => import("./Flags"));
const Audit = lazy(() => import("./Audit"));
const Staff = lazy(() => import("./Staff"));
const Settings = lazy(() => import("./Settings"));

// Who sees which section (owners see everything). Mirrors the server's gates.
// Platform announcements (FND-052 / SUP-063): compose for everyone or a segment, see read rates.
function Announcements() {
  return <><AnnouncementComposer role="superadmin" /><AnnouncementsPanel role="superadmin" compact /></>;
}

const SECTIONS = [
  { key: "overview", icon: FaHome, label: "Overview", roles: "*", C: Overview },
  { key: "orgs", icon: FaBuilding, label: "Organisations", roles: ["support", "finance", "analyst"], C: Orgs },
  { key: "approvals", icon: FaClipboardCheck, label: "Approvals", roles: ["support"], C: Approvals, badge: "pendingOrgs" },
  { key: "people", icon: FaUsers, label: "People", roles: ["support"], C: People },
  { key: "families", icon: FaChild, label: "Families", roles: ["support"], C: Families },
  { key: "analytics", icon: FaChartLine, label: "Analytics", roles: ["analyst", "support", "finance", "engineer", "content"], C: Analytics },
  { key: "support", icon: FaComments, label: "Support", roles: ["support"], C: Support, badge: "openSupport" },
  { key: "announcements", icon: FaBullhorn, label: "Announcements", roles: ["support"], C: Announcements },
  { key: "privacy", icon: FaUserSecret, label: "Data rights", roles: ["support"], C: Privacy, badge: "dataPending" },
  { key: "content", icon: FaQuestionCircle, label: "Content", roles: ["content"], C: Content },
  { key: "billing", icon: FaMoneyBillWave, label: "Plans & billing", roles: ["finance", "support"], C: Billing },
  { key: "health", icon: FaHeartbeat, label: "Health & ops", roles: ["engineer"], C: Health },
  { key: "flags", icon: FaFlag, label: "Flags", roles: ["engineer", "support", "finance"], C: Flags },
  { key: "audit", icon: FaHistory, label: "Audit log", roles: ["support"], C: Audit },
  { key: "staff", icon: FaUserShield, label: "Staff", roles: [], C: Staff },
  { key: "settings", icon: FaCog, label: "Settings", roles: "*", C: Settings },
];
const canSee = (role, section) => {
  const sec = SECTIONS.find((x) => x.key === section);
  return !!sec && (role === "owner" || sec.roles === "*" || sec.roles.includes(role));
};

export default function SuperAdminConsole() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { superAdminUser, superAdminLogout } = useAdminAuth();
  const role = superAdminUser?.staffRole || "owner";

  useEffect(() => { if (!superAdminUser) navigate("/superadmin-login"); }, [superAdminUser, navigate]);
  useEffect(() => { document.title = t("sa.title", "Learnigo console"); }, [t]);

  const live = useLoad("/live", { pollMs: 30_000, skip: !superAdminUser });
  const L = live.data?.live;
  const visible = useMemo(() => SECTIONS.filter((x) => canSee(role, x.key)), [role]);
  const active = visible.some((x) => x.key === params.get("section")) ? params.get("section") : "overview";
  const go = (section, extra = {}) => setParams(() => new URLSearchParams({ section, ...extra }));
  const Current = SECTIONS.find((x) => x.key === active).C;

  if (!superAdminUser) return null;

  const nav = visible.map((x) => ({
    key: x.key, label: t(`sa.nav.${x.key}`, x.label), icon: x.icon, onClick: () => go(x.key),
    badge: x.badge && L?.[x.badge] ? L[x.badge] : undefined,
  }));

  const logout = async () => {
    try {
      await fetch(`${API}/api/superadmin/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("superadmin_jwt")}` } });
    } catch { /* signed out locally anyway */ }
    superAdminLogout();
    navigate("/superadmin-login");
  };

  return (
    <DashboardShell
      brand={{ label: "LEARNIGO · Console", to: "/superadmin-dashboard" }}
      nav={nav}
      active={active}
      bell={<NotificationBell role="superadmin" />}
      breadcrumbs={[{ label: t("sa.platform", "Platform"), to: "/superadmin-dashboard" }, { label: t(`sa.nav.${active}`, SECTIONS.find((x) => x.key === active).label) }]}
      user={
        <div className={s.userMenu}>
          <span className={s.avatar} aria-hidden="true">{(superAdminUser.name || "S").slice(0, 1)}</span>
          <span className={s.hideSm}>
            <span className={s.strong}>{superAdminUser.name}</span><br />
            <span className={s.roleTag}>{superAdminUser.breakGlass ? t("sa.breakGlass", "break-glass owner") : role}</span>
          </span>
          <button type="button" className={s.iconBtn} onClick={logout} aria-label={t("sa.signOut", "Sign out")} title={t("sa.signOut", "Sign out")}><FaSignOutAlt aria-hidden="true" /></button>
        </div>
      }
    >
      <div className={s.live} role="region" aria-label={t("sa.live.label", "Live platform counters")} aria-live="off">
        <span><span className={s.liveDot} aria-hidden="true" />{t("sa.live.title", "Live")}</span>
        {L ? (
          <>
            <button type="button" className={s.liveItem} onClick={() => canSee(role, "analytics") && go("analytics")}><strong>{L.learnersNow.toLocaleString()}</strong> {t("sa.live.now", "learners now")}</button>
            <button type="button" className={s.liveItem} onClick={() => canSee(role, "analytics") && go("analytics")}><strong>{L.dau.toLocaleString()}</strong> {t("sa.live.dau", "learners today")}</button>
            {L.mrrCents != null && <button type="button" className={s.liveItem} onClick={() => canSee(role, "billing") && go("analytics", { tab: "revenue" })}><strong>{money(L.mrrCents, L.currency)}</strong> MRR</button>}
            <button type="button" className={s.liveItem} onClick={() => canSee(role, "approvals") && go("approvals")}><strong>{L.pendingOrgs}</strong> {t("sa.live.pending", "awaiting approval")}</button>
            <button type="button" className={s.liveItem} onClick={() => canSee(role, "support") && go("support")}><strong>{L.openSupport}</strong> {t("sa.live.support", "open support")}</button>
            <button type="button" className={s.liveItem} onClick={() => canSee(role, "privacy") && go("privacy")}><strong>{L.dataPending}</strong> {t("sa.live.gdpr", "data requests")}{L.dataOverdue ? ` (${L.dataOverdue} ${t("sa.live.overdue", "overdue")})` : ""}</button>
          </>
        ) : <Skeleton variant="text" width={420} />}
      </div>
      <Suspense fallback={<Skeleton variant="chart" />}>
        <Current role={role} go={go} params={params} setParams={setParams} me={superAdminUser} live={L} />
      </Suspense>
    </DashboardShell>
  );
}
