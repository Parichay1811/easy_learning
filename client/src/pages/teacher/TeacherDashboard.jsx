import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaUsers, FaChartLine, FaUpload, FaCog, FaSignOutAlt, FaClipboardList, FaComments, FaBullhorn } from "react-icons/fa";
import { DashboardShell, Button, Skeleton, SubTabs, SubPanel, usePane, WelcomeToast } from "../../components/dashboard";
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
import s from "./teacher.module.css";

// The question upload page still takes the older helper shape.
function useLegacyApi(token) {
  const call = useCallback(async (path, init = {}) => (await fetch(`${API_ROOT}/api/teacher${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } })).json(), [token]);
  const get = useCallback((path) => call(path), [call]);
  const post = useCallback((path, body, method = "POST") => call(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), [call]);
  const postForm = useCallback((path, formData, method = "POST") => call(path, { method, body: formData }), [call]);
  return { get, post, postForm };
}

// Messages and the settings for how they reach you, as two sub-tabs.
function MessagesView({ thread }) {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["inbox", "settings"]);
  return (
    <>
      <SubTabs label={t("teacher.msg.tabs", { defaultValue: "Messages" })} value={pane} onChange={setPane} idBase="msg"
        tabs={[
          { id: "inbox", label: t("teacher.msg.inbox", { defaultValue: "Messages" }), icon: FaComments },
          { id: "settings", label: t("teacher.msg.settings", { defaultValue: "Notification settings" }), icon: FaCog },
        ]} />
      <SubPanel id="inbox" value={pane} idBase="msg"><MessageCenter role="teacher" initialThreadId={thread} /></SubPanel>
      <SubPanel id="settings" value={pane} idBase="msg"><NotificationPrefs role="teacher" /></SubPanel>
    </>
  );
}

// Write an announcement (and see what you sent) / read the ones you received.
function AnnouncementsView() {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["send", "received"]);
  return (
    <>
      <SubTabs label={t("teacher.ann.tabs", { defaultValue: "Announcements" })} value={pane} onChange={setPane} idBase="ann"
        tabs={[
          { id: "send", label: t("teacher.ann.send", { defaultValue: "Send and sent" }), icon: FaBullhorn },
          { id: "received", label: t("teacher.ann.received", { defaultValue: "Received" }), icon: FaComments },
        ]} />
      <SubPanel id="send" value={pane} idBase="ann"><AnnouncementComposer role="teacher" /></SubPanel>
      <SubPanel id="received" value={pane} idBase="ann"><AnnouncementsPanel role="teacher" compact /></SubPanel>
    </>
  );
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

  // Grouped by task; the first four are what a teacher opens most (the phone tab bar).
  const G = {
    teach: t("teacher.navGroup.teach", { defaultValue: "Teach" }),
    talk: t("teacher.navGroup.talk", { defaultValue: "Talk" }),
    tools: t("teacher.navGroup.tools", { defaultValue: "Tools and settings" }),
  };
  const nav = [
    { key: "today", group: G.teach, label: t("teacher.nav.today", { defaultValue: "Today" }), icon: FaHome, to: "/teacher-dashboard?view=today" },
    { key: "groups", group: G.teach, label: t("teacher.nav.groups", { defaultValue: "Groups" }), icon: FaUsers, to: "/teacher-dashboard?view=groups" },
    { key: "tests", group: G.teach, label: t("teacher.nav.tests", { defaultValue: "Tests & questions" }), icon: FaClipboardList, to: "/teacher/tests" },
    { key: "messages", group: G.talk, label: t("teacher.nav.messages", { defaultValue: "Messages" }), icon: FaComments, to: "/teacher-dashboard?view=messages" },
    { key: "announcements", group: G.talk, label: t("teacher.nav.announcements", { defaultValue: "Announcements" }), icon: FaBullhorn, to: "/teacher-dashboard?view=announcements" },
    { key: "questions", group: G.tools, label: t("teacher.nav.questions", { defaultValue: "Upload questions" }), icon: FaUpload, to: "/teacher-dashboard?view=questions" },
    { key: "summary", group: G.tools, label: t("teacher.nav.summary", { defaultValue: "Summary" }), icon: FaChartLine, to: "/teacher-dashboard?view=summary" },
    { key: "plan", group: G.tools, label: t("teacher.nav.plan", { defaultValue: "Plan" }), icon: FaCog, to: "/teacher-dashboard?view=plan" },
  ];
  const active = { group: "groups", student: "groups" }[view] || view;
  const workspace = ws.data;

  if (!teacherUser) return null;
  return (
    <DashboardShell
      brand={{ label: "LEARNIGO", role: t("teacher.brandRole", { defaultValue: "Teacher" }), to: "/teacher-dashboard" }}
      nav={nav}
      active={active}
      contextSwitcher={workspace && <WorkspaceSwitcher key={wsKey} current={{ id: workspace.workspace.id, name: workspace.workspace.name, kind: workspace.workspace.kind }} onSwitched={onSwitched} />}
      breadcrumbs={workspace && view !== "today" ? [{ label: workspace.workspace.name, to: "/teacher-dashboard?view=today" }, { label: nav.find((n) => n.key === active)?.label || "" }] : undefined}
      zoomKey={`${view}|${id || ""}|${wsKey}`}
      bell={<NotificationBell role="teacher" />}
      user={(
        <>
          <Button variant="ghost" size="sm" icon={FaSignOutAlt} onClick={handleLogout} aria-label={t("teacher.logout", { defaultValue: "Log out" })}><span className={s.hideNarrow}>{t("teacher.logout", { defaultValue: "Log out" })}</span></Button>
          {/* Lives in the bar (not the page) so moving between pages does not cut the hello short. */}
          <WelcomeToast name={teacherUser?.name} place="teacher" />
        </>
      )}
    >
      <div key={wsKey} style={{ display: "contents", gap: "inherit" }}>
        {ws.loading && !workspace ? <Skeleton variant="chart" /> : (
          <>
            {view === "today" && <TodayView teacher={teacherUser} workspace={workspace} go={go} onWorkspaceChange={ws.reload} />}
            {view === "groups" && <GroupsView go={go} params={params} />}
            {view === "group" && id && <GroupView key={id} id={id} tab={params.get("tab") || "overview"} go={go} params={params} />}
            {view === "student" && id && <StudentView key={id} id={id} go={go} />}
            {view === "summary" && <SummaryView workspace={workspace} />}
            {view === "messages" && <MessagesView thread={params.get("thread") || undefined} />}
            {view === "announcements" && <AnnouncementsView />}
            {view === "plan" && <PlanView workspace={workspace} reload={ws.reload} />}
            {view === "questions" && <TeacherQuestionUpload get={legacy.get} post={legacy.post} postForm={legacy.postForm} token={token} />}
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default TeacherDashboard;
