// The time-range bar's state (in the URL) turned into the school API's query:
// from/to (never past today), cmp=prev|lastyear|none, or termId for "this term vs the last".
import { useMemo } from "react";
import { useTimeRange, today as kitToday, toISO } from "../../../components/dashboard";
import { useLoad, qs } from "./api";

export function useSchoolRange({ defaultRange = "week" } = {}) {
  const years = useLoad("/years");
  const terms = useMemo(() => (years.data?.years || []).flatMap((y) => (y.terms || []).map((t) => ({ key: t._id, label: `${t.name} · ${y.name}`, from: t.start, to: t.end }))), [years.data]);
  const tr = useTimeRange({ defaultRange, terms });
  const now = toISO(kitToday());
  const params = useMemo(() => {
    const to = tr.to > now ? now : tr.to;
    const from = tr.from > to ? to : tr.from;
    if (tr.range === "term" && tr.term) return { termId: tr.term.key };
    return { from, to, cmp: tr.cmp === "yoy" ? "lastyear" : tr.cmp };
  }, [tr.from, tr.to, tr.cmp, tr.range, tr.term, now]);
  return { tr, terms, params, query: qs(params) };
}
