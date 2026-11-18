// LearningEvent rows (newest first, from /analytics/timeline) -> kit Timeline events.
// Answers in a row on the same module and subject become one expandable entry.
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const DEVICE = { phone: "📱 Phone", tablet: "📱 Tablet", desktop: "💻 Computer" };

export function eventsToTimeline(rows, t) {
  const T = (k, d, o) => t(`parent.tl.${k}`, { defaultValue: d, ...o });
  const out = [];
  let group = null;
  const flush = () => {
    if (!group) return;
    const right = group.items.filter((a) => a.correct).length;
    out.push({
      id: group.id, time: group.time, kind: "session", subject: group.subject,
      title: `${cap(group.module)} · ${cap(group.subject)}`,
      subtitle: (group.items.length === 1 ? (right ? T("answer1ok", "1 question, right") : T("answer1no", "1 question, not right yet")) : T("answers", "{{n}} questions, {{right}} right", { n: group.items.length, right })) + (group.device ? ` · ${DEVICE[group.device] || ""}` : ""),
      details: group.items.slice(0, 20).map((a) => ({
        label: a.timeMs ? T("answerTime", "Answered in {{s}} s", { s: Math.round(a.timeMs / 100) / 10 }) : T("answer", "Answer"),
        ok: Boolean(a.correct), value: a.mode === "warrior" ? T("warrior", "Warrior") : undefined,
      })),
    });
    group = null;
  };
  for (const e of rows || []) {
    if (e.kind === "answer") {
      if (group && group.module === e.module && group.subject === e.subject && new Date(group.last) - new Date(e.ts) < 20 * 60000) {
        group.items.push(e); group.last = e.ts; continue;
      }
      flush();
      group = { id: e._id, time: e.ts, last: e.ts, module: e.module, subject: e.subject, device: e.device, items: [e] };
      continue;
    }
    flush();
    if (e.kind === "session") {
      out.push({ id: e._id, time: e.ts, kind: "session", subject: e.subject, minutes: e.minutes || undefined, title: `${cap(e.module)} · ${cap(e.subject)}`, subtitle: [e.mode === "warrior" ? T("warrior", "Warrior") : T("practice", "Practice"), DEVICE[e.device]].filter(Boolean).join(" · ") });
    } else if (e.kind === "round") {
      out.push({ id: e._id, time: e.ts, kind: "game", subject: e.subject, title: T("round", "Finished a round: {{m}} · {{s}}", { m: cap(e.module), s: cap(e.subject) }), subtitle: T("stars", "{{n}} stars", { n: e.stars || 0 }) + (e.mode === "warrior" ? ` · ${T("warrior", "Warrior")}` : "") });
    } else if (e.kind === "ai_teacher") {
      out.push({ id: e._id, time: e.ts, kind: "session", minutes: e.minutes || undefined, title: T("ai", "AI Teacher: {{topic}}", { topic: e.title || e.topic }), subtitle: e.subject || "" });
    } else if (e.kind === "test") {
      out.push({ id: e._id, time: e.ts, kind: "test", subject: e.subject, title: T("test", "Test"), subtitle: "" });
    }
  }
  flush();
  return out;
}
