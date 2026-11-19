import { useState, useEffect, useCallback, useId } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdDashboard, MdPeople, MdGroups,
  MdSchool, MdFamilyRestroom, MdBarChart, MdLogout, MdAdd,
  MdDelete, MdBusiness, MdClose, MdCheckCircle, MdPending,
  MdInsights, MdEdit, MdSupportAgent, MdMenuBook, MdVisibility,
  MdRateReview, MdThumbDown, MdSearch, MdOpenInNew, MdSend, MdPerson,
} from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, designationLabel } from "../../utils/designations";
import StudentDashboardViewer from "../../components/StudentDashboardViewer/StudentDashboardViewer";
import BatchDetail from "../../components/Admin/BatchDetail";
import QuestionBatchDetailModal from "../../components/Admin/QuestionBatchDetailModal";
import {
  DashboardShell, KpiTile, DataTable, Sheet, Button, EmptyState, PanelHead, SubTabs, SubPanel, Skeleton, WelcomeToast,
} from "../../components/dashboard";
import mascotImg from "../../assets/dash/mascot.webp";
import styles from "./AdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

// The admin's sections, grouped by task. The first four are the phone's tab bar.
const NAV = [
  { key: "overview", group: "see", label: "Overview", icon: MdDashboard },
  { key: "students", group: "manage", label: "Students", icon: MdSchool },
  { key: "batches", group: "manage", label: "Groups", icon: MdGroups },
  { key: "tutors", group: "manage", label: "Teachers", icon: MdPeople },
  { key: "parents", group: "manage", label: "Parents", icon: MdFamilyRestroom },
  { key: "subjects", group: "manage", label: "Subjects", icon: MdMenuBook },
  { key: "org", group: "manage", label: "Organization", icon: MdBusiness },
  { key: "questions", group: "check", label: "Questions", icon: MdRateReview },
  { key: "reports", group: "check", label: "Reports", icon: MdBarChart },
  { key: "chat", group: "talk", label: "Messages", icon: MdSupportAgent },
];
const GROUPS = { see: "See", manage: "Manage", check: "Check", talk: "Talk" };
const SECTION_KEYS = NAV.map((n) => n.key);

function useAdminApi(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body, method = "POST") => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  const postForm = useCallback(async (path, formData, method = "POST") => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return r.json();
  }, [token]);

  const del = useCallback(async (path) => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  }, [token]);

  return { get, post, postForm, del };
}

// ── Form in a sheet (same fields, checks and submit as the old admin modal) ──
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

