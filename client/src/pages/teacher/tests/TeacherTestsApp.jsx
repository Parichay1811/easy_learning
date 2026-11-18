// Teacher tests and question bank (TCH-020..061), at /teacher/tests/*.
import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { FaClipboardList, FaQuestionCircle, FaPenNib, FaUniversalAccess, FaArrowLeft, FaLeaf } from "react-icons/fa";
import { DashboardShell, PlanLockCard } from "../../../components/dashboard";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useT } from "./api";
import TestsHome from "./TestsHome";
import TestBuilder from "./TestBuilder";
import TestResults from "./TestResults";
import BankBrowser from "./BankBrowser";
import QuestionEditor from "./QuestionEditor";
import ImportQuestions from "./ImportQuestions";
import MarkingQueue from "./MarkingQueue";
import Accommodations from "./Accommodations";

// What a locked module looks like everywhere in this area (DSN-030).
export function Locked({ module }) {
  const tt = useT();
  const copy = {
    "qbank.author": [tt("lock.bank", "Write your own questions"), tt("lock.bankText", "Build a question bank with every question type, then use it in tests.")],
    tests: [tt("lock.tests", "Tests with rules"), tt("lock.testsText", "Set tests with time limits, attempts and feedback, and see results the moment students finish.")],
    "tests.advanced": [tt("lock.adv", "Advanced tests"), tt("lock.advText", "Random question pools, per-question timers, accommodations and the live monitor.")],
    "grading.manual": [tt("lock.marking", "Mark typed and spoken answers"), tt("lock.markingText", "A marking queue with rubrics, quick comments and keyboard shortcuts.")],
    "qbank.share": [tt("lock.share", "Share with the community"), tt("lock.shareText", "Offer your best questions to every Learnigo teacher.")],
  }[module] || [tt("lock.generic", "Not in your plan"), ""];
  return <PlanLockCard module={String(module)} title={copy[0]} text={copy[1]} />;
}

export default function TeacherTestsApp() {
  const tt = useT();
  const { teacherUser } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (teacherUser === null) navigate("/teacher-login");
  }, [teacherUser, navigate]);

  const base = "/teacher/tests";
  const active = pathname.startsWith(`${base}/bank`) ? "bank" : pathname.startsWith(`${base}/marking`) ? "marking"
    : pathname.startsWith(`${base}/accommodations`) ? "acc" : pathname.startsWith(`${base}/practice`) ? "practice" : "tests";
  const nav = [
    { key: "tests", label: tt("nav.tests", "Tests"), icon: FaClipboardList, to: base },
    { key: "practice", label: tt("nav.practice", "Practice sets"), icon: FaLeaf, to: `${base}/practice` },
    { key: "bank", label: tt("nav.bank", "Question bank"), icon: FaQuestionCircle, to: `${base}/bank` },
    { key: "marking", label: tt("nav.marking", "Marking"), icon: FaPenNib, to: `${base}/marking` },
    { key: "acc", label: tt("nav.acc", "Accommodations"), icon: FaUniversalAccess, to: `${base}/accommodations` },
    { key: "back", label: tt("nav.back", "Teacher home"), icon: FaArrowLeft, to: "/teacher-dashboard" },
  ];

  if (!teacherUser) return null;

  return (
    <DashboardShell
      brand={{ label: "LEARNIGO", to: "/teacher-dashboard" }}
      nav={nav}
      active={active}
      user={<span className="d-sr-only">{teacherUser.name || teacherUser.email}</span>}
    >
      <Routes>
        <Route index element={<TestsHome kind="test" />} />
        <Route path="practice" element={<TestsHome kind="practice" />} />
        <Route path="new" element={<TestBuilder />} />
        <Route path=":id/edit" element={<TestBuilder />} />
        <Route path=":id" element={<TestResults />} />
        <Route path="bank" element={<BankBrowser />} />
        <Route path="bank/new" element={<QuestionEditor />} />
        <Route path="bank/import" element={<ImportQuestions />} />
        <Route path="bank/:module/:subject/:id" element={<QuestionEditor />} />
        <Route path="marking" element={<MarkingQueue />} />
        <Route path="accommodations" element={<Accommodations />} />
      </Routes>
    </DashboardShell>
  );
}
