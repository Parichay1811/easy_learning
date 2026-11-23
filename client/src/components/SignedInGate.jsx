import { Navigate, useLocation } from "react-router-dom";
import { activeSession, sessionFor } from "../utils/session";

// Somebody already signed in is not asked to sign in again (utils/session.js): the
// entry page ("who are you?") opens their last-used place, and a role's sign-in page
// opens that role's place. Before any of the page draws, so nothing flashes.
// `?switch` shows the page anyway. A parent invite link is kept for the dashboard.
export default function SignedInGate({ role, children }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (params.has("switch")) return children;
  const session = role ? sessionFor(role) : activeSession();
  if (!session) return children;
  if (session.role === "parent" && params.get("invite")) {
    try { sessionStorage.setItem("parent_invite", params.get("invite")); } catch { /* private mode */ }
  }
  return <Navigate to={session.home} replace />;
}
