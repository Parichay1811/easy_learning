// Ask the guide (GuideCoach.jsx) to look again now: the next step on this page changed
// (a question arrived, a sheet opened, a list loaded).
export const GUIDE_EVENT = "learnigo:guide";
export const nudgeGuide = () => { try { window.dispatchEvent(new Event(GUIDE_EVENT)); } catch { /* no window */ } };