function validateField(f, value, form) {
  const isVisible = !f.showIf || f.showIf(form);
  if (!isVisible) return null;
  const strVal = typeof value === "string" ? value.trim() : value;
  const isEmpty = value === undefined || value === null || strVal === "" || (f.type === "file" && !value);
  if (f.required && isEmpty) return `${f.label} is required`;
  if (isEmpty) return null;
  if (f.type === "email" && !EMAIL_RE.test(strVal)) return "Enter a valid email address";
  if (f.type === "tel" && !PHONE_RE.test(strVal)) return "Enter a valid phone number";
  if (f.type === "number") {
    const n = Number(strVal);
    if (Number.isNaN(n)) return `${f.label} must be a number`;
    if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}`;
    if (f.max !== undefined && n > f.max) return `${f.label} must be at most ${f.max}`;
  }
  if (f.minLength && strVal.length < f.minLength) return `${f.label} must be at least ${f.minLength} characters`;
  if (f.maxLength && strVal.length > f.maxLength) return `${f.label} must be at most ${f.maxLength} characters`;
  return null;
}

function validateForm(fields, form) {
  const errors = {};
  fields.forEach((f) => {
    const err = validateField(f, form[f.key], form);
    if (err) errors[f.key] = err;
  });
  return errors;
}

function FormSheet({ title, fields, onSubmit, onClose, loading, serverError, initial, submitLabel, hint }) {
  const { t } = useTranslation();
  const formId = useId();
  const [form, setForm] = useState(initial || {});
  const [touched, setTouched] = useState({});
  const errors = validateForm(fields, form);
  const hasErrors = Object.keys(errors).length > 0;
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((x) => ({ ...x, [k]: true }));
  const submit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fields.map((f) => [f.key, true])));
    if (hasErrors) return;
    onSubmit(form);
  };
  return (
    <Sheet
      title={title}
      text={hint}
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t("adminClassic.cancel", { defaultValue: "Cancel" })}</Button>
          <Button type="submit" form={formId} disabled={loading || (Object.keys(touched).length > 0 && hasErrors)}>
            {loading ? t("adminClassic.saving", { defaultValue: "Saving…" }) : (submitLabel || t("adminClassic.save", { defaultValue: "Save" }))}
          </Button>
        </>
      )}
    >
      <form id={formId} onSubmit={submit} className={styles.form} noValidate>
        {fields.map((f) => {
          if (f.showIf && !f.showIf(form)) return null;
          const id = `${formId}-${f.key}`;
          const showError = touched[f.key] && errors[f.key];
          const common = { id, onBlur: () => blur(f.key), "aria-invalid": showError ? true : undefined, "aria-describedby": showError ? `${id}-err` : undefined };
          return (
            <div key={f.key} className={styles.field}>
              <label htmlFor={id} className={styles.label}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>
              {f.type === "select" ? (
                <select {...common} className={styles.input} value={form[f.key] ?? ""} onChange={(e) => change(f.key, e.target.value)}>
                  <option value="" disabled>{f.placeholder || t("adminClassic.choose", { defaultValue: "Choose…" })}</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "file" ? (
                <input {...common} className={styles.input} type="file" accept={f.accept || "image/*"} onChange={(e) => change(f.key, e.target.files?.[0] || null)} />
              ) : (
                <input {...common} className={styles.input} type={f.type === "tel" ? "text" : (f.type || "text")} inputMode={f.type === "tel" ? "tel" : undefined}
                  placeholder={f.placeholder || ""} value={form[f.key] || ""} onChange={(e) => change(f.key, e.target.value)} />
              )}
              {showError && <span id={`${id}-err`} className={styles.fieldError}>{errors[f.key]}</span>}
            </div>
          );
        })}
        {serverError && <p role="alert" className={styles.serverError}>{serverError}</p>}
        {/* Enter in a field submits, like the old dialog. */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Sheet>
  );
}

// ── Performance (a sheet) ──────────────────────────────────────────────────
function PerformanceSheet({ data, onClose }) {
  const { t } = useTranslation();
  return (
    <Sheet title={t("adminClassic.perf.title", { defaultValue: "How {{name}} is doing", name: data.name })} onClose={onClose}>
      {data.type === "student" ? (
        data.performance.linked ? (
          <div className={styles.perfGrid}>
            <div className={styles.perfStat}><span>{data.performance.totalXP}</span><label>Total XP</label></div>
            <div className={styles.perfStat}><span>{data.performance.totalSessions}</span><label>Sessions</label></div>
            <div className={styles.perfStat}><span>{data.performance.totalMinutes}</span><label>Minutes</label></div>
            <div className={styles.perfStat}><span>{data.performance.averageScore}%</span><label>Avg Score</label></div>
            <div className={styles.perfStat}><span>{data.performance.achievementCount}</span><label>Achievements</label></div>
          </div>
        ) : (
          <p className={styles.muted}>No learning activity recorded yet for this student's linked email.</p>
        )
      ) : (
        data.students.length === 0 ? (
          <p className={styles.muted}>This tutor has no students assigned yet.</p>
        ) : (
          <ul className={styles.perfList}>
            {data.students.map((s) => (
              <li key={s.studentId} className={styles.perfRow}>
                <strong>{s.name}</strong>
                {s.performance.linked ? (
                  <span>{s.performance.totalXP} XP · {s.performance.totalSessions} sessions · {s.performance.averageScore}% avg</span>
                ) : (
                  <span className={styles.muted}>No activity yet</span>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </Sheet>
  );
}

// ── Chat with the Learnigo team ────────────────────────────────────────────
function ChatPanel({ messages, draft, onDraftChange, onSend, sending }) {
  const { t } = useTranslation();
  return (
    <section className={styles.chat} aria-label={t("adminClassic.chat.aria", { defaultValue: "Conversation with Learnigo" })}>
      <div className={styles.chatMessages} role="log" aria-live="polite">
        {messages.length === 0 ? (
          <EmptyState compact title={t("adminClassic.chat.emptyTitle", { defaultValue: "No messages yet" })}
            text={t("adminClassic.chat.emptyText", { defaultValue: "Ask the Learnigo team anything about your organization or registration. Write below." })} />
        ) : (
          messages.map((m) => (
            <div key={m._id} className={`${styles.bubble} ${m.senderRole === "admin" ? styles.bubbleMine : styles.bubbleTheirs}`}>
              <p>{m.message}</p>
              <span className={styles.bubbleTime}>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
      <form className={styles.chatInput} onSubmit={(e) => { e.preventDefault(); onSend(); }}>
        <label htmlFor="admin-chat" className="d-sr-only">{t("adminClassic.chat.label", { defaultValue: "Your message" })}</label>
        <textarea id="admin-chat" rows={2} className={styles.input} value={draft} onChange={(e) => onDraftChange(e.target.value)}
          placeholder={t("adminClassic.chat.placeholder", { defaultValue: "Message the Learnigo team…" })} />
        <Button type="submit" icon={MdSend} disabled={sending || !draft.trim()}>
          {sending ? t("adminClassic.chat.sending", { defaultValue: "Sending…" }) : t("adminClassic.chat.send", { defaultValue: "Send" })}
        </Button>
      </form>
    </section>
  );
}

// Small buttons at the end of a table row (they keep their words for screen readers).
function RowActions({ actions, row }) {
  return (
    <span className={styles.rowActions}>
      {actions.map((a) => (
        <button key={a.title} type="button" className={`${styles.rowBtn} ${a.variant === "delete" ? styles.rowBtnDanger : ""}`}
          title={a.title} aria-label={`${a.title}: ${row.name || row.originalFilename || ""}`} onClick={() => a.onClick(row)}>
          {a.icon}
        </button>
      ))}
    </span>
  );
}

// A kit table with an actions column, or a friendly empty state with the next step.
// Long lists scroll inside their box on wide screens, so the heading and buttons stay in view.
function Table({ columns, rows, actions, caption, empty, fit = 250 }) {
  if (!rows.length) return <div className={styles.card}>{empty}</div>;
  const cols = actions ? [...columns, { key: "_actions", label: "Actions", align: "end", render: (r) => <RowActions actions={actions} row={r} /> }] : columns;
  return (
    <div style={{ "--fit": `${fit}px` }}>
      <DataTable className={styles.scrollArea} caption={caption} columns={cols.map((c) => ({ ...c, render: c.render || ((r) => (r[c.key] === 0 ? 0 : r[c.key] || "—")) }))} rows={rows} getRowKey={(r) => r._id} />
    </div>
  );
}

const STATUS_CLASS = { approved: "badgeGreen", active: "badgeGreen", pending: "badgeYellow", rejected: "badgeRed", inactive: "badgeGrey" };
const StatusBadge = ({ status }) => <span className={`${styles.badge} ${styles[STATUS_CLASS[status]] || styles.badgeYellow}`}>{status || "—"}</span>;

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { t } = useTranslation();
  const { adminUser, adminLogout, getAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getAdminToken();
  const { get, post, postForm, del } = useAdminApi(token);

  // The open section lives in the URL (?section=…), so Back / Forward and a reload keep it.
  const [params, setParams] = useSearchParams();
  const section = SECTION_KEYS.includes(params.get("section")) ? params.get("section") : "overview";
  const [stats, setStats] = useState({ tutors: 0, students: 0, batches: 0, parents: 0, org: null });
  const [org, setOrg] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [tutorSearch, setTutorSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [questionStats, setQuestionStats] = useState({ totalUploads: 0, pendingUploads: 0, approvedUploads: 0, rejectedUploads: 0 });
  const [questionBatches, setQuestionBatches] = useState([]);
  const [questionFilterStatus, setQuestionFilterStatus] = useState("all");
  const [viewQuestionBatchId, setViewQuestionBatchId] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [perfModal, setPerfModal] = useState(null);
  const [dashboardViewerStudent, setDashboardViewerStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatUnread, setChatUnread] = useState(0);
  const [chatSending, setChatSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminUser && adminUser !== undefined) navigate("/admin-login");
  }, [adminUser, navigate]);

  // School staff (coordinator, office, viewer) work in the school dashboard (ADM-023).
  useEffect(() => {
    try {
      const p = JSON.parse(atob((localStorage.getItem("admin_jwt") || "").split(".")[1] || ""));
      if (p?.role === "org_staff") navigate("/admin-school", { replace: true });
    } catch { /* not a staff token */ }
    // Message notifications link here (?tab=messages&thread=<id>): messages live in the school dashboard.
    const q = new URLSearchParams(window.location.search);
    if (q.get("tab") === "messages") navigate(`/admin-school/messages${q.get("thread") ? `?thread=${encodeURIComponent(q.get("thread"))}` : ""}`, { replace: true });
  }, [navigate]);

  const loadStats = useCallback(async () => {
    const data = await get("/stats");
    if (data.success) { setStats(data.stats); setOrg(data.stats.org); }
  }, [get]);

  const loadProfile = useCallback(async () => {
    const data = await get("/profile");
    if (data.success) setProfile(data.admin);
  }, [get]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadStats(), loadProfile()]);
      setLoading(false);
    })();
  }, [loadStats, loadProfile]);

  const pollChatUnread = useCallback(async () => {
    const d = await get("/chat/unread-count");
    if (d.success) setChatUnread(d.count);
  }, [get]);

  useEffect(() => {
    (async () => { await pollChatUnread(); })();
    const iv = setInterval(pollChatUnread, 25000);
    return () => clearInterval(iv);
  }, [pollChatUnread]);

  const loadTutors = useCallback(async (search) => {
    const d = await get(`/tutors${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (d.success) setTutors(d.tutors);
  }, [get]);

  const loadStudents = useCallback(async (search) => {
    const d = await get(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (d.success) setStudents(d.students);
  }, [get]);

  const loadChat = useCallback(async () => {
    const d = await get("/chat");
    if (d.success) { setChatMessages(d.messages); setChatUnread(0); }
  }, [get]);

  const loadQuestionStats = useCallback(async () => {
    const d = await get("/questions/uploads/stats");
    if (d.success) setQuestionStats(d.stats);
  }, [get]);

  const loadQuestionBatches = useCallback(async (status) => {
    const query = status && status !== "all" ? `?status=${status}` : "";
    const d = await get(`/questions/uploads${query}`);
    if (d.success) setQuestionBatches(d.batches);
  }, [get]);

  useEffect(() => {
    (async () => { await loadQuestionStats(); })();
  }, [loadQuestionStats]);

  const loadSection = useCallback(async (sec) => {
    setSelectedBatchId(null);
    if (sec === "tutors") loadTutors(tutorSearch);
    else if (sec === "batches") {
      const d = await get("/batches"); if (d.success) setBatches(d.batches);
    } else if (sec === "subjects") {
      const d = await get("/subjects"); if (d.success) setSubjects(d.subjects);
    } else if (sec === "students") loadStudents(studentSearch);
    else if (sec === "parents") {
      const d = await get("/parents"); if (d.success) setParents(d.parents);
    } else if (sec === "org") {
      const d = await get("/org"); if (d.success) setOrg(d.org);
    } else if (sec === "chat") loadChat();
    else if (sec === "questions") { loadQuestionStats(); loadQuestionBatches(questionFilterStatus); }
  }, [get, loadTutors, loadStudents, loadChat, loadQuestionStats, loadQuestionBatches, tutorSearch, studentSearch, questionFilterStatus]);

  // Load what the open section shows whenever it changes (also on first load).
  useEffect(() => {
    (async () => {
      setModal(null);
      setPerfModal(null);
      await loadSection(section);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const goSection = useCallback((sec) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (sec === "overview") n.delete("section"); else n.set("section", sec);
      n.delete("tab");
      return n;
    });
    window.scrollTo?.({ top: 0 });
  }, [setParams]);

  const loadBatches = useCallback(async () => {
    const d = await get("/batches"); if (d.success) setBatches(d.batches);
  }, [get]);

  const handleSendChat = async () => {
    if (!chatDraft.trim()) return;
    setChatSending(true);
    const d = await post("/chat", { message: chatDraft.trim() });
    setChatSending(false);
    if (d.success) { setChatDraft(""); loadChat(); }
  };

  const handleLogout = () => { adminLogout(); navigate("/"); };

  const openModal = (config) => { setModal(config); setModalError(""); };
  const closeModal = () => setModal(null);

  const submitViaForm = (endpoint, form, fields) => {
    const formData = new FormData();
    fields.forEach((f) => {
      const v = form[f.key];
      if (v !== undefined && v !== null && v !== "") formData.append(f.key, v);
    });
    return postForm(endpoint, formData, modal.method || "POST");
  };

  const handleModalSubmit = async (form) => {
    setModalLoading(true);
    setModalError("");
    try {
      const hasFile = modal.fields.some((f) => f.type === "file");
      const data = hasFile
        ? await submitViaForm(modal.endpoint, form, modal.fields)
        : await post(modal.endpoint, form, modal.method || "POST");

      if (!data.success) { setModalError(data.message || "Something went wrong"); return; }
      closeModal();
      loadStats();
      loadProfile();
      loadSection(section);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (path, id) => {
    if (!confirm("Delete this record?")) return;
    await del(`${path}/${id}`);
    loadStats();
    loadSection(section);
  };

  const handleQuestionFilterChange = (status) => {
    setQuestionFilterStatus(status);
    loadQuestionBatches(status);
  };

  const handleApproveQuestion = async (batch) => {
    await post(`/questions/uploads/${batch._id}/approve`, {});
    loadQuestionStats();
    loadQuestionBatches(questionFilterStatus);
  };

  const openStudentPerformance = async (student) => {
    const d = await get(`/students/${student._id}/performance`);
    if (!d.success) return;
    if (d.performance.linked) {
      setDashboardViewerStudent({ id: student._id, name: student.name });
    } else {
      setPerfModal({ type: "student", name: student.name, performance: d.performance });
    }
  };

  const openTutorPerformance = async (tutor) => {
    const d = await get(`/tutors/${tutor._id}/performance`);
    if (d.success) setPerfModal({ type: "tutor", name: tutor.name, students: d.students });
  };


  if (loading || adminUser === undefined) {
    return (
      <div className={`dash ${styles.splash}`} aria-busy="true">
        <img src={mascotImg} alt="" width="84" height="98" />
        <p>{t("adminClassic.loading", { defaultValue: "Opening your school…" })}</p>
        <div className={styles.splashBars}><Skeleton variant="tile" /><Skeleton variant="tile" /><Skeleton variant="tile" /></div>
      </div>
    );
  }


  const orgRegistrationFields = [
    { key: "name", label: "Organization Name", required: true, minLength: 2, maxLength: 100 },
    { key: "type", label: "Type", type: "select", required: true, options: ORG_TYPE_OPTIONS },
    { key: "address", label: "Address", maxLength: 200 },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "designation", label: "Your Designation (Principal / Father / Mother / etc.)", type: "select", required: true, options: DESIGNATION_OPTIONS },
    { key: "designationOther", label: "Please specify", required: true, showIf: (f) => f.designation === "other", maxLength: 50 },
    { key: "logo", label: "Organization Logo (optional)", type: "file", accept: "image/*" },
  ];

  const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];

  const tutorFields = [
    { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "subject", label: "Subject", maxLength: 50 },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ];

  const studentFields = [
    { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
    { key: "email", label: "Email", type: "email" },
    { key: "age", label: "Age", type: "number", min: 3, max: 25 },
    { key: "grade", label: "Grade / Class", maxLength: 20 },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ];

  const profileFields = [
    { key: "designation", label: "Your Designation", type: "select", required: true, options: DESIGNATION_OPTIONS },
    { key: "designationOther", label: "Please specify", required: true, showIf: (f) => f.designation === "other", maxLength: 50 },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "avatar", label: "Profile Photo (optional)", type: "file", accept: "image/*" },
  ];


  const T = (k, d, o) => t(`adminClassic.${k}`, { defaultValue: d, ...o });
  const nav = NAV.map((n) => ({
    key: n.key,
    group: T(`group.${n.group}`, GROUPS[n.group]),
    label: T(`nav.${n.key}`, n.label),
    icon: n.icon,
    onClick: () => goSection(n.key),
    badge: n.key === "chat" ? chatUnread || undefined : n.key === "questions" ? questionStats.pendingUploads || undefined : undefined,
  }));
  const editProfile = () => openModal({
    title: T("editProfile", "Edit your profile"),
    endpoint: "/profile",
    method: "PATCH",
    fields: profileFields,
    initial: { designation: profile?.designation || "", designationOther: profile?.designationOther || "", phone: profile?.phone || "" },
  });
  const schoolLink = org && (
    <Button icon={MdOpenInNew} onClick={() => navigate("/admin-school")}>{T("openSchool", "Open the school dashboard")}</Button>
  );
  const addTutor = () => openModal({
    title: T("tutors.add", "Add a teacher"),
    endpoint: "/tutors",
    fields: [
      { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "subject", label: "Subject", maxLength: 50 },
    ],
  });
  const addBatch = () => openModal({
    title: T("batches.add", "Create a group"),
    endpoint: "/batches",
    fields: [
      { key: "name", label: "Batch Name", required: true, minLength: 2, maxLength: 100 },
      { key: "academicYear", label: "Academic Year (e.g. 2026-27)", maxLength: 20 },
      { key: "term", label: "Term / Semester", maxLength: 30 },
      { key: "maxStudents", label: "Max Students (optional)", type: "number", min: 1 },
      { key: "description", label: "Description", maxLength: 300 },
    ],
  });
  const addSubject = () => openModal({
    title: T("subjects.add", "Add a subject"),
    endpoint: "/subjects",
    fields: [
      { key: "name", label: "Subject Name", required: true, minLength: 2, maxLength: 60 },
      { key: "code", label: "Code (optional, e.g. english)", maxLength: 30 },
      { key: "description", label: "Description", maxLength: 200 },
    ],
  });
  const addStudent = () => openModal({
    title: T("students.add", "Add a student"),
    endpoint: "/students",
    fields: [
      { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
      { key: "email", label: "Email", type: "email" },
      { key: "age", label: "Age", type: "number", min: 3, max: 25 },
      { key: "grade", label: "Grade / Class", maxLength: 20 },
    ],
  });
  const addParent = () => openModal({
    title: T("parents.add", "Add a parent"),
    endpoint: "/parents",
    fields: [
      { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "tel" },
    ],
  });
  const registerOrg = () => openModal({ title: T("org.register", "Register your organization"), endpoint: "/org", fields: orgRegistrationFields });
  const editOrg = () => openModal({
    title: org.status === "rejected" ? T("org.resubmitTitle", "Resubmit your organization") : T("org.editTitle", "Edit your organization"),
    endpoint: "/org",
    fields: orgRegistrationFields,
    initial: {
      name: org.name, type: org.type, address: org.address, phone: org.phone,
      designation: profile?.designation || "", designationOther: profile?.designationOther || "",
    },
  });
  const search = (id, value, onChange, label) => (
    <label className={styles.search} htmlFor={id}>
      <MdSearch aria-hidden="true" />
      <span className="d-sr-only">{label}</span>
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} />
    </label>
  );
  const QF = ["all", "pending", "approved", "rejected"];
  const qfLabel = { all: T("q.all", "All"), pending: T("q.pending", "Waiting"), approved: T("q.approved", "Approved"), rejected: T("q.rejected", "Sent back") };
  const qfCount = { all: questionStats.totalUploads, pending: questionStats.pendingUploads, approved: questionStats.approvedUploads, rejected: questionStats.rejectedUploads };

  return (
    <DashboardShell
      brand={{ label: "LEARNIGO", role: T("brandRole", "School admin"), to: "/admin-dashboard" }}
      nav={nav}
      active={section}
      sideNote={false}
      contextSwitcher={org ? (
        <span className={styles.orgPill} title={org.name}>
          {org.logoUrl ? <img src={org.logoUrl} alt="" width="22" height="22" /> : <MdBusiness aria-hidden="true" />}
          <span className={styles.orgPillText}>{org.name}</span>
        </span>
      ) : null}
      user={(
        <span className={styles.userBar}>
          {/* In a shell slot, so changing sections doesn't cut the hello short. */}
          <WelcomeToast name={adminUser?.name} place="school" />
          <button type="button" className={styles.profileBtn} onClick={editProfile} aria-haspopup="dialog"
            aria-label={T("profileAria", "Your profile: {{name}}. Edit it", { name: adminUser?.name || adminUser?.email || "" })}>
            <MdPerson aria-hidden="true" />
            <span className={styles.profileText}>
              <span className={styles.profileName}>{adminUser?.name || adminUser?.email}</span>
              {profile?.designation && <span className={styles.profileRole}>{designationLabel(profile)}</span>}
            </span>
          </button>
          <Button size="sm" variant="ghost" icon={MdLogout} onClick={handleLogout} className={styles.iconOnPhone} aria-label={T("logout", "Sign out")}>{T("logout", "Sign out")}</Button>
        </span>
      )}
    >
      {/* New schools are approved straight away (self-serve, free). Only a school Learnigo turned
          down and that sent its details again waits for another look. */}
      {org && org.status === "pending" && org.rejectionHistory?.length > 0 && (
        <div className={`${styles.banner} ${styles.bannerWait}`} role="status">
          <MdPending aria-hidden="true" /> <span>{T("bannerResubmitted", "Thanks for updating your details. Learnigo is taking another look; you can keep setting things up meanwhile.")}</span>
        </div>
      )}
      {org && org.status === "rejected" && (
        <div className={`${styles.banner} ${styles.bannerRed}`} role="status">
          <MdClose aria-hidden="true" />
          <span>{T("bannerRejected", "Your organization was not approved. Reason: {{reason}} You can update your details and resubmit.", { reason: org.rejectionReason || "No reason given." })}</span>
          {section !== "org" && <Button size="sm" variant="soft" onClick={() => goSection("org")}>{T("org.resubmit", "Resubmit registration")}</Button>}
        </div>
      )}

      {/* ── Overview ── */}
      {section === "overview" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("ov.title", "Welcome back, {{name}}", { name: adminUser?.name || adminUser?.email })}
            text={org ? T("ov.text", "Your team, classes and students at a glance.") : T("ov.textNoOrg", "Register your school or centre to start.")} />
          {org ? (
            <div className={styles.hero}>
              <div className={styles.heroOrg}>
                {org.logoUrl ? <img src={org.logoUrl} alt="" className={styles.orgLogo} /> : <img src={mascotImg} alt="" className={styles.heroPup} width="64" height="74" />}
                <div className={styles.grow}>
                  <h2 className={styles.heroTitle}>{org.name}</h2>
                  <p className={styles.muted}>{org.type?.replace("_", " ")} · <StatusBadge status={org.status} /></p>
                </div>
              </div>
              <div className={styles.heroCta}>
                <p>{T("ov.schoolText", "The school dashboard has the school tree, insights, imports and settings.")}</p>
                {schoolLink}
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <EmptyState title={T("ov.setupTitle", "Set up your organization")}
                text={T("ov.setupText", "Register your school or coaching centre to start managing teachers, groups and students.")}
                actionLabel={T("org.register", "Register your organization")} onAction={registerOrg} />
            </div>
          )}
          <div className={styles.tiles}>
            <KpiTile label={T("tile.tutors", "Teachers")} value={stats.tutors} icon={MdPeople} hue="grape" onClick={() => goSection("tutors")} />
            <KpiTile label={T("tile.batches", "Groups")} value={stats.batches} icon={MdGroups} hue="sky" onClick={() => goSection("batches")} />
            <KpiTile label={T("tile.students", "Students")} value={stats.students} icon={MdSchool} hue="grass" onClick={() => goSection("students")} />
            <KpiTile label={T("tile.parents", "Parents")} value={stats.parents} icon={MdFamilyRestroom} hue="sun" onClick={() => goSection("parents")} />
          </div>
        </div>
      )}

      {/* ── Organization ── */}
      {section === "org" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("org.title", "Organization")}
            text={org ? T("org.text", "Your school's details as Learnigo sees them.") : T("org.textNoneFree", "This sets up your school or centre on Learnigo. It's free and ready straight away.")}
            actions={!org
              ? <Button icon={MdAdd} aria-haspopup="dialog" onClick={registerOrg}>{T("org.registerNow", "Register now")}</Button>
              : <Button icon={MdEdit} aria-haspopup="dialog" onClick={editOrg}>{org.status === "rejected" ? T("org.resubmit", "Resubmit registration") : T("org.edit", "Edit organization")}</Button>} />
          {!org ? (
            <div className={styles.card}>
              <EmptyState title={T("org.noneTitle", "Register your organization")}
                text={T("org.noneText", "Please also say who you are (for example Principal, Father, Mother).")}
                actionLabel={T("org.registerNow", "Register now")} onAction={registerOrg} />
            </div>
          ) : (
            <div className={`${styles.card} ${styles.orgCard}`}>
              {org.logoUrl && <img src={org.logoUrl} alt="" className={styles.orgLogo} />}
              <dl className={styles.dl}>
                <div><dt>Name</dt><dd>{org.name}</dd></div>
                <div><dt>Type</dt><dd>{org.type?.replace("_", " ")}</dd></div>
                <div><dt>Address</dt><dd>{org.address || "—"}</dd></div>
                <div><dt>Phone</dt><dd>{org.phone || "—"}</dd></div>
                <div><dt>Status</dt><dd><StatusBadge status={org.status} /></dd></div>
                {profile?.designation && <div><dt>Declared By</dt><dd>{designationLabel(profile)}</dd></div>}
              </dl>
              {org.status === "approved" && (
                <p className={styles.okText}><MdCheckCircle aria-hidden="true" /> {T("org.ready", "All set: you can now manage your team.")}</p>
              )}
              {org.rejectionHistory?.length > 0 && (
                <div className={styles.history}>
                  <h2 className={styles.h3}>{T("org.pastRejections", "Past rejections")}</h2>
                  {org.rejectionHistory.map((h, i) => (
                    <p key={i}>{new Date(h.rejectedAt).toLocaleDateString()}: {h.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tutors (teachers) ── */}
      {section === "tutors" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("tutors.title", "Teachers")} text={T("tutors.text", "The people who teach your groups. They sign in with the email you add here.")}
            actions={<Button icon={MdAdd} aria-haspopup="dialog" onClick={addTutor}>{T("tutors.add", "Add a teacher")}</Button>} />
          {search("tutor-search", tutorSearch, (v) => { setTutorSearch(v); loadTutors(v); }, T("tutors.search", "Search teachers by name…"))}
          <Table
            caption={T("tutors.title", "Teachers")}
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "subject", label: "Subject" },
              { key: "phone", label: "Phone" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={tutors}
            actions={[
              { icon: <MdInsights />, title: "View Performance", onClick: openTutorPerformance },
              {
                icon: <MdEdit />, title: "Edit", onClick: (row) => openModal({
                  title: T("tutors.edit", "Edit teacher"),
                  endpoint: `/tutors/${row._id}`,
                  method: "PATCH",
                  fields: tutorFields,
                  initial: { name: row.name, email: row.email, phone: row.phone, subject: row.subject, status: row.status },
                }),
              },
              { icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/tutors", row._id) },
            ]}
            empty={<EmptyState compact title={T("tutors.emptyTitle", "No teachers yet")} text={T("tutors.emptyText", "Add your first teacher; they can then sign in and see their groups.")} actionLabel={T("tutors.add", "Add a teacher")} onAction={addTutor} />}
          />
        </div>
      )}

      {/* ── Batches (groups) ── */}
      {section === "batches" && (
        selectedBatchId ? (
          <div className={styles.legacy}>
            <BatchDetail
              batchId={selectedBatchId}
              get={get}
              post={post}
              del={del}
              onClose={() => setSelectedBatchId(null)}
              onChanged={() => { loadBatches(); loadStats(); }}
            />
          </div>
        ) : (
          <div className={styles.section}>
            <PanelHead as="h1" title={T("batches.title", "Groups")} text={T("batches.text", "Classes or batches: who learns together, with which teachers and subjects.")}
              actions={<Button icon={MdAdd} aria-haspopup="dialog" onClick={addBatch}>{T("batches.add", "Create a group")}</Button>} />
            <Table
              caption={T("batches.title", "Groups")}
              columns={[
                { key: "name", label: "Batch Name" },
                { key: "academicYear", label: "Year / Term", render: (r) => [r.academicYear, r.term].filter(Boolean).join(" · ") || "—" },
                { key: "subjects", label: "Subjects", render: (r) => r.subjects?.length || 0 },
                { key: "tutorIds", label: "Tutors", render: (r) => r.tutorIds?.length || 0 },
                { key: "studentIds", label: "Students", render: (r) => `${r.studentIds?.length || 0}${r.maxStudents ? ` / ${r.maxStudents}` : ""}` },
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              ]}
              rows={batches}
              actions={[
                { icon: <MdVisibility />, title: "Open Batch", onClick: (row) => setSelectedBatchId(row._id) },
                { icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/batches", row._id) },
              ]}
              empty={<EmptyState compact title={T("batches.emptyTitle", "No groups yet")} text={T("batches.emptyText", "Create your first group, then add students and teachers to it.")} actionLabel={T("batches.add", "Create a group")} onAction={addBatch} />}
            />
          </div>
        )
      )}

      {/* ── Subjects ── */}
      {section === "subjects" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("subjects.title", "Subjects")} text={T("subjects.text", "What your groups learn. English, Maths and Science come ready-made.")}
            actions={<Button icon={MdAdd} aria-haspopup="dialog" onClick={addSubject}>{T("subjects.add", "Add a subject")}</Button>} />
          <Table
            caption={T("subjects.title", "Subjects")}
            columns={[
              { key: "name", label: "Name" },
              { key: "code", label: "Code" },
              { key: "isDefault", label: "Default", render: (r) => (r.isDefault ? "Yes" : "No") },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={subjects}
            actions={[
              {
                icon: <MdDelete />, title: "Remove", variant: "delete",
                onClick: async (row) => {
                  if (!confirm("Remove this subject?")) return;
                  await del(`/subjects/${row._id}`);
                  loadSection("subjects");
                },
              },
            ]}
            empty={<EmptyState compact title={T("subjects.emptyTitle", "No subjects yet")} text="No subjects yet. English, Maths, and Science are added automatically when you register your organization." actionLabel={T("subjects.add", "Add a subject")} onAction={addSubject} />}
          />
        </div>
      )}

      {/* ── Students ── */}
      {section === "students" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("students.title", "Students")} text={T("students.text", "Everyone who learns with you. Open one to see how they are doing.")}
            actions={<Button icon={MdAdd} aria-haspopup="dialog" onClick={addStudent}>{T("students.add", "Add a student")}</Button>} />
          {search("student-search", studentSearch, (v) => { setStudentSearch(v); loadStudents(v); }, T("students.search", "Search students by name…"))}
          <Table
            caption={T("students.title", "Students")}
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "grade", label: "Grade" },
              { key: "age", label: "Age" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={students}
            actions={[
              { icon: <MdInsights />, title: "View Performance", onClick: openStudentPerformance },
              {
                icon: <MdEdit />, title: "Edit", onClick: (row) => openModal({
                  title: T("students.edit", "Edit student"),
                  endpoint: `/students/${row._id}`,
                  method: "PATCH",
                  fields: studentFields,
                  initial: { name: row.name, email: row.email, age: row.age, grade: row.grade, status: row.status },
                }),
              },
              { icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/students", row._id) },
            ]}
            empty={<EmptyState compact title={T("students.emptyTitle", "No students yet")} text={T("students.emptyText", "Add your first student, or import a whole class in the school dashboard.")} actionLabel={T("students.add", "Add a student")} onAction={addStudent} />}
          />
        </div>
      )}

      {/* ── Parents ── */}
      {section === "parents" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("parents.title", "Parents")} text={T("parents.text", "Parents and guardians who follow their child's learning.")}
            actions={<Button icon={MdAdd} aria-haspopup="dialog" onClick={addParent}>{T("parents.add", "Add a parent")}</Button>} />
          <Table
            caption={T("parents.title", "Parents")}
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "studentIds", label: "Children", render: (r) => r.studentIds?.length || 0 },
              { key: "consentGiven", label: "Consent", render: (r) => (r.consentGiven ? "Yes" : "No") },
            ]}
            rows={parents}
            empty={<EmptyState compact title={T("parents.emptyTitle", "No parents linked yet")} text={T("parents.emptyText", "Add a parent with their email; signing in with that address links them.")} actionLabel={T("parents.add", "Add a parent")} onAction={addParent} />}
          />
        </div>
      )}

      {/* ── Question review ── */}
      {section === "questions" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("q.title", "Question review")} text={T("q.text", "Approve or send back the questions your teachers upload, before learners see them.")} />
          <div className={`${styles.tiles} ${styles.tallOnly}`}>
            <KpiTile label={T("q.total", "Total uploads")} value={questionStats.totalUploads} icon={MdRateReview} hue="sun" />
            <KpiTile label={T("q.pendingTile", "Waiting for review")} value={questionStats.pendingUploads} icon={MdPending} hue="sky" tone={questionStats.pendingUploads ? "attention" : "neutral"} onClick={() => handleQuestionFilterChange("pending")} />
            <KpiTile label={T("q.approvedTile", "Approved")} value={questionStats.approvedUploads} icon={MdCheckCircle} hue="grass" onClick={() => handleQuestionFilterChange("approved")} />
            <KpiTile label={T("q.rejectedTile", "Sent back")} value={questionStats.rejectedUploads} icon={MdThumbDown} hue="coral" onClick={() => handleQuestionFilterChange("rejected")} />
          </div>
          <SubTabs idBase="qf" sticky={false} label={T("q.filter", "Show uploads")} value={questionFilterStatus} onChange={handleQuestionFilterChange}
            tabs={QF.map((k) => ({ id: k, label: `${qfLabel[k]} · ${qfCount[k] ?? 0}` }))} />
          <SubPanel idBase="qf" id={questionFilterStatus} value={questionFilterStatus}>
            <Table
              fit={300}
              caption={T("q.title", "Question review")}
              columns={[
                { key: "originalFilename", label: "File" },
                { key: "module", label: "Module / Subject", render: (r) => `${r.module} / ${r.subject}` },
                { key: "submittedByName", label: "Teacher", render: (r) => `${r.submittedByName} (${r.submittedByEmail})` },
                { key: "rowCount", label: "Rows", render: (r) => `${r.rowCount}${r.skippedRowCount ? ` (+${r.skippedRowCount} skipped)` : ""}` },
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                { key: "createdAt", label: "Uploaded", render: (r) => new Date(r.createdAt).toLocaleDateString() },
              ]}
              rows={questionBatches}
              actions={[
                { icon: <MdVisibility />, title: "View Questions", onClick: (row) => setViewQuestionBatchId(row._id) },
                { icon: <MdCheckCircle />, title: "Approve", onClick: handleApproveQuestion },
                {
                  icon: <MdThumbDown />, title: "Reject", variant: "delete", onClick: (row) => openModal({
                    title: T("q.rejectTitle", "Send this upload back"),
                    endpoint: `/questions/uploads/${row._id}/reject`,
                    fields: [{ key: "reason", label: "Reason", required: true, minLength: 5, maxLength: 500 }],
                  }),
                },
              ]}
              empty={<EmptyState compact title={T("q.emptyTitle", "Nothing here")} text={`No question uploads${questionFilterStatus !== "all" ? ` with status "${questionFilterStatus}"` : ""} found.`} />}
            />
          </SubPanel>
        </div>
      )}

      {/* ── Reports ── */}
      {section === "reports" && (
        <div className={styles.section}>
          <PanelHead as="h1" title={T("reports.title", "Reports")} text={T("reports.text", "How big your school is today.")} actions={schoolLink} />
          <div className={styles.tiles}>
            <KpiTile label={T("tile.tutorsTotal", "Total teachers")} value={stats.tutors} icon={MdPeople} hue="grape" onClick={() => goSection("tutors")} />
            <KpiTile label={T("tile.batchesTotal", "Total groups")} value={stats.batches} icon={MdGroups} hue="sky" onClick={() => goSection("batches")} />
            <KpiTile label={T("tile.studentsTotal", "Total students")} value={stats.students} icon={MdSchool} hue="grass" onClick={() => goSection("students")} />
            <KpiTile label={T("tile.parentsTotal", "Total parents")} value={stats.parents} icon={MdFamilyRestroom} hue="sun" onClick={() => goSection("parents")} />
          </div>
          <p className={styles.note}>
            <MdBarChart aria-hidden="true" />
            <span>{T("reports.note", "For one person's learning, open Teachers or Students, find them, and press the chart button. The school dashboard has charts for every grade and class.")}</span>
          </p>
        </div>
      )}

      {/* ── Messages (chat with Learnigo) ── */}
      {section === "chat" && (
        <div className={`${styles.section} ${styles.chatSection}`}>
          <PanelHead as="h1" title={T("chat.title", "Messages")} text={T("chat.text", "Write to the Learnigo team about your organization or registration.")} />
          <ChatPanel
            messages={chatMessages}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSend={handleSendChat}
            sending={chatSending}
          />
        </div>
      )}

      {modal && (
        <FormSheet
          key={modal.title + (modal.endpoint || "")}
          title={modal.title}
          fields={modal.fields}
          initial={modal.initial}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
          loading={modalLoading}
          serverError={modalError}
        />
      )}

      {perfModal && <PerformanceSheet data={perfModal} onClose={() => setPerfModal(null)} />}

      {/* Question upload batch detail (parsed rows) */}
      {viewQuestionBatchId && (
        <QuestionBatchDetailModal batchId={viewQuestionBatchId} get={get} post={post} onClose={() => setViewQuestionBatchId(null)} />
      )}

      {dashboardViewerStudent && (
        <StudentDashboardViewer
          apiBase={`${API}/api/admin/students/${dashboardViewerStudent.id}/dashboard`}
          token={token}
          displayName={dashboardViewerStudent.name}
          onClose={() => setDashboardViewerStudent(null)}
        />
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
