// Which marked element to point at, out of everything a page has marked. Pure, so it can
// be tested without a browser.
//
// A page marks what to tap next with data-guide (a name), data-guide-say (the words to
// speak) and optionally data-guide-order (lower goes first; default 5). candidates:
//   [{ key, order, visible, disabled, inDialog, done }]   in document order
// -> the index to point at, or -1.
export function pickGuide(candidates, { dialogOpen = false } = {}) {
  let best = -1;
  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    if (!c || !c.visible || c.disabled || c.done) continue;
    // While a dialog is open only what is inside it can be tapped.
    if (dialogOpen && !c.inDialog) continue;
    if (best < 0 || c.order < candidates[best].order) best = i;
  }
  return best;
}

/**
 * Where the hand goes for a target box: under it pointing up when there is room,
 * otherwise above it pointing down. All numbers are viewport pixels.
 *   rect { left, top, width, height }, view { width, height }, hand (its size)
 * -> { x, y, below }
 */
export function placeHand(rect, view, hand = 56) {
  const cx = rect.left + rect.width * (rect.width > 160 ? 0.72 : 0.5);
  const below = rect.top + rect.height + hand + 8 <= view.height;
  const x = Math.max(6, Math.min(view.width - hand - 6, cx - hand / 2));
  const y = below ? rect.top + rect.height - Math.min(14, rect.height * 0.25) : rect.top - hand + Math.min(14, rect.height * 0.25);
  return { x, y: Math.max(4, Math.min(view.height - hand - 4, y)), below };
}
