import { useCallback, useState } from 'react';

const keyFor = (id) => `dash.celebrated.${id}`;

/**
 * Show a milestone once (DSN-022): the first time `id` is passed, `show` is true; after
 * `dismiss()` (or a close) it never shows again in this browser. One calm card per visit.
 *
 *   const [show, dismiss] = useCelebrateOnce(`streak-7-${child.id}`);
 *   {show && <Celebration title="7 days in a row!" text="…" onClose={dismiss} />}
 */
export function useCelebrateOnce(id, enabled = true) {
  const [seen, setSeen] = useState(() => {
    try { return Boolean(localStorage.getItem(keyFor(id))); } catch { return false; }
  });
  const dismiss = useCallback(() => {
    setSeen(true);
    try { localStorage.setItem(keyFor(id), String(Date.now())); } catch { /* storage may be blocked */ }
  }, [id]);
  return [Boolean(id) && enabled && !seen, dismiss];
}

export default useCelebrateOnce;
