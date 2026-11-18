import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserFriends, FaCopy, FaCheck } from "react-icons/fa";
import styles from "./LinkParentCard.module.css";

const BASE = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
  const token = localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The learner's side of linking a parent (FND-012): make a one-time code, give
// it to the parent, and they enter it in their Learnigo parent dashboard.
export default function LinkParentCard() {
  const { t } = useTranslation();
  const [state, setState] = useState({ status: "idle", code: "", expiresAt: null, error: "" });
  const [copied, setCopied] = useState(false);

  const makeCode = async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    setCopied(false);
    try {
      const res = await fetch(`${BASE}/dashboard/link-code`, { method: "POST", credentials: "include", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "failed");
      setState({ status: "ready", code: data.code, expiresAt: data.expiresAt, error: "" });
    } catch (err) {
      setState({
        status: "error", code: "", expiresAt: null,
        error: err.message && err.message !== "failed" ? err.message : t("linkParent.error", { defaultValue: "Couldn't make a code. Please try again." }),
      });
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(state.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the code is on screen */ }
  };

  return (
    <section className={styles.card} aria-labelledby="link-parent-title">
      <div className={styles.icon} aria-hidden="true"><FaUserFriends /></div>
      <div className={styles.body}>
        <h2 id="link-parent-title">{t("linkParent.title", { defaultValue: "Link a parent" })}</h2>
        <p>{t("linkParent.text", { defaultValue: "Want a parent to follow your progress? Make a code and give it to them. They type it in their Learnigo parent page." })}</p>
        {state.status === "ready" && (
          <div className={styles.codeRow}>
            <output className={styles.code} aria-live="polite" aria-label={t("linkParent.codeLabel", { defaultValue: "Your link code" })}>
              {state.code.slice(0, 3)} {state.code.slice(3)}
            </output>
            <button type="button" className={styles.copy} onClick={copy}>
              {copied ? <FaCheck /> : <FaCopy />} {copied ? t("linkParent.copied", { defaultValue: "Copied" }) : t("linkParent.copy", { defaultValue: "Copy" })}
            </button>
            <small>{t("linkParent.once", { defaultValue: "Works once · lasts {{hours}} hours", hours: 24 })}</small>
          </div>
        )}
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      </div>
      <button type="button" className={styles.make} onClick={makeCode} disabled={state.status === "loading"}>
        {state.status === "ready" ? t("linkParent.another", { defaultValue: "New code" }) : t("linkParent.make", { defaultValue: "Make a code" })}
      </button>
    </section>
  );
}
