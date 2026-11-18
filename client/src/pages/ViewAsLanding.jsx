// /view-as: opened by the console in a new tab. Puts the read-only token in place
// and goes to that person's dashboard; the ViewAsBanner then stays on top.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { activatePending } from "../components/ViewAs/viewAsStore";

export default function ViewAsLanding() {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let p = null;
    try { p = activatePending(); } catch { p = null; }
    if (p?.path) window.location.replace(p.path);
    else Promise.resolve().then(() => setFailed(true));
  }, []);
  return (
    <main style={{ padding: "64px 16px", textAlign: "center", fontFamily: "Fredoka, system-ui, sans-serif", color: "#1d2433" }}>
      {failed ? (
        <>
          <h1>{t("viewAs.expiredTitle", "This view-as link has expired")}</h1>
          <p>{t("viewAs.expiredText", "Start the read-only view again from the console.")}</p>
          <a href="/superadmin-dashboard">{t("viewAs.back", "Back to the console")}</a>
        </>
      ) : <p>{t("viewAs.opening", "Opening the read-only view…")}</p>}
    </main>
  );
}
