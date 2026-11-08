// Is what the microphone heard just the teacher's own voice coming back from
// the speakers? Words are compared by their first four letters, so "metres"
// and "meters" still match, and in pairs, in order, so a new question that
// reuses the teacher's words ("the area of a rectangle 9 by 4") is not echo.
const stems = (text) => text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w.slice(0, 4));
const pairs = (words) => words.slice(1).map((w, i) => `${words[i]} ${w}`);

export function isEcho(heardText, teacherLines) {
  const heard = pairs(stems(heardText));
  const known = new Set(teacherLines.flatMap((s) => pairs(stems(s))));
  return heard.length >= 2 && heard.filter((p) => known.has(p)).length / heard.length >= 0.5;
}
