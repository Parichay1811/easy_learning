// Plain words for every comfort setting (utils/learnerPrefs.js PREF_FIELDS),
// shared by the learner's settings sheet and the parent/teacher learning plan.
// Each setting says what it does in one line. Nothing here names a condition:
// presets are named by what they change.

export const GROUP_ORDER = ["voice", "reading", "focus", "time", "sound"];

export function groupTitle(t, group) {
  const def = {
    sound: "Sounds and touch",
    voice: "The teacher's voice",
    reading: "Reading and seeing",
    focus: "Movement and focus",
    time: "Time and answering",
  }[group] || group;
  return t(`prefs.groups.${group}`, def);
}

const FIELD_TEXT = {
  uiSounds: ["Button sounds", "Soft clicks and chimes when you press buttons and answer. The voice is set separately."],
  hoverSounds: ["Pointer sounds", "A very quiet tap when the mouse moves onto a card."],
  soundVolume: ["Sound volume", "How loud the clicks and chimes are (not the voice)."],
  haptics: ["Vibration", "A tiny buzz on phones and tablets when you tap or answer."],
  voice: ["Teacher speaks by herself", "She reads questions, hints and feedback on her own. When this is off she speaks only when you press a listen button."],
  voiceRate: ["Voice speed", "How fast the teacher talks."],
  autoRead: ["Read each question aloud", "Every new question is read to you as soon as it appears."],
  captions: ["Captions", "Show the words on screen while the teacher is speaking."],
  font: ["Letter style", "Pick the letters that are easiest for you to read."],
  textScale: ["Text size", "Make all the writing bigger."],
  spacing: ["Spacing", "More room between letters, words and lines."],
  contrast: ["Contrast", "Stronger colours and outlines that stand out more."],
  motion: ["Movement", "How much things on the screen move and slide."],
  focusMode: ["Fewer distractions", "Hides moving backgrounds, butterflies and other decorations."],
  bigTargets: ["Bigger buttons", "Larger buttons that are easier to tap."],
  timer: ["Warrior clock", "The countdown in Warrior mode. Practice mode never has a clock."],
  breakEvery: ["Break reminders", "A gentle reminder to rest after playing for a while."],
  speakInstead: ["If the microphone can't be used", "How to answer a speaking question when the microphone is off or not working."],
};

export function fieldLabel(t, key) {
  return t(`prefs.fields.${key}.label`, FIELD_TEXT[key]?.[0] || key);
}

export function fieldHelp(t, key) {
  return t(`prefs.fields.${key}.help`, FIELD_TEXT[key]?.[1] || "");
}

const OPTION_TEXT = {
  font: { default: "Standard", readable: "Clear (Lexend)", dyslexic: "Weighted (OpenDyslexic)" },
  spacing: { normal: "Normal", wide: "Wide" },
  contrast: { normal: "Normal", high: "High" },
  motion: { system: "Like my device", full: "Full", reduced: "Less movement" },
  timer: { on: "Normal", relaxed: "More time", off: "No clock" },
  breakEvery: { 0: "Never", 10: "10 min", 15: "15 min", 20: "20 min", 30: "30 min" },
  speakInstead: { ask: "Ask me", type: "Type it", choose: "Choose from options" },
};

export function optionLabel(t, key, option) {
  const def = OPTION_TEXT[key]?.[option] ?? String(option);
  return t(`prefs.fields.${key}.options.${option}`, def);
}

/** How a range value is read out (and shown beside the slider). */
export function rangeText(t, key, value) {
  const v = Number(value);
  if (key === "voiceRate") {
    if (v <= 0.8) return t("prefs.rate.slow", "Slow");
    if (v < 0.95) return t("prefs.rate.calm", "Calm");
    if (v <= 1.05) return t("prefs.rate.normal", "Normal");
    return t("prefs.rate.quick", "Quick");
  }
  return `${Math.round(v * 100)}%`;
}

const PRESET_TEXT = {
  reading: ["Reading support", "Clear letters, more spacing, bigger text, questions read aloud."],
  calm: ["Calm & quiet", "Softer sounds, less movement, no clock."],
  focus: ["Fewer distractions", "No moving backgrounds, quieter, a break reminder."],
  captions: ["Captions & pictures", "Words on screen for everything spoken; type instead of speaking."],
  bigger: ["Bigger buttons", "Larger buttons and text."],
  time: ["More time", "No Warrior clock and a break reminder."],
};

export const PRESET_ORDER = ["reading", "calm", "focus", "captions", "bigger", "time"];

export function presetLabel(t, name) {
  return t(`prefs.presets.${name}.label`, PRESET_TEXT[name]?.[0] || name);
}

export function presetHelp(t, name) {
  return t(`prefs.presets.${name}.help`, PRESET_TEXT[name]?.[1] || "");
}
