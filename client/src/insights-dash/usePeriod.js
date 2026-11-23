// The "At a glance" period (7 or 28 days) in the URL (?glance=28), so a link opens the same view.
// Tiny and eager on purpose: the panels themselves are lazy-loaded.
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useGlancePeriod() {
  const [params, setParams] = useSearchParams();
  const days = params.get("glance") === "28" ? 28 : 7;
  const setDays = useCallback((d) => setParams((prev) => {
    const n = new URLSearchParams(prev);
    if (Number(d) === 28) n.set("glance", "28"); else n.delete("glance");
    return n;
  }, { replace: true }), [setParams]);
  return [days, setDays];
}
