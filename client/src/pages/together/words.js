// The words and pictures of "Together" (friends, rounds together, teams, prizes) and
// Shorts. Every key the server sends (config/social.js) has its picture here and its
// English words as the default; other languages come from the locale files
// (together.* and shorts.*), falling back to these.

export const AVATARS = {
  fox: "🦊", owl: "🦉", otter: "🦦", panda: "🐼", tiger: "🐯", koala: "🐨", dolphin: "🐬", hedgehog: "🦔",
  rabbit: "🐰", lion: "🦁", penguin: "🐧", turtle: "🐢", bear: "🐻", deer: "🦌", eagle: "🦅", seal: "🦭",
  wolf: "🐺", robin: "🐦", whale: "🐳", gecko: "🦎", rocket: "🚀", star: "⭐", rainbow: "🌈", sun: "☀️",
};
// A soft colour behind each avatar, the same every time for the same picture.
const HUES = [18, 42, 96, 150, 188, 214, 262, 318];
export const avatarHue = (key) => HUES[[...String(key || "")].reduce((a, ch) => a + ch.charCodeAt(0), 0) % HUES.length];

export const STICKERS = { star: "⭐", heart: "💛", rocket: "🚀", clap: "👏", rainbow: "🌈", trophy: "🏆", sun: "☀️", highfive: "🙌" };
export const CHEER_LINES = {
  great_job: "Great job!", you_can: "You can do it!", nice_comeback: "Great comeback!", thanks: "Thank you!",
  well_played: "Well played!", go_team: "Go team!", proud: "I'm proud of you!", again: "Let's play again!",
};

export const TEAM_NAMES = { comets: "The Comets", sunflowers: "The Sunflowers", otters: "The Otters", dragons: "The Dragons" };

// The personal award of a ceremony: its picture, name and what it means (with its numbers).
export const AWARDS = {
  best_comeback: { emoji: "💪", name: "Best comeback", text: "Kept going after tricky ones and got it right. {{comebacks}} comebacks!" },
  most_improved: { emoji: "📈", name: "Most improved", text: "From {{from}}% right to {{to}}% right during the match." },
  sharp_first_try: { emoji: "🎯", name: "Sharp thinker", text: "{{noHint}} right answers with no hint at all." },
  kindest_cheerer: { emoji: "💛", name: "Kindest cheerer", text: "Sent {{cheers}} cheers to team-mates." },
  curious_explorer: { emoji: "🧭", name: "Curious explorer", text: "Tried {{places}} different kinds of questions." },
  team_spark: { emoji: "✨", name: "Team spark", text: "Earned the team's very first star." },
  steady_helper: { emoji: "🌟", name: "Steady helper", text: "Added {{stars}} stars to the team." },
  teammate: { emoji: "🤝", name: "Team-mate", text: "Part of the team from start to finish." },
  first_flag_star: { emoji: "🚩", name: "First to the flag", text: "Your team reached the goal first." },
  review_champion: { emoji: "🧠", name: "Review champion", text: "Remembered what was learned before." },
  // Content v5: the true award of a match or game duel, and milestones of learning with others.
  fair_play: { emoji: "🤗", name: "Fair player", text: "Played the whole challenge with a friend, to the end." },
  first_together: { emoji: "🌟", name: "First buddy round", text: "Your first round together with a friend." },
  first_match: { emoji: "🎀", name: "First friendly match", text: "Your first friendly match with a friend." },
  first_game_duel: { emoji: "🎮", name: "First game duel", text: "Your first camera game challenge with a friend." },
  five_with_friends: { emoji: "🖐️", name: "Five with friends", text: "Five rounds and challenges played with friends." },
  ten_with_friends: { emoji: "🔟", name: "Ten with friends", text: "Ten rounds and challenges played with friends." },
  team_player: { emoji: "🏅", name: "Team player", text: "Helped your team reach its goal." },
  cheer_giver: { emoji: "💌", name: "Cheer giver", text: "Sent {{count}} cheers to friends and team-mates." },
};

