// How content-v3 metadata is derived for the existing bank: one primary skill, age band,
// graded flag and validation per question. Per-type defaults live in TYPES; item-level data
// (keyword lists, rhymes, rubric words) in ITEM_VALIDATION. derive-metadata.js applies these;
// patches.js holds the content repairs.
const { parseNumberAnswer, numberTokens } = require('../../utils/scoreAnswer')

const typeKey = (id) => String(id).replace(/-Q\d+$/, '')

// Types themed for young children (cartoon/"tell a grown-up"/kind-unkind). Everything marked
// joy_flavor "silly" is "young" too. Everything else is fine for any age, adults included.
const YOUNG_TYPES = new Set([
  'EN-LIS-T03', 'EN-LIS-T12', 'EN-LIS-T14', 'EN-RD-T03',
  'MA-LIS-T02', 'MA-LIS-T03', 'MA-LIS-T05', 'MA-RD-T01', 'MA-RD-T06', 'MA-RD-T07', 'MA-RD-T08', 'MA-RD-T09',
  'SCI-LIS-T01', 'SCI-LIS-T02', 'SCI-LIS-T04', 'SCI-LIS-T05', 'SCI-LIS-T13', 'SCI-SPK-T03',
])

// type → primary skill (a function where it depends on the item)
const SKILL = {
  'EN-LIS-T01': 'english.listening-words', 'EN-LIS-T02': 'english.listening-words', 'EN-LIS-T03': 'english.understanding-sentences',
  'EN-LIS-T04': 'english.rhyme', 'EN-LIS-T05': 'english.first-last-sounds', 'EN-LIS-T06': 'english.first-last-sounds',
  'EN-LIS-T07': 'english.syllables', 'EN-LIS-T08': 'english.word-groups', 'EN-LIS-T09': 'english.missing-word',
  'EN-LIS-T10': 'english.sequencing', 'EN-LIS-T11': 'english.word-picture-match', 'EN-LIS-T12': 'english.word-groups',
  'EN-LIS-T13': 'english.following-instructions', 'EN-LIS-T14': 'english.understanding-sentences', 'EN-LIS-T15': 'english.inference',
  'EN-RD-T01': 'english.word-picture-match', 'EN-RD-T02': 'english.word-picture-match', 'EN-RD-T03': 'english.understanding-sentences',
  'EN-RD-T04': 'english.missing-word', 'EN-RD-T05': 'english.word-picture-match', 'EN-RD-T06': 'english.word-groups',
  'EN-RD-T07': 'english.word-groups', 'EN-RD-T08': 'english.rhyme', 'EN-RD-T09': 'english.sight-words',
  'EN-RD-T10': 'english.sequencing', 'EN-RD-T11': 'english.reading-comprehension', 'EN-RD-T12': 'english.reading-comprehension',
  'EN-RD-T13': 'english.word-groups', 'EN-RD-T14': 'english.sequencing', 'EN-RD-T15': 'english.inference',
  'EN-WR-T01': 'english.dictation', 'EN-WR-T02': 'english.spelling-short-words', 'EN-WR-T03': 'english.spelling-short-words',
  'EN-WR-T04': 'english.dictation', 'EN-WR-T05': 'english.sentence-building', 'EN-WR-T06': 'english.sentence-building',
  'EN-WR-T07': 'english.capitals-punctuation', 'EN-WR-T08': 'english.word-endings', 'EN-WR-T09': 'english.word-families',
  'EN-WR-T10': 'english.opposites-synonyms', 'EN-WR-T11': 'english.describing', 'EN-WR-T12': 'english.missing-word',
  'EN-WR-T13': 'english.spelling-correction', 'EN-WR-T14': 'english.written-answers', 'EN-WR-T15': 'english.composition',
  'EN-SPK-T01': 'english.saying-words', 'EN-SPK-T02': 'english.letter-sounds', 'EN-SPK-T03': 'english.naming-things',
  'EN-SPK-T04': 'english.reading-aloud', 'EN-SPK-T05': 'english.reading-aloud', 'EN-SPK-T06': 'english.rhyme',
  'EN-SPK-T07': 'english.syllables', 'EN-SPK-T08': 'english.missing-word', 'EN-SPK-T09': 'english.opposites-synonyms',
  'EN-SPK-T10': 'english.spelling-aloud', 'EN-SPK-T11': 'english.describing', 'EN-SPK-T12': 'english.word-groups',
  'EN-SPK-T13': 'english.answering-aloud', 'EN-SPK-T14': 'english.sequencing', 'EN-SPK-T15': 'english.speaking-opinions',

  'MA-LIS-T01': 'maths.number-recognition', 'MA-LIS-T02': 'maths.counting', 'MA-LIS-T03': (q) => (/side/.test(q.audio_text) ? 'maths.shapes' : /coin|biscuit|share/.test(q.audio_text) ? 'maths.addition-within-10' : 'maths.counting'),
  'MA-LIS-T04': 'maths.number-recognition', 'MA-LIS-T05': 'maths.shapes', 'MA-LIS-T06': 'maths.one-more-one-less',
  'MA-LIS-T07': 'maths.compare-numbers', 'MA-LIS-T08': 'maths.patterns', 'MA-LIS-T09': 'maths.skip-counting',
  'MA-LIS-T10': 'maths.word-problems', 'MA-LIS-T11': 'maths.word-problems-two-step', 'MA-LIS-T12': (q) => (/o'clock|hour|time/.test(q.audio_text) ? 'maths.time' : 'maths.money'),
  'MA-LIS-T13': 'maths.measures', 'MA-LIS-T14': 'maths.fractions', 'MA-LIS-T15': 'maths.ordering-numbers',
  'MA-RD-T01': 'maths.counting', 'MA-RD-T02': arithmetic, 'MA-RD-T03': arithmetic, 'MA-RD-T04': 'maths.missing-number',
  'MA-RD-T05': 'maths.compare-numbers', 'MA-RD-T06': 'maths.patterns', 'MA-RD-T07': 'maths.shapes', 'MA-RD-T08': 'maths.counting',
  'MA-RD-T09': 'maths.comparing-groups', 'MA-RD-T10': 'maths.word-problems', 'MA-RD-T11': 'maths.sorting-numbers',
  'MA-RD-T12': 'maths.number-line', 'MA-RD-T13': 'maths.data', 'MA-RD-T14': (q) => (/p\b|£|coin/.test(q.prompt) ? 'maths.money' : 'maths.time'), 'MA-RD-T15': 'maths.reasoning',
  'MA-WR-T01': 'maths.counting', 'MA-WR-T02': arithmetic, 'MA-WR-T03': 'maths.missing-number', 'MA-WR-T04': arithmetic,
  'MA-WR-T05': 'maths.choosing-operation', 'MA-WR-T06': 'maths.number-recognition', 'MA-WR-T07': 'maths.compare-numbers',
  'MA-WR-T08': 'maths.number-sentences', 'MA-WR-T09': 'maths.patterns', 'MA-WR-T10': 'maths.number-sentences',
  'MA-WR-T11': 'maths.word-problems', 'MA-WR-T12': 'maths.word-problems-two-step', 'MA-WR-T13': 'maths.measures',
  'MA-WR-T14': 'maths.fractions', 'MA-WR-T15': 'maths.word-problems-two-step',
  'MA-SPK-T01': 'maths.number-recognition', 'MA-SPK-T02': 'maths.counting', 'MA-SPK-T03': arithmetic,
  'MA-SPK-T04': 'maths.number-sentences', 'MA-SPK-T05': 'maths.shapes', 'MA-SPK-T06': 'maths.compare-numbers',
  'MA-SPK-T07': 'maths.skip-counting', 'MA-SPK-T08': 'maths.counting', 'MA-SPK-T09': 'maths.time',
  'MA-SPK-T10': 'maths.patterns', 'MA-SPK-T11': 'maths.estimation', 'MA-SPK-T12': 'maths.explaining',
  'MA-SPK-T13': 'maths.word-problems', 'MA-SPK-T14': 'maths.word-problems-two-step', 'MA-SPK-T15': 'maths.explaining',

  'SCI-LIS-T01': 'science.vocabulary', 'SCI-LIS-T02': 'science.facts', 'SCI-LIS-T03': 'science.facts', 'SCI-LIS-T04': 'science.animal-sounds',
  'SCI-LIS-T05': 'science.clues', 'SCI-LIS-T06': 'science.living-things', 'SCI-LIS-T07': 'science.body-senses',
  'SCI-LIS-T08': 'science.weather-seasons', 'SCI-LIS-T09': 'science.life-cycles', 'SCI-LIS-T10': 'science.classifying',
  'SCI-LIS-T11': 'science.cause-effect', 'SCI-LIS-T12': 'science.experiments', 'SCI-LIS-T13': 'science.safety',
  'SCI-LIS-T14': 'science.classifying', 'SCI-LIS-T15': 'science.inference',
  'SCI-RD-T01': 'science.facts', 'SCI-RD-T02': 'science.facts', 'SCI-RD-T03': 'science.vocabulary', 'SCI-RD-T04': 'science.related-things',
  'SCI-RD-T05': 'science.parts', 'SCI-RD-T06': 'science.classifying', 'SCI-RD-T07': 'science.classifying', 'SCI-RD-T08': 'science.life-cycles',
  'SCI-RD-T09': 'science.cause-effect', 'SCI-RD-T10': 'science.comparing', 'SCI-RD-T11': 'science.classifying',
  'SCI-RD-T12': 'science.definitions', 'SCI-RD-T13': 'science.data', 'SCI-RD-T14': 'science.reading-passages', 'SCI-RD-T15': 'science.inference',
  'SCI-WR-T01': 'science.vocabulary', 'SCI-WR-T02': 'science.vocabulary', 'SCI-WR-T03': 'science.vocabulary', 'SCI-WR-T04': 'science.parts',
  'SCI-WR-T05': 'science.parts', 'SCI-WR-T06': 'science.fact-correction', 'SCI-WR-T07': 'science.fact-correction',
  'SCI-WR-T08': 'science.definitions', 'SCI-WR-T09': 'science.classifying', 'SCI-WR-T10': 'science.life-cycles',
  'SCI-WR-T11': 'science.cause-effect', 'SCI-WR-T12': 'science.prediction', 'SCI-WR-T13': 'science.observation',
  'SCI-WR-T14': 'science.explaining', 'SCI-WR-T15': 'science.explaining',
  'SCI-SPK-T01': 'science.vocabulary', 'SCI-SPK-T02': 'science.vocabulary', 'SCI-SPK-T03': 'science.animal-sounds',
  'SCI-SPK-T04': 'science.reading-aloud', 'SCI-SPK-T05': 'science.reading-aloud', 'SCI-SPK-T06': 'science.explaining',
  'SCI-SPK-T07': 'science.classifying', 'SCI-SPK-T08': 'science.observation', 'SCI-SPK-T09': 'science.comparing',
  'SCI-SPK-T10': 'science.life-cycles', 'SCI-SPK-T11': 'science.prediction', 'SCI-SPK-T12': 'science.explaining',
  'SCI-SPK-T13': 'science.explaining', 'SCI-SPK-T14': 'science.experiments', 'SCI-SPK-T15': 'science.experiments',
}

// "2 + 3", "15 - 8 = ___": addition/subtraction within 10 / 20 / 100.
function arithmetic(q) {
  const text = `${q.prompt || ''} ${q.audio_text || ''}`.replace(/[−–]/g, '-')
  const m = text.match(/(\d+)\s*([+\-x×])\s*(\d+)/)
  if (!m) return 'maths.add-subtract-within-100'
  const a = Number(m[1]), b = Number(m[3])
  if (m[2] === 'x' || m[2] === '×') return 'maths.multiplication'
  const result = m[2] === '+' ? a + b : a - b
  const max = Math.max(a, b, result)
  if (max <= 10) return m[2] === '+' ? 'maths.addition-within-10' : 'maths.subtraction-within-10'
  if (max <= 20) return m[2] === '+' ? 'maths.addition-within-20' : 'maths.subtraction-within-20'
  return 'maths.add-subtract-within-100'
}

// ── Item-level validation data ──
const RHYMES = {
  'EN-SPK-T06-Q01': ['hat', 'bat', 'mat', 'sat', 'rat', 'fat', 'pat', 'that', 'flat', 'chat', 'splat', 'vat', 'gnat', 'brat'],
  'EN-SPK-T06-Q02': ['log', 'fog', 'jog', 'frog', 'hog', 'bog', 'clog', 'cog', 'blog', 'smog'],
  'EN-SPK-T06-Q03': ['run', 'fun', 'bun', 'gun', 'one', 'done', 'none', 'ton', 'won', 'son', 'spun', 'nun', 'stun'],
  'EN-SPK-T06-Q04': ['red', 'fed', 'led', 'head', 'said', 'bread', 'ted', 'wed', 'shed', 'sled', 'bled', 'dead', 'spread', 'thread', 'ned'],
  'EN-SPK-T06-Q05': ['care', 'dare', 'bare', 'hair', 'chair', 'pair', 'fair', 'air', 'stare', 'where', 'there', 'bear', 'wear', 'square', 'rare', 'pear', 'scare', 'glare', 'flair', 'stair'],
  'EN-SPK-T06-Q06': ['gate', 'late', 'plate', 'eight', 'great', 'mate', 'date', 'skate', 'weight', 'straight', 'state', 'crate', 'bait', 'hate', 'rate', 'fate', 'freight'],
  'EN-SPK-T06-Q07': ['find', 'mind', 'wind', 'blind', 'behind', 'kind', 'grind', 'signed', 'lined', 'mined', 'rind', 'dined'],
  'EN-SPK-T06-Q08': ['cave', 'wave', 'brave', 'gave', 'grave', 'shave', 'rave', 'pave', 'crave', 'slave'],
  'EN-SPK-T06-Q09': ['giggle', 'jiggle', 'niggle', 'squiggle', 'higgle'],
  'EN-SPK-T06-Q10': ['pack', 'snack', 'track', 'back', 'black', 'sack', 'rack', 'jack', 'tack', 'crack', 'stack', 'shack', 'knack', 'lack', 'hack', 'smack', 'yak'],
}
const ANIMALS = ['cat', 'dog', 'bird', 'fish', 'cow', 'horse', 'pig', 'sheep', 'goat', 'duck', 'hen', 'chicken', 'rabbit', 'mouse', 'rat', 'lion', 'tiger', 'bear', 'elephant', 'giraffe', 'zebra', 'monkey', 'snake', 'frog', 'owl', 'fox', 'wolf', 'deer', 'whale', 'dolphin', 'shark', 'bee', 'ant', 'spider', 'butterfly', 'hamster', 'parrot', 'penguin', 'kangaroo', 'koala', 'panda', 'camel', 'donkey', 'turtle', 'tortoise', 'crocodile', 'alligator', 'hippo', 'rhino', 'squirrel', 'hedgehog', 'badger', 'goose', 'swan', 'eagle', 'crab', 'octopus', 'snail', 'worm', 'puppy', 'kitten', 'pony', 'lamb', 'calf', 'bat', 'seal', 'otter', 'beaver', 'llama', 'gorilla', 'cheetah', 'leopard', 'lizard', 'ladybird', 'ladybug', 'fly', 'mole', 'robin', 'pigeon', 'crow', 'dinosaur']
const FOODS = ['apple', 'banana', 'bread', 'milk', 'egg', 'eggs', 'cheese', 'rice', 'pasta', 'pizza', 'cake', 'carrot', 'potato', 'chips', 'crisps', 'chicken', 'fish', 'soup', 'orange', 'grape', 'grapes', 'pear', 'strawberry', 'strawberries', 'tomato', 'cucumber', 'pea', 'peas', 'bean', 'beans', 'broccoli', 'sandwich', 'sandwiches', 'biscuit', 'biscuits', 'cookie', 'cookies', 'yoghurt', 'yogurt', 'cereal', 'toast', 'butter', 'jam', 'honey', 'sausage', 'sausages', 'burger', 'noodles', 'meat', 'beef', 'ham', 'salad', 'lettuce', 'onion', 'corn', 'sweetcorn', 'melon', 'watermelon', 'mango', 'pineapple', 'lemon', 'cherry', 'cherries', 'plum', 'peach', 'nuts', 'chocolate', 'sweets', 'jelly', 'ice cream', 'popcorn', 'pancake', 'pancakes', 'porridge', 'curry', 'beans on toast', 'fruit', 'vegetables']
const PARTY_FOODS = ['cake', 'jelly', 'crisps', 'chips', 'sandwiches', 'sandwich', 'pizza', 'sausage rolls', 'sausages', 'cupcakes', 'cupcake', 'biscuits', 'cookies', 'sweets', 'candy', 'ice cream', 'popcorn', 'juice', 'lemonade', 'fruit', 'grapes', 'chocolate', 'muffins', 'doughnuts', 'donuts', 'hot dogs', 'party rings', 'brownies', 'nuggets', 'cheese', 'carrot sticks', 'strawberries', 'watermelon']
const COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'grey', 'gray', 'gold', 'silver', 'violet', 'turquoise', 'navy', 'beige', 'cream', 'indigo', 'maroon', 'lilac']
const NEEDS_WATER = ['plants', 'plant', 'people', 'animals', 'animal', 'flowers', 'flower', 'trees', 'tree', 'gardens', 'garden', 'pets', 'pet', 'fish', 'dogs', 'cats', 'humans', 'us', 'me', 'grass', 'crops', 'seeds', 'birds', 'cows', 'horses', 'babies', 'body', 'vegetables', 'farms', 'everyone', 'everything', 'living things']
const ANIMAL_SOUNDS = ['quack', 'moo', 'oink', 'baa', 'woof', 'meow', 'miaow', 'neigh', 'hiss', 'roar', 'tweet', 'cheep', 'buzz', 'cluck', 'squeak', 'howl', 'hoot', 'ribbit', 'croak', 'bark', 'growl', 'purr', 'gobble', 'honk', 'chirp', 'bray', 'cock a doodle doo', 'twit twoo']
const ENGLISH_SPEAK_KEYWORDS = {
  'EN-SPK-T03-Q05': [['helmet', 'hat', 'hard hat']], 'EN-SPK-T03-Q06': [['coin', 'coins', 'money', 'penny', 'pound']],
  'EN-SPK-T03-Q07': [['crossing', 'children', 'kids', 'sign', 'road', 'school', 'walking', 'people']],
  'EN-SPK-T03-Q08': [['seed', 'plant', 'seedling', 'sprout', 'shoot', 'leaf', 'leaves']],
  'EN-SPK-T03-Q01': [['soap']], 'EN-SPK-T03-Q02': [['bus', 'coach']], 'EN-SPK-T03-Q03': [['bed']], 'EN-SPK-T03-Q04': [['apple']],
  'EN-SPK-T03-Q09': [['duck']], 'EN-SPK-T03-Q10': [['butterfly']],
  'EN-SPK-T08-Q02': [['bed', 'sleep']], 'EN-SPK-T08-Q04': [['bin', 'trash', 'dustbin', 'rubbish bin', 'garbage']], 'EN-SPK-T08-Q05': [['thank you', 'thanks']],
  'EN-SPK-T08-Q06': [['road', 'street']], 'EN-SPK-T08-Q07': [['tap', 'water', 'faucet']], 'EN-SPK-T08-Q08': [['tell', 'talk', 'ask', 'call', 'speak', 'find']],
  'EN-SPK-T09-Q01': [['cold', 'cool', 'chilly', 'freezing']], 'EN-SPK-T09-Q02': [['small', 'little', 'tiny']], 'EN-SPK-T09-Q05': [['unkind', 'mean', 'nasty', 'cruel', 'rude', 'horrible']],
  'EN-SPK-T09-Q06': [['dangerous', 'unsafe', 'risky']], 'EN-SPK-T09-Q07': [['spend', 'waste']], 'EN-SPK-T09-Q09': [['loud', 'noisy']],
  'EN-SPK-T09-Q10': [['scared', 'afraid', 'frightened', 'fearful', 'cowardly', 'timid', 'nervous']],
  'EN-SPK-T11-Q01': [['wash', 'washing', 'clean', 'cleaning', 'soap'], ['hand', 'hands']], 'EN-SPK-T11-Q02': [['dog', 'puppy'], ['bone']],
  'EN-SPK-T11-Q03': [['rain', 'raining', 'rainy', 'wet'], ['umbrella', 'brolly']], 'EN-SPK-T11-Q04': [['brush', 'brushing', 'clean'], ['teeth', 'tooth']],
  'EN-SPK-T11-Q05': [['save', 'saving', 'keep', 'put'], ['coin', 'coins', 'money', 'pennies'], ['purse', 'wallet', 'bag']],
  'EN-SPK-T11-Q06': [['helmet'], ['bike', 'bicycle', 'cycling', 'ride', 'riding']], 'EN-SPK-T11-Q07': [['stop', 'stopping', 'wait'], ['look', 'looking', 'check'], ['cross', 'crossing', 'walk', 'road']],
  'EN-SPK-T11-Q09': [['duck'], ['hat']], 'EN-SPK-T11-Q10': [['turtle', 'tortoise'], ['race', 'racing', 'win', 'wins', 'won', 'winning', 'trophy', 'rabbit', 'hare']],
  'EN-SPK-T13-Q01': [['soap', 'water', 'handwash', 'sanitiser', 'sanitizer']], 'EN-SPK-T13-Q02': [['helmet']],
  'EN-SPK-T13-Q03': [['look', 'stop', 'check', 'wait', 'both ways', 'left and right', 'listen']], 'EN-SPK-T13-Q04': [['thank you', 'thanks', 'cheers', 'ta']],
  'EN-SPK-T13-Q05': [['ask', 'join', 'play', 'invite', 'include', 'talk', 'say hello', 'hi', 'friend', 'together', 'come']],
  'EN-SPK-T13-Q06': [['tell', 'say sorry', 'sorry', 'own up', 'admit', 'fix', 'honest', 'truth', 'clean']],
  'EN-SPK-T13-Q07': [['save', 'saving', 'piggy bank', 'money box', 'earn', 'chores', 'jobs', 'work', 'pocket money', 'wait']],
  'EN-SPK-T13-Q08': [['breathe', 'breath', 'breaths', 'calm', 'count', 'walk away', 'talk', 'relax', 'hug', 'quiet', 'rest', 'tell']],
  'EN-SPK-T12-Q01': { list: ANIMALS }, 'EN-SPK-T12-Q02': { list: FOODS }, 'EN-SPK-T12-Q03': { list: COLOURS },
  'EN-SPK-T12-Q07': { list: NEEDS_WATER }, 'EN-SPK-T12-Q08': { list: ANIMAL_SOUNDS }, 'EN-SPK-T12-Q10': { list: PARTY_FOODS },
}
const CAPTIONS = {
  'EN-WR-T11-Q01': { keywords: [['wash', 'washing', 'washes', 'clean', 'cleaning', 'soap'], ['hand', 'hands']], min: 2 },
  'EN-WR-T11-Q02': { keywords: [['dog', 'puppy'], ['bone']], min: 2 },
  'EN-WR-T11-Q03': { keywords: [['umbrella', 'brolly'], ['rain', 'raining', 'rainy', 'wet']], min: 1 },
  'EN-WR-T11-Q04': { keywords: [['brush', 'brushing', 'brushes', 'clean', 'cleaning'], ['teeth', 'tooth']], min: 2 },
  'EN-WR-T11-Q05': { keywords: [['coin', 'coins', 'money', 'pennies', 'save', 'saving', 'savings']], min: 1 },
  'EN-WR-T11-Q06': { keywords: [['helmet'], ['bike', 'bicycle', 'cycle', 'cycling', 'ride', 'riding']], min: 1 },
  'EN-WR-T11-Q08': { keywords: [['seed', 'seeds', 'plant', 'plants', 'flower', 'flowers', 'grow', 'grows', 'growing', 'garden', 'water', 'watering']], min: 1 },
  'EN-WR-T11-Q09': { keywords: [['duck'], ['hat']], min: 2 },
  'EN-WR-T11-Q10': { keywords: [['turtle', 'tortoise'], ['win', 'won', 'wins', 'winner', 'race', 'trophy', 'prize', 'first', 'cup']], min: 2 },
}
const WHY_ANSWERS = {
  'EN-WR-T14-Q01': [['germs', 'germ', 'bacteria', 'dirt', 'dirty', 'clean', 'sick', 'ill', 'poorly', 'virus', 'bugs']],
  'EN-WR-T14-Q02': [['head', 'brain', 'safe', 'protect', 'hurt', 'injured', 'injury', 'fall', 'crash', 'bang']],
  'EN-WR-T14-Q03': [['car', 'cars', 'traffic', 'vehicle', 'vehicles', 'safe', 'hit', 'coming', 'bike', 'bus', 'see']],
  'EN-WR-T14-Q04': [['hide', 'hiding', 'secret', 'truth', 'honest', 'mind', 'worry', 'worried', 'relief', 'relieved', 'better', 'guilty', 'scared', 'lie', 'lying', 'trouble', 'told', 'off her chest']],
  'EN-WR-T14-Q05': [['add up', 'adds up', 'builds up', 'grow', 'grows', 'more', 'lots', 'enough', 'buy', 'save up', 'later', 'big', 'bigger', 'over time', 'emergency']],
  'EN-WR-T14-Q06': [['included', 'include', 'alone', 'lonely', 'friend', 'kind', 'happy', 'play', 'wanted', 'left out', 'welcome', 'nice']],
  'EN-WR-T14-Q07': [['safe', 'safer', 'fall', 'trip', 'push', 'hurt', 'crowd', 'calm', 'panic', 'accident', 'bump']],
  'EN-WR-T14-Q08': [['calm', 'calmer', 'relax', 'better', 'cool', 'angry', 'cross', 'temper', 'feelings', 'slow', 'breathe']],
}
const SCI_RUBRIC = {
  'SCI-WR-T06-Q01': { keywords: [['water', 'sea', 'ocean', 'river', 'rivers', 'lake', 'lakes', 'pond', 'ponds', 'stream', 'aquarium', 'tank']], forbidden: ['moon'] },
  'SCI-WR-T06-Q02': { keywords: [['sunlight', 'sun', 'light', 'water', 'air', 'soil', 'nutrients', 'carbon dioxide']], forbidden: ['chocolate'] },
  'SCI-WR-T06-Q03': { keywords: [['day', 'daytime', 'morning', 'daylight', 'afternoon']] },
  'SCI-WR-T06-Q04': { keywords: [['are living', 'are alive', 'living things', 'alive']] },
  'SCI-WR-T06-Q05': { keywords: [['nectar', 'pollen', 'flower', 'flowers', 'plants', 'blossom']], forbidden: ['cloud', 'clouds'] },
  'SCI-WR-T06-Q06': { keywords: [['heart']] },
  'SCI-WR-T06-Q07': { keywords: [['cocoon', 'chrysalis', 'pupa']] },
  'SCI-WR-T06-Q08': { keywords: [['some', 'not all', 'many', 'most', 'birds', 'certain', "don't all", 'not every']] },
  'SCI-WR-T06-Q09': { keywords: [['mammal', 'mammals']] },
  'SCI-WR-T06-Q10': { keywords: [['ash', 'gas', 'gases', 'smoke', 'steam', 'rocks']] },
  'SCI-WR-T10-Q02': { keywords: [['water', 'watering', 'germinate', 'germinates', 'germination', 'root', 'roots', 'soak', 'swell', 'swells', 'crack', 'cracks', 'split']] },
  'SCI-WR-T10-Q03': { keywords: [['rain', 'rains', 'raining', 'rainfall', 'precipitation', 'drizzle', 'shower']] },
  'SCI-WR-T10-Q04': { keywords: [['legs', 'leg', 'froglet', 'tadpole with legs']] },
  'SCI-WR-T10-Q06': { keywords: [['erupts', 'erupt', 'eruption', 'explodes', 'blows', 'bursts']] },
  'SCI-WR-T10-Q07': { keywords: [['scab', 'clot', 'clots', 'heals', 'healing', 'dries']] },
  'SCI-WR-T10-Q08': { keywords: [['hypothesis', 'guess', 'predict', 'prediction', 'idea', 'plan']] },
  'SCI-WR-T10-Q09': { keywords: [['eat', 'eats', 'eaten', 'eating']] },
  'SCI-WR-T10-Q10': { keywords: [['river', 'rivers', 'flows', 'back to the sea', 'ocean', 'sea', 'collection', 'collects', 'runs back', 'streams']] },
  'SCI-WR-T11-Q01': { keywords: [['melt', 'melts', 'melting', 'water', 'liquid', 'puddle']] },
  'SCI-WR-T11-Q02': { keywords: [['wilt', 'wilts', 'die', 'dies', 'droop', 'droops', 'dry', 'dries', 'shrivel', 'shrivels', 'brown', 'wither', 'withers']] },
  'SCI-WR-T11-Q03': { keywords: [['break', 'breaks', 'broken', 'shatter', 'shatters', 'smash', 'smashes', 'crack', 'cracks']] },
  'SCI-WR-T11-Q04': { keywords: [['cavity', 'cavities', 'decay', 'rot', 'holes', 'hole', 'toothache', 'fall out', 'plaque', 'germs', 'bad breath', 'smell', 'yellow', 'pain', 'hurt']] },
  'SCI-WR-T11-Q05': { keywords: [['green']] },
  'SCI-WR-T11-Q06': { keywords: [['spray', 'sprays', 'fizz', 'fizzes', 'explode', 'explodes', 'burst', 'bursts', 'foam', 'spill', 'everywhere', 'bubbles', 'shoots', 'squirts', 'overflows']] },
  'SCI-WR-T11-Q07': { keywords: [['pull', 'pulls', 'move', 'moves', 'jerk', 'jerks', 'away', 'flinch', 'flinches', 'snatch', 'drop']] },
  'SCI-WR-T11-Q08': { keywords: [['cocoon', 'chrysalis', 'pupa', 'butterfly', 'transform', 'change', 'changes', 'metamorphosis']] },
  'SCI-WR-T11-Q09': { keywords: [['home', 'homes', 'habitat', 'move', 'leave', 'die', 'lose', 'nowhere', 'food', 'shelter', 'homeless']] },
  'SCI-WR-T11-Q10': { keywords: [['fewer', 'less', 'no fruit', 'little fruit', 'smaller', 'not much', "won't grow", "doesn't grow", 'none']] },
  'SCI-WR-T12-Q01': { keywords: [['freeze', 'freezes', 'frozen', 'ice', 'solid']] },
  'SCI-WR-T12-Q02': { keywords: [['grow', 'grows', 'sprout', 'sprouts', 'germinate', 'plant', 'shoot', 'leaves', 'bigger', 'taller']] },
  'SCI-WR-T12-Q03': { keywords: [['wilt', 'wilts', 'pale', 'die', 'dies', 'yellow', 'white', 'weak', 'droop', 'droops', 'struggle', 'not grow', "won't grow", 'stop growing']] },
  'SCI-WR-T12-Q04': { keywords: [['warm', 'room', 'outside the fridge'], ['melt', 'melts', 'faster', 'first', 'quicker', 'sooner']], min: 2 },
  'SCI-WR-T12-Q05': { keywords: [['damage', 'damaged', 'blown', 'blow', 'fall', 'falls', 'break', 'broken', 'destroy', 'destroyed', 'wind', 'wet', 'knocked']] },
  'SCI-WR-T12-Q06': { keywords: [['taller', 'bigger', 'healthier', 'grow', 'more', 'faster', 'greener', 'better', 'stronger']] },
  'SCI-WR-T12-Q07': { keywords: [['spoil', 'spoiled', 'bad', 'rot', 'rotten', 'unsafe', 'germs', 'bacteria', 'sick', 'ill', 'off', 'smell', 'smelly', 'poison', 'not safe']] },
  'SCI-WR-T12-Q08': { keywords: [['melt', 'melts', 'melting', 'disappear', 'less ice', 'sea level', 'sea levels', 'rise', 'flood', 'flooding', 'thinner', 'gone']] },
  'SCI-WR-T12-Q09': { keywords: [['grow', 'grows', 'spread', 'spreads', 'increase', 'increases', 'more', 'take over', 'lots', 'quickly', 'everywhere']] },
  'SCI-WR-T12-Q10': { keywords: [['healthier', 'bigger', 'taller', 'better', 'grow', 'wilt', 'wilts', 'droop', 'dry', 'weaker', 'smaller', 'die']] },
  'SCI-WR-T14-Q01': { keywords: [['germs', 'germ', 'bacteria', 'virus', 'viruses', 'dirt', 'dirty', 'clean', 'sick', 'ill', 'disease']] },
  'SCI-WR-T14-Q02': { keywords: [['food', 'energy', 'photosynthesis', 'grow', 'make', 'sugar', 'live', 'alive']] },
  'SCI-WR-T14-Q03': { keywords: [['heat', 'warm', 'hot', 'energy', 'temperature', 'sun']] },
  'SCI-WR-T14-Q04': { keywords: [['pollen', 'pollinate', 'pollination', 'pollinating', 'fertilise', 'fertilize', 'carry', 'spread']] },
  'SCI-WR-T14-Q05': { keywords: [['milk', 'lungs', 'air', 'breathe', 'breathes', 'warm-blooded', 'warm blooded', 'babies', 'live young', 'blowhole', 'mammal']] },
  'SCI-WR-T14-Q06': { keywords: [['energy', 'grow', 'change', 'changes', 'transform', 'store', 'stores', 'does not eat', "doesn't eat", "can't eat", 'cannot eat', 'butterfly']] },
  'SCI-WR-T14-Q07': { keywords: [['bacteria', 'germs', 'spoil', 'spoils', 'rot', 'rots', 'sick', 'ill', 'food poisoning', 'bad', 'heat', 'hot', 'warm']] },
  'SCI-WR-T14-Q08': { keywords: [['fair', 'know', 'cause', 'caused', 'one thing', 'which', 'difference', 'compare', 'sure', 'what made']] },
  'SCI-WR-T14-Q09': { keywords: [['food chain', 'food', 'home', 'homes', 'shelter', 'habitat', 'oxygen', 'depend', 'depends', 'ecosystem', 'prey', 'eat', 'connected', 'linked']] },
  'SCI-WR-T14-Q10': { keywords: [['fair', 'different', 'everyone', 'reliable', 'side effects', 'chance', 'luck', 'sure', 'proof', 'evidence', 'many', 'safe', 'works for', 'trust', 'accurate']] },
}
const SCI_SPEAK = {
  'SCI-SPK-T02-Q05': [['mountain', 'mountains', 'hill', 'hills']], 'SCI-SPK-T02-Q06': [['skeleton', 'bone', 'bones']], 'SCI-SPK-T02-Q08': [['caterpillar', 'grub', 'larva']],
  'SCI-SPK-T07-Q01': [['animal', 'mammal', 'living', 'alive', 'pet']], 'SCI-SPK-T07-Q02': [['fruit', 'plant', 'living']],
  'SCI-SPK-T07-Q03': [['non living', 'not living', 'nonliving', 'not alive', 'mineral', 'stone', 'solid']], 'SCI-SPK-T07-Q04': [['flower', 'plant', 'living']],
  'SCI-SPK-T07-Q05': [['mammal', 'animal']], 'SCI-SPK-T07-Q06': [['predator', 'mammal', 'animal', 'carnivore', 'hunter', 'cat']],
  'SCI-SPK-T07-Q07': [['solid', 'frozen', 'water']], 'SCI-SPK-T07-Q08': [['amphibian', 'animal']], 'SCI-SPK-T07-Q09': [['fruit', 'plant']],
  'SCI-SPK-T07-Q10': [['mammal', 'animal']],
  'SCI-SPK-T08-Q01': [['flower', 'flowers', 'bee', 'bees', 'nectar', 'pollen', 'pollinate', 'pollination']],
  'SCI-SPK-T08-Q02': [['caterpillar', 'leaf', 'leaves', 'eat', 'eating', 'eats', 'larva']],
  'SCI-SPK-T08-Q03': [['cloud', 'clouds', 'rain', 'raining', 'rainy', 'weather', 'storm']],
  'SCI-SPK-T08-Q04': [['plant', 'seed', 'seedling', 'water', 'watering', 'grow', 'growing', 'sprout']],
  'SCI-SPK-T08-Q05': [['volcano', 'lava', 'erupt', 'erupting', 'eruption', 'fire', 'hot', 'magma']],
  'SCI-SPK-T08-Q06': [['bone', 'bones', 'broken', 'heal', 'healing', 'plaster', 'bandage', 'hurt', 'injury', 'skin', 'body', 'cut']],
  'SCI-SPK-T08-Q07': [['caterpillar', 'cocoon', 'chrysalis', 'butterfly', 'life cycle', 'pupa', 'change']],
  'SCI-SPK-T08-Q08': [['microscope', 'observe', 'look', 'tiny', 'small', 'close', 'magnify', 'flower', 'see']],
  'SCI-SPK-T11-Q01': [['freeze', 'freezes', 'frozen', 'ice', 'solid']], 'SCI-SPK-T11-Q02': [['sprout', 'grow', 'grows', 'plant', 'bigger', 'taller', 'germinate']],
  'SCI-SPK-T11-Q03': [['wilt', 'pale', 'die', 'yellow', 'white', 'weak', 'droop', 'not grow']], 'SCI-SPK-T11-Q04': [['warm', 'room'], ['melt', 'melts', 'faster', 'first', 'quicker']],
  'SCI-SPK-T11-Q05': [['cocoon', 'chrysalis', 'butterfly', 'pupa', 'change', 'transform']], 'SCI-SPK-T11-Q06': [['spoil', 'bad', 'rot', 'unsafe', 'germs', 'bacteria', 'sick', 'ill', 'off', 'smell']],
  'SCI-SPK-T11-Q07': [['taller', 'healthier', 'bigger', 'grow', 'better', 'faster', 'more']], 'SCI-SPK-T11-Q08': [['melt', 'melting', 'rise', 'sea level', 'flood', 'disappear', 'less ice', 'thinner']],
  'SCI-SPK-T11-Q09': [['spread', 'grow', 'more', 'increase', 'take over', 'lots']], 'SCI-SPK-T11-Q10': [['healthier', 'bigger', 'taller', 'better', 'wilt', 'droop', 'weaker', 'smaller', 'grow']],
}
const SCI_COMPARE = {
  'SCI-SPK-T09-Q01': { more: ['elephant'], less: ['mouse'] }, 'SCI-SPK-T09-Q02': { more: ['rabbit', 'bunny'], less: ['snail'] },
  'SCI-SPK-T09-Q03': { more: ['brick'], less: ['feather'] }, 'SCI-SPK-T09-Q04': { more: ['mountain'], less: ['hill'] },
  'SCI-SPK-T09-Q05': { more: ['whale'], less: ['elephant'] }, 'SCI-SPK-T09-Q06': { more: ['boiling', 'water'], less: ['ice'] },
  'SCI-SPK-T09-Q07': { more: ['cheetah'], less: ['tortoise'] }, 'SCI-SPK-T09-Q08': { more: ['bucket'], less: ['cup'] },
  'SCI-SPK-T09-Q10': { more: ['whale', 'blue whale'], less: ['elephant', 'horse'] },
}
const MATHS_COMPARE = {
  'MA-SPK-T06-Q07': { more: [15], less: [9] }, 'MA-SPK-T06-Q09': { more: [9, 18], less: [6, 12] },
}
const PATTERN_OPS = { add: ['add', 'adding', 'plus', 'more', 'up', 'increase', 'increases', 'count on', 'counting on', 'goes up', 'bigger', 'forward'], sub: ['subtract', 'subtracting', 'take away', 'taking away', 'minus', 'less', 'down', 'back', 'decrease', 'decreases', 'count back', 'counting back', 'goes down', 'smaller', 'backwards'] }

