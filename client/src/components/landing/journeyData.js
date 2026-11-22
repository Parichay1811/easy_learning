// The landing page's sample journey: one idea (melting), three questions that
// climb from stage 0 (everyday curiosity) to stage 2 (understanding), each with
// an easier related question for after a miss. Sample data that runs in the
// browser only; nothing is sent or saved. English here is the default text of
// the i18n keys `landing.journey.items.<id>.*` (scratchpad/i18n-jr-landing.json).
//
// Every `script` follows the narration rules of the real bank: it talks to the
// learner, keeps the screen's facts and options (all of them, same order),
// never hints at the answer, at most 50 words and one "!".

export const JOURNEY = [
  {
    id: "s0",
    stage: 0,
    emoji: "🧊",
    correct: 1,
    hintPicture: "🍦 ☀️ 💧",
    en: {
      instruction: "Think about it",
      prompt: "You leave an ice cube on a plate in a warm kitchen. What will you find on the plate an hour later?",
      options: ["A bigger ice cube", "A puddle of water", "The same ice cube, just as big"],
      hint: "Think of an ice lolly on a sunny day. What happens to it as it gets warm?",
      hintAlt: "An ice lolly in the sun, dripping water.",
      explain: "Warmth melts ice: the solid ice turns into liquid water.",
      script: "Picture this: you leave an ice cube on a plate in a warm kitchen, and come back an hour later. What do you think is on the plate? A bigger ice cube, a puddle of water, or the same ice cube, just as big?",
    },
    easier: {
      id: "s0e",
      emoji: "❄️",
      correct: 2,
      en: {
        instruction: "An easier one on the same idea",
        prompt: "Where do we keep ice so that it stays frozen?",
        options: ["On a sunny windowsill", "In a warm bath", "In the freezer"],
        explain: "Ice stays frozen where it is cold, like in a freezer.",
        script: "Here's a quick one. Where do we keep ice so that it stays frozen? On a sunny windowsill, in a warm bath, or in the freezer?",
      },
    },
  },
  {
    id: "s1",
    stage: 1,
    emoji: "🔍",
    correct: 2,
    hintPicture: "🧈 🔥 💧",
    en: {
      instruction: "Spot the melting",
      prompt: "Which of these is melting?",
      options: ["Water turning to ice in the freezer", "A puddle drying up in the sun", "Butter going soft in a warm pan"],
      hint: "Melting is when something solid warms up and becomes runny. Which one starts out solid?",
      hintAlt: "A block of butter in a hot pan turning runny.",
      explain: "Butter is solid. In a warm pan it melts and becomes runny.",
      script: "Let's be detectives. Which of these is melting? Water turning to ice in the freezer, a puddle drying up in the sun, or butter going soft in a warm pan?",
    },
    easier: {
      id: "s1e",
      emoji: "🧊 ➜ 💧",
      emojiAlt: "Ice, then water.",
      correct: 1,
      en: {
        instruction: "An easier one on the same idea",
        prompt: "Look at the picture: first ice, then water. What happened to the ice?",
        options: ["It froze", "It melted", "It grew"],
        explain: "Ice turning into water is called melting.",
        script: "Look at the picture. First there is ice, then there is water. What happened to the ice? It froze, it melted, or it grew?",
      },
    },
  },
  {
    id: "s2",
    stage: 2,
    emoji: "🍦",
    correct: 0,
    hintPicture: "☀️ 🌳 🌡️",
    en: {
      instruction: "Why does it happen?",
      prompt: "Two ice lollies: one in the sun, one in the shade. Why does the one in the sun melt faster?",
      options: ["The sun warms it up more", "Shade makes ice heavier", "Ice only melts when it is sunny"],
      hint: "Stand in the sun, then in the shade. Where do you feel warmer?",
      hintAlt: "The sun, a shady tree and a thermometer.",
      explain: "Sunlight adds warmth, and more warmth means faster melting. Ice melts in the shade too, just more slowly.",
      script: "Two ice lollies, one in the sun and one in the shade. The one in the sun melts faster. Why do you think that is? The sun warms it up more, shade makes ice heavier, or ice only melts when it is sunny?",
    },
    easier: {
      id: "s2e",
      emoji: "☀️ 🌳",
      emojiAlt: "The sun and a shady tree.",
      correct: 1,
      en: {
        instruction: "An easier one on the same idea",
        prompt: "On a summer day, where does it feel warmer?",
        options: ["In the shade", "In the sun", "Both feel exactly the same"],
        explain: "The sun warms whatever it shines on, so it feels warmer there.",
        script: "Think of a summer day. Where does it feel warmer? In the shade, in the sun, or do both feel exactly the same?",
      },
    },
  },
];

/** The six stages (contract §1), English names as i18n defaults (`landing.stage.<n>`). */
export const STAGES = [
  { n: 0, name: "Everyday curiosity" },
  { n: 1, name: "Recognition" },
  { n: 2, name: "Understanding" },
  { n: 3, name: "Application" },
  { n: 4, name: "Reasoning" },
  { n: 5, name: "Transfer" },
];
