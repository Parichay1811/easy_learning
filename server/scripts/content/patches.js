// Hand repairs to existing bank questions (content v3). Applied by derive-metadata.js before
// metadata is derived; every patch sets absolute values, so re-running is safe.
// Each entry: { ids | match, category, severity, reason, apply(q, h) }.
//   category: wrong_key | ambiguous | unanswerable | widget_mismatch | mode_mismatch | level_off |
//             translation | checker_support | science_accuracy | wording | exclude
//   severity: blocking (a right answer could be marked wrong / the key is wrong) | warning
// h (helpers): forEachLang(q, fn(target, lang)), exclude(q, reason), setLevel(q, n), LANGS.
// Translations written for these repairs are inline; English-subject items have no translations.

const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const TRANSLATION_FIXES = require('./translation-fixes')
const ids = (prefix, nums) => nums.map((n) => `${prefix}-Q${String(n).padStart(2, '0')}`)
const range = (prefix, a = 1, b = 10) => ids(prefix, Array.from({ length: b - a + 1 }, (_, i) => a + i))
const stripParen = (s) => (typeof s === 'string' ? s.replace(/\s*[(（][^)）]*[)）]\s*/g, ' ').replace(/\s+/g, ' ').trim() : s)

// Same sentence in all languages: "A box has 12 eggs. 5 are used for one cake and 4 for another. How many eggs are left?"
const EGG_BOX = {
  en: 'A box has 12 eggs. 5 are used for one cake and 4 for another. How many eggs are left?',
  es: 'Una caja tiene 12 huevos. Se usan 5 para un pastel y 4 para otro. ¿Cuántos huevos quedan?',
  fr: "Une boîte contient 12 œufs. On en utilise 5 pour un gâteau et 4 pour un autre. Combien d'œufs reste-t-il ?",
  pt: 'Uma caixa tem 12 ovos. Usam-se 5 num bolo e 4 noutro. Quantos ovos sobram?',
  it: "Una scatola contiene 12 uova. Se ne usano 5 per una torta e 4 per un'altra. Quante uova restano?",
  de: 'In einer Schachtel sind 12 Eier. 5 werden für einen Kuchen gebraucht und 4 für einen anderen. Wie viele Eier sind übrig?',
  nl: 'In een doos zitten 12 eieren. Er worden er 5 gebruikt voor een taart en 4 voor een andere. Hoeveel eieren blijven er over?',
  ru: 'В коробке 12 яиц. 5 яиц ушло на один торт и 4 на другой. Сколько яиц осталось?',
  tr: "Bir kutuda 12 yumurta var. 5'i bir kek için, 4'ü başka bir kek için kullanılıyor. Kaç yumurta kaldı?",
  zh: '一盒有12个鸡蛋。做一个蛋糕用了5个,做另一个用了4个。还剩多少个鸡蛋?',
  ja: '箱に卵が12個あります。1つのケーキに5個、もう1つのケーキに4個使いました。卵は何個残っていますか?',
  ko: '상자에 달걀이 12개 있어요. 케이크 하나에 5개, 다른 케이크에 4개를 썼어요. 달걀이 몇 개 남았을까요?',
  id: 'Sebuah kotak berisi 12 telur. 5 dipakai untuk satu kue dan 4 untuk kue lainnya. Berapa telur yang tersisa?',
  vi: 'Một hộp có 12 quả trứng. 5 quả dùng để làm một cái bánh và 4 quả cho một cái bánh khác. Còn lại bao nhiêu quả trứng?',
}
const MIA_PAGES = {
  en: "Mia's goal is 30 pages. She reads 15 pages, then 8 more. How many pages has she read so far?",
  es: 'La meta de Mía es leer 30 páginas. Lee 15 páginas y luego 8 más. ¿Cuántas páginas ha leído hasta ahora?',
  fr: "L'objectif de Mia est de lire 30 pages. Elle lit 15 pages, puis 8 de plus. Combien de pages a-t-elle lues jusqu'à maintenant ?",
  pt: 'A meta da Mia é ler 30 páginas. Ela lê 15 páginas e depois mais 8. Quantas páginas ela já leu?',
  it: "L'obiettivo di Mia è leggere 30 pagine. Legge 15 pagine, poi altre 8. Quante pagine ha letto finora?",
  de: 'Mias Ziel sind 30 Seiten. Sie liest 15 Seiten und dann noch 8. Wie viele Seiten hat sie bis jetzt gelesen?',
  nl: 'Mia wil 30 bladzijden lezen. Ze leest 15 bladzijden en daarna nog 8. Hoeveel bladzijden heeft ze tot nu toe gelezen?',
  ru: 'Мия хочет прочитать 30 страниц. Она прочитала 15 страниц, а потом ещё 8. Сколько страниц она уже прочитала?',
  tr: "Mia'nın hedefi 30 sayfa okumak. 15 sayfa okuyor, sonra 8 sayfa daha. Şimdiye kadar kaç sayfa okudu?",
  zh: '米娅的目标是读30页。她先读了15页,又读了8页。她到现在一共读了多少页?',
  ja: 'ミアの目標は30ページ読むことです。15ページ読んで、そのあと8ページ読みました。今までに何ページ読みましたか?',
  ko: '미아의 목표는 30쪽 읽기예요. 15쪽을 읽고 8쪽을 더 읽었어요. 지금까지 몇 쪽을 읽었을까요?',
  id: 'Target Mia adalah membaca 30 halaman. Ia membaca 15 halaman, lalu 8 halaman lagi. Berapa halaman yang sudah ia baca sejauh ini?',
  vi: 'Mục tiêu của Mia là đọc 30 trang. Bạn ấy đọc 15 trang, rồi đọc thêm 8 trang. Đến giờ bạn ấy đã đọc bao nhiêu trang?',
}
const CONTAINERS = {
  en: 'Container X holds twice as much as Container Y. Container Z holds more than Container Y. Which holds the most?',
  es: 'El Contenedor X contiene el doble que el Contenedor Y. El Contenedor Z contiene más que el Contenedor Y. ¿Cuál contiene más?',
  fr: 'Le récipient X contient deux fois plus que le récipient Y. Le récipient Z contient plus que le récipient Y. Lequel contient le plus ?',
  pt: 'O Recipiente X contém o dobro do Recipiente Y. O Recipiente Z contém mais do que o Recipiente Y. Qual contém mais?',
  it: 'Il Contenitore X contiene il doppio del Contenitore Y. Il Contenitore Z contiene più del Contenitore Y. Quale contiene di più?',
  de: 'Behälter X fasst doppelt so viel wie Behälter Y. Behälter Z fasst mehr als Behälter Y. Welcher fasst am meisten?',
  nl: 'Container X bevat twee keer zoveel als container Y. Container Z bevat meer dan container Y. Welke bevat het meest?',
  ru: 'В контейнер X входит вдвое больше, чем в контейнер Y. В контейнер Z входит больше, чем в контейнер Y. В какой входит больше всего?',
  tr: 'X Kabı, Y Kabının iki katı kadar alır. Z Kabı, Y Kabından daha çok alır. Hangisi en çok alır?',
  zh: '容器X装的是容器Y的两倍。容器Z装的比容器Y多。哪个装得最多?',
  ja: '容器Xは容器Yの2倍入ります。容器Zは容器Yより多く入ります。どれが一番多く入るかな?',
  ko: '통 X는 통 Y보다 두 배 많이 담아요. 통 Z는 통 Y보다 많이 담아요. 어느 것이 가장 많이 담을까요?',
  id: 'Wadah X menampung dua kali lebih banyak dari Wadah Y. Wadah Z menampung lebih banyak dari Wadah Y. Mana yang menampung paling banyak?',
  vi: 'Bình chứa X chứa gấp đôi Bình chứa Y. Bình chứa Z chứa nhiều hơn Bình chứa Y. Bình nào chứa nhiều nhất?',
}
const SAME_GROUPS = {
  en: 'Do both groups have the same number?',
  es: '¿Los dos grupos tienen la misma cantidad?', fr: 'Les deux groupes ont-ils le même nombre ?', pt: 'Os dois grupos têm a mesma quantidade?',
  it: 'I due gruppi hanno lo stesso numero?', de: 'Haben beide Gruppen gleich viele?', nl: 'Hebben beide groepen evenveel?',
  ru: 'В двух группах одинаковое количество?', tr: 'İki grupta aynı sayıda mı var?', zh: '两组的数量一样吗?', ja: '2つのグループの数は同じかな?',
  ko: '두 묶음의 개수가 같나요?', id: 'Apakah kedua kelompok jumlahnya sama?', vi: 'Hai nhóm có số lượng bằng nhau không?',
}
const CHRYSALIS_SENTENCE = {
  en: 'A caterpillar changes into a butterfly inside a chrysalis.',
  es: 'Una oruga se transforma en mariposa dentro de una crisálida.', fr: "Une chenille se transforme en papillon à l'intérieur d'une chrysalide.",
  pt: 'Uma lagarta se transforma em borboleta dentro de uma crisálida.', it: 'Un bruco si trasforma in una farfalla dentro una crisalide.',
  de: 'Eine Raupe verwandelt sich in einer Puppe in einen Schmetterling.', nl: 'Een rups verandert in een pop in een vlinder.',
  ru: 'Гусеница превращается в бабочку внутри куколки.', tr: 'Bir tırtıl, bir krizalit içinde kelebeğe dönüşür.', zh: '毛毛虫在蛹里变成蝴蝶。',
}
// Yes/No and True/False labels that were left in English.
const LABELS = {
  de: { '✅ Yes': '✅ Ja', '❌ No': '❌ Nein' },
  ru: { '✅ True': '✅ Верно', '❌ False': '❌ Неверно' },
  ko: { '✅ True': '✅ 맞아요', '❌ False': '❌ 틀려요' },
}
function relabel(q, lang) {
  const t = q.translations && q.translations[lang]
  if (!t) return
  const map = LABELS[lang]
  const fix = (v) => (typeof v === 'string' && map[v] ? map[v] : v)
  if (Array.isArray(t.options)) t.options = t.options.map(fix)
  t.correct_answer = fix(t.correct_answer)
  if (Array.isArray(t.accepted_answers)) t.accepted_answers = t.accepted_answers.map(fix)
}