const firstNumber = (s) => { const p = parseNumberAnswer(String(s ?? ''), 'en', { final: false }); return p && !p.multiple ? p.value : null }
const lastNumber = (s) => { const p = parseNumberAnswer(String(s ?? ''), 'en', { final: true }); return p ? p.value : null }
const allNumbers = (s) => numberTokens(String(s ?? ''), 'en').filter((t) => t.num !== undefined).map((t) => t.num)
const kwGroups = (q) => ((q.speech_scoring && q.speech_scoring.expected_keywords) || []).map((k) => [k])

// The validation for one question (after patches). Returns { graded, validation }.
function deriveValidation(q) {
  const T = typeKey(q.id)
  const graded = q.graded === false ? false : true
  const it = q.interaction
  const v = (method, extra = {}) => ({ graded, validation: { method, ...extra } })
  if (q.graded === false) {
    // Practice items still say how they would be checked, for reference.
    if (it === 'mic_record') return v('speech_open')
    if (it === 'typed_long' || it === 'typed_short') return v('rubric', { open: true })
  }

  // ── structured widgets ──
  if (it === 'tap_mcq' || it === 'true_false' || it === 'drag_to_blank') return v('choice')
  if (it === 'multi_select') return v('set')
  if (it === 'drag_order' || it === 'tap_sequence') return v('sequence')
  if (it === 'match_pairs') return v('pairs')
  if (it === 'sort_bins') return v('bins')
  if (it === 'letter_bank') {
    if (Array.isArray(q.correct_answer)) return v('sequence')
    if (T === 'MA-WR-T08') return v('text', { tiles: true, equation: 'any_true' })
    return v('text', { tiles: true, spelling_strict: true })
  }

  // ── typed ──
  if (it === 'typed_short' || it === 'typed_long') {
    switch (T) {
      case 'EN-WR-T01': case 'EN-WR-T02': case 'EN-WR-T03': case 'EN-WR-T04': case 'EN-WR-T08': case 'EN-WR-T09': case 'EN-WR-T13':
      case 'SCI-WR-T01': case 'SCI-WR-T03':
        return v('text', { spelling_strict: true })
      case 'EN-WR-T07': return v('text', { case_sensitive: true, punctuation_strict: true })
      case 'EN-WR-T10': return v('text', {})
      case 'EN-WR-T12': return v('text', { strip_articles: true, allow_echo: true })
      case 'EN-WR-T11': return v('rubric', { ...CAPTIONS[q.id] })
      case 'EN-WR-T14': return v('rubric', { keywords: WHY_ANSWERS[q.id], min: 1 })
      case 'SCI-WR-T04': case 'SCI-WR-T08': case 'SCI-WR-T09': return v('text', { strip_articles: true, allow_echo: true })
      case 'SCI-WR-T06': return v('rubric', { ...SCI_RUBRIC[q.id], min: 1, negation_fix: true })
      case 'SCI-WR-T10': case 'SCI-WR-T11': case 'SCI-WR-T12': case 'SCI-WR-T14':
        if (SCI_RUBRIC[q.id]) return v('rubric', { min: 1, ...SCI_RUBRIC[q.id] })
        return v('text', { strip_articles: true, allow_echo: true })
      case 'MA-WR-T06': return v('number', { number_words: false })
      case 'MA-WR-T07': return v('text', {})
      case 'MA-WR-T10': return v('text', { equation: true })
      case 'MA-WR-T13': return v('number', { unit_required: true })
      case 'MA-WR-T14': return v('number', { equivalent_forms: 'fraction' })
      case 'MA-WR-T15': return v('number', { final_answer: true })
      case 'MA-WR-T01': case 'MA-WR-T02': case 'MA-WR-T03': case 'MA-WR-T09': case 'MA-WR-T11': case 'MA-WR-T12':
        return v('number', { number_words: true })
      default: return v('text', {})
    }
  }

  // ── speech ──
  if (it === 'mic_record') {
    const ans = q.correct_answer
    switch (T) {
      case 'EN-SPK-T06': return v('speech_keywords', { keywords: [RHYMES[q.id]], min: 1, not_prompt: true })
      case 'EN-SPK-T12': {
        const d = ENGLISH_SPEAK_KEYWORDS[q.id]
        return v('speech_keywords', { keywords: d.list.map((w) => [w]), min: 2 })
      }
      case 'EN-SPK-T04': { const g = kwGroups(q); return v('speech_keywords', { keywords: g, min: Math.max(1, g.length - 1) }) }
      case 'EN-SPK-T14': case 'SCI-SPK-T10': {
        const g = kwGroups(q).map((alts) => alts.flatMap((a) => (a === 'cocoon' ? ['cocoon', 'chrysalis', 'pupa'] : [a])))
        return v('speech_keywords', { keywords: g, min: Math.ceil(g.length / 2), ordered: true })
      }
      case 'MA-SPK-T01': return v('speech_keywords', { numbers: [Number(q.prompt)] })
      case 'MA-SPK-T02': case 'MA-SPK-T03': return v('speech_keywords', { numbers: [lastNumber(ans)], number_final: true })
      case 'MA-SPK-T04': return v('speech_keywords', { numbers: allNumbers(q.prompt), ordered: true })
      case 'MA-SPK-T05': return v('speech_keywords', { keywords: [{ 'MA-SPK-T05-Q05': ['rectangle', 'oblong'], 'MA-SPK-T05-Q06': ['oval', 'ellipse'], 'MA-SPK-T05-Q07': ['diamond', 'rhombus'] }[q.id] || [ans]], min: 1 })
      case 'MA-SPK-T06': {
        if (q.id === 'MA-SPK-T06-Q10') return v('speech_keywords', { keywords: [['equal', 'same', 'both', 'neither', 'equals', 'five', 'tie']], min: 1 })
        const c = MATHS_COMPARE[q.id] || (() => { const ns = allNumbers(q.prompt); return { more: [Math.max(...ns)], less: [Math.min(...ns)] } })()
        return v('speech_keywords', { compare: c })
      }
      case 'MA-SPK-T07': { const ns = allNumbers(ans); return v('speech_keywords', { numbers: ns, ordered: true, min_numbers: Math.max(2, ns.length - 1) }) }
      case 'MA-SPK-T08': return v('speech_keywords', { numbers: [firstNumber((q.speech_scoring.expected_keywords || [])[0])] })
      case 'MA-SPK-T09': {
        const t = { Q01: '3:00', Q02: '6:00', Q03: '9:00', Q04: '12:00', Q05: '4:30', Q06: '8:15', Q07: '2:30', Q08: '10:45', Q09: '6:35', Q10: '12:50' }[q.id.slice(-3)]
        return v('speech_keywords', { time: t })
      }
      case 'MA-SPK-T10': {
        if (q.id === 'MA-SPK-T10-Q08') return v('speech_keywords', { keywords: [['double', 'doubles', 'doubling', 'times two', 'times 2', 'twice', 'multiply by two', 'multiply by 2', 'two times', 'x2']], min: 1 })
        if (q.id === 'MA-SPK-T10-Q09') return v('speech_keywords', { keywords: [['add', 'plus', 'sum', 'together', 'adding'], ['two', 'last two', 'before', 'previous', 'numbers before']], min: 2 })
        const nums = allNumbers(q.prompt)
        const step = nums[1] - nums[0]
        return v('speech_keywords', { keywords: [step > 0 ? PATTERN_OPS.add : PATTERN_OPS.sub, [String(Math.abs(step))]], min: 2 })
      }
      case 'MA-SPK-T13': case 'MA-SPK-T14': return v('speech_keywords', { numbers: [lastNumber(ans)], number_final: true })
      case 'SCI-SPK-T07': case 'SCI-SPK-T08': case 'SCI-SPK-T11':
        return v('speech_keywords', { keywords: SCI_SPEAK[q.id], min: SCI_SPEAK[q.id].length, graded_langs: ['en'] })
      case 'SCI-SPK-T09': {
        if (q.id === 'SCI-SPK-T09-Q09') return v('speech_keywords', { keywords: [['equal', 'same', 'both', 'neither', 'equals', 'five', 'tie']], min: 1, graded_langs: ['en'] })
        return v('speech_keywords', { compare: SCI_COMPARE[q.id], graded_langs: ['en'] })
      }
      default: {
        const own = ENGLISH_SPEAK_KEYWORDS[q.id] || SCI_SPEAK[q.id]
        const g = own || kwGroups(q)
        return v('speech_keywords', { keywords: g, min: Math.ceil(g.length / 2) })
      }
    }
  }
  return v('choice')
}

function deriveSkill(q) {
  const s = SKILL[typeKey(q.id)]
  return typeof s === 'function' ? s(q) : s
}
function deriveAgeBand(q) {
  if (YOUNG_TYPES.has(typeKey(q.id))) return 'young'
  if (q.joy_flavor === 'silly') return 'young'
  return 'all'
}

module.exports = { typeKey, deriveSkill, deriveAgeBand, deriveValidation, arithmetic, YOUNG_TYPES, RHYMES, ENGLISH_SPEAK_KEYWORDS }
