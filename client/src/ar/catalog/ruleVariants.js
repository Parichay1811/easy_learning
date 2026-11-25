/**
 * The rule pairs Rule Switch can play.
 *
 * The rule used to be animals → vehicles every single round, so "the opposite
 * rule" was only ever one thing and a child who had played twice had learnt the
 * answer rather than the switching. A round now plays one of these pairs and
 * never the pair it played last (goNoGoPlan.pickVariant).
 *
 * Each pair is two groups a young child tells apart at a glance, and the first
 * entry is the original pair. Kept in its own file, free of engine and icon
 * imports, so the content test can check every pair really has enough pictures
 * on both sides.
 */

/**
 * Pictures that say what they are without their caption — a go/no-go turn lasts
 * a couple of seconds. Fruit and vegetables are unmistakably food where a grain
 * stalk for "cereal" or a jar for "yoghurt" is not; the pyjamas glyph is a
 * person in bed.
 */
export function plainPicture(item) {
  const cats = item?.cats || []
  if (cats.includes('food')) return cats.includes('fruit') || cats.includes('vegetable')
  if (cats.includes('clothing')) return !cats.includes('sleep')
  return true
}

export const RULE_SWITCH_VARIANTS = [
  {
    goSets: ['animals', 'vehicles'],
    noGoSets: ['animals', 'vehicles'],
    goCats: ['animal'],
    goLabel: 'animals',
    noGoLabel: 'vehicles',
  },
  {
    goSets: ['food', 'clothing'],
    noGoSets: ['food', 'clothing'],
    goCats: ['food'],
    goLabel: 'food',
    noGoLabel: 'clothes',
    only: plainPicture,
  },
  {
    goSets: ['vehicles', 'food'],
    noGoSets: ['vehicles', 'food'],
    goCats: ['vehicle'],
    goLabel: 'vehicles',
    noGoLabel: 'food',
    only: plainPicture,
  },
  {
    goSets: ['animals', 'clothing'],
    noGoSets: ['animals', 'clothing'],
    goCats: ['clothing'],
    goLabel: 'clothes',
    noGoLabel: 'animals',
    only: plainPicture,
  },
]
