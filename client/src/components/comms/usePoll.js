import { useEffect, useRef } from 'react';

// Call `fn` now and every `ms` while the tab is visible (design-guide §5.4:
// polling, no WebSockets). Pauses in background tabs, catches up on return.
export default function usePoll(fn, ms = 25_000, deps = []) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; });
  useEffect(() => {
    let timer = null;
    let stopped = false;
    const run = () => { if (!stopped && document.visibilityState !== 'hidden') Promise.resolve(saved.current()).catch(() => {}); };
    const loop = () => { timer = setTimeout(() => { run(); loop(); }, ms); };
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    run();
    loop();
    document.addEventListener('visibilitychange', onVisible);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}
