// Labels and tones for organisation flags (SUP-010).
export const FLAG_LABEL = {
  over_limit: ["Over seat limit", "alert"], payment_failed: ["Payment failed", "alert"], low_engagement: ["Low engagement", "attention"],
  admin_inactive: ["Admin inactive 30 d", "attention"], pending_approval: ["Awaiting approval", "attention"], suspended: ["Suspended", "alert"], trial_ending: ["Trial ending", "accent"],
};

// Status words to pill tones (the word is always shown too).
export const STATUS_TONE = {
  approved: "good", active: "good", done: "good", resolved: "good", operational: "good", paid: "good", connected: "good",
  pending: "attention", trialing: "accent", processing: "attention", open: "attention", investigating: "alert", identified: "attention", monitoring: "accent", scheduled: "accent", past_due: "alert", paused: "neutral",
  rejected: "alert", cancelled: "neutral", failed: "alert", disabled: "neutral", suspended: "alert", queued: "attention", sent: "good", running: "accent", overdue: "alert", due_soon: "attention", ok: "good",
};
