// Level-0 ("starter") English items: very simple, plain (fine for a 6-year-old and for an adult
// beginner), automatically checkable. English items are not translated (they teach English).
const listen = (n, audio, prompt, options, correct, extra = {}) => ({
  id: `EN-LIS-F00-Q${String(n).padStart(2, '0')}`, interaction: 'tap_mcq', question_type: 'foundation_listen_answer',
  instruction: 'Listen. Tap the answer.', audio_text: audio, prompt, options, correct_answer: correct, emoji: '👂',
  hint: 'Listen once more. The answer is in what you hear.', feedback_correct: `${correct}. You listened carefully.`,
  skill: 'english.understanding-sentences', construct: 'understanding one short spoken sentence', ...extra,
})
const read = (n, prompt, options, correct, extra = {}) => ({
  id: `EN-RD-F00-Q${String(n).padStart(2, '0')}`, interaction: 'tap_mcq', question_type: 'foundation_read_answer',
  instruction: 'Read. Tap the answer.', prompt, options, correct_answer: correct, emoji: '📖',
  hint: 'Read the first sentence again. The answer is in it.', feedback_correct: `${correct}. You found it in the sentence.`,
  skill: 'english.understanding-sentences', construct: 'reading one short sentence for meaning', ...extra,
})

module.exports = {
  'english_listen.json': [
    listen(1, 'The cat is sleeping.', 'Which animal is sleeping?', ['🐱 cat', '🐶 dog', '🐟 fish'], '🐱 cat'),
    listen(2, 'bus', 'Which word did you hear?', ['bus', 'bag', 'bed'], 'bus', { instruction: 'Listen. Tap the word you hear.', skill: 'english.listening-words', construct: 'hearing a single everyday word', question_type: 'foundation_listen_word', hint: 'Listen to the middle sound: u.' }),
    listen(3, 'The cup is red.', 'What colour is the cup?', ['red', 'blue', 'green'], 'red'),
    listen(4, 'I have two apples.', 'How many apples?', ['1', '2', '3'], '2'),
    listen(5, 'Please close the door.', 'What should you close?', ['the door', 'the window', 'the book'], 'the door'),
    listen(6, 'It is raining, so take an umbrella.', 'What is the weather like?', ['🌧️ rainy', '☀️ sunny', '❄️ snowy'], '🌧️ rainy'),
    listen(7, 'Sam drinks a glass of milk.', 'What does Sam drink?', ['milk', 'juice', 'water'], 'milk'),
    listen(8, 'The keys are on the table.', 'Where are the keys?', ['on the table', 'in the bag', 'under the bed'], 'on the table'),
  ],
  'english_read.json': [
    read(1, 'The sun is hot. What is hot?', ['the sun', 'the snow', 'the ice'], 'the sun'),
    read(2, 'cat', ['🐱', '🐶', '🐟'], '🐱', { instruction: 'Read the word. Tap the matching picture.', skill: 'english.word-picture-match', construct: 'reading a short word and matching its picture', question_type: 'foundation_read_word', hint: 'Say each sound: c - a - t.' }),
    read(3, 'Tom has a red ball. What colour is the ball?', ['red', 'blue', 'yellow'], 'red'),
    read(4, 'The bag is big. Is the bag small?', ['Yes', 'No'], 'No', { interaction: 'true_false', question_type: 'foundation_read_yes_no' }),
    read(5, 'Mia is in the kitchen. She is making tea. Where is Mia?', ['in the kitchen', 'in the garden', 'at school'], 'in the kitchen'),
    read(6, 'I eat breakfast in the morning. When do I eat breakfast?', ['in the morning', 'at night', 'at lunch time'], 'in the morning'),
    read(7, 'Ben has a dog. The dog is called Max. What is the dog called?', ['Max', 'Ben', 'Sam'], 'Max'),
    read(8, 'The shop is open. Can you go in?', ['Yes', 'No'], 'Yes', { interaction: 'true_false', question_type: 'foundation_read_yes_no' }),
  ],
  'english_write.json': [
    { id: 'EN-WR-F00-Q01', interaction: 'typed_short', question_type: 'foundation_missing_word', instruction: 'Type the missing word.', prompt: 'I ___ happy.', correct_answer: 'am', emoji: '✏️', validation: { method: 'text', allow_echo: true }, hint: 'Say it aloud: I ... happy.', feedback_correct: 'I am happy. Well built.', skill: 'english.missing-word', construct: 'choosing the right form of "be"', distractor_insight: { is: 'used "is" - with I we say "am"', are: 'used "are" - with I we say "am"' } },
    { id: 'EN-WR-F00-Q02', interaction: 'typed_short', question_type: 'foundation_missing_word', instruction: 'Type the missing word.', prompt: 'We ___ friends.', correct_answer: 'are', emoji: '✏️', validation: { method: 'text', allow_echo: true }, hint: 'Say it aloud: We ... friends.', feedback_correct: 'We are friends. Well built.', skill: 'english.missing-word', construct: 'choosing the right form of "be"', distractor_insight: { is: 'used "is" - with we we say "are"', am: 'used "am" - with we we say "are"' } },
    { id: 'EN-WR-F00-Q03', interaction: 'typed_short', question_type: 'foundation_dictation', instruction: 'Look at the picture and listen. Type the word.', prompt: '🐱', audio_text: 'cat', correct_answer: 'cat', emoji: '🐱', validation: { method: 'text', spelling_strict: true }, hint: 'Say it slowly: c - a - t.', feedback_correct: 'cat. Every sound in place.', skill: 'english.dictation', construct: 'spelling a short word you hear' },
    { id: 'EN-WR-F00-Q04', interaction: 'letter_bank', question_type: 'foundation_letter_bank', instruction: 'Listen. Put the letters in order to spell the word.', audio_text: 'sun', prompt: '☀️', options: ['s', 'u', 'n'], correct_answer: 'sun', emoji: '☀️', hint: 'Say it slowly: s - u - n.', feedback_correct: 'sun. Letters in the right order.', skill: 'english.spelling-short-words', construct: 'ordering letters to spell a short word' },
    { id: 'EN-WR-F00-Q05', interaction: 'drag_order', question_type: 'foundation_build_sentence', instruction: 'Listen. Put the words in order.', audio_text: 'I like tea.', prompt: '', options: ['I', 'like', 'tea'], correct_answer: ['I', 'like', 'tea'], emoji: '👂', hint: 'Which word do you hear first?', feedback_correct: 'I like tea. Words in the right order.', skill: 'english.sentence-building', construct: 'putting three heard words in order' },
    { id: 'EN-WR-F00-Q06', interaction: 'typed_short', question_type: 'foundation_first_letter', instruction: 'Type the first letter of the word.', prompt: '🐶 dog', correct_answer: 'd', emoji: '🐶', validation: { method: 'text', case_sensitive: false }, hint: 'Say the word. What sound do you hear first?', feedback_correct: 'd - dog starts with d.', skill: 'english.first-last-sounds', construct: 'writing the first letter of a word', distractor_insight: { b: 'b/d swap - check which way the letter faces' } },
    { id: 'EN-WR-F00-Q07', interaction: 'typed_short', question_type: 'foundation_copy_word', instruction: 'Type this word.', prompt: 'help', correct_answer: 'help', emoji: '✏️', validation: { method: 'text', spelling_strict: true }, hint: 'Look at each letter: h - e - l - p.', feedback_correct: 'help. Copied letter by letter.', skill: 'english.spelling-short-words', construct: 'copying a short word accurately' },
    { id: 'EN-WR-F00-Q08', interaction: 'typed_short', question_type: 'foundation_missing_letter', instruction: 'Listen. Type the missing letter.', prompt: 'c_t', audio_text: 'cat', correct_answer: 'a', accepted_answers: ['a', 'cat'], emoji: '✏️', validation: { method: 'text', spelling_strict: true }, hint: 'Say it slowly: c - a - t. Which sound is missing?', feedback_correct: 'a - cat.', skill: 'english.spelling-short-words', construct: 'hearing and writing the middle sound' },
  ],
  'english_speak.json': [
    { id: 'EN-SPK-F00-Q01', interaction: 'mic_record', question_type: 'foundation_say_word', instruction: 'Listen. Say the word.', audio_text: 'apple', prompt: '', correct_answer: 'apple', keywords: ['apple'], sample: 'apple', emoji: '👂', hint: 'Listen once more, then say it.', feedback_correct: 'apple. Clearly said.', skill: 'english.saying-words', construct: 'repeating a heard word' },
    { id: 'EN-SPK-F00-Q02', interaction: 'mic_record', question_type: 'foundation_name_picture', instruction: 'Say what you see.', prompt: '🐶', correct_answer: 'dog', keywords: ['dog'], sample: 'a dog', validation: { method: 'speech_keywords', keywords: [['dog', 'puppy', 'doggy']], min: 1 }, emoji: '🗣️', hint: 'It says woof.', feedback_correct: 'dog. You named it.', skill: 'english.naming-things', construct: 'naming a common picture' },
    { id: 'EN-SPK-F00-Q03', interaction: 'mic_record', question_type: 'foundation_read_aloud', instruction: 'Read this word out loud.', prompt: 'hello', correct_answer: 'hello', keywords: ['hello'], sample: 'hello', emoji: '🗣️', hint: 'h - e - llo.', feedback_correct: 'hello. Read aloud clearly.', skill: 'english.reading-aloud', construct: 'reading one familiar word aloud' },
    { id: 'EN-SPK-F00-Q04', interaction: 'mic_record', question_type: 'foundation_answer_aloud', instruction: 'Listen to the question. Answer out loud.', audio_text: 'What colour is the sky on a sunny day?', prompt: '', correct_answer: 'blue', keywords: ['blue'], sample: 'It is blue.', validation: { method: 'speech_keywords', keywords: [['blue']], min: 1 }, emoji: '👂', hint: 'Look up on a sunny day. What colour is it?', feedback_correct: 'Blue. A clear answer.', skill: 'english.answering-aloud', construct: 'answering a simple spoken question' },
    { id: 'EN-SPK-F00-Q05', interaction: 'mic_record', question_type: 'foundation_say_word', instruction: 'Listen. Say the words.', audio_text: 'thank you', prompt: '', correct_answer: 'thank you', keywords: ['thank you', 'thanks'], sample: 'thank you', validation: { method: 'speech_keywords', keywords: [['thank you', 'thanks']], min: 1 }, emoji: '👂', hint: 'Listen once more, then say it.', feedback_correct: 'thank you. Clearly said.', skill: 'english.saying-words', construct: 'repeating a heard phrase' },
    { id: 'EN-SPK-F00-Q06', interaction: 'mic_record', question_type: 'foundation_read_aloud', instruction: 'Read this word out loud.', prompt: 'cup', correct_answer: 'cup', keywords: ['cup'], sample: 'cup', emoji: '🗣️', hint: 'c - u - p.', feedback_correct: 'cup. Read aloud clearly.', skill: 'english.reading-aloud', construct: 'reading one short word aloud' },
    { id: 'EN-SPK-F00-Q07', interaction: 'mic_record', question_type: 'foundation_name_picture', instruction: 'Say what you see.', prompt: '🍌', correct_answer: 'banana', keywords: ['banana'], sample: 'a banana', validation: { method: 'speech_keywords', keywords: [['banana', 'bananas']], min: 1 }, emoji: '🗣️', hint: 'It is a long yellow fruit.', feedback_correct: 'banana. You named it.', skill: 'english.naming-things', construct: 'naming a common picture' },
    { id: 'EN-SPK-F00-Q08', interaction: 'mic_record', question_type: 'foundation_answer_aloud', instruction: 'Listen to the question. Answer out loud.', audio_text: 'What do you use to open a door: a key or a spoon?', prompt: '', correct_answer: 'a key', keywords: ['key'], sample: 'a key', validation: { method: 'speech_keywords', keywords: [['key']], min: 1 }, emoji: '👂', hint: 'Which one fits in a lock?', feedback_correct: 'A key. You listened to both choices.', skill: 'english.answering-aloud', construct: 'choosing between two spoken options' },
  ],
}