const SCI_MORE_ANSWERS = {
  'SCI-WR-T04-Q03': ['tail fin', 'fin'], 'SCI-WR-T04-Q05': ['stalk'], 'SCI-WR-T04-Q08': ['vent'], 'SCI-WR-T04-Q09': ['magma chamber'],
  'SCI-WR-T08-Q03': ['light'], 'SCI-WR-T08-Q05': ['hunter', 'carnivore'], 'SCI-WR-T08-Q06': ['home'], 'SCI-WR-T08-Q10': ['extinct'],
  'SCI-WR-T09-Q01': ['pets'], 'SCI-WR-T09-Q03': ['plants'], 'SCI-WR-T09-Q04': ['2d shapes'], 'SCI-WR-T09-Q05': ['hunters', 'meat eaters'],
  'SCI-WR-T09-Q07': ['matter'], 'SCI-WR-T09-Q09': ['instruments', 'measuring instruments'],
}
const EN_READ_QUESTIONS = {
  'EN-RD-T11-Q01': 'What did Tom use?', 'EN-RD-T11-Q02': 'What did Mia put on?', 'EN-RD-T11-Q03': 'When did Sam pack his bag?',
  'EN-RD-T11-Q04': 'What did Priya say?', 'EN-RD-T11-Q05': 'What did Ravi do before crossing?', 'EN-RD-T11-Q06': 'How often did Anna save a coin?',
  'EN-RD-T11-Q07': 'What did Leo do, even though he was scared?', 'EN-RD-T11-Q08': 'What did Omar do when he felt cross?',
  'EN-RD-T11-Q09': 'What did the duck do?', 'EN-RD-T11-Q10': "What did Maya's dog do?",
  'EN-RD-T12-Q01': 'What did Ben do after he woke up?', 'EN-RD-T12-Q02': 'What made Zoe feel better?', 'EN-RD-T12-Q03': 'What did Sam do with the litter?',
  'EN-RD-T12-Q04': 'How did Nina leave the building?', 'EN-RD-T12-Q05': 'Why was Kiran calm in the morning?', 'EN-RD-T12-Q06': 'How did Ana get the book?',
  'EN-RD-T12-Q07': 'What did Ben do for the boy?', 'EN-RD-T12-Q08': 'What did Tia do, even though she was scared?',
  'EN-RD-T12-Q09': 'What probably happened next?', 'EN-RD-T12-Q10': 'Why did Maya go to the sink first?',
  'EN-RD-T15-Q08': 'How did the boy feel?', 'EN-RD-T15-Q09': 'What probably happened next?',
}

