import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Which sub-tab is open, kept in the URL (?pane=… by default) so Back / Forward
 * and a reload keep it. Switching pushes a history entry; the first id is the
 * default and is left out of the URL.
 *
 *   const [pane, setPane] = usePane(['summary', 'trend', 'habits']);
 */
export function usePane(ids, { param = 'pane' } = {}) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(param);
  const value = ids.includes(raw) ? raw : ids[0];
  const key = ids.join('|');
  const select = useCallback((next) => {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (!next || next === key.split('|')[0]) n.delete(param); else n.set(param, next);
      return n;
    });
  }, [setParams, param, key]);
  return [value, select];
}
