import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaChartLine, FaClock, FaUsers, FaFileAlt, FaShieldAlt, FaHeadset, FaSchool, FaComments, FaSignOutAlt, FaUserFriends } from "react-icons/fa";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { DashboardShell, EmptyState, Skeleton, SubTabs, SubPanel, usePane, WelcomeToast } from "../../components/dashboard";
import { useLinks } from "../../components/links";
import { useParentApi } from "./parentApi";
import ChildSwitcher from "./ChildSwitcher";
import ParentHome from "./ParentHome";
import ParentLearning from "./ParentLearning";
import ParentActivity from "./ParentActivity";
import ParentFamily from "./ParentFamily";
import ParentReports from "./ParentReports";
import ParentPrivacy from "./ParentPrivacy";
import ParentChat from "./ParentChat";
import ParentTogether from "./ParentTogether";
import ParentSchool from "./ParentSchool";
import { NotificationBell, MessageCenter, NotificationPrefs } from "../../components/comms";
import SetupWizard from "./SetupWizard";
import s from "./parent.module.css";

const TABS = ["home", "learning", "activity", "together", "school", "messages", "family", "reports", "privacy", "support"];
const INVITE_KEY = "parent_invite";

// The parent's dashboard (PAR-*): one shell, a child switcher, and a page per tab.
// State lives in the URL (?tab=&pane=&child=&range=…) so a link opens the same view:
// `tab` is the menu entry, `pane` the sub-tab inside it.
const ParentDashboard = () => {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.${k}`, { defaultValue: d, ...o });
  const { parentUser, parentLogout, getParentToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getParentToken();
  const api = useParentApi(token);
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "home";

  const [children, setChildren] = useState(null);
  const [invites, setInvites] = useState([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [setupFor, setSetupFor] = useState(null);
  const [notice, setNotice] = useState("");
  // "Connect by email" requests waiting for this parent: counted on the Family entry.
  const links = useLinks("parent", { poll: 60000, enabled: Boolean(token) });
  const linkRequests = links.data?.incoming?.length || 0;

  useEffect(() => {
    if (!parentUser && parentUser !== undefined) navigate("/parent-login");
  }, [parentUser, navigate]);

  const loadChildren = useCallback(async () => {
    const d = await api.get("/children");
    setChildren(d.success ? d.children : []);
    return d.success ? d.children : [];
  }, [api]);

  const loadInvites = useCallback(async () => {
    const d = await api.get("/guardian-invites");
    if (d.success) setInvites(d.invites);
  }, [api]);

  // An invite link (…/parent-login?invite=…) is kept until the parent is signed in, then accepted here.
  useEffect(() => {
    if (!token) return;
    (async () => {
      let pending = null;
      try { pending = sessionStorage.getItem(INVITE_KEY); } catch { /* private mode */ }
      if (pending) {
        try { sessionStorage.removeItem(INVITE_KEY); } catch { /* ignore */ }
        const r = await api.post("/guardian-invites/accept", { token: pending });
        setNotice(r.success ? T("invite.accepted", "You can now follow {{name}}'s learning.", { name: r.child?.name }) : r.message);
      }
      await Promise.all([loadChildren(), loadInvites()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const poll = async () => { const d = await api.get("/chat/unread-count"); if (d.success) setChatUnread(d.count); };
    poll();
    const iv = setInterval(poll, 25000);
    return () => clearInterval(iv);
  }, [api, token]);

  const verified = useMemo(() => (children || []).filter((c) => c.linkStatus === "verified"), [children]);
  const childId = params.get("child");
  const child = verified.find((c) => c._id === childId) || verified[0] || null;

  // First-run setup for a newly linked child (PAR-004): once, skippable.
  const [dismissed, setDismissed] = useState(() => new Set());
  let autoSetup = null;
  if (child && !child.onboardedAt && tab === "home" && !dismissed.has(child._id)) {
    let skipped = false;
    try { skipped = localStorage.getItem(`parent_setup_skip_${child._id}`) === "1"; } catch { /* ignore */ }
    if (!skipped) autoSetup = child;
  }
  const wizardFor = setupFor || autoSetup;

  const go = useCallback((nextTab, extra = {}) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("tab", nextTab);
      if (nextTab !== prev.get("tab")) n.delete("pane");
      for (const [k, v] of Object.entries(extra)) { if (v == null) n.delete(k); else n.set(k, v); }
      return n;
    });
    window.scrollTo?.({ top: 0 });
  }, [setParams]);

  const selectChild = (id) => setParams((prev) => { const n = new URLSearchParams(prev); n.set("child", id); return n; });

  // Grouped by what a parent comes to do: follow the child, talk, family settings.
  // The first four are the phone's tab bar; the rest sit under "More".
  const G = { child: T("group.child", "Your child"), talk: T("group.talk", "Talk"), family: T("group.family", "Family and settings") };
  const nav = [
    { key: "home", group: G.child, label: T("nav.home", "Home"), icon: FaHome, onClick: () => go("home") },
    { key: "learning", group: G.child, label: T("nav.learning", "Learning"), icon: FaChartLine, onClick: () => go("learning") },
    { key: "activity", group: G.child, label: T("nav.activity", "Activity"), icon: FaClock, onClick: () => go("activity") },
    { key: "school", group: G.child, label: T("nav.school", "School"), icon: FaSchool, onClick: () => go("school") },
    { key: "together", group: G.child, label: T("nav.together", "Together"), icon: FaUserFriends, onClick: () => go("together") },
    { key: "reports", group: G.child, label: T("nav.reports", "Reports"), icon: FaFileAlt, onClick: () => go("reports") },
    { key: "messages", group: G.talk, label: T("nav.messages", "Messages"), icon: FaComments, onClick: () => go("messages") },
    { key: "support", group: G.talk, label: T("nav.support", "Support"), icon: FaHeadset, onClick: () => go("support"), badge: chatUnread || undefined },
    { key: "family", group: G.family, label: T("nav.family", "Family"), icon: FaUsers, onClick: () => go("family"), badge: (invites.length + linkRequests) || undefined },
    { key: "privacy", group: G.family, label: T("nav.privacy", "Privacy"), icon: FaShieldAlt, onClick: () => go("privacy") },
  ];

  const signOut = () => { parentLogout(); navigate("/"); };
  const needsChild = ["home", "learning", "activity", "together", "school", "reports", "privacy"].includes(tab);

  let page;
  if (children === null) {
    page = <><Skeleton variant="rect" height={140} /><Skeleton variant="chart" /></>;
  } else if (tab === "family") {
    page = <ParentFamily api={api} kids={children} child={child} invites={invites} parent={parentUser}
      onChanged={async () => { await Promise.all([loadChildren(), loadInvites()]); }} onSelect={selectChild} onSetup={setSetupFor} go={go} />;
  } else if (tab === "support") {
    page = <ParentChat api={api} onRead={() => setChatUnread(0)} />;
  } else if (tab === "messages") {
    page = <ParentMessages thread={params.get("thread") || undefined} />;
  } else if (needsChild && !child) {
    page = (
      <div className={s.card}>
        <EmptyState
          icon="👋"
          title={children.length ? T("empty.notLinked", "Your child's link isn't confirmed yet") : T("empty.title", "Add your child to see their learning")}
          text={children.length
            ? T("empty.notLinkedText", "Once the link is confirmed with a code or by the school, their learning shows up here.")
            : T("empty.text", "Create an account for a young child, or link a child who already uses Learnigo.")}
          actionLabel={T("empty.action", "Add or link a child")}
          onAction={() => go("family", { add: "1" })}
        />
      </div>
    );
  } else if (tab === "home") page = <ParentHome api={api} child={child} go={go} />;
  else if (tab === "learning") page = <ParentLearning api={api} child={child} go={go} />;
  else if (tab === "activity") page = <ParentActivity api={api} child={child} onChanged={loadChildren} />;
  else if (tab === "together") page = <ParentTogether api={api} child={child} onChanged={loadChildren} />;
  else if (tab === "school") page = <ParentSchool api={api} child={child} />;
  else if (tab === "reports") page = <ParentReports api={api} child={child} />;
  else if (tab === "privacy") page = <ParentPrivacy api={api} child={child} onChanged={loadChildren} />;

  return (
    <DashboardShell
      brand={{ label: "LEARNIGO", role: T("brandRole", "Parent"), to: "/" }}
      nav={nav}
      active={tab}
      bell={<NotificationBell role="parent" />}
      contextSwitcher={verified.length ? <ChildSwitcher kids={verified} selected={child?._id} onSelect={selectChild} /> : null}
      user={(
        <span className={s.topUser}>
          <span className={s.srOnly}>{parentUser?.email}</span>
          <button type="button" className={s.signOut} onClick={signOut}><FaSignOutAlt aria-hidden="true" /><span className={s.signOutText}>{T("signOut", "Sign out")}</span></button>
          {/* Here, not in the page, so moving between tabs doesn't cut the hello short. */}
          <WelcomeToast name={parentUser?.name} place="parent" ready={parentUser !== undefined} />
        </span>
      )}
    >
      {notice && <p className={s.notice} role="status">{notice}</p>}
      {page}
      {wizardFor && (
        <SetupWizard key={wizardFor._id} api={api} child={wizardFor}
          onClose={async (done) => {
            if (!done) { try { localStorage.setItem(`parent_setup_skip_${wizardFor._id}`, "1"); } catch { /* ignore */ } }
            setDismissed((d) => new Set(d).add(wizardFor._id));
            setSetupFor(null);
            await loadChildren();
          }} />
      )}
    </DashboardShell>
  );
};

// Messages: the conversations, and how the parent wants to hear about new ones.
function ParentMessages({ thread }) {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["inbox", "settings"]);
  return (
    <>
      <SubTabs label={t("parent.msg.tabs", { defaultValue: "Messages" })} value={pane} onChange={setPane}
        tabs={[
          { id: "inbox", label: t("parent.msg.inbox", { defaultValue: "Conversations" }) },
          { id: "settings", label: t("parent.msg.settings", { defaultValue: "How I get notified" }), short: t("parent.msg.settingsShort", { defaultValue: "Settings" }) },
        ]} />
      <SubPanel id="inbox" value={pane}><MessageCenter role="parent" initialThreadId={thread} /></SubPanel>
      <SubPanel id="settings" value={pane}><NotificationPrefs role="parent" /></SubPanel>
    </>
  );
}

export default ParentDashboard;
