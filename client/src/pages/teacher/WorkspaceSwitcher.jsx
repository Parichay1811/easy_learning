// TCH-003: one login, several workspaces ("Sunrise School" by day, "My tutoring" in the
// evening). Shown in the shell's context-switcher slot, and as a chooser after sign-in.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSchool, FaUserTie, FaChevronDown, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { apiCall } from "./teacherApi";
import { useSwitchWorkspace } from "./teacherShared";
import s from "./teacher.module.css";

const Icon = ({ kind }) => (kind === "solo" ? <FaUserTie aria-hidden="true" /> : <FaSchool aria-hidden="true" />);

// Full-page chooser right after sign-in when a person has more than one workspace.
export function WorkspaceChooser({ workspaces, onChosen }) {
  const { t } = useTranslation();
  const switchTo = useSwitchWorkspace();
  const [err, setErr] = useState("");
  const pick = async (w) => {
    const r = await switchTo(w.tutorId);
    if (r.ok) onChosen(); else setErr(r.message);
  };
  return (
    <div className={s.chooser} role="group" aria-label={t("teacher.ws.choose", { defaultValue: "Where are you teaching now?" })}>
      {workspaces.map((w) => (
        <button key={w.tutorId} type="button" className={s.chooserBtn} onClick={() => pick(w)}>
          <span className={s.chooserIcon}><Icon kind={w.kind} /></span>
          <span>
            <strong style={{ display: "block" }}>{w.name}</strong>
            <span className={s.muted}>{w.kind === "solo" ? t("teacher.ws.solo", { defaultValue: "My private tutoring" }) : t("teacher.ws.school", { defaultValue: "School or centre" })}</span>
          </span>
        </button>
      ))}
      {err && <p className={s.error}>{err}</p>}
    </div>
  );
}

export default function WorkspaceSwitcher({ current, onSwitched }) {
  const { t } = useTranslation();
  const { getTeacherToken } = useAdminAuth();
  const switchTo = useSwitchWorkspace();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(null);
  const ref = useRef(null);
  const token = getTeacherToken();
  // On phones the menu spans the screen width just under the button (it would not fit beside it).
  const toggle = () => {
    const phone = window.matchMedia("(max-width: 700px)").matches;
    setMenuTop(phone && ref.current ? Math.round(ref.current.getBoundingClientRect().bottom + 6) : null);
    setOpen((v) => !v);
  };

  useEffect(() => {
    apiCall("/teacher/auth/workspaces", { token }).then((r) => { if (r.ok) setList(r.workspaces); });
  }, [token]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const me = list.find((w) => w.orgId === String(current?.id)) || { name: current?.name, kind: current?.kind };
  const hasSolo = list.some((w) => w.kind === "solo");
  return (
    <div className={s.switcher} ref={ref}>
      <button type="button" className={s.switchBtn} aria-haspopup="menu" aria-expanded={open} onClick={toggle}
        aria-label={t("teacher.ws.current", { defaultValue: "Workspace: {{name}}. Switch workspace", name: me.name || "" })}>
        <Icon kind={me.kind} /> <span>{me.name}</span> <FaChevronDown aria-hidden="true" />
      </button>
      {open && (
        <ul className={s.switchMenu} role="menu" style={menuTop != null ? { position: "fixed", top: menuTop, left: 12, right: 12, minWidth: 0 } : undefined}>
          {list.map((w) => (
            <li key={w.tutorId} role="none">
              <button type="button" role="menuitemradio" aria-checked={w.orgId === String(current?.id)} className={s.switchItem}
                onClick={async () => { setOpen(false); if (w.orgId !== String(current?.id)) { const r = await switchTo(w.tutorId); if (r.ok) onSwitched(); } }}>
                <Icon kind={w.kind} />
                <span><strong>{w.name}</strong><small>{w.kind === "solo" ? t("teacher.ws.solo", { defaultValue: "My private tutoring" }) : t("teacher.ws.school", { defaultValue: "School or centre" })}</small></span>
              </button>
            </li>
          ))}
          {!hasSolo && (
            <li role="none">
              <Link role="menuitem" to="/teach" className={s.switchItem}><FaPlus aria-hidden="true" /><span><strong>{t("teacher.ws.startSolo", { defaultValue: "Start my own tutoring workspace" })}</strong><small>{t("teacher.ws.free", { defaultValue: "Free, takes a minute" })}</small></span></Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
