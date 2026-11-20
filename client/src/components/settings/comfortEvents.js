// Opening the Comfort settings sheet from anywhere (the navbar, the module HUD).
export const OPEN_COMFORT_EVENT = "learnigo:comfort-settings";

/** Opens the Comfort settings sheet (components/settings/ComfortSettings.jsx). */
export function openComfortSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_COMFORT_EVENT));
}

// While a sheet or a break reminder is open, the Warrior clock waits:
// window "learnigo:hold-clock" events with detail { source, on }.
export const HOLD_CLOCK_EVENT = "learnigo:hold-clock";
export function holdClock(source, on) {
  window.dispatchEvent(new CustomEvent(HOLD_CLOCK_EVENT, { detail: { source, on } }));
}
