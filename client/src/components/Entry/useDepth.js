// A little depth for the entry screens: the meadow and the pictures shift a
// few pixels against each other as the mouse moves (or, on a phone or tablet,
// as the device tilts), like looking through a window. Writes two numbers
// between -1 and 1 to CSS (--dx, --dy) on the given element, at most once a
// frame; the CSS turns them into small translations (compositor only).
//
// Off with "less movement". Device tilt is only used where the browser gives
// it without a permission prompt (not iOS Safari, which asks first).
import { useEffect } from "react";

const clamp = (v) => Math.max(-1, Math.min(1, v));

export function useDepth(ref, on = true) {
  useEffect(() => {
    const el = ref.current;
    if (!on || !el || typeof window === "undefined") return undefined;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--dx", x.toFixed(3));
      el.style.setProperty("--dy", y.toFixed(3));
    };
    const set = (nx, ny) => {
      // Ignore tiny jitters (sensor noise): no restyle for nothing.
      if (Math.abs(nx - x) < 0.01 && Math.abs(ny - y) < 0.01) return;
      x = nx;
      y = ny;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    let fine = false;
    try { fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch { fine = false; }

    const offs = [];
    if (fine) {
      const move = (e) => set(clamp((e.clientX / window.innerWidth - 0.5) * 2), clamp((e.clientY / window.innerHeight - 0.5) * 2));
      window.addEventListener("pointermove", move, { passive: true });
      offs.push(() => window.removeEventListener("pointermove", move));
    } else if (typeof window.DeviceOrientationEvent !== "undefined" && typeof window.DeviceOrientationEvent.requestPermission !== "function") {
      let base = null;
      const tilt = (e) => {
        if (e.gamma == null || e.beta == null) return;
        if (base === null) base = e.beta; // however the device is held now is "level"
        set(clamp(e.gamma / 22), clamp((e.beta - base) / 22));
      };
      window.addEventListener("deviceorientation", tilt, { passive: true });
      offs.push(() => window.removeEventListener("deviceorientation", tilt));
    }
    return () => {
      offs.forEach((f) => f());
      cancelAnimationFrame(raf);
      el.style.removeProperty("--dx");
      el.style.removeProperty("--dy");
    };
  }, [ref, on]);
}

/**
 * Pointer handlers that tilt one card towards the mouse (--rx, --ry between
 * -1 and 1 on the card). Mouse and pen only; touch presses the card instead.
 */
export function tiltHandlers(on = true) {
  if (!on) return {};
  return {
    onPointerMove: (e) => {
      if (e.pointerType === "touch") return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--rx", clamp(((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      el.style.setProperty("--ry", clamp(((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    },
    onPointerLeave: (e) => {
      e.currentTarget.style.removeProperty("--rx");
      e.currentTarget.style.removeProperty("--ry");
    },
  };
}
