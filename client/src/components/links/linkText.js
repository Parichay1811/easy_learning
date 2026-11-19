// The words for a request, from the point of view of the person reading it
// (used by RequestInbox and anywhere a request is mentioned, e.g. a toast).
export function incomingText(t, r, viewer) {
  const name = r.from.name || r.from.email;
  const o = { name, group: r.group?.name || "", org: r.org?.name || "" };
  switch (`${r.from.role}>${viewer}`) {
    case "parent>student": return t("links.in.parentToKid", { defaultValue: "{{name}} wants to follow your learning", ...o });
    case "teacher>student": return t("links.in.teacherToKid", { defaultValue: "{{name}} invited you to join {{group}}", ...o });
    case "admin>student": return t("links.in.schoolToKid", { defaultValue: "{{org}} invited you to join", ...o });
    case "student>parent": return t("links.in.kidToParent", { defaultValue: "{{name}} asked you to follow their learning", ...o });
    case "student>teacher": return t("links.in.kidToTeacher", { defaultValue: "{{name}} wants to join your class", ...o });
    case "admin>teacher": return t("links.in.schoolToTeacher", { defaultValue: "{{org}} invited you to teach there", ...o });
    case "teacher>admin": return t("links.in.teacherToSchool", { defaultValue: "{{name}} wants to teach at your school", ...o });
    default: return t("links.in.other", { defaultValue: "{{name}} wants to connect with you", ...o });
  }
}

export function outgoingText(t, r) {
  const who = r.to.name ? `${r.to.name} (${r.to.email})` : r.to.email;
  const o = { who, group: r.group?.name || "", org: r.org?.name || "" };
  if (r.status === "accepted") return r.group ? t("links.out.acceptedGroup", { defaultValue: "{{who}} said yes · {{group}}", ...o }) : t("links.out.accepted", { defaultValue: "{{who}} said yes", ...o });
  if (r.status === "declined") return t("links.out.declined", { defaultValue: "{{who}} said no thanks", ...o });
  if (r.status === "expired") return t("links.out.expired", { defaultValue: "The request to {{who}} ran out", ...o });
  return r.group ? t("links.out.waitingGroup", { defaultValue: "Waiting for {{who}} · {{group}}", ...o }) : t("links.out.waiting", { defaultValue: "Waiting for {{who}} to accept", ...o });
}
