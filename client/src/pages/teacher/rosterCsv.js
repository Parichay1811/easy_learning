// Turn pasted text or a CSV file into roster rows (TCH-011). Accepts commas, semicolons or
// tabs (a copy from a spreadsheet), quoted values, and an optional header row. Without a
// header the columns are: name, email, grade, age, parent email, parent name.
const FIELDS = ["name", "email", "grade", "age", "parentEmail", "parentName"];
const HEADER_WORDS = {
  name: ["name", "student", "student name", "full name", "learner"],
  email: ["email", "e-mail", "student email", "mail"],
  grade: ["grade", "year", "class", "level"],
  age: ["age"],
  parentEmail: ["parent email", "parent e-mail", "guardian email", "parent mail"],
  parentName: ["parent name", "parent", "guardian", "guardian name"],
};

function splitLine(line, sep) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

export function parseRoster(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], header: false };
  const first = lines[0];
  const sep = first.includes("\t") ? "\t" : (first.split(";").length > first.split(",").length ? ";" : ",");
  const cells = lines.map((l) => splitLine(l, sep));
  const head = cells[0].map((h) => h.toLowerCase());
  const map = {};
  head.forEach((h, i) => {
    for (const [field, words] of Object.entries(HEADER_WORDS)) if (!(field in map) && words.includes(h)) map[field] = i;
  });
  const header = "name" in map;
  const order = header ? map : Object.fromEntries(FIELDS.map((f, i) => [f, i]));
  const body = header ? cells.slice(1) : cells;
  const rows = body.map((c) => Object.fromEntries(FIELDS.map((f) => [f, order[f] != null ? (c[order[f]] || "") : ""])))
    .filter((r) => Object.values(r).some(Boolean));
  return { rows, header };
}

export const SAMPLE_CSV = "name,email,grade,parent email\nAnaya Shah,anaya@example.com,Year 4,anaya.parent@example.com\nLeo Brennan,leo@example.com,Year 4,\n";