// Prizes in the trophy room, by kind.
export const PRIZES = {
  together: { emoji: "🤝", name: "Together stars", text: "You and a friend earned {{together}} stars in one round." },
  ribbon: { emoji: "🎀", name: "Match ribbon", text: "A friendly match, {{mine}} of {{of}} right." },
  brave: { emoji: "🦁", name: "Brave challenger", text: "You took on a friendly match: {{mine}} of {{of}} right." },
  trophy: { emoji: "🏆", name: "Team trophy", text: "Your team reached its goal: {{teamStars}} stars together." },
  first_flag: { emoji: "🚩", name: "First to the flag", text: "Your team got there first." },
  jar: { emoji: "🫙", name: "Star jar sticker", text: "You and your friends filled the jar to {{stars}} stars." },
  game_ribbon: { emoji: "🎗️", name: "Game ribbon", text: "A camera game challenge: {{mine}} of {{of}} stars." },
  game_brave: { emoji: "🦊", name: "Brave mover", text: "You took on a camera game challenge: {{mine}} of {{of}} stars." },
};

// A camera game's name for the duel lists (the game's own translated title, else its id).
export const gameName = (t, id) => t(`ar.games.${id}.title`, String(id || "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));

// Shorts: the themes a learner can pick.
export const THEMES = {
  animals: { emoji: "🦁", name: "Animals", hue: 28 },
  nature: { emoji: "🌿", name: "Nature", hue: 140 },
  space: { emoji: "🚀", name: "Space", hue: 250 },
  body: { emoji: "🫀", name: "My body", hue: 350 },
  numbers: { emoji: "🔢", name: "Numbers", hue: 210 },
  words: { emoji: "📚", name: "Words and stories", hue: 275 },
  science: { emoji: "🧪", name: "Science", hue: 165 },
  machines: { emoji: "⚙️", name: "How things work", hue: 200 },
  world: { emoji: "🌍", name: "Our world", hue: 190 },
  arts: { emoji: "🎨", name: "Art, music and sport", hue: 320 },
  curious: { emoji: "💡", name: "Big questions", hue: 45 },
};

export const SUBJECTS = {
  english: { emoji: "🏰", name: "English", color: "#8b5cf6" },
  maths: { emoji: "🚀", name: "Maths", color: "#339af0" },
  science: { emoji: "🌱", name: "Science", color: "#2f9e44" },
};
export const MODULES = { listen: { emoji: "🎧", name: "Listen" }, read: { emoji: "📖", name: "Read" }, write: { emoji: "✏️", name: "Write" } };

// Fills "{{name}}" places from `values` (missing ones become an empty string).
export const fill = (text, values = {}) => String(text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => (values[k] ?? "")).replace(/\s+([.!?])/g, "$1");

/** Helpers that go through i18n, with the English above as the default. */
export function words(t) {
  // "Brave Fox" in English; the animal comes first where the language wants it ("Zorro Valiente").
  const nick = (n) => {
    if (!n) return "";
    const a = t(`together.nick.a.${n.a}`, n.text.split(" ")[0]);
    const animal = t(`together.nick.n.${n.n}`, n.text.split(" ")[1]);
    return t("together.nick.order", "an") === "na" ? `${animal} ${a}` : `${a} ${animal}`;
  };
  return {
    nick,
    // A friend is shown by first name when we have it, else by nickname.
    who: (p) => p?.name || nick(p?.nick) || t("together.someone", "A learner"),
    team: (key) => t(`together.team.${key}`, TEAM_NAMES[key] || key),
    line: (key) => t(`together.cheer.line.${key}`, CHEER_LINES[key] || ""),
    award: (key) => ({ emoji: AWARDS[key]?.emoji || "🌟", name: t(`together.award.${key}.name`, AWARDS[key]?.name || key) }),
    awardText: (key, ev) => t(`together.award.${key}.text`, { defaultValue: AWARDS[key]?.text || "", ...ev }),
    prize: (kind) => ({ emoji: PRIZES[kind]?.emoji || "🌟", name: t(`together.prize.${kind}.name`, PRIZES[kind]?.name || kind) }),
    prizeText: (kind, ev) => t(`together.prize.${kind}.text`, { defaultValue: PRIZES[kind]?.text || "", ...ev }),
    theme: (key) => ({ emoji: THEMES[key]?.emoji || "💡", hue: THEMES[key]?.hue ?? 45, name: t(`shorts.theme.${key}`, THEMES[key]?.name || key) }),
    subject: (key) => t(`subjectPage.${key}.label`, { defaultValue: SUBJECTS[key]?.name || key }),
    module: (key) => t(`subjectPage.modules.${key}.label`, { defaultValue: MODULES[key]?.name || key }),
  };
}