const patches = [
  // ═════════ English · Listen ═════════
  { ids: ['EN-LIS-T13-Q09'], category: 'widget_mismatch', severity: 'blocking', reason: '"Tap the silliest hat" is one tap, but tap_sequence waited for 4 taps in a fixed order; any hat is a fair answer, so it becomes a one-tap practice item.',
    apply(q) { q.interaction = 'tap_mcq'; q.correct_answer = q.options[0]; q.accepted_answers = [...q.options]; q.graded = false } },
  { ids: ['EN-LIS-T13-Q05'], category: 'widget_mismatch', severity: 'blocking', reason: '"Tap everything except the shoe" has no order, but tap_sequence compared the taps in order.',
    apply(q) { q.interaction = 'multi_select'; q.accepted_answers = [...q.correct_answer]; q.level = 4 } },
  { ids: ['EN-LIS-T13-Q03'], category: 'ambiguous', severity: 'blocking', reason: '"Tap the biggest ball": basketball, football and volleyball are similar sizes and the emoji are drawn the same size. Asks for the smallest ball (tennis ball) instead.',
    apply(q) { q.audio_text = 'Tap the smallest ball.'; q.correct_answer = ['🎾']; q.accepted_answers = ['🎾']; q.hints = ['Listen once more.', 'It is the ball you use with a racket.']; q.feedback = { ...q.feedback, correct: 'The tennis ball. You listened for "smallest". 🎾', incorrect: 'Listen for the describing word: smallest.' }; q.distractor_insight = { '🏀': 'picked a big ball - listen for "smallest"', '⚽': 'picked a big ball - listen for "smallest"', '🏐': 'picked a big ball - listen for "smallest"' }; q.level = 2 } },
  { ids: ['EN-LIS-T13-Q06'], category: 'exclude', severity: 'blocking', reason: '"Tap the second star" depends on the on-screen order, which is shuffled; and ✨/💫 are arguably not stars. Cannot be fixed well with emoji tiles.',
    apply(q, h) { h.exclude(q, 'Position-based instruction ("the second star") but the options are shuffled on screen; the star emoji are not clearly distinct.') } },
  { ids: ['EN-LIS-T13-Q01', 'EN-LIS-T13-Q04'], category: 'level_off', severity: 'warning', reason: 'A single "Tap the apple/clock" was labelled level 5.', apply(q) { q.level = 1 } },
  { ids: ['EN-LIS-T13-Q02', 'EN-LIS-T13-Q07', 'EN-LIS-T13-Q08'], category: 'level_off', severity: 'warning', reason: 'Two-step instructions labelled level 5.', apply(q) { q.level = 3 } },
  { ids: ['EN-LIS-T13-Q10'], category: 'level_off', severity: 'warning', reason: 'Three-step instruction labelled level 5.', apply(q) { q.level = 4 } },
  { ids: ['EN-LIS-T08-Q07'], category: 'ambiguous', severity: 'blocking', reason: 'cat, hat, dog: "hat" is the natural odd one out by meaning; the key (dog) is about rhyme, which the question did not say.',
    apply(q) { q.prompt = 'Which word does NOT rhyme?' } },
  { match: /^EN-LIS-T09-/, category: 'mode_mismatch', severity: 'warning', reason: 'The voice skipped "___", so the learner heard "I wash my before dinner" with no gap. The gap is now spoken as "beep".',
    apply(q) { if (typeof q.audio_text === 'string') q.audio_text = q.audio_text.replace(/_{2,}/g, 'beep') } },
  { match: /^EN-RD-T04-/, category: 'mode_mismatch', severity: 'warning', reason: 'Read-aloud skipped the gap; it is now spoken as "beep".',
    apply(q) { if (typeof q.audio_text === 'string') q.audio_text = q.audio_text.replace(/_{2,}/g, 'beep') } },
  { match: /^EN-SPK-T08-/, category: 'mode_mismatch', severity: 'warning', reason: 'The voice skipped the gap; it is now spoken as "beep".',
    apply(q) { if (typeof q.audio_text === 'string') q.audio_text = q.audio_text.replace(/_{2,}/g, 'beep') } },
  { match: /^EN-LIS-T12-/, category: 'mode_mismatch', severity: 'warning', reason: 'The audio named the answers ("Tap all the animals. Cat. Cow."), turning a category task into tap-what-you-heard.',
    apply(q) { if (typeof q.audio_text === 'string') q.audio_text = q.audio_text.split(/(?<=[.!?])\s+/)[0] } },
  { ids: ['EN-LIS-T12-Q10'], category: 'ambiguous', severity: 'blocking', reason: '"Tap all the silly words" is a matter of taste once the answers are not read out; kept as practice.',
    apply(q) { q.graded = false } },
  { ids: ['EN-LIS-T12-Q01'], category: 'wording', severity: 'warning', reason: '🧺 is a basket, not a towel.',
    apply(q) { const sw = (v) => (v === '🧺 towel' ? '🧽 sponge' : v); q.options = q.options.map(sw); q.correct_answer = q.correct_answer.map(sw); if (Array.isArray(q.accepted_answers)) q.accepted_answers = q.accepted_answers.map(sw) } },
  { ids: ['EN-LIS-T12-Q05'], category: 'wording', severity: 'warning', reason: '🦺 is a safety vest, not a seatbelt.',
    apply(q) { const sw = (v) => (v === '🦺 seatbelt' ? '🦺 safety vest' : v); q.options = q.options.map(sw); q.correct_answer = q.correct_answer.map(sw); if (Array.isArray(q.accepted_answers)) q.accepted_answers = q.accepted_answers.map(sw) } },
  { ids: ['EN-LIS-T05-Q01'], category: 'ambiguous', severity: 'warning', reason: '"What sound does it start with?" - c can make the /s/ sound (city), so c was defensible.',
    apply(q) { const sw = (v) => (v === 'c' ? 'sh' : v); q.options = q.options.map(sw); if (q.distractor_insight && q.distractor_insight.c) { q.distractor_insight.sh = 'heard a hissing sound but not the plain /s/'; delete q.distractor_insight.c } } },
  { match: /^EN-LIS-T14-/, category: 'level_off', severity: 'warning', reason: 'One-sentence yes/no common-sense questions were labelled level 5.', apply(q) { q.level = 2 } },
  { match: /^EN-LIS-T11-/, category: 'level_off', severity: 'warning', reason: 'Same matching task as EN-RD-T05 (level 2) but labelled level 4.', apply(q) { q.level = 2 } },

  // ═════════ English · Read ═════════
  { match: /^EN-RD-T06-/, category: 'widget_mismatch', severity: 'blocking', reason: 'match_pairs with a flat two-item answer: the widget split the emoji in half and the item could never be finished. "Tap the two that belong together" is a two-item multi_select.',
    apply(q) { q.interaction = 'multi_select'; q.accepted_answers = [...q.correct_answer] } },
  { ids: ['EN-RD-T06-Q01'], category: 'wording', severity: 'warning', reason: '🧺 is a basket, not a towel.',
    apply(q) { const sw = (v) => (v === '🧺 towel' ? '🧽 sponge' : v); q.options = q.options.map(sw); q.correct_answer = q.correct_answer.map(sw); q.accepted_answers = q.accepted_answers.map(sw); q.prompt = q.prompt.replace('towel', 'sponge') } },
  { ids: ['EN-RD-T07-Q08'], category: 'ambiguous', severity: 'blocking', reason: 'water, sleep, sweets: "sleep" (not food) and "water" (sleep and sweets start with s) were also defensible odd ones out; the needs-versus-wants rule was never stated.',
    apply(q) { q.prompt = 'water  sleep  sweets - which one does your body NOT need every day?' } },
  { match: /^EN-RD-T09-/, category: 'ambiguous', severity: 'blocking', reason: 'The word to find was never shown, and options like "dog (1st)" and "dog (4th)" were both the target. Now the instruction names the word and the options are the different words in the line.',
    apply(q) {
      const base = (v) => String(v).split(' (')[0]
      const target = base(q.correct_answer)
      const line = String(q.prompt).split(/\s+/).filter(Boolean)
      const opts = [...new Set([target, ...line])].slice(0, 4)
      q.instruction = `Find the word "${target}" in the line. Tap it.`
      q.options = opts
      q.correct_answer = target
      q.accepted_answers = [target]
      q.distractor_insight = Object.fromEntries(opts.filter((o) => o !== target).map((o) => [o, 'picked a word that looks similar - check every letter']))
    } },
  { match: /^EN-RD-T14-/, category: 'mode_mismatch', severity: 'blocking', reason: 'The prompt printed the three sentences already in order (and EN-RD-T14-Q04 printed them in a different order from the key), so the task was copying - or contradicted the key.',
    apply(q) { q.prompt = 'Put the story in order.' } },
  { match: /^EN-RD-T(11|12)-|^EN-RD-T15-Q0[89]$/, category: 'unanswerable', severity: 'warning', reason: 'The instruction said "Answer the question" but no question was shown.',
    apply(q) { const ask = EN_READ_QUESTIONS[q.id]; if (ask && !String(q.prompt).includes(ask)) q.prompt = `${q.prompt} ${ask}` } },
  { match: /^EN-RD-T03-/, category: 'level_off', severity: 'warning', reason: 'Reading 6-10 word sentences was labelled level 1 (harder than the level-2 gap fills).', apply(q) { q.level = 2 } },
  { ids: ['EN-RD-T01-Q01'], category: 'ambiguous', severity: 'warning', reason: '🧴 (pump bottle) reads as liquid soap.',
    apply(q) { const sw = (v) => (v === '🧴' ? '🧽' : v); q.options = q.options.map(sw); if (q.distractor_insight && q.distractor_insight['🧴']) { q.distractor_insight['🧽'] = q.distractor_insight['🧴']; delete q.distractor_insight['🧴'] } } },

  // ═════════ English · Write ═════════
  { match: /^EN-WR-T01-/, category: 'wording', severity: 'warning', reason: 'The spoken word gives the answer (it is a picture-supported dictation), so the instruction says to listen too. Without the audio, 😄 = giggle or 🙏 = thanks were ambiguous.',
    apply(q) { q.instruction = 'Look at the picture and listen. Type the word.' } },
  { match: /^EN-WR-T03-/, category: 'checker_support', severity: 'blocking', reason: 'Learners often type the whole word ("cat") instead of the missing letter; both are right.',
    apply(q) { q.accepted_answers = [...new Set([q.correct_answer, q.audio_text].filter(Boolean))] } },
  { ids: ['EN-WR-T09-Q07', 'EN-WR-T09-Q08', 'EN-WR-T09-Q10'], category: 'wording', severity: 'warning', reason: 'The instruction said "change one letter" but these change two or three letters.',
    apply(q) { q.instruction = 'Change the letters to make a new word.' } },
  { ids: ['EN-WR-T10-Q01'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['cold', 'cool', 'chilly', 'freezing'] } },
  { ids: ['EN-WR-T10-Q03'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['small', 'little', 'tiny'] } },
  { ids: ['EN-WR-T10-Q05'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['unkind', 'mean', 'nasty', 'cruel', 'rude', 'horrible'] } },
  { ids: ['EN-WR-T10-Q07'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['dangerous', 'unsafe', 'risky'] } },
  { ids: ['EN-WR-T10-Q08'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['spend', 'waste'] } },
  { ids: ['EN-WR-T10-Q09'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['laugh', 'chuckle', 'titter', 'snigger', 'snicker', 'chortle'] } },
  { ids: ['EN-WR-T10-Q10'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['jump', 'bounce', 'leap', 'spring', 'skip'] } },
  { ids: ['EN-WR-T12-Q03'], category: 'checker_support', severity: 'blocking', reason: '"At night I go to sleep" is right too.', apply(q) { q.accepted_answers = ['bed', 'sleep'] } },
  { ids: ['EN-WR-T12-Q04'], category: 'checker_support', severity: 'blocking', reason: 'Other words for bin.', apply(q) { q.accepted_answers = ['bin', 'rubbish bin', 'dustbin', 'trash', 'trash can', 'garbage'] } },
  { ids: ['EN-WR-T12-Q06'], category: 'checker_support', severity: 'blocking', reason: '"street" is right too.', apply(q) { q.accepted_answers = ['road', 'street'] } },
  { ids: ['EN-WR-T12-Q07'], category: 'checker_support', severity: 'blocking', reason: 'Many places to keep coins.', apply(q) { q.accepted_answers = ['purse', 'pocket', 'wallet', 'piggy bank', 'money box', 'moneybox', 'jar', 'bag', 'bank', 'box'] } },
  { ids: ['EN-WR-T12-Q08'], category: 'checker_support', severity: 'blocking', reason: 'Other right answers.', apply(q) { q.accepted_answers = ['tell', 'talk to', 'ask', 'call', 'speak to', 'find', 'hug'] } },
  { ids: ['EN-WR-T12-Q09', 'EN-WR-T12-Q10'], category: 'ambiguous', severity: 'blocking', reason: 'A silly gap fill where almost any noun works ("The cat sat on my ___"): kept as practice, not graded.',
    apply(q) { q.graded = false } },
  { ids: ['EN-WR-T13-Q08'], category: 'ambiguous', severity: 'blocking', reason: '"I wosh my hands and dri them" had two misspelled words; "wash" was marked wrong.',
    apply(q) { q.prompt = 'I wash my hands and dri them.' } },
  { ids: ['EN-WR-T14-Q09', 'EN-WR-T14-Q10'], category: 'ambiguous', severity: 'blocking', reason: '"Why do you think..." invites opinions with no single answer; practice only.', apply(q) { q.graded = false } },
  { match: /^EN-WR-T15-/, category: 'checker_support', severity: 'blocking', reason: 'Free writing ("two sentences about how you get ready for bed") was compared exactly with two sample paragraphs, so almost every real answer was wrong; practice only.', apply(q) { q.graded = false } },
  { ids: ['EN-WR-T11-Q07'], category: 'ambiguous', severity: 'blocking', reason: 'The picture (💛🙋) can be captioned many ways; practice only.', apply(q) { q.graded = false } },

  // ═════════ English · Speak ═════════
  { match: /^EN-SPK-T06-/, category: 'wrong_key', severity: 'blocking', reason: 'The keyword was the prompt word itself (say "cat" → right; say "hat" → wrong). Now any listed rhyme counts, never the word itself.', apply() {} },
  { match: /^EN-SPK-T12-/, category: 'wrong_key', severity: 'blocking', reason: 'The keyword was the category name ("animal"), which learners never say while naming animals; now a word list per category, or practice only where the category is open.',
    apply(q) { if (['EN-SPK-T12-Q04', 'EN-SPK-T12-Q05', 'EN-SPK-T12-Q06', 'EN-SPK-T12-Q09'].includes(q.id)) q.graded = false } },
  { ids: ['EN-SPK-T13-Q09', 'EN-SPK-T13-Q10'], category: 'checker_support', severity: 'blocking', reason: 'Open "what would you do" questions had no keywords and were always marked wrong; practice only.', apply(q) { q.graded = false } },
  { match: /^EN-SPK-T15-/, category: 'checker_support', severity: 'blocking', reason: 'Open opinion questions had no keywords and were always marked wrong; practice only.', apply(q) { q.graded = false } },
  { match: /^EN-SPK-T02-/, category: 'checker_support', severity: 'blocking', reason: 'Browser speech recognition cannot reliably transcribe a single letter sound (/s/, /ch/); practice only.', apply(q) { q.graded = false } },
  { match: /^EN-SPK-T07-/, category: 'checker_support', severity: 'blocking', reason: 'Speech recognition returns whole words ("water"), never the syllables ("wa-ter"), so the keywords could not match; practice only.', apply(q) { q.graded = false } },
  { match: /^EN-SPK-T10-/, category: 'checker_support', severity: 'blocking', reason: 'Spelled-out letters are transcribed unpredictably ("see a tea"); practice only.', apply(q) { q.graded = false } },
  { ids: ['EN-SPK-T08-Q09', 'EN-SPK-T08-Q10', 'EN-SPK-T11-Q08'], category: 'ambiguous', severity: 'blocking', reason: 'Open gap fill / ambiguous picture; practice only.', apply(q) { q.graded = false } },

  // ═════════ Maths · Listen ═════════
  { ids: ['MA-LIS-T03-Q01'], category: 'wrong_key', severity: 'blocking', reason: 'The apples to count were never shown (only one badge emoji), so "three apples - yes" could not be checked.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🍎🍎🍎' }) } },
  { ids: ['MA-LIS-T03-Q02'], category: 'unanswerable', severity: 'blocking', reason: 'The four stars were never shown.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '⭐⭐⭐⭐' }) } },
  { ids: ['MA-LIS-T03-Q03'], category: 'wrong_key', severity: 'blocking', reason: 'The two dogs were never shown.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🐶🐶' }) } },
  { ids: ['MA-LIS-T03-Q04'], category: 'unanswerable', severity: 'blocking', reason: 'The seven balloons were never shown.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🎈🎈🎈🎈🎈🎈🎈' }) } },
  { match: /^MA-LIS-T03-/, category: 'translation', severity: 'warning', reason: 'German Yes/No labels were left in English.', apply(q) { relabel(q, 'de') } },
  { ids: ['MA-LIS-T11-Q06'], category: 'ambiguous', severity: 'blocking', reason: '"Reads 15, then 8 more, then stops 5 pages early from her goal of 30" means both 23 and 25.',
    apply(q, h) { h.forEachLang(q, (t, lang) => { t.audio_text = MIA_PAGES[lang]; t.options = ['23', '7', '30']; t.correct_answer = '23'; t.accepted_answers = ['23'] }); q.distractor_insight = { 7: 'worked out the pages still to read instead of the pages read', 30: 'gave the goal, not the pages read' } } },
  { ids: ['MA-LIS-T13-Q10'], category: 'wrong_key', severity: 'blocking', reason: 'X = 2Y and Y = Z/2 give X = Z, so there WAS enough information. The second fact now says only that Z holds more than Y, so the key "not enough information" is right.',
    apply(q, h) { h.forEachLang(q, (t, lang) => { t.audio_text = CONTAINERS[lang] }); q.distractor_insight = { 'Container X': 'assumed "twice as much as Y" means biggest - Z could hold even more', 'Container Z': 'assumed "more than Y" means biggest - X could hold more' } } },
  { ids: ['MA-LIS-T14-Q09'], category: 'ambiguous', severity: 'blocking', reason: 'Options 1/2 and 3/6 are equal, so both were right.',
    apply(q, h) { h.forEachLang(q, (t) => { if (Array.isArray(t.options)) t.options = t.options.map((o) => (o === '3/6' ? '1/6' : o)) }); q.distractor_insight = { '1/3': 'used the number of pizzas instead of dividing', '1/6': 'gave one slice of six instead of the share of three pizzas' } } },
  { ids: ['MA-LIS-T11-Q05'], category: 'wording', severity: 'warning', reason: '"A recipe needs 12 eggs... how many are left?" did not make sense; now a box of 12 eggs.', apply(q, h) { h.forEachLang(q, (t, lang) => { t.audio_text = EGG_BOX[lang] }) } },
  { ids: ['MA-LIS-T05-Q05', 'MA-RD-T07-Q05'], category: 'ambiguous', severity: 'blocking', reason: 'A square (⬛) is also a rectangle, so it was a defensible answer for "rectangle".',
    apply(q, h) { h.forEachLang(q, (t) => { if (Array.isArray(t.options)) t.options = t.options.map((o) => (o === '⬛' ? '⚪' : o)) }); if (q.distractor_insight && q.distractor_insight['⬛']) { q.distractor_insight['⚪'] = 'picked a round shape - a rectangle has four straight sides'; delete q.distractor_insight['⬛'] } } },
  { match: /^MA-LIS-T15-/, category: 'mode_mismatch', severity: 'warning', reason: 'The prompt printed the numbers, so listening was not needed; ordering three numbers was labelled level 5.',
    apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '' }); q.level = /Q0[1-3]$/.test(q.id) ? 2 : 3 } },
  { ids: range('MA-LIS-T12', 1, 6), category: 'level_off', severity: 'warning', reason: 'Adding two coins, an hour later etc. labelled level 4.', apply(q) { q.level = 2 } },
  { ids: ids('MA-LIS-T13', [1, 2, 3, 4, 8]), category: 'level_off', severity: 'warning', reason: 'One-step comparisons where the answer is in the sentence, labelled level 4.', apply(q) { q.level = 2 } },
  { ids: ids('MA-LIS-T14', [1, 6]), category: 'level_off', severity: 'warning', reason: 'Half a pizza and 6 ÷ 2 labelled level 5.', apply(q) { q.level = 3 } },
  { ids: ['MA-LIS-T07-Q09'], category: 'level_off', severity: 'warning', reason: 'Half of 10 versus a quarter of 20 at level 2.', apply(q) { q.level = 3 } },
  { ids: ['MA-LIS-T08-Q09'], category: 'level_off', severity: 'warning', reason: 'A Fibonacci pattern among +1/+2 patterns at level 3.', apply(q) { q.level = 4 } },

  // ═════════ Maths · Read ═════════
  { ids: ['MA-RD-T05-Q08'], category: 'wrong_key', severity: 'blocking', reason: '6 + 3 = 9 and 4 + 4 = 8, so the answer was ">" but the key was "=". The right side is now 5 + 4.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '6 + 3 ? 5 + 4' }) } },
  { match: /^MA-RD-T08-/, category: 'unanswerable', severity: 'blocking', reason: 'The right-hand column showed the numbers again instead of the picture groups, so no pair could ever be made.',
    apply(q, h) { h.forEachLang(q, (t) => { const pairs = Array.isArray(t.correct_answer) ? t.correct_answer : q.correct_answer; t.options = pairs.map((p) => p[1]) }) } },
  { ids: ['MA-RD-T09-Q01'], category: 'exclude', severity: 'blocking', reason: 'match_pairs with a text answer ("Neither") and an instruction that contradicts the key; the feedback in every language is written for the broken version.',
    apply(q, h) { h.exclude(q, 'Broken widget (match_pairs with a single text answer) and an instruction that contradicts the key; replaced by the other same/different items of this type.') } },
  { ids: ids('MA-RD-T09', [3, 5, 7, 9]), category: 'widget_mismatch', severity: 'blocking', reason: 'A Same/Different choice was set up as match_pairs, which could never be answered.',
    apply(q, h) { q.interaction = 'tap_mcq'; h.forEachLang(q, (t, lang) => { t.instruction = SAME_GROUPS[lang]; if (Array.isArray(t.accepted_answers) && t.accepted_answers.length !== 1) t.accepted_answers = [t.correct_answer] }) } },
  { ids: ids('MA-RD-T09', [2, 4, 6, 8, 10]), category: 'widget_mismatch', severity: 'blocking', reason: 'match_pairs with a text key ("tied A and C") that was not an option, and the options printed the counts. Now "tap the two groups" (multi_select) with labelled groups and no counts.',
    apply(q, h) {
      q.interaction = 'multi_select'
      h.forEachLang(q, (t) => {
        if (!/^A: /.test(String(t.prompt))) {
          const groups = String(t.prompt).replace(/^[^:：]*[:：]\s*/, '').split(/\s{2,}/).filter(Boolean)
          if (groups.length === 3) t.prompt = groups.map((g, i) => `${'ABC'[i]}: ${g}`).join('   ')
        }
        if (Array.isArray(t.options)) t.options = t.options.map((o) => String(o).replace(/\s*[(（]\d+[)）]\s*$/, ''))
        t.correct_answer = [t.options[0], t.options[2]]
        t.accepted_answers = [...t.correct_answer]
      })
      q.distractor_insight = { [q.options[1]]: 'picked the group that is different' }
    } },
  { ids: ['MA-RD-T14-Q05'], category: 'wrong_key', severity: 'blocking', reason: '🕓 shows four o\'clock (an option) but the key was 4:30; now 🕟 (half past four).',
    apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🕟' }); if (q.image) q.image.emoji = '🕟' } },
  { ids: ['MA-RD-T14-Q07'], category: 'wrong_key', severity: 'blocking', reason: '🕘 shows nine o\'clock (an option) but the key was 8:15, which no clock emoji can show. Now 🕣 = 8:30.',
    apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🕣'; const sw = (v) => (v === '8:15' ? '8:30' : v); if (Array.isArray(t.options)) t.options = t.options.map(sw); t.correct_answer = sw(t.correct_answer); if (Array.isArray(t.accepted_answers)) t.accepted_answers = t.accepted_answers.map(sw) }); if (q.image) q.image.emoji = '🕣'; q.distractor_insight = { "8 o'clock": "ignored the long hand pointing to the 6", "9 o'clock": 'read the next hour because the short hand is past 8' }; q.feedback = { ...q.feedback, correct: '8:30 - half past eight. 🕣' } } },
  { ids: ['MA-RD-T14-Q09'], category: 'wrong_key', severity: 'blocking', reason: '🕙 shows ten o\'clock but the key was 10:45, which no clock emoji can show. Now 🕥 = 10:30.',
    apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🕥'; const sw = (v) => ({ '10:45': '10:30', '11:45': '11:30', '10:15': '10:00' }[v] || v); if (Array.isArray(t.options)) t.options = t.options.map(sw); t.correct_answer = sw(t.correct_answer); if (Array.isArray(t.accepted_answers)) t.accepted_answers = t.accepted_answers.map(sw) }); if (q.image) q.image.emoji = '🕥'; q.distractor_insight = { '11:30': 'read the next hour because the short hand is past 10', '10:00': 'ignored the long hand pointing to the 6' }; q.feedback = { ...q.feedback, correct: '10:30 - half past ten. 🕥' } } },
  { ids: ids('MA-RD-T14', [1, 2, 4]), category: 'mode_mismatch', severity: 'blocking', reason: 'The prompt text "(clock showing 3 o\'clock)" gave the answer away.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = stripParen(t.prompt) }) } },
  { match: /^MA-RD-T03-/, category: 'translation', severity: 'warning', reason: 'Russian and Korean True/False labels were left in English.', apply(q) { relabel(q, 'ru'); relabel(q, 'ko') } },
  { ids: range('MA-RD-T03', 5, 8), category: 'level_off', severity: 'warning', reason: 'Bridging through 10 at level 1.', apply(q) { q.level = 2 } },
  { ids: range('MA-RD-T03', 9, 10), category: 'level_off', severity: 'warning', reason: 'Two-digit sums with regrouping (16 + 17, 45 − 19) at level 1.', apply(q) { q.level = 3 } },
  { ids: ['MA-RD-T05-Q10'], category: 'level_off', severity: 'warning', reason: 'Multiplication on both sides at level 2.', apply(q) { q.level = 3 } },

  // ═════════ Maths · Write ═════════
  { ids: ['MA-WR-T07-Q08'], category: 'wrong_key', severity: 'blocking', reason: '6 + 3 = 9 and 4 + 4 = 8, so the answer was ">" but the key was "=". The right side is now 5 + 4.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '6 + 3 ___ 5 + 4' }) } },
  { ids: ['MA-WR-T12-Q05'], category: 'wording', severity: 'warning', reason: 'The recipe story did not make sense (and the Japanese prompt was untranslated); now a box of 12 eggs.', apply(q, h) { h.forEachLang(q, (t, lang) => { t.prompt = EGG_BOX[lang] }) } },
  { ids: ids('MA-WR-T02', [5, 6, 7, 8]), category: 'level_off', severity: 'warning', reason: 'Bridging through 10 at level 1.', apply(q) { q.level = 2 } },
  { ids: ids('MA-WR-T02', [9, 10]), category: 'level_off', severity: 'warning', reason: 'Crossing 20 with regrouping at level 1.', apply(q) { q.level = 3 } },
  { ids: ids('MA-WR-T04', [5, 8]), category: 'level_off', severity: 'warning', reason: 'Bridging through 10 at level 1.', apply(q) { q.level = 2 } },
  { ids: ids('MA-WR-T04', [6, 7, 9, 10]), category: 'level_off', severity: 'warning', reason: 'Two-digit sums with regrouping at level 1.', apply(q) { q.level = 3 } },
  { ids: ['MA-WR-T03-Q10'], category: 'level_off', severity: 'warning', reason: '? − 15 = 18 needs two-digit work.', apply(q) { q.level = 3 } },
  { ids: ['MA-WR-T09-Q09'], category: 'level_off', severity: 'warning', reason: 'Fibonacci among simple step patterns.', apply(q) { q.level = 4 } },
  { match: /^MA-WR-T08-/, category: 'wrong_key', severity: 'blocking', reason: 'The tiles were joined without spaces ("3+4=7") and compared with "3 + 4 = 7", so a right answer was always wrong; and "4 + 3 = 7" is just as true. Now any true equation that uses every tile is right.', apply() {} },
  { match: /^MA-WR-T10-/, category: 'checker_support', severity: 'blocking', reason: '"2 + 3 = 5" for "3 + 2 = 5" and other orderings of the same number sentence are right; spacing does not matter.', apply() {} },
  { match: /^MA-WR-T06-/, category: 'checker_support', severity: 'warning', reason: '"Type the number as digits": copying the word ("three") must not count.', apply() {} },

  { match: /^MA-WR-T08-/, category: 'translation', severity: 'warning', reason: 'The Japanese prompt was left in English.',
    apply(q) { const t = q.translations && q.translations.ja; const m = t && String(t.prompt).match(/^Build a true equation using: (.*)$/); if (m) t.prompt = `${m[1]} をつかって、正しい式をつくろう。` } },
  { ids: Object.keys(TRANSLATION_FIXES), category: 'translation', severity: 'warning', reason: 'Text left in English inside a translation (Japanese word problems, a few Turkish prompts).',
    apply(q) { for (const [lang, fields] of Object.entries(TRANSLATION_FIXES[q.id])) if (q.translations && q.translations[lang]) Object.assign(q.translations[lang], fields) } },

  // ═════════ Maths · Speak ═════════
  { ids: ['MA-SPK-T14-Q05'], category: 'wording', severity: 'warning', reason: 'The recipe story did not make sense; now a box of 12 eggs.', apply(q, h) { h.forEachLang(q, (t, lang) => { t.audio_text = EGG_BOX[lang] }) } },
  { ids: ids('MA-SPK-T09', [1, 2, 3, 4, 7]), category: 'mode_mismatch', severity: 'blocking', reason: 'The prompt text "(clock showing 3 o\'clock)" gave the answer away.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = stripParen(t.prompt) }) } },
  { ids: ['MA-SPK-T09-Q05'], category: 'wrong_key', severity: 'blocking', reason: '🕓 shows four o\'clock but the answer was half past four; now 🕟.', apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '🕟' }); if (q.image) q.image.emoji = '🕟' } },
  { ids: ids('MA-SPK-T09', [6, 8, 9, 10]), category: 'wrong_key', severity: 'blocking', reason: 'The clock emoji showed a different time from the answer (no emoji can show 8:15, 10:45, 6:35 or 12:50). The time is now shown on a digital clock.',
    apply(q, h) { const t0 = { 'MA-SPK-T09-Q06': '8:15', 'MA-SPK-T09-Q08': '10:45', 'MA-SPK-T09-Q09': '6:35', 'MA-SPK-T09-Q10': '12:50' }[q.id]; h.forEachLang(q, (t) => { t.prompt = `⏰ ${t0}` }); if (q.image) q.image.emoji = '⏰' } },
  { match: /^MA-SPK-T11-/, category: 'checker_support', severity: 'blocking', reason: 'Estimates are open (no keywords, always marked wrong) and "(shown briefly)" was printed as text; practice only, stage direction removed.',
    apply(q, h) { q.graded = false; h.forEachLang(q, (t) => { t.prompt = stripParen(t.prompt) }) } },
  { match: /^MA-SPK-T1[25]-/, category: 'checker_support', severity: 'blocking', reason: 'Explaining a method is open-ended; speech keywords cannot judge it fairly. Practice only.', apply(q) { q.graded = false } },
  { ids: ['MA-SPK-T13-Q07', 'MA-SPK-T13-Q10'], category: 'exclude', severity: 'blocking', reason: 'Story retelling with no maths in a maths module.', apply(q, h) { h.exclude(q, 'Not a maths item (story retell with no numbers); belongs in English speaking practice.') } },
  { match: /^MA-SPK-T06-/, category: 'wrong_key', severity: 'blocking', reason: 'Keywords ["bigger","seven"] with "half must match" accepted "three is bigger"; and "three is smaller" (also true) was marked wrong. Now the comparison itself is checked.', apply() {} },
  { match: /^MA-SPK-T10-/, category: 'wrong_key', severity: 'blocking', reason: 'Keywords ["one","add"] with "half must match" accepted "add two". Now both the operation and the number must be said.', apply() {} },
  { ids: ids('MA-SPK-T03', [5, 6, 7, 8]), category: 'level_off', severity: 'warning', reason: 'Bridging through 10 at level 1.', apply(q) { q.level = 2 } },
  { ids: ids('MA-SPK-T03', [9, 10]), category: 'level_off', severity: 'warning', reason: 'Crossing 20 at level 1.', apply(q) { q.level = 3 } },
  { ids: ids('MA-SPK-T01', [9, 10]), category: 'level_off', severity: 'warning', reason: 'Two-digit numbers at level 1.', apply(q) { q.level = 2 } },

  // ═════════ Science · Listen ═════════
  { ids: ['SCI-LIS-T05-Q10'], category: 'exclude', severity: 'blocking', reason: 'The key was 💎 but the feedback, hint and picture all said rock; and "diamonds are a kind of rock" is wrong science.',
    apply(q, h) { h.exclude(q, 'Key (💎) contradicts its own feedback (rock) and the clues contain a science error; both 💎 and 🪨 were defensible.') } },
  { ids: ['SCI-LIS-T04-Q07'], category: 'ambiguous', severity: 'blocking', reason: '"Buzzzz!" fits a bee, a mosquito and a fly equally.',
    apply(q, h) { h.forEachLang(q, (t) => { if (Array.isArray(t.options)) t.options = t.options.map((o) => ({ '🦟': '🐄', '🪰': '🐟' }[o] || o)) }); q.distractor_insight = { '🐄': 'a cow moos - it does not buzz', '🐟': 'fish are silent - they do not buzz' } } },
  { ids: ['SCI-LIS-T14-Q10', 'SCI-LIS-T14-Q04', 'SCI-RD-T07-Q07'], category: 'exclude', severity: 'blocking', reason: 'Two defensible odd ones out (tomato, cucumber and apple are all fruits; whale is the only mammal; hawk is the only bird); fixing needs new words and feedback in 14 languages.',
    apply(q, h) { h.exclude(q, 'Two options are defensible odd ones out; the feedback in every language is written around the old words.') } },
  { ids: ['SCI-LIS-T15-Q08'], category: 'exclude', severity: 'blocking', reason: '"All the ice at the poles is frozen fresh water" is false (sea ice is frozen sea water).',
    apply(q, h) { h.exclude(q, 'Stimulus states a false fact (all polar ice is fresh water).') } },
  { ids: ids('SCI-LIS-T06', [8, 10]), category: 'level_off', severity: 'warning', reason: 'Coral and a dormant seed are trick items, not foundation level.', apply(q) { q.level = 3 } },
  { ids: ids('SCI-LIS-T06', [6, 9]), category: 'level_off', severity: 'warning', reason: 'Candle flame and talking robot are trick items above level 1.', apply(q) { q.level = 2 } },
  { ids: ids('SCI-LIS-T08', [9, 10]), category: 'level_off', severity: 'warning', reason: 'Hemisphere seasons and equatorial climate at level 2.', apply(q) { q.level = 4 } },
  { ids: ['SCI-LIS-T07-Q10'], category: 'level_off', severity: 'warning', reason: 'Kidneys filtering blood at level 2.', apply(q) { q.level = 3 } },

  // ═════════ Science · Read ═════════
  { match: /^SCI-RD-T04-/, category: 'widget_mismatch', severity: 'blocking', reason: 'match_pairs with a flat two-item answer: the widget split the emoji and the item could never be finished. "Tap the two things that go together" is a two-item multi_select.',
    apply(q, h) { q.interaction = 'multi_select'; h.forEachLang(q, (t) => { if (Array.isArray(t.correct_answer)) t.accepted_answers = [...t.correct_answer] }) } },
  { ids: ['SCI-RD-T04-Q05'], category: 'exclude', severity: 'blocking', reason: 'Sun and moon "go together" as well as sun and plant.', apply(q, h) { h.exclude(q, 'Two defensible pairs (sun+plant, sun+moon).') } },
  { match: /^SCI-RD-T12-/, category: 'unanswerable', severity: 'blocking', reason: 'The right-hand column showed the terms again instead of the definitions, so no pair could be made.',
    apply(q, h) { h.forEachLang(q, (t) => { const pairs = Array.isArray(t.correct_answer) ? t.correct_answer : q.correct_answer; t.options = pairs.map((p) => p[1]) }) } },
  { match: /^SCI-RD-T14-/, category: 'unanswerable', severity: 'blocking', reason: 'The instruction said "Answer the question" but the question was only in the hint (and SCI-RD-T14-Q02 was ambiguous without it).',
    apply(q, h) { h.forEachLang(q, (t) => { const ask = Array.isArray(t.hints) ? t.hints[0] : null; if (ask && !String(t.prompt).includes(ask)) t.prompt = `${t.prompt}\n${ask}` }) } },
  { ids: ['SCI-RD-T03-Q06'], category: 'exclude', severity: 'blocking', reason: '"chrysalis" was keyed to 🪺 (a nest with eggs); no option shows a chrysalis.', apply(q, h) { h.exclude(q, 'The keyed picture (🪺 nest) is not a chrysalis; no right option exists.') } },
  { ids: ['SCI-RD-T02-Q08'], category: 'science_accuracy', severity: 'blocking', reason: 'Butterflies form a chrysalis (moths spin cocoons), so an informed learner would answer False.',
    apply(q, h) { h.forEachLang(q, (t, lang) => { if (CHRYSALIS_SENTENCE[lang]) t.prompt = CHRYSALIS_SENTENCE[lang] }) } },
  { match: /^SCI-RD-T02-/, category: 'translation', severity: 'warning', reason: 'Russian True/False labels were left in English.', apply(q) { relabel(q, 'ru') } },
  { ids: ['SCI-RD-T02-Q10'], category: 'level_off', severity: 'warning', reason: 'A long sentence about botanical fruit at level 1.', apply(q) { q.level = 3 } },
  { ids: ids('SCI-RD-T03', [7, 8]), category: 'level_off', severity: 'warning', reason: '"habitat" and "predator" at foundation level.', apply(q) { q.level = 2 } },
  { ids: ids('SCI-RD-T03', [9, 10]), category: 'level_off', severity: 'warning', reason: '"photosynthesis" and "hibernation" at level 1.', apply(q) { q.level = 3 } },
  { ids: ids('SCI-RD-T01', [9, 10]), category: 'level_off', severity: 'warning', reason: '13-14 word sentences at level 1.', apply(q) { q.level = 2 } },
  { ids: ids('SCI-RD-T13', [1, 2, 5]), category: 'level_off', severity: 'warning', reason: 'Picking the longest row of 2-4 symbols at level 4.', apply(q) { q.level = 2 } },
  { ids: ids('SCI-RD-T15', [2, 3]), category: 'level_off', severity: 'warning', reason: 'Simple inferences at level 5.', apply(q) { q.level = 3 } },

  // ═════════ Science · Write ═════════
  { match: /^SCI-WR-T07-/, category: 'widget_mismatch', severity: 'blocking', reason: '"Drag the word into the blank" was a letter_bank whose answer is ONE of three word tiles, but the widget waited for all three tiles and joined them, so the right answer was always wrong. Now a drag_to_blank (tap one).',
    apply(q) { q.interaction = 'drag_to_blank' } },
  { match: /^SCI-WR-T1[35]-/, category: 'checker_support', severity: 'blocking', reason: 'Open observations / free writing (answer "open") could never be marked right; practice only.', apply(q) { q.graded = false } },
  { ids: ['SCI-WR-T08-Q04', 'SCI-WR-T10-Q01'], category: 'science_accuracy', severity: 'warning', reason: 'Butterflies form a chrysalis; "chrysalis" and "pupa" are accepted as well as "cocoon".',
    apply(q) { q.accepted_answers = [...new Set([...(q.accepted_answers || []), 'cocoon', 'chrysalis', 'pupa'])] } },

  { ids: Object.keys(SCI_MORE_ANSWERS), category: 'checker_support', severity: 'blocking', reason: 'Other right answers to a one-word science question (English).',
    apply(q) { q.accepted_answers = [...new Set([...(q.accepted_answers || [q.correct_answer]), ...SCI_MORE_ANSWERS[q.id]])] } },

  // ═════════ Science · Speak ═════════
  { match: /^SCI-SPK-T03-/, category: 'checker_support', severity: 'blocking', reason: 'Animal-sound imitations ("woof", "hiss") are not reliably transcribed; practice only.', apply(q) { q.graded = false } },
  { match: /^SCI-SPK-T(06|12|13|14|15)-/, category: 'checker_support', severity: 'blocking', reason: 'Open facts, explanations, questions and investigation plans had empty or token keywords; speech keywords cannot judge them fairly. Practice only.', apply(q) { q.graded = false } },
  { ids: ['SCI-SPK-T08-Q09', 'SCI-SPK-T08-Q10'], category: 'checker_support', severity: 'blocking', reason: 'Open picture descriptions of a food chain / water cycle; practice only.', apply(q) { q.graded = false } },
  { match: /^SCI-SPK-T09-/, category: 'wrong_key', severity: 'blocking', reason: 'Keywords ["bigger","elephant"] with "half must match" accepted "the mouse is bigger"; now the comparison itself is checked.', apply() {} },
]

// ═════════ Content v4 repairs (2026-11-21) ═════════
const { RHYMES, ENGLISH_SPEAK_KEYWORDS } = require('./rules')
const v4 = [
  { match: /^(EN-LIS-T01|EN-LIS-T09|MA-LIS-T13)-/, category: 'mode_mismatch', severity: 'blocking', reason: 'The picture badge on these listening items showed the right answer (🧼 for "soap", ⛑️ for "helmet", 📏 for "ruler"), so the item could be answered without listening. Now a neutral 👂.',
    apply(q) { q.image = { ...q.image, emoji: '👂' } } },
  { match: /^EN-SPK-T06-/, category: 'checker_support', severity: 'warning', reason: 'speech_scoring.expected_keywords held the word to rhyme WITH. The checker never used it (validation lists the rhymes and has not_prompt), but any other reader of expected_keywords would accept the prompt word. Now it lists real rhymes.',
    apply(q) { q.speech_scoring = { ...q.speech_scoring, expected_keywords: RHYMES[q.id].filter((w) => w !== String(q.prompt).toLowerCase()).slice(0, 6) } } },
  { match: /^EN-SPK-T12-/, category: 'checker_support', severity: 'warning', reason: 'speech_scoring.expected_keywords held the category word ("animal", "safe"). The checker never used it (validation lists category members, min 2), but any other reader would accept the category word itself. Now it lists examples.',
    apply(q) {
      const d = ENGLISH_SPEAK_KEYWORDS[q.id]
      const examples = d ? d.list.slice(0, 8) : String(q.speech_scoring.sample_answer || '').split(',').map((x) => x.trim()).filter(Boolean)
      q.speech_scoring = { ...q.speech_scoring, expected_keywords: examples }
    } },
]
patches.push(...v4)

// ═════════ Stage overrides (content v4) ═════════
// stages.js derives `stage` (0-5) from cognition.bloom + interaction. These reviewed overrides
// win where the Bloom tag is clearly wrong for the kind of thinking the item asks for, and for
// the generated starter / stretch items, whose builder gave every item the default "remember".
// Each entry: { ids | match, stage, reason }.
const F = (prefix, nums) => ids(`${prefix}-F00`, nums)
const S = (prefix, nums) => ids(prefix, nums)
const stageOverrides = [
  // Original bank
  { match: /^EN-(LIS-T0[4-7]|RD-T08|SPK-T07)-/, stage: 3, reason: 'Rhyme, first/last sound and syllable items apply sound knowledge to one word; Bloom "analyze" (splitting a word) overstates it as reasoning.' },
  { match: /^(MA-LIS-T07|MA-SPK-T06|SCI-SPK-T09|SCI-RD-T10)-/, stage: 2, reason: 'Saying which of two named things is bigger, heavier or faster is understanding one comparison, not multi-step reasoning.' },
  { match: /^(MA-RD-T05|MA-WR-T07)-/, stage: 3, reason: 'Choosing <, > or = applies the comparison symbols to two numbers or sums.' },
  { match: /^EN-RD-T09-/, stage: 1, reason: 'Spotting a named word in a line is recognition (Bloom "apply" overstated).' },
  { match: /^(EN-LIS-T12|SCI-RD-T11|SCI-LIS-T10)-/, stage: 3, reason: 'Selecting every item of a category named in the question applies a given rule; nothing has to be worked out.' },
  { match: /^(MA-LIS-T11|MA-WR-T12|MA-SPK-T14)-/, stage: 4, reason: 'Two-step problems: planning and chaining two operations is reasoning, not one-step application.' },
  { match: /^SCI-SPK-T12-/, stage: 4, reason: 'Explaining what would happen and why is reasoning about cause and effect.' },
  { match: /^SCI-SPK-T14-/, stage: 5, reason: 'Designing a test for a new question transfers the fair-test idea to a new situation.' },
  { match: /^EN-WR-T11-/, stage: 3, reason: 'A caption for a picture applies sentence writing; it is not transfer to a new situation.' },
  // Generated starter items (level 0): reviewed per item type
  { ids: F('EN-LIS', [1, 3, 4, 5, 6, 7, 8]), stage: 2, reason: 'Starter: understanding one short spoken sentence.' },
  { ids: F('EN-RD', [1, 2, 3, 4, 5, 6, 7, 8]), stage: 2, reason: 'Starter: understanding one short written sentence or word (as EN-RD-T01/T11).' },
  { ids: F('EN-SPK', [4, 8]), stage: 2, reason: 'Starter: answering a spoken question shows understanding.' },
  { ids: [...F('EN-SPK', [3, 6]), ...F('SCI-SPK', [4])], stage: 3, reason: 'Starter: reading a word aloud applies decoding (as EN-SPK-T04, SCI-SPK-T04).' },
  { ids: F('EN-WR', [1, 2, 3, 4, 5, 8]), stage: 3, reason: 'Starter: spelling a heard word, building a sentence or choosing "am/are" applies a rule (as EN-WR-T02/T03/T04/T05/T12).' },
  { ids: [...F('MA-LIS', [1, 2, 3, 4, 6, 8]), ...F('MA-RD', [1, 2, 3, 4, 5, 8]), ...F('MA-SPK', [3, 5, 7]), ...F('MA-WR', [1, 3, 4, 5, 6, 8])], stage: 3, reason: 'Starter: working out a sum, a difference, the next number or a one-step story applies a procedure (as MA-RD-T02, MA-LIS-T06).' },
  { ids: F('MA-LIS', [7]), stage: 2, reason: 'Starter: saying which of two numbers is more is understanding one comparison.' },
  { ids: F('SCI-RD', [1, 2, 3, 4, 5, 6, 7, 8]), stage: 2, reason: 'Starter: read one fact, then answer from it: understanding a sentence.' },
  { ids: F('SCI-WR', [1, 2, 3, 4, 5]), stage: 3, reason: 'Starter: spelling the word for a picture (as SCI-WR-T01, tagged apply).' },
  // Generated maths stretch items (levels 6-8)
  { ids: [...S('MA-LIS-S06', [1, 2, 3, 4]), ...S('MA-LIS-S07', [1, 2]), ...S('MA-LIS-S08', [1, 2]), ...S('MA-RD-S06', [1]), ...S('MA-RD-S07', [1, 2, 3]), ...S('MA-RD-S08', [1, 2]), ...S('MA-WR-S06', [1, 2, 3, 4]), ...S('MA-WR-S07', [1, 2, 3]), ...S('MA-WR-S08', [1, 2, 3])], stage: 3, reason: 'Stretch: calculating with negatives, percentages, ratio, equations or powers applies a procedure.' },
  { ids: S('MA-RD-S06', [2, 3, 4]), stage: 2, reason: 'Stretch: ordering negative numbers and matching equal fractions, decimals and percentages is understanding.' },
]

module.exports = { patches, LANGS, stripParen, stageOverrides }
