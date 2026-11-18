// Shared by the school pages: the base path and the caller's access (role, perms, modules).
import { createContext, useContext } from "react";

export const BASE = "/admin-school";
export const SchoolCtx = createContext(null);
export const useSchool = () => useContext(SchoolCtx);
