// "View as" (SUP-002): asks why, gets a 30-minute read-only token and opens the
// person's dashboard in a new tab, where an orange banner stays on top.
import { useTranslation } from "react-i18next";
import { useConsoleApi } from "./api";
import { ReasonDialog } from "./ui";
import { setPending } from "../../../components/ViewAs/viewAsStore";
import s from "./console.module.css";

export default function ViewAsDialog({ target, onClose }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const start = async (reason) => {
    const r = await api.post("/view-as", { targetRole: target.role, targetId: target.id, reason });
    try {
      setPending({ token: r.token, storageKey: r.storageKey, path: r.path, expiresAt: r.expiresAt, sessionId: r.sessionId, target: r.target });
    } catch { throw new Error(t("sa.viewAs.storage", "This browser blocks local storage, so view-as cannot open.")); }
    window.open("/view-as", "_blank");
  };
  return (
    <ReasonDialog
      title={t("sa.viewAs.title", "View as {{name}}", { name: target.name || target.email })}
      intro={t("sa.viewAs.intro", "You will see exactly what this {{role}} sees, read-only, for 30 minutes. Nothing can be changed. This is recorded in the audit log and their organisation's admin is told.", { role: target.role })}
      min={10}
      confirmLabel={t("sa.viewAs.start", "Start read-only view")}
      onConfirm={start}
      onClose={onClose}
      extra={<p className={`${s.small} ${s.muted}`}>{t("sa.viewAs.example", "Example: \"Ticket 1234: admin cannot see Year 5 results\".")}</p>}
    />
  );
}
