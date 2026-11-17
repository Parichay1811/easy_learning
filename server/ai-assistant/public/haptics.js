// Haptics: a light touch on each moment that matters (the student starts
// talking, the teacher thinks, starts speaking, a right or wrong answer), so
// the student feels the teacher respond. Android: the Vibration API with a
// pattern per moment. iPhone (no Vibration API): a hidden switch toggled by
// its label makes Safari tap the Taptic Engine (iOS 17.4+; reported patched
// in iOS 26.5, unconfirmed). Everyone, including laptops with no motor, gets
// the visual pulse (onPulse). The student can turn it off; it is remembered.
const PATTERNS = {
  start: [18, 60, 10], listen: [10], think: [6, 70, 6], speak: [8],
  success: [12, 60, 30], error: [30, 50, 30], notify: [14, 40, 14], tick: [6],
};
const KEY = 'lt-haptics';

export function createHaptics({ onPulse } = {}) {
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch { /* private mode: default on */ }
  const vibrate = typeof navigator.vibrate === 'function';
  const ios = !vibrate && (/iP(hone|od|ad)/.test(navigator.userAgent + navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  let label = null;
  if (ios) {
    label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
  }

  function fire(name) {
    onPulse?.(name);
    if (!on) return;
    const p = PATTERNS[name] || PATTERNS.tick;
    if (vibrate) { try { navigator.vibrate(p); } catch { /* not allowed before a tap */ } return; }
    if (label) {
      // One tap per pulse of the pattern (iOS taps cannot vary in length).
      let at = 0;
      for (let i = 0; i < p.length; i += 2) { setTimeout(() => label.click(), at); at += (p[i] || 0) + (p[i + 1] || 0); }
    }
  }

  return {
    fire,
    get on() { return on; },
    get supported() { return vibrate || !!label; },
    toggle() { on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* remembered for this visit only */ } return on; },
  };
}
