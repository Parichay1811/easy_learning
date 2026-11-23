// Formatting helpers shared by the insight panels.
import { fmtDate } from "../components/dashboard/format";

export const day = (iso) => fmtDate(iso, { style: "day" });

export function listOf(items, lang) {
  try { return new Intl.ListFormat(lang, { style: "long", type: "conjunction" }).format(items); } catch { return items.join(", "); }
}
