import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { installUiSounds, navSoundWithin, sfx } from "./utils/sounds";
import { notePath } from "./utils/navMemory";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

import { AnimatePresence } from "framer-motion";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import SplashPage from "./components/SplashPage/SplashPage";
import Background3D from "./components/Background3D/Background3D";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import CompanionStage from "./companion/CompanionStage";
import SignedInGate from "./components/SignedInGate";
import { renewSessions, noteRoleForPath } from "./utils/session";
import RoleSelect from "./pages/RoleSelect";
import Home from "./pages/Home";
import SubjectPage from "./pages/SubjectPage";
import ListenModule from "./pages/modules/ListenModule";
import ReadModule from "./pages/modules/ReadModule";
import WriteModule from "./pages/modules/WriteModule";
import SpeakModule from "./pages/modules/SpeakModule";
import GamesPage from "./pages/GamesPage";
import AITeacher from "./pages/AITeacher";
import ARHub from "./ar/pages/ARHub";
import ARGame from "./ar/pages/ARGame";
import ARInsights from "./ar/pages/ARInsights";
import Login from "./pages/Login";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import TeacherLogin from "./pages/TeacherLogin";
import ParentLogin from "./pages/ParentLogin";
import Dashboard from "./pages/Dashboard";
import Discovery from "./pages/Discovery";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import ViewAsBanner from "./components/ViewAs/ViewAsBanner";
import StatusBanner from "./components/StatusBanner/StatusBanner";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import SoloSignup from "./pages/teacher/SoloSignup";
import JoinGroup from "./pages/join/JoinGroup";
import TutorPage from "./pages/join/TutorPage";
import ParentDashboard from "./pages/parent/ParentDashboard";
import { ParentReportPage, SharedReportPage } from "./pages/parent/ReportPage";
import FamilyLayer from "./components/family/FamilyLayer";
import PrefsProvider from "./components/settings/PrefsProvider";
import { ComfortSettingsHost } from "./components/settings/ComfortSettings";
import BreakReminder from "./components/settings/BreakReminder";
import VoiceBar, { StopVoiceOnNavigate } from "./components/VoiceBar/VoiceBar";
import TeacherTestsApp from "./pages/teacher/tests/TeacherTestsApp";
import TestPlayer from "./pages/TestPlayer";
import LearningSupportByCountry from "./pages/LearningSupportByCountry";
import LearningDifferences from "./pages/LearningDifferences";
import WhoWeHelp from "./pages/WhoWeHelp";
import Pricing from "./pages/Pricing";
import ArLearningGames from "./pages/ArLearningGames";
import Faq from "./pages/Faq";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";

// Developer-only pages (component galleries). Not routed in production builds
// unless VITE_ENABLE_DEV_PAGES=1.
const DEV_PAGES = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PAGES === "1";
const DashboardKit = lazy(() => import("./pages/dev/DashboardKit"));
const CommsGallery = lazy(() => import("./pages/dev/CommsGallery"));
const SchoolApp = lazy(() => import("./pages/admin/school/SchoolApp"));
const SuperAdminConsole = lazy(() => import("./pages/superadmin/console/SuperAdminConsole"));
const ViewAsLanding = lazy(() => import("./pages/ViewAsLanding"));
const StatusPage = lazy(() => import("./pages/StatusPage"));

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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith("/admin-school") ? "/admin-school" : location.pathname}>
        <Route path="/" element={<SignedInGate><RoleSelect /></SignedInGate>} />
        <Route path="/home" element={<Home />} />
        <Route path="/subject/:subject" element={<SubjectPage />} />
        <Route path="/module/listen/:subject" element={<ListenModule />} />
        <Route path="/module/read/:subject" element={<ReadModule />} />
        <Route path="/module/write/:subject" element={<WriteModule />} />
        <Route path="/module/speak/:subject" element={<SpeakModule />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/ai-teacher" element={<AITeacher />} />
        {/* Camera (MediaPipe) games. `/games/ar/insights` is matched before the
            :gameId route so it cannot be swallowed as a game id. */}
        <Route path="/games/ar" element={<ARHub />} />
        <Route path="/games/ar/insights" element={<ARInsights />} />
        <Route path="/games/ar/:gameId" element={<ARGame />} />
        <Route path="/login" element={<SignedInGate role="student"><Login /></SignedInGate>} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/learning-support-by-country" element={<LearningSupportByCountry />} />
        <Route path="/learning-support-by-country/:country" element={<LearningSupportByCountry />} />
        <Route path="/learning-differences" element={<LearningDifferences />} />
        <Route path="/learning-differences/:difference" element={<LearningDifferences />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/who-we-help" element={<WhoWeHelp />} />
        <Route path="/who-we-help/:audience" element={<WhoWeHelp />} />
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
        <Route path="/superadmin-dashboard" element={<Suspense fallback={null}><SuperAdminConsole /></Suspense>} />
        <Route path="/superadmin-classic" element={<SuperAdminDashboard />} />
        <Route path="/view-as" element={<Suspense fallback={null}><ViewAsLanding /></Suspense>} />
        <Route path="/status" element={<Suspense fallback={null}><StatusPage /></Suspense>} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
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
    "/games", "/games/ar", "/dashboard", "/discovery", "/ai-teacher", "/parent-dashboard", "/parent/report",
  ].includes(location.pathname)
    || location.pathname.startsWith("/shared-report/")
    || location.pathname.startsWith("/module/")
    || location.pathname.startsWith("/subject/")
    || location.pathname === "/teach" || location.pathname.startsWith("/join/") || location.pathname.startsWith("/tutor/");

  // The live companion and butterflies (companion/): on learner and public pages; off on
  // staff tools and while a camera game runs (the camera and its tracking need the device).
  const companionOff = isAR || isSchool || location.pathname.startsWith("/teacher") || location.pathname.startsWith("/superadmin")
    || ["/admin-dashboard", "/admin-login", "/view-as", "/status"].includes(location.pathname) || location.pathname.startsWith("/dev/");

  return (
    <>
      <RouteSounds />
      <RouteMemory />
      <SessionKeeper />
      {!companionOff && <CompanionStage />}
      <ViewAsBanner />
      <StatusBanner />
      {!hideBackground3D && <Background3D />}
      {!hideNavbar && <Navbar />}
      <div style={{ paddingTop: hideNavbar ? "0" : "80px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* A page that fails to draw shows a friendly screen, not a blank one (resets on a new page). */}
        <ErrorBoundary resetKey={location.pathname}>
          <AnimatedRoutes />
        </ErrorBoundary>
      </div>
      {!hideNavbar && <Footer />}
      <FamilyLayer />
      {/* The learner's comfort settings, the teacher's captions and break reminders (components/settings, VoiceBar). */}
      <StopVoiceOnNavigate />
      <VoiceBar hidden={isAR} />
      <ComfortSettingsHost />
      <BreakReminder />
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <PrefsProvider>
          <AnimatePresence>
            {showSplash && (
              <SplashPage onFinish={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <Router>
            <AppLayout />
          </Router>
        </PrefsProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
