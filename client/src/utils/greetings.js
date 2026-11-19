// The AI teacher's welcome: one of twenty warm greetings, said in her voice
// (the site's narrator, utils/narrator.js) in the site's language, once per
// visit for each place it is used. Returns the line it said, so the page can
// show it in a speech bubble too.
//
//   import { welcome } from "../utils/greetings";
//   const line = welcome({ name: "Aanya", place: "home" });
import i18n from "../i18n/i18n";
import { narrate } from "./narrator";
import { getSpeechLang } from "./speechLang";
import { GREETINGS } from "./greetingLines";

const LAST_KEY = "learnigo_last_greeting";

function lines(lang) {
  const base = (lang || "en").split("-")[0];
  return GREETINGS[base] || GREETINGS.en;
}

/** A greeting in the current language, with the name filled in (or left out). */
export function pickGreeting(name) {
  const lang = i18n.language || "en";
  const list = lines(lang);
  let last = -1;
  try { last = Number(sessionStorage.getItem(LAST_KEY) ?? -1); } catch { /* private mode */ }
  let i = Math.floor(Math.random() * list.length);
  if (i === last) i = (i + 1) % list.length;
  try { sessionStorage.setItem(LAST_KEY, String(i)); } catch { /* private mode */ }
  // The first name; a title ("Mrs Sharma", "Dr. Rao") keeps the surname with it.
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const titled = /^(mr|mrs|ms|miss|mx|dr|prof|sir|madam|herr|frau|sr|sra|mme|mlle)\.?$/i.test(parts[0] || "");
  const who = titled ? parts.slice(0, 2).join(" ") : parts[0] || "";
  const line = list[i];
  // "{name}" is filled in; without a name, the comma or space around it goes too.
  // (Also the Japanese "さん" after it, and full-width commas.)
  return who ? line.replace(/\{name\}/g, who) : line.replace(/[,，、]?\s*\{name\}(さん)?/g, "");
}

/**
 * Says a welcome once per visit for `place` (e.g. "home", "parent"). Returns
 * the line, or null when it was already said (pass force to say it again).
 */
export function welcome({ name, place = "site", force = false, delay = 350 } = {}) {
  const key = `learnigo_welcomed_${place}`;
  try {
    if (!force && sessionStorage.getItem(key)) return null;
    sessionStorage.setItem(key, "1");
  } catch { /* private mode: say it anyway */ }
  const line = pickGreeting(name);
  const lang = getSpeechLang(i18n.language || "en");
  setTimeout(() => { narrate(line, { lang }); }, delay);
  return line;
}
