// The platform console (SUPER_ADMIN.md): one frame, sections by staff role,
// grouped by task in the menu (pills switch the pages of a group), live counters
// in the top bar. The section lives in the URL (?section=orgs&org=…), so a link
// shares the exact view.
import { lazy, Suspense, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaBuilding, FaChartLine, FaClipboardCheck, FaCog, FaComments, FaFlag, FaHeartbeat, FaHome, FaHistory,
  FaMoneyBillWave, FaQuestionCircle, FaSignOutAlt, FaUserShield, FaUsers, FaChild, FaUserSecret, FaBullhorn, FaGraduationCap,
} from "react-icons/fa";
import { DashboardShell, Skeleton, SubTabs } from "../../../components/dashboard";
import { NotificationBell } from "../../../components/comms";
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
const Announcements = lazy(() => import("./Announcements"));
const Settings = lazy(() => import("./Settings"));

// Who sees which section (owners see everything). Mirrors the server's gates.
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

// The menu groups the sections by task (6 entries instead of 16, so it fits every
// screen and the phone's tab bar). Inside a group, pills switch between its pages.
// A page is a section, or a section with a preset ?tab= (the analytics views).
const GROUPS = [
  { key: "home", icon: FaHome, label: "Overview", pages: [{ key: "overview", section: "overview" }] },
  { key: "orgs", icon: FaBuilding, label: "Organisations", pages: [{ key: "orgs", section: "orgs" }, { key: "approvals", section: "approvals" }] },
  { key: "people", icon: FaUsers, label: "People", pages: [{ key: "people", section: "people" }, { key: "families", section: "families" }, { key: "staff", section: "staff" }] },
  { key: "help", icon: FaComments, label: "Support", pages: [{ key: "support", section: "support", label: "Inbox" }, { key: "privacy", section: "privacy" }, { key: "announcements", section: "announcements" }] },
  { key: "insights", icon: FaChartLine, label: "Insights", pages: [
    { key: "growth", section: "analytics", tab: "growth", label: "Growth", icon: FaChartLine },
    { key: "learning", section: "analytics", tab: "learning", label: "Learning", icon: FaGraduationCap },
    { key: "revenue", section: "analytics", tab: "revenue", label: "Revenue", icon: FaMoneyBillWave, roles: ["owner", "finance", "analyst"] },
    { key: "orghealth", section: "analytics", tab: "health", label: "Organisation health", icon: FaBuilding },
    { key: "health", section: "health" },
    { key: "audit", section: "audit" },
  ] },
  { key: "platform", icon: FaCog, label: "Platform", pages: [{ key: "content", section: "content" }, { key: "billing", section: "billing" }, { key: "flags", section: "flags" }, { key: "settings", section: "settings" }] },
];
const pageOk = (role, p) => canSee(role, p.section) && (!p.roles || role === "owner" || p.roles.includes(role));

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
  const groups = useMemo(() => GROUPS.map((g) => ({ ...g, pages: g.pages.filter((p) => pageOk(role, p)) })).filter((g) => g.pages.length), [role]);

  if (!superAdminUser) return null;

  const sectionOf = (key) => SECTIONS.find((x) => x.key === key);
  const pageLabel = (p) => (p.label ? t(`sa.page.${p.key}`, p.label) : t(`sa.nav.${p.section}`, sectionOf(p.section).label));
  const pageBadge = (p) => { const b = sectionOf(p.section).badge; return b && L?.[b] ? L[b] : undefined; };
  const tabNow = params.get("tab") || "growth";
  const isPage = (p) => p.section === active && (!p.tab || p.tab === tabNow);
  const group = groups.find((g) => g.pages.some(isPage)) || groups.find((g) => g.pages.some((p) => p.section === active)) || groups[0];
  const page = group.pages.find(isPage) || group.pages.find((p) => p.section === active) || group.pages[0];
  const open = (p) => go(p.section, p.tab ? { tab: p.tab } : {});

  const nav = groups.map((g) => {
    const badge = g.pages.reduce((n, p) => n + (pageBadge(p) || 0), 0);
    return { key: g.key, label: t(`sa.group.${g.key}`, g.label), icon: g.icon, onClick: () => open(g.pages[0]), badge: badge || undefined };
  });

  const logout = async () => {
    try {
      await fetch(`${API}/api/superadmin/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("superadmin_jwt")}` } });
    } catch { /* signed out locally anyway */ }
    superAdminLogout();
    navigate("/superadmin-login");
  };

  const liveBar = (where) => (
    <div className={`${s.live} ${where === "top" ? s.liveTop : s.liveMain}`} role="region" aria-label={t("sa.live.label", "Live platform counters")} aria-live="off" data-print="hide">
      <span className={s.liveTitle}><span className={s.liveDot} aria-hidden="true" />{t("sa.live.title", "Live")}</span>
      {L ? (
        <>
          <button type="button" className={s.liveItem} onClick={() => canSee(role, "analytics") && go("analytics")}><strong>{L.learnersNow.toLocaleString()}</strong> {t("sa.live.now", "learners now")}</button>
          <button type="button" className={`${s.liveItem} ${s.liveLong}`} onClick={() => canSee(role, "analytics") && go("analytics")}><strong>{L.dau.toLocaleString()}</strong> {t("sa.live.dau", "learners today")}</button>
          {L.mrrCents != null && <button type="button" className={`${s.liveItem} ${s.liveLong}`} onClick={() => canSee(role, "billing") && go("analytics", { tab: "revenue" })}><strong>{money(L.mrrCents, L.currency)}</strong> MRR</button>}
          <button type="button" className={`${s.liveItem} ${L.pendingOrgs ? s.liveWarn : ""}`} onClick={() => canSee(role, "approvals") && go("approvals")}><strong>{L.pendingOrgs}</strong> {t("sa.live.pending", "awaiting approval")}</button>
          <button type="button" className={`${s.liveItem} ${L.openSupport ? s.liveWarn : ""}`} onClick={() => canSee(role, "support") && go("support")}><strong>{L.openSupport}</strong> {t("sa.live.support", "open support")}</button>
          <button type="button" className={`${s.liveItem} ${L.dataOverdue ? s.liveWarn : ""}`} onClick={() => canSee(role, "privacy") && go("privacy")}><strong>{L.dataPending}</strong> {t("sa.live.gdpr", "data requests")}{L.dataOverdue ? ` (${L.dataOverdue} ${t("sa.live.overdue", "overdue")})` : ""}</button>
        </>
      ) : <Skeleton variant="text" width={240} />}
    </div>
  );

  return (
    <DashboardShell
      brand={{ label: "LEARNIGO · Console", to: "/superadmin-dashboard" }}
      sideNote={false}
      nav={nav}
      active={group.key}
      topbar={liveBar("top")}
      bell={<NotificationBell role="superadmin" />}
      user={
        <div className={s.userMenu}>
          <span className={s.avatar} aria-hidden="true">{(superAdminUser.name || "S").slice(0, 1)}</span>
          <span className={s.hideMd}>
            <span className={s.strong}>{superAdminUser.name}</span><br />
            <span className={s.roleTag}>{superAdminUser.breakGlass ? t("sa.breakGlass", "break-glass owner") : role}</span>
          </span>
          <button type="button" className={s.iconBtn} onClick={logout} aria-label={t("sa.signOut", "Sign out")} title={t("sa.signOut", "Sign out")}><FaSignOutAlt aria-hidden="true" /></button>
        </div>
      }
    >
      {liveBar("main")}
      <h1 className={s.srOnly}>{pageLabel(page)}</h1>
      {group.pages.length > 1 && (
        <SubTabs
          idBase="sa-page"
          sticky={false}
          label={t(`sa.group.${group.key}`, group.label)}
          value={page.key}
          onChange={(k) => open(group.pages.find((p) => p.key === k))}
          tabs={group.pages.map((p) => ({ id: p.key, label: pageLabel(p), icon: p.icon || sectionOf(p.section).icon, badge: pageBadge(p) }))}
        />
      )}
      <Suspense fallback={<Skeleton variant="chart" />}>
        <div id={`sa-page-panel-${page.key}`} role={group.pages.length > 1 ? "tabpanel" : undefined} aria-labelledby={group.pages.length > 1 ? `sa-page-tab-${page.key}` : undefined} className={s.sectionBody}>
          <Current role={role} go={go} params={params} setParams={setParams} me={superAdminUser} live={L} />
        </div>
      </Suspense>
    </DashboardShell>
  );
}
