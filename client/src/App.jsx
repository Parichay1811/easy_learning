import { Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  createRoutesFromElements,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { installUiSounds, navSoundWithin, sfx } from "./utils/sounds";
import { notePath } from "./utils/navMemory";
import { lazyPage, preloadElement } from "./utils/lazyPage";
import { saveData } from "./utils/useLiteMode";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

import { AnimatePresence, PresenceContext, motion as Motion } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import SplashPage from "./components/SplashPage/SplashPage";
import { splashSeen } from "./components/SplashPage/splashSeen";
import Background3D from "./components/Background3D/Background3D";
import { VideoBackgroundHost } from "./components/VideoBackground/VideoBackground";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import CompanionStage from "./companion/CompanionStage";
import SignedInGate from "./components/SignedInGate";
import { renewSessions, noteRoleForPath } from "./utils/session";
import ViewAsBanner from "./components/ViewAs/ViewAsBanner";
import StatusBanner from "./components/StatusBanner/StatusBanner";
import PrefsProvider from "./components/settings/PrefsProvider";
import { ComfortSettingsHost } from "./components/settings/ComfortSettings";
import BreakReminder from "./components/settings/BreakReminder";
import VoiceBar, { StopVoiceOnNavigate } from "./components/VoiceBar/VoiceBar";
import GuideCoach from "./components/guide/GuideCoach";
import { basenameFor, onRouteLangChange, routeLang } from "./seo/routeLocale";

// ── Pages ────────────────────────────────────────────────────────────────────
// The first screens a learner sees are part of the first download: the "who are
// you?" page, the sign-in page and Home.
import RoleSelect from "./pages/RoleSelect";
import Home from "./pages/Home";
import Login from "./pages/Login";

// Every other page is its own chunk, fetched when it is first opened (or a moment
// before: see IntentPreload and LearnerWarmUp below). To add a page: one line here,
// one <Route> in ROUTES. An ordinary `import X from "./pages/X"` works too, but then
// the page is in everybody's first download.
const SubjectPage = lazyPage(() => import("./pages/SubjectPage"));
const ListenModule = lazyPage(() => import("./pages/modules/ListenModule"));
const ReadModule = lazyPage(() => import("./pages/modules/ReadModule"));
const WriteModule = lazyPage(() => import("./pages/modules/WriteModule"));
const SpeakModule = lazyPage(() => import("./pages/modules/SpeakModule"));
const GamesPage = lazyPage(() => import("./pages/GamesPage"));
// Learning together (friends, rounds together, my team, prizes) and the Shorts feed.
const Together = lazyPage(() => import("./pages/together/Together"));
const MatchRound = lazyPage(() => import("./pages/together/MatchRound"));
const Shorts = lazyPage(() => import("./pages/shorts/Shorts"));
const AITeacher = lazyPage(() => import("./pages/AITeacher"));
const ContactUs = lazyPage(() => import("./pages/ContactUs"));
const AboutUs = lazyPage(() => import("./pages/AboutUs"));
const WhyLearnigo = lazyPage(() => import("./pages/WhyLearnigo"));
const AdminLogin = lazyPage(() => import("./pages/AdminLogin"));
const SuperAdminLogin = lazyPage(() => import("./pages/SuperAdminLogin"));
const TeacherLogin = lazyPage(() => import("./pages/TeacherLogin"));
const ParentLogin = lazyPage(() => import("./pages/ParentLogin"));
const Dashboard = lazyPage(() => import("./pages/Dashboard"));
const Discovery = lazyPage(() => import("./pages/Discovery"));
const AdminDashboard = lazyPage(() => import("./pages/admin/AdminDashboard"));
const SuperAdminDashboard = lazyPage(() => import("./pages/superadmin/SuperAdminDashboard"));
const TeacherDashboard = lazyPage(() => import("./pages/teacher/TeacherDashboard"));
const SoloSignup = lazyPage(() => import("./pages/teacher/SoloSignup"));
const JoinGroup = lazyPage(() => import("./pages/join/JoinGroup"));
const TutorPage = lazyPage(() => import("./pages/join/TutorPage"));
const ParentDashboard = lazyPage(() => import("./pages/parent/ParentDashboard"));
const ParentReportPage = lazyPage(() => import("./pages/parent/ReportPage"), "ParentReportPage");
const SharedReportPage = lazyPage(() => import("./pages/parent/ReportPage"), "SharedReportPage");
const TeacherTestsApp = lazyPage(() => import("./pages/teacher/tests/TeacherTestsApp"));
const TestPlayer = lazyPage(() => import("./pages/TestPlayer"));
const Pricing = lazyPage(() => import("./pages/Pricing"));
const ArLearningGames = lazyPage(() => import("./pages/ArLearningGames"));
const Faq = lazyPage(() => import("./pages/Faq"));
const PrivacyPolicy = lazyPage(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazyPage(() => import("./pages/TermsAndConditions"));
const NotFound = lazyPage(() => import("./pages/NotFound"));
const GuidePages = lazyPage(() => import("./pages/GuidePages"));
const SchoolApp = lazyPage(() => import("./pages/admin/school/SchoolApp"));
const SuperAdminConsole = lazyPage(() => import("./pages/superadmin/console/SuperAdminConsole"));
const ViewAsLanding = lazyPage(() => import("./pages/ViewAsLanding"));
const StatusPage = lazyPage(() => import("./pages/StatusPage"));
// The camera games, and the MediaPipe runtime they bring, load on demand: every
// other page starts without them. Opening Games warms them (GamesPage.jsx).
const ARHub = lazyPage(() => import("./ar/pages/ARHub"));
const ARGame = lazyPage(() => import("./ar/pages/ARGame"));
const ARInsights = lazyPage(() => import("./ar/pages/ARInsights"));
// Developer-only pages (component galleries). Not routed in production builds
// unless VITE_ENABLE_DEV_PAGES=1.
const DEV_PAGES = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PAGES === "1";
const DashboardKit = lazyPage(() => import("./pages/dev/DashboardKit"));
const CommsGallery = lazyPage(() => import("./pages/dev/CommsGallery"));
const QuestionKit = lazyPage(() => import("./pages/dev/QuestionKit"));

// Floating layers that are not needed for the first picture: fetched once the page
// is up. If one cannot be fetched it simply is not there (nothing else depends on it).
const nothing = { default: () => null };
const FamilyLayer = lazyPage(() => import("./components/family/FamilyLayer").catch(() => nothing));

// ── Routes ───────────────────────────────────────────────────────────────────
// One <Route> per page. A page that is still downloading shows the shared
// <RouteFallback /> (the <Suspense> around <Routes> below): no wrapper needed here.
const ROUTES = (
  <>
    <Route path="/" element={<SignedInGate><RoleSelect /></SignedInGate>} />
    <Route path="/home" element={<Home />} />
    <Route path="/subject/:subject" element={<SubjectPage />} />
    <Route path="/module/listen/:subject" element={<ListenModule />} />
    <Route path="/module/read/:subject" element={<ReadModule />} />
    <Route path="/module/write/:subject" element={<WriteModule />} />
    <Route path="/module/speak/:subject" element={<SpeakModule />} />
    <Route path="/games" element={<GamesPage />} />
    <Route path="/ai-teacher" element={<AITeacher />} />
    <Route path="/together" element={<Together />} />
    <Route path="/together/round/:id" element={<MatchRound />} />
    <Route path="/shorts" element={<Shorts />} />
    {/* Camera (MediaPipe) games. `/games/ar/insights` is matched before the
        :gameId route so it cannot be swallowed as a game id. */}
    <Route path="/games/ar" element={<ARHub />} />
    <Route path="/games/ar/insights" element={<ARInsights />} />
    <Route path="/games/ar/:gameId" element={<ARGame />} />
    <Route path="/login" element={<SignedInGate role="student"><Login /></SignedInGate>} />
    <Route path="/contact-us" element={<ContactUs />} />
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/about-us/why-learnigo" element={<WhyLearnigo />} />
    <Route path="/learning-support-by-country" element={<GuidePages guide="countries" />} />
    <Route path="/learning-support-by-country/:slug" element={<GuidePages guide="countries" />} />
    <Route path="/learning-differences" element={<GuidePages guide="differences" />} />
    <Route path="/learning-differences/:slug" element={<GuidePages guide="differences" />} />
    <Route path="/learning-tools" element={<GuidePages guide="tools" />} />
    <Route path="/learning-tools/:slug" element={<GuidePages guide="tools" />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/who-we-help" element={<GuidePages guide="audiences" />} />
    <Route path="/who-we-help/:slug" element={<GuidePages guide="audiences" />} />
    <Route path="/ar-learning-games" element={<ArLearningGames />} />
    <Route path="/faq" element={<Faq />} />
    <Route path="/policy" element={<PrivacyPolicy />} />
    <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
    <Route path="/admin-login" element={<SignedInGate role="admin"><AdminLogin /></SignedInGate>} />
    <Route path="/superadmin-login" element={<SuperAdminLogin />} />
    <Route path="/teacher-login" element={<SignedInGate role="teacher"><TeacherLogin /></SignedInGate>} />
    <Route path="/parent-login" element={<SignedInGate role="parent"><ParentLogin /></SignedInGate>} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/discovery" element={<Discovery />} />
    <Route path="/admin-dashboard" element={<AdminDashboard />} />
    <Route path="/admin-school/*" element={<SchoolApp />} />
    <Route path="/superadmin-dashboard" element={<SuperAdminConsole />} />
    <Route path="/superadmin-classic" element={<SuperAdminDashboard />} />
    <Route path="/view-as" element={<ViewAsLanding />} />
    <Route path="/status" element={<StatusPage />} />
    <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
    <Route path="/teach" element={<SoloSignup />} />
    <Route path="/join/:code" element={<JoinGroup />} />
    <Route path="/tutor/:slug" element={<TutorPage />} />
    <Route path="/parent-dashboard" element={<ParentDashboard />} />
    <Route path="/parent/report" element={<ParentReportPage />} />
    <Route path="/shared-report/:token" element={<SharedReportPage />} />
    <Route path="/teacher/tests/*" element={<TeacherTestsApp />} />
    <Route path="/test/:id" element={<TestPlayer />} />
    {DEV_PAGES && <Route path="/dev/dashboard-kit" element={<DashboardKit />} />}
    {DEV_PAGES && <Route path="/dev/comms" element={<CommsGallery />} />}
    {DEV_PAGES && <Route path="/dev/question-kit" element={<QuestionKit />} />}
    <Route path="*" element={<NotFound />} />
  </>
);

// The same routes as plain objects, to find which page a link leads to.
const ROUTE_TABLE = createRoutesFromElements(ROUTES);

/** Fetch the chunk of the page at `pathname` (an in-app path, without a language prefix). */
function preloadPath(pathname) {
  const matches = matchRoutes(ROUTE_TABLE, pathname);
  if (matches?.length) preloadElement(matches[matches.length - 1].route.element);
}

// Shown while a page's chunk downloads. Nothing at all for the first third of a
// second, so a quick download does not flash a spinner (index.css .route-wait).
function RouteFallback() {
  return <div className="route-wait" role="status" aria-label="Loading" />;
}

// A link the learner is about to follow (the pointer is over it, it has keyboard
// focus, a finger has just touched it): fetch its page now, so it opens at once.
function IntentPreload() {
  useEffect(() => {
    const base = basenameFor(routeLang) || "";
    let lastHref = "";
    const onIntent = (e) => {
      const a = e.target?.closest?.("a[href]");
      if (!a || a.href === lastHref || a.origin !== window.location.origin || a.target === "_blank") return;
      lastHref = a.href;
      const path = base && a.pathname.startsWith(`${base}/`) ? a.pathname.slice(base.length) : a.pathname;
      preloadPath(path);
    };
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("touchstart", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("touchstart", onIntent);
      document.removeEventListener("focusin", onIntent);
    };
  }, []);
  return null;
}

// A signed-in learner goes from Home to a subject or a round next, with a button (not
// a link IntentPreload could see): once the first page is drawn and the browser has
// nothing to do, fetch those pages one after another. Not when the browser asks to
// save data. Games and the dashboard are links in the navbar: IntentPreload has them.
const LEARNER_NEXT = [SubjectPage, ReadModule, ListenModule, WriteModule, SpeakModule];
function LearnerWarmUp() {
  useEffect(() => {
    let signedIn = false;
    try { signedIn = Boolean(localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt")); } catch { /* private mode */ }
    if (!signedIn || saveData()) return undefined;
    let i = 0;
    let timer = 0;
    let idle = 0;
    const next = () => {
      if (i >= LEARNER_NEXT.length) return;
      LEARNER_NEXT[i].preload();
      i += 1;
      timer = setTimeout(queue, 400);
    };
    const queue = () => {
      if ("requestIdleCallback" in window) idle = requestIdleCallback(next, { timeout: 5000 });
      else next();
    };
    timer = setTimeout(queue, 2500);
    return () => { clearTimeout(timer); if (idle) cancelIdleCallback(idle); };
  }, []);
  return null;
}

// Every button and link makes a sound that fits what it does (utils/sounds.js).
installUiSounds();

// Pages change with a sound that matches the motion: a whoosh forward into a
// new page, a softer one back (the browser's Back, or a back button). A link or
// button that already played its own navigation sound is not doubled.
function RouteSounds() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prev = useRef(pathname);
  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    if (navSoundWithin(900)) return;
    if (navType === "POP") sfx.back();
    else sfx.whoosh();
  }, [pathname, navType]);
  return null;
}

// Stay signed in until sign-out (utils/session.js): renew still-valid tokens on start,
// every few hours and when the tab comes back after a while; remember the role last used.
function SessionKeeper() {
  const { pathname } = useLocation();
  useEffect(() => { noteRoleForPath(pathname); }, [pathname]);
  useEffect(() => {
    renewSessions();
    const id = setInterval(() => renewSessions(), 3 * 60 * 60 * 1000);
    let hiddenAt = Date.now();
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (Date.now() - hiddenAt > 60 * 60 * 1000) renewSessions();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return null;
}

// Remembers the page before this one, so a round's Back returns there (utils/navMemory.js).
function RouteMemory() {
  const { pathname, search } = useLocation();
  useEffect(() => { notePath(`${pathname}${search}`); }, [pathname, search]);
  return null;
}

// One page at a time, with a short hand-over: the page that is leaving fades out
// quickly (about a tenth of a second), then the new one plays its own entrance. The
// leaving page does not also play its own longer exit: PresenceContext is reset
// inside, so only this quick fade stands between a tap and the next page.
// The element that fades is the same padded column every page has always sat in.
const PAGE_EXIT = { opacity: 0 };
const PAGE_EXIT_TRANSITION = { duration: 0.12, ease: "easeOut" };

function AnimatedRoutes({ hideNavbar }) {
  const location = useLocation();
  const routeKey = location.pathname.startsWith("/admin-school") ? "/admin-school" : location.pathname;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.div
        key={routeKey}
        style={{ paddingTop: hideNavbar ? "0" : "80px", flex: 1, display: "flex", flexDirection: "column" }}
        exit={PAGE_EXIT}
        transition={PAGE_EXIT_TRANSITION}
      >
        <PresenceContext.Provider value={null}>
          {/* A page that fails to draw (or to download) shows a friendly screen, not a blank one (resets on a new page). */}
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Routes location={location}>{ROUTES}</Routes>
            </Suspense>
          </ErrorBoundary>
        </PresenceContext.Provider>
      </Motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const location = useLocation();
  // An active camera session (gameplay itself, or the calibration/insights
  // screens that run alongside it) owns the whole viewport: it must not
  // scroll, and a navbar above it would be a target a child reaches into by
  // accident. The Camera Games hub is just a menu, so it keeps the normal
  // site header and background like any other page.
  const isAR = location.pathname.startsWith("/games/ar/");
  const isSchool = location.pathname.startsWith("/admin-school");
  const hideNavbar = isAR || isSchool || ["/", "/login", "/admin-login", "/superadmin-login", "/teacher-login", "/parent-login", "/admin-dashboard", "/superadmin-dashboard", "/superadmin-classic", "/view-as", "/teacher-dashboard", "/parent-dashboard", "/teach", "/parent/report"].includes(location.pathname)
    || location.pathname.startsWith("/join/") || location.pathname.startsWith("/tutor/") || location.pathname.startsWith("/shared-report/")
    || location.pathname.startsWith("/teacher/tests") || location.pathname.startsWith("/test/");
  // Every page a logged-in student can reach — Home, About Us, Contact Us, the
  // question modules, Subject page, the Games/Camera Games hubs and the Student
  // Dashboard — shares the same full-viewport video background, so the app reads
  // as one place rather than switching backdrops page to page. The role-select
  // gate and every login page draw their own meadow scene (components/Entry) instead, and an active
  // camera session (gameplay or Insights) owns the whole viewport with its own
  // background.
  const hideBackground3D = isAR || isSchool || [
    "/", "/home", "/about-us", "/contact-us", "/faq", "/policy", "/terms-and-conditions",
    "/login", "/admin-login", "/superadmin-login", "/teacher-login", "/parent-login",
    "/games", "/games/ar", "/dashboard", "/discovery", "/ai-teacher", "/together", "/shorts", "/parent-dashboard", "/parent/report",
  ].includes(location.pathname)
    || location.pathname.startsWith("/shared-report/")
    || location.pathname.startsWith("/module/")
    || location.pathname.startsWith("/subject/")
    || location.pathname.startsWith("/together/")
    || location.pathname === "/teach" || location.pathname.startsWith("/join/") || location.pathname.startsWith("/tutor/");

  // The live companion and butterflies (companion/): on learner and public pages; off on
  // staff tools and while a camera game runs (the camera and its tracking need the device).
  const companionOff = isAR || isSchool || location.pathname.startsWith("/teacher") || location.pathname.startsWith("/superadmin")
    || ["/admin-dashboard", "/admin-login", "/view-as", "/status", "/shorts"].includes(location.pathname) || location.pathname.startsWith("/dev/");

  return (
    <>
      <RouteSounds />
      <RouteMemory />
      <SessionKeeper />
      <IntentPreload />
      <LearnerWarmUp />
      {!companionOff && <CompanionStage />}
      <ViewAsBanner />
      <StatusBanner />
      {/* The one meadow film behind every page that asks for it (<VideoBackground />): it
          plays on across page changes. Before Background3D, which covers it where both are. */}
      <VideoBackgroundHost />
      {!hideBackground3D && <Background3D />}
      {!hideNavbar && <Navbar />}
      <AnimatedRoutes hideNavbar={hideNavbar} />
      {!hideNavbar && <Footer />}
      <Suspense fallback={null}><FamilyLayer /></Suspense>
      {/* The learner's comfort settings, the teacher's captions and break reminders (components/settings, VoiceBar). */}
      <StopVoiceOnNavigate />
      <VoiceBar hidden={isAR} />
      {/* Shows a learner where to tap next, and says it (components/guide). */}
      {!isAR && <GuideCoach />}
      <ComfortSettingsHost />
      <BreakReminder />
    </>
  );
}

function App() {
  // The splash is for the first visit (components/SplashPage/splashSeen.js); a tap or a key skips it.
  const [showSplash, setShowSplash] = useState(() => !splashSeen());
  // The URL's language prefix (/es/...) is the router's basename. Choosing a
  // language can move the URL to another prefix (seo/routeLocale.js); the
  // router then remounts under the new basename.
  const [lang, setLang] = useState(routeLang);
  useEffect(() => onRouteLangChange(setLang), []);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <PrefsProvider>
          <AnimatePresence>
            {showSplash && (
              <SplashPage onFinish={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <Router key={lang || "default"} basename={basenameFor(lang)}>
            <AppLayout />
          </Router>
        </PrefsProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
