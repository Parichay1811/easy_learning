import { createContext, useContext, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ADMIN_JWT_KEY = "admin_jwt";
const SUPERADMIN_JWT_KEY = "superadmin_jwt";
const TEACHER_JWT_KEY = "teacher_jwt";
const PARENT_JWT_KEY = "parent_jwt";

const AdminAuthContext = createContext(null);

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const p = decodeJWT(token);
  if (!p?.exp) return true;
  return p.exp * 1000 < Date.now();
}

// Console staff: role (owner, support, ...), id and session id ride in the token (SUP-001).
const superAdminFrom = (p) => ({ email: p.email, name: p.name, role: "superadmin", staffRole: p.staffRole || "owner", staffId: p.staffId || "", sid: p.sid || "", breakGlass: p.breakGlass !== false && !p.staffId });

function readStoredUser(tokenKey, mapPayload) {
  const token = localStorage.getItem(tokenKey);
  if (!token || isExpired(token)) return null;
  return mapPayload(decodeJWT(token));
}

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => readStoredUser(ADMIN_JWT_KEY, (p) => (
    { id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "org_admin" }
  )));
  const [superAdminUser, setSuperAdminUser] = useState(() => readStoredUser(SUPERADMIN_JWT_KEY, superAdminFrom));
  const [teacherUser, setTeacherUser] = useState(() => readStoredUser(TEACHER_JWT_KEY, (p) => (
    { id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "teacher" }
  )));
  const [parentUser, setParentUser] = useState(() => readStoredUser(PARENT_JWT_KEY, (p) => (
    { id: p.id, uid: p.uid, email: p.email, name: p.name, role: "parent" }
  )));

  const adminGoogleSignIn = async (idToken) => {
    const res = await fetch(`${API}/api/admin/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok && res.status === 404) throw new Error("Admin auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(ADMIN_JWT_KEY, data.token);
    const p = decodeJWT(data.token);
    setAdminUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "org_admin" });
    return data.admin;
  };

  const superAdminLogin = async (email, password) => {
    const res = await fetch(`${API}/api/superadmin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok && res.status === 404) throw new Error("Super admin auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw Object.assign(new Error(data.message), { code: data.code });
    // Named staff continue with two-factor sign-in (data.step); the break-glass owner gets a token now.
    if (data.step) return data;
    return superAdminCompleteLogin(data);
  };

  // Stores the session token once every sign-in step is done (SUP-001).
  const superAdminCompleteLogin = (data) => {
    localStorage.setItem(SUPERADMIN_JWT_KEY, data.token);
    setSuperAdminUser(superAdminFrom(decodeJWT(data.token)));
    return data;
  };

  // Stores a teacher token (and, for a Solo owner, their admin token): used by sign-in,
  // Solo signup and the workspace switcher (TCH-001/003).
  const teacherUseToken = (token, adminToken) => {
    localStorage.setItem(TEACHER_JWT_KEY, token);
    const p = decodeJWT(token);
    setTeacherUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "teacher" });
    if (adminToken) {
      localStorage.setItem(ADMIN_JWT_KEY, adminToken);
      const a = decodeJWT(adminToken);
      setAdminUser({ id: a.id, uid: a.uid, email: a.email, name: a.name, orgId: a.orgId, role: "org_admin" });
    }
  };

  // Returns the whole answer ({ teacher, workspaces, needsChoice }). Errors carry `code`
  // (NO_TEACHER_ACCOUNT lets the login page offer a Solo workspace).
  const teacherGoogleSignIn = async (idToken, tutorId) => {
    const res = await fetch(`${API}/api/teacher/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tutorId ? { idToken, tutorId } : { idToken }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.success) {
      const err = new Error(data?.message || "No teacher account found for this email.");
      err.code = data?.code;
      throw err;
    }
    teacherUseToken(data.token, data.adminToken);
    return data;
  };

  const parentGoogleSignIn = async (idToken) => {
    const res = await fetch(`${API}/api/parent/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok && res.status === 404) throw new Error("Parent auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(PARENT_JWT_KEY, data.token);
    const p = decodeJWT(data.token);
    setParentUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, role: "parent" });
    return data.parent;
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_JWT_KEY);
    setAdminUser(null);
  };

  const superAdminLogout = () => {
    localStorage.removeItem(SUPERADMIN_JWT_KEY);
    setSuperAdminUser(null);
  };

  const teacherLogout = () => {
    localStorage.removeItem(TEACHER_JWT_KEY);
    setTeacherUser(null);
  };

  const parentLogout = () => {
    localStorage.removeItem(PARENT_JWT_KEY);
    setParentUser(null);
  };

  const getAdminToken = () => localStorage.getItem(ADMIN_JWT_KEY);
  const getSuperAdminToken = () => localStorage.getItem(SUPERADMIN_JWT_KEY);
  const getTeacherToken = () => localStorage.getItem(TEACHER_JWT_KEY);
  const getParentToken = () => localStorage.getItem(PARENT_JWT_KEY);

  return (
    <AdminAuthContext.Provider value={{
      adminUser, superAdminUser, teacherUser, parentUser,
      adminGoogleSignIn, superAdminLogin, superAdminCompleteLogin, teacherGoogleSignIn, teacherUseToken, parentGoogleSignIn,
      adminLogout, superAdminLogout, teacherLogout, parentLogout,
      getAdminToken, getSuperAdminToken, getTeacherToken, getParentToken,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook is co-located with its provider; 10+ call sites import it from this path
export const useAdminAuth = () => useContext(AdminAuthContext);
