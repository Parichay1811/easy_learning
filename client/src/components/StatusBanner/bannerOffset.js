// The site banners (the "view as" bar and the status notice) are fixed at the
// top of the screen, above the navbar. This keeps CSS variables on <html> in
// step with what is actually showing, so everything else moves down below them:
//
//   --banner-h            total height of the banners showing (0px for none):
//                         the navbar's top, the page's top padding (index.css)
//                         and --nav-h (Navbar.module.css), which the fixed
//                         full-screen game screens sit under
//   --banner-top-<slot>   where one banner starts: they stack in ORDER, the
//                         "view as" bar on top and the status notice under it
//
//   const ref = useBannerSlot("status");
//   return show ? <div ref={ref} className={s.banner}>…</div> : null;
//
// Heights are measured (ResizeObserver), so a banner that wraps onto two
// lines on a phone pushes the page down by two lines.
import { useCallback } from "react";

const ORDER = ["viewas", "status"];
const heights = new Map();
let lastTotal = "0px";

function publish() {
  const root = document.documentElement.style;
  let top = 0;
  for (const slot of ORDER) {
    root.setProperty(`--banner-top-${slot}`, `${top}px`);
    top += heights.get(slot) || 0;
  }
  const total = `${top}px`;
  root.setProperty("--banner-h", total);
  if (total !== lastTotal) {
    lastTotal = total;
    // The room left for the page changed, as on a window resize: code that
    // measures the layout on resize (the student dashboard's navbar overlap,
    // for one) measures again.
    try { window.dispatchEvent(new Event("resize")); } catch { /* very old browser */ }
  }
}

/**
 * A callback ref for a banner's outer element. While the element is mounted
 * its height counts towards --banner-h; when it unmounts (hidden, dismissed,
 * the component goes away) its height is taken off again.
 */
export function useBannerSlot(slot) {
  return useCallback((el) => {
    if (!el) return undefined;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (heights.get(slot) === h) return;
      heights.set(slot, h);
      publish();
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", measure);
      heights.delete(slot);
      publish();
    };
  }, [slot]);
}
