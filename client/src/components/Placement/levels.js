// Plain descriptions of the learning levels (0-8). Levels are steps in a
// subject, never ages: an adult starting English and a child starting maths
// can both begin at level 0.
const TEXT = {
  maths: [
    "Counting and small numbers",
    "Numbers to 20: adding and taking away",
    "Numbers to 100 and simple word problems",
    "Times tables and bigger sums",
    "Fractions, money and time",
    "Decimals, percentages and measures",
    "Problems with several steps",
    "First ideas of algebra",
    "Challenging problems and reasoning",
  ],
  english: [
    "First sounds and first words",
    "Simple words and short sentences",
    "Short stories and everyday words",
    "Longer sentences and talking about the past",
    "Paragraphs and finding the meaning",
    "Explaining ideas and giving opinions",
    "Longer texts and richer vocabulary",
    "Confident reading and writing",
    "Fluent and expressive",
  ],
  science: [
    "Looking, naming and sorting",
    "Living things, materials and weather",
    "Senses, simple tests and changes",
    "Plants, animals, forces and the body",
    "Cause and effect, fair tests",
    "Systems, energy and reasoning",
    "Explaining with evidence",
    "Models and predictions",
    "Investigating like a scientist",
  ],
};

export const MAX_LEVEL = 8;

export function levelText(t, subject, level) {
  const list = TEXT[subject] || TEXT.maths;
  return t(`placement.levels.${subject}.${level}`, list[level] || "");
}
