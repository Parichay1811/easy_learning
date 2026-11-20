import { useSyncExternalStore } from "react";
import { getPrefs, onPrefsChange, setPrefs } from "../../utils/learnerPrefs";

const subscribe = (cb) => onPrefsChange(() => cb());

/** The learner's comfort settings, re-rendering when they change. */
export function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs, getPrefs);
}

/** [prefs, setPrefs(patch)] for a component that changes them. */
export function usePrefsState() {
  return [usePrefs(), setPrefs];
}

export default usePrefs;
