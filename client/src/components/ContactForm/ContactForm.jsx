import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAttachFile, MdCheckCircle, MdSend } from "react-icons/md";
import styles from "./ContactForm.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ROLE_OPTIONS = ["student", "parent", "admin", "teacher", "other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// `dense`: the one-screen Contact page (tighter spacing, a shorter message box).
function ContactForm({ fixedRole, defaultName = "", defaultEmail = "", defaultOrgName = "", onSuccess, compact = false, dense = false }) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState(fixedRole || "student");
  const [orgName, setOrgName] = useState(defaultOrgName);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = t("contactForm.errors.name");
    if (!EMAIL_RE.test(email.trim())) e.email = t("contactForm.errors.email");
    if (!subject.trim() || subject.trim().length < 3) e.subject = t("contactForm.errors.subject");
    if (!message.trim() || message.trim().length < 10) e.message = t("contactForm.errors.message");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("role", role);
      form.append("orgName", orgName.trim());
      form.append("subject", subject.trim());
      form.append("message", message.trim());
      if (attachment) form.append("attachment", attachment);

      const r = await fetch(`${API}/api/contact`, { method: "POST", body: form });
      const data = await r.json();
      if (!data.success) {
        setServerError(data.message || t("contactForm.errorServer"));
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
      setAttachment(null);
      onSuccess?.();
    } catch {
      setServerError(t("contactForm.errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <MdCheckCircle className={styles.successIcon} />
        <h3>{t("contactForm.successTitle")}</h3>
        <p>{t("contactForm.successText")}</p>
        <button className={styles.submitBtn} onClick={() => setSent(false)}>{t("contactForm.sendAnother")}</button>
      </div>
    );
  }

  return (
    <form className={`${styles.form} ${compact ? styles.compact : ""} ${dense ? styles.dense : ""}`} onSubmit={handleSubmit} noValidate>
      {!fixedRole && (
        <div className={`${styles.field} ${styles.fRole}`}>
          <label htmlFor="cf-role">{t("contactForm.iAmA")}</label>
          <select id="cf-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((o) => <option key={o} value={o}>{t(`contactForm.roles.${o}`)}</option>)}
          </select>
        </div>
      )}
      <div className={styles.row}>
        <div className={`${styles.field} ${styles.fName}`}>
          <label htmlFor="cf-name">{t("contactForm.yourName")}</label>
          <input id="cf-name" autoComplete="name" aria-invalid={Boolean(errors.name)} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contactForm.namePlaceholder")} />
          {errors.name && <span className={styles.error} role="alert">{errors.name}</span>}
        </div>
        <div className={`${styles.field} ${styles.fEmail}`}>
          <label htmlFor="cf-email">{t("contactForm.yourEmail")}</label>
          <input id="cf-email" type="email" autoComplete="email" inputMode="email" aria-invalid={Boolean(errors.email)} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contactForm.emailPlaceholder")} />
          {errors.email && <span className={styles.error} role="alert">{errors.email}</span>}
        </div>
      </div>
      {/* The organisation matters for a school, a teacher or a group, not for a learner or a parent. */}
      {(fixedRole || !["student", "parent"].includes(role)) && (
        <div className={`${styles.field} ${styles.fOrg}`}>
          <label htmlFor="cf-org">{t("contactForm.organization")}</label>
          <input id="cf-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={t("contactForm.orgPlaceholder")} autoComplete="organization" />
        </div>
      )}
      <div className={`${styles.field} ${styles.fSubject}`}>
        <label htmlFor="cf-subject">{t("contactForm.subject")}</label>
        <input id="cf-subject" aria-invalid={Boolean(errors.subject)} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("contactForm.subjectPlaceholder")} />
        {errors.subject && <span className={styles.error} role="alert">{errors.subject}</span>}
      </div>
      <div className={`${styles.field} ${styles.fMessage}`}>
        <label htmlFor="cf-message">{t("contactForm.message")}</label>
        <textarea id="cf-message" rows={compact || dense ? 3 : 5} aria-invalid={Boolean(errors.message)} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contactForm.messagePlaceholder")} />
        {errors.message && <span className={styles.error} role="alert">{errors.message}</span>}
      </div>
      <div className={`${styles.field} ${styles.fFile}`}>
        <label className={styles.fileLabel}>
          <MdAttachFile /> {attachment ? attachment.name : t("contactForm.attachFile")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className={styles.fileInput}
          />
        </label>
      </div>
      {serverError && <p className={`${styles.serverError} ${styles.fError}`} role="alert">{serverError}</p>}
      <button type="submit" className={`${styles.submitBtn} ${styles.fSend}`} disabled={submitting}>
        <MdSend /> {submitting ? t("contactForm.sending") : t("contactForm.sendMessage")}
      </button>
    </form>
  );
}

export default ContactForm;
