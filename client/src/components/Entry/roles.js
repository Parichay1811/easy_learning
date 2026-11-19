// The kinds of player on the entry screens: colours and where each signs in.
// `color` is the fill (emblem ring, the door of light, the glow), `soft` the
// pale tint behind things, `ink` coloured text on white (>= 4.5:1), `lip` the
// darker toy-like edge under cards, `btn`/`btnLip` a button face that carries
// white text at >= 4.5:1 and its edge.
export const ROLE_THEME = {
  student: { color: "#339af0", soft: "#dbeefe", ink: "#1864ab", lip: "#1971c2", btn: "#1971c2", btnLip: "#124f8a", route: "/login" },
  parent: { color: "#f06595", soft: "#ffe3ee", ink: "#b0245f", lip: "#c2255c", btn: "#c2255c", btnLip: "#8c1a43", route: "/parent-login" },
  teacher: { color: "#40c057", soft: "#e3f6e7", ink: "#237032", lip: "#2b8a3e", btn: "#237032", btnLip: "#17501f", route: "/teacher-login" },
  school: { color: "#ff8a3d", soft: "#ffe8d6", ink: "#a63d00", lip: "#d9480f", btn: "#c4410b", btnLip: "#8a2d06", route: "/admin-login" },
  team: { color: "#8b5cf6", soft: "#efe7ff", ink: "#6d28d9", lip: "#6741d9", btn: "#6741d9", btnLip: "#4a2ba3", route: "/superadmin-login" },
  tutor: { color: "#20c997", soft: "#d3f9ec", ink: "#0a6b52", lip: "#0ca678", btn: "#087f5b", btnLip: "#05573e", route: "/teach" },
};

/** CSS custom properties for a role, to put on an element's style. */
export function roleVars(key) {
  const r = ROLE_THEME[key] || ROLE_THEME.student;
  return {
    "--role": r.color,
    "--role-soft": r.soft,
    "--role-ink": r.ink,
    "--role-lip": r.lip,
    "--role-btn": r.btn,
    "--role-btn-lip": r.btnLip,
  };
}
