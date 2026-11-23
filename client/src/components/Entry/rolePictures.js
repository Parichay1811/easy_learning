// The painted picture of each kind of player (student, parent, teacher,
// school, private tutor): a warm, 3D-film family drawn to match the puppy.
// Square pictures in four widths (160–960 px), AVIF with a WebP fallback
// (src/assets/entry/role-<role>-<width>.<avif|webp>); <RolePicture> draws them.
const files = import.meta.glob("../../assets/entry/role-*.{avif,webp}", { eager: true, query: "?no-inline", import: "default" });

function build() {
  const out = {};
  for (const [path, url] of Object.entries(files)) {
    const m = path.match(/role-(\w+)-(\d+)\.(avif|webp)$/);
    if (!m) continue;
    const [, role, w, type] = m;
    out[role] ??= { avif: [], webp: [] };
    out[role][type].push([Number(w), url]);
  }
  for (const r of Object.values(out)) {
    for (const type of ["avif", "webp"]) r[type].sort((a, b) => a[0] - b[0]);
    r.avifSet = r.avif.map(([w, u]) => `${u} ${w}w`).join(", ");
    r.webpSet = r.webp.map(([w, u]) => `${u} ${w}w`).join(", ");
    r.src = (r.webp.find(([w]) => w === 320) || r.webp[0])[1];
  }
  return out;
}

export const ROLE_PICTURES = build();

// Where the faces are in each picture (object-position), so a wide, short
// crop still shows who it is.
export const ROLE_FOCUS = {
  student: "50% 30%",
  parent: "58% 34%",
  teacher: "52% 26%",
  school: "50% 42%",
  tutor: "60% 30%",
};
export const hasRolePicture = (role) => Boolean(ROLE_PICTURES[role]);

// How wide the big picture is drawn on a sign-in page (Entry.module.css):
// hidden on short landscape phones, a square on the left on wide screens, a
// banner across the card on phones and tablets.
export const HERO_SIZES = "(orientation: landscape) and (max-height: 540px) 1px, (min-width: 900px) and (min-height: 600px) and (min-aspect-ratio: 1/1) 360px, (min-width: 700px) and (orientation: portrait) 520px, min(440px, 100vw - 28px)";

const warmed = new Set();

/**
 * Starts fetching a role's sign-in picture when a card is hovered, focused or
 * pressed, so the picture is there the moment the page opens (and can fly
 * across from the card). AVIF only: a browser without it skips the hint and
 * loads its WebP as usual.
 */
export function warmRolePicture(role, sizes = HERO_SIZES) {
  const p = ROLE_PICTURES[role];
  if (!p || warmed.has(role) || typeof document === "undefined") return;
  warmed.add(role);
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.type = "image/avif";
  link.setAttribute("imagesrcset", p.avifSet);
  link.setAttribute("imagesizes", sizes);
  document.head.appendChild(link);
}
