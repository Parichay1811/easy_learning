import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaUsers, FaChartLine, FaUpload, FaCog, FaSignOutAlt, FaClipboardList, FaComments, FaBullhorn } from "react-icons/fa";
import { DashboardShell, Button, Skeleton } from "../../components/dashboard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import TeacherQuestionUpload from "./TeacherQuestionUpload";
import TodayView from "./TodayView";
import GroupsView from "./GroupsView";
import GroupView from "./GroupView";
import StudentView from "./StudentView";
import SummaryView from "./SummaryView";
import PlanView from "./PlanView";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { NotificationBell, MessageCenter, NotificationPrefs, AnnouncementComposer, AnnouncementsPanel } from "../../components/comms";
import { API_ROOT, useLoad, useTeacherApi } from "./teacherApi";
import logo from "/logo.png";
import s from "./teacher.module.css";

// The question upload page still takes the older helper shape.
function useLegacyApi(token) {
  const call = useCallback(async (path, init = {}) => (await fetch(`${API_ROOT}/api/teacher${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } })).json(), [token]);
  const get = useCallback((path) => call(path), [call]);
  const post = useCallback((path, body, method = "POST") => call(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), [call]);
  const postForm = useCallback((path, formData, method = "POST") => call(path, { method, body: formData }), [call]);
  return { get, post, postForm };
}

// Teacher dashboard: one shell, views chosen by ?view= (today | groups | group | student |
// summary | plan | questions) so links and the back button work.
const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { teacherUser, teacherLogout, getTeacherToken } = useAdminAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const token = getTeacherToken();
  const legacy = useLegacyApi(token);
  const { get } = useTeacherApi();
  const [wsKey, setWsKey] = useState(0);

  useEffect(() => {
    if (!teacherUser) navigate("/teacher-login");
  }, [teacherUser, navigate]);

  const ws = useLoad(() => (token ? get("/workspace") : Promise.resolve({ ok: false })), [token, wsKey]);
  // Notification links use ?tab=messages&thread=<id> (the same shape on every role).
  const view = params.get("view") || (params.get("tab") === "messages" ? "messages" : "today");
  const id = params.get("id");
  const go = useCallback((v, extra = {}) => {
    setParams({ view: v, ...Object.fromEntries(Object.entries(extra).filter(([, x]) => x != null && x !== "")) });
    window.scrollTo?.(0, 0);
  }, [setParams]);

  const handleLogout = () => { teacherLogout(); navigate("/"); };
  const onSwitched = () => { setWsKey((k) => k + 1); setParams({ view: "today" }); };

  const nav = [
    { key: "today", label: t("teacher.nav.today", { defaultValue: "Today" }), icon: FaHome, to: "/teacher-dashboard?view=today" },
    { key: "groups", label: t("teacher.nav.groups", { defaultValue: "Groups" }), icon: FaUsers, to: "/teacher-dashboard?view=groups" },
    { key: "summary", label: t("teacher.nav.summary", { defaultValue: "Summary" }), icon: FaChartLine, to: "/teacher-dashboard?view=summary" },
    { key: "messages", label: t("teacher.nav.messages", { defaultValue: "Messages" }), icon: FaComments, to: "/teacher-dashboard?view=messages" },
    { key: "announcements", label: t("teacher.nav.announcements", { defaultValue: "Announcements" }), icon: FaBullhorn, to: "/teacher-dashboard?view=announcements" },
    { key: "tests", label: t("teacher.nav.tests", { defaultValue: "Tests & question bank" }), icon: FaClipboardList, to: "/teacher/tests" },
    { key: "questions", label: t("teacher.nav.questions", { defaultValue: "Upload questions" }), icon: FaUpload, to: "/teacher-dashboard?view=questions" },
    { key: "plan", label: t("teacher.nav.plan", { defaultValue: "Plan" }), icon: FaCog, to: "/teacher-dashboard?view=plan" },
  ];
  const active = { group: "groups", student: "groups" }[view] || view;
  const workspace = ws.data;

  if (!teacherUser) return null;
  return (
    <DashboardShell
      brand={{ label: "LEARNIGO", logo: <img src={logo} alt="" style={{ height: 28 }} />, to: "/teacher-dashboard" }}
      nav={nav}
      active={active}
      contextSwitcher={workspace && <WorkspaceSwitcher key={wsKey} current={{ id: workspace.workspace.id, name: workspace.workspace.name, kind: workspace.workspace.kind }} onSwitched={onSwitched} />}
      breadcrumbs={workspace ? [{ label: workspace.workspace.name, to: "/teacher-dashboard?view=today" }, { label: nav.find((n) => n.key === active)?.label || "" }] : undefined}
      bell={<NotificationBell role="teacher" />}
      user={<Button variant="ghost" size="sm" icon={FaSignOutAlt} onClick={handleLogout} aria-label={t("teacher.logout", { defaultValue: "Log out" })}><span className={s.hideNarrow}>{t("teacher.logout", { defaultValue: "Log out" })}</span></Button>}
    >
      <div key={wsKey} style={{ display: "contents" }}>
        {ws.loading && !workspace ? <Skeleton variant="chart" /> : (
          <>
            {view === "today" && <TodayView teacher={teacherUser} workspace={workspace} go={go} onWorkspaceChange={ws.reload} />}
            {view === "groups" && <GroupsView go={go} params={params} />}
            {view === "group" && id && <GroupView key={id} id={id} tab={params.get("tab") || "overview"} go={go} params={params} />}
            {view === "student" && id && <StudentView key={id} id={id} go={go} />}
            {view === "summary" && <SummaryView workspace={workspace} />}
            {view === "messages" && <><MessageCenter role="teacher" initialThreadId={params.get("thread") || undefined} /><NotificationPrefs role="teacher" /></>}
            {view === "announcements" && <><AnnouncementComposer role="teacher" /><AnnouncementsPanel role="teacher" compact /></>}
            {view === "plan" && <PlanView workspace={workspace} reload={ws.reload} />}
            {view === "questions" && <TeacherQuestionUpload get={legacy.get} post={legacy.post} postForm={legacy.postForm} token={token} />}
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default TeacherDashboard;
