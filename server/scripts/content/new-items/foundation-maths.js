// Level-0 ("starter") maths items for every mode, with translations in all 13 languages.
// Prompts are mostly language-neutral (2 + 3, 🍎🍎🍎); spoken text and hints are translated.
const H = {
  add: { en: 'Start at the first number and count on.', es: 'Empieza en el primer número y cuenta hacia delante.', fr: 'Pars du premier nombre et compte en avançant.', pt: 'Começa no primeiro número e conta para a frente.', it: 'Parti dal primo numero e conta in avanti.', de: 'Fang bei der ersten Zahl an und zähle weiter.', nl: 'Begin bij het eerste getal en tel verder.', ru: 'Начни с первого числа и считай дальше.', tr: 'İlk sayıdan başla ve ileri doğru say.', zh: '从第一个数开始往后数。', ja: 'さいしょのかずから、つづけてかぞえよう。', ko: '첫 번째 수에서 시작해서 이어 세어 보세요.', id: 'Mulai dari angka pertama, lalu hitung maju.', vi: 'Bắt đầu từ số đầu tiên rồi đếm thêm.' },
  sub: { en: 'Start at the first number and count back.', es: 'Empieza en el primer número y cuenta hacia atrás.', fr: 'Pars du premier nombre et compte à rebours.', pt: 'Começa no primeiro número e conta para trás.', it: "Parti dal primo numero e conta all'indietro.", de: 'Fang bei der ersten Zahl an und zähle rückwärts.', nl: 'Begin bij het eerste getal en tel terug.', ru: 'Начни с первого числа и считай назад.', tr: 'İlk sayıdan başla ve geriye doğru say.', zh: '从第一个数开始往回数。', ja: 'さいしょのかずから、ぎゃくにかぞえよう。', ko: '첫 번째 수에서 시작해서 거꾸로 세어 보세요.', id: 'Mulai dari angka pertama, lalu hitung mundur.', vi: 'Bắt đầu từ số đầu tiên rồi đếm lùi.' },
  after: { en: 'Count one more than the number you heard.', es: 'Cuenta uno más que el número que oíste.', fr: 'Compte un de plus que le nombre entendu.', pt: 'Conta um a mais do que o número que ouviste.', it: 'Conta uno in più del numero che hai sentito.', de: 'Zähl eins weiter als die Zahl, die du gehört hast.', nl: 'Tel één verder dan het getal dat je hoorde.', ru: 'Прибавь один к числу, которое услышал.', tr: 'Duyduğun sayıdan bir fazlasını say.', zh: '比听到的数多数一个。', ja: 'きいたかずの、ひとつあとのかずだよ。', ko: '들은 수보다 하나 더 세어 보세요.', id: 'Hitung satu lebih banyak dari angka yang kamu dengar.', vi: 'Đếm thêm một từ số em vừa nghe.' },
  before: { en: 'Count one back from the number you heard.', es: 'Cuenta uno hacia atrás desde el número que oíste.', fr: 'Compte un en arrière depuis le nombre entendu.', pt: 'Conta um para trás a partir do número que ouviste.', it: "Conta uno all'indietro dal numero che hai sentito.", de: 'Zähl eins zurück von der Zahl, die du gehört hast.', nl: 'Tel één terug vanaf het getal dat je hoorde.', ru: 'Отсчитай один назад от числа, которое услышал.', tr: 'Duyduğun sayıdan bir geri say.', zh: '从听到的数往回数一个。', ja: 'きいたかずの、ひとつまえのかずだよ。', ko: '들은 수에서 하나 거꾸로 세어 보세요.', id: 'Hitung mundur satu dari angka yang kamu dengar.', vi: 'Đếm lùi một từ số em vừa nghe.' },
  hear: { en: 'Listen again for the number.', es: 'Escucha otra vez el número.', fr: 'Écoute encore le nombre.', pt: 'Ouve o número outra vez.', it: 'Ascolta di nuovo il numero.', de: 'Hör dir die Zahl noch einmal an.', nl: 'Luister nog een keer naar het getal.', ru: 'Послушай число ещё раз.', tr: 'Sayıyı bir kez daha dinle.', zh: '再听一遍这个数。', ja: 'もういちど、かずをきいてみよう。', ko: '수를 한 번 더 들어 보세요.', id: 'Dengarkan angkanya sekali lagi.', vi: 'Nghe lại con số một lần nữa.' },
  more: { en: 'Which number do you reach later when you count?', es: '¿A qué número llegas más tarde al contar?', fr: 'Quel nombre arrive plus tard quand tu comptes ?', pt: 'A que número chegas mais tarde quando contas?', it: 'Quale numero arriva più tardi quando conti?', de: 'Welche Zahl kommt beim Zählen später?', nl: 'Bij welk getal kom je later als je telt?', ru: 'До какого числа доходишь позже, когда считаешь?', tr: 'Sayarken hangi sayıya daha sonra ulaşırsın?', zh: '数数的时候,哪个数在后面?', ja: 'かぞえるとき、あとにでてくるのはどっち?', ko: '셀 때 나중에 나오는 수는 어느 것일까요?', id: 'Saat berhitung, angka mana yang datang belakangan?', vi: 'Khi đếm, số nào đến sau?' },
  count: { en: 'Touch each picture once as you count.', es: 'Toca cada dibujo una vez mientras cuentas.', fr: 'Touche chaque image une fois en comptant.', pt: 'Toca em cada imagem uma vez enquanto contas.', it: 'Tocca ogni immagine una volta mentre conti.', de: 'Tippe beim Zählen jedes Bild einmal an.', nl: 'Tik elk plaatje één keer aan terwijl je telt.', ru: 'Касайся каждой картинки один раз, когда считаешь.', tr: 'Sayarken her resme bir kez dokun.', zh: '数的时候每个图片只点一次。', ja: 'かぞえながら、えをひとつずつさわろう。', ko: '세면서 그림을 하나씩 한 번만 짚어 보세요.', id: 'Sentuh setiap gambar sekali sambil menghitung.', vi: 'Chạm vào mỗi hình một lần khi đếm.' },
  read: { en: 'Say the number to yourself first.', es: 'Primero di el número para ti.', fr: "Dis d'abord le nombre dans ta tête.", pt: 'Primeiro diz o número para ti.', it: "Prima di' il numero tra te e te.", de: 'Sag dir die Zahl zuerst leise vor.', nl: 'Zeg het getal eerst zachtjes voor jezelf.', ru: 'Сначала скажи число про себя.', tr: 'Önce sayıyı içinden söyle.', zh: '先在心里说一遍这个数。', ja: 'まず、こころのなかでかずをいってみよう。', ko: '먼저 마음속으로 수를 말해 보세요.', id: 'Ucapkan angkanya dalam hati dulu.', vi: 'Hãy đọc thầm con số trước.' },
  pattern: { en: 'Look at how the numbers change each time.', es: 'Fíjate en cómo cambian los números cada vez.', fr: 'Regarde comment les nombres changent à chaque fois.', pt: 'Vê como os números mudam de cada vez.', it: 'Guarda come cambiano i numeri ogni volta.', de: 'Schau, wie sich die Zahlen jedes Mal ändern.', nl: 'Kijk hoe de getallen elke keer veranderen.', ru: 'Посмотри, как каждый раз меняются числа.', tr: 'Sayıların her seferinde nasıl değiştiğine bak.', zh: '看看数字每次怎么变化。', ja: 'かずがどうかわっていくか見てみよう。', ko: '수가 매번 어떻게 바뀌는지 보세요.', id: 'Lihat bagaimana angkanya berubah setiap kali.', vi: 'Xem các số thay đổi thế nào mỗi lần.' },
}
// Spoken number words 0-10 (sample answers / expected keywords for the speaking items).
const NUM = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
  fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
  pt: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'],
  it: ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'],
  de: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
  nl: ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'],
  ru: ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'],
  tr: ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on'],
  zh: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  ja: ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'],
  ko: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'],
  id: ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'],
  vi: ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'],
}
const LANGS = Object.keys(NUM)
const perLang = (fn) => Object.fromEntries(LANGS.map((l) => [l, fn(l)]))
const numWord = (n) => perLang((l) => NUM[l][n])

const A = {
  fourMinusOne: { en: 'What is four minus one?', es: '¿Cuánto es cuatro menos uno?', fr: 'Combien font quatre moins un ?', pt: 'Quanto é quatro menos um?', it: 'Quanto fa quattro meno uno?', de: 'Wie viel ist vier minus eins?', nl: 'Hoeveel is vier min één?', ru: 'Сколько будет четыре минус один?', tr: 'Dört eksi bir kaç eder?', zh: '四减一等于几?', ja: '4ひく1はいくつ?', ko: '4 빼기 1은 얼마예요?', id: 'Empat dikurangi satu sama dengan berapa?', vi: 'Bốn trừ một bằng mấy?' },
  afterSix: { en: 'What number comes after six?', es: '¿Qué número va después del seis?', fr: 'Quel nombre vient après six ?', pt: 'Que número vem depois do seis?', it: 'Quale numero viene dopo il sei?', de: 'Welche Zahl kommt nach sechs?', nl: 'Welk getal komt na zes?', ru: 'Какое число идёт после шести?', tr: 'Altıdan sonra hangi sayı gelir?', zh: '六后面是几?', ja: '6のつぎのかずはなに?', ko: '6 다음에 오는 수는 무엇일까요?', id: 'Angka berapa yang datang setelah enam?', vi: 'Số nào đứng sau số sáu?' },
  twoPlusThree: { en: 'What is two plus three?', es: '¿Cuánto es dos más tres?', fr: 'Combien font deux plus trois ?', pt: 'Quanto é dois mais três?', it: 'Quanto fa due più tre?', de: 'Wie viel ist zwei plus drei?', nl: 'Hoeveel is twee plus drie?', ru: 'Сколько будет два плюс три?', tr: 'İki artı üç kaç eder?', zh: '二加三等于几?', ja: '2たす3はいくつ?', ko: '2 더하기 3은 얼마예요?', id: 'Dua ditambah tiga sama dengan berapa?', vi: 'Hai cộng ba bằng mấy?' },
  samApples: { en: 'Sam has two apples and gets one more. How many apples does Sam have now?', es: 'Sam tiene dos manzanas y le dan una más. ¿Cuántas manzanas tiene Sam ahora?', fr: 'Sam a deux pommes et en reçoit une de plus. Combien de pommes Sam a-t-il maintenant ?', pt: 'O Sam tem duas maçãs e ganha mais uma. Quantas maçãs o Sam tem agora?', it: "Sam ha due mele e ne riceve un'altra. Quante mele ha Sam adesso?", de: 'Sam hat zwei Äpfel und bekommt noch einen dazu. Wie viele Äpfel hat Sam jetzt?', nl: 'Sam heeft twee appels en krijgt er nog één bij. Hoeveel appels heeft Sam nu?', ru: 'У Сэма два яблока, и ему дают ещё одно. Сколько яблок теперь у Сэма?', tr: "Sam'in iki elması var ve bir tane daha alıyor. Sam'in şimdi kaç elması var?", zh: '萨姆有两个苹果,又得到一个。萨姆现在有几个苹果?', ja: 'サムはりんごを2こ持っていて、もう1こもらいます。サムはいま、りんごをいくつ持っていますか?', ko: '샘은 사과 2개를 가지고 있고 1개를 더 받아요. 샘은 이제 사과가 몇 개 있을까요?', id: 'Sam punya dua apel dan mendapat satu lagi. Berapa apel yang Sam punya sekarang?', vi: 'Sam có hai quả táo và được thêm một quả. Bây giờ Sam có bao nhiêu quả táo?' },
  five: { en: 'five', es: 'cinco', fr: 'cinq', pt: 'cinco', it: 'cinque', de: 'fünf', nl: 'vijf', ru: 'пять', tr: 'beş', zh: '五', ja: 'ご', ko: '오', id: 'lima', vi: 'năm' },
  beforeTen: { en: 'What number comes before ten?', es: '¿Qué número va antes del diez?', fr: 'Quel nombre vient avant dix ?', pt: 'Que número vem antes do dez?', it: 'Quale numero viene prima del dieci?', de: 'Welche Zahl kommt vor zehn?', nl: 'Welk getal komt voor tien?', ru: 'Какое число идёт перед десятью?', tr: 'Ondan önce hangi sayı gelir?', zh: '十前面是几?', ja: '10のまえのかずはなに?', ko: '10 앞에 오는 수는 무엇일까요?', id: 'Angka berapa yang datang sebelum sepuluh?', vi: 'Số nào đứng trước số mười?' },
  threeOrSeven: { en: 'Which is more: three or seven?', es: '¿Qué es más: tres o siete?', fr: 'Lequel est le plus grand : trois ou sept ?', pt: 'O que é mais: três ou sete?', it: 'Qual è di più: tre o sette?', de: 'Was ist mehr: drei oder sieben?', nl: 'Wat is meer: drie of zeven?', ru: 'Что больше: три или семь?', tr: 'Hangisi daha çok: üç mü, yedi mi?', zh: '三和七,哪个更多?', ja: '3と7、どちらがおおきい?', ko: '3과 7 중에서 어느 것이 더 클까요?', id: 'Mana yang lebih banyak: tiga atau tujuh?', vi: 'Số nào lớn hơn: ba hay bảy?' },
  onePlusOne: { en: 'What is one plus one?', es: '¿Cuánto es uno más uno?', fr: 'Combien font un plus un ?', pt: 'Quanto é um mais um?', it: 'Quanto fa uno più uno?', de: 'Wie viel ist eins plus eins?', nl: 'Hoeveel is één plus één?', ru: 'Сколько будет один плюс один?', tr: 'Bir artı bir kaç eder?', zh: '一加一等于几?', ja: '1たす1はいくつ?', ko: '1 더하기 1은 얼마예요?', id: 'Satu ditambah satu sama dengan berapa?', vi: 'Một cộng một bằng mấy?' },
}

const ok = (s) => `${s} ✔️`
const id = (p, n) => `${p}-F00-Q${String(n).padStart(2, '0')}`
const choice = (prefix, n, o) => ({ id: id(prefix, n), interaction: 'tap_mcq', question_type: 'foundation_maths', ...o })

const listen = (n, audio, options, correct, hint, skill, extra = {}) => choice('MA-LIS', n, {
  question_type: 'foundation_listen_maths', instruction: 'Listen. Tap the answer.', audio_text: audio, prompt: '', options, correct_answer: correct,
  hint, feedback_correct: ok(correct), emoji: '👂', skill, construct: 'a first spoken maths fact', ...extra,
})
const read = (n, prompt, options, correct, hint, skill, extra = {}) => choice('MA-RD', n, {
  question_type: 'foundation_read_maths', instruction: 'Read the equation. Tap the answer.', prompt, options, correct_answer: correct,
  hint, feedback_correct: ok(`${String(prompt).replace(/\?\s*$/, '').replace(/= ?$/, '').trim()} = ${correct}`), emoji: '🔢', skill, construct: 'a first written maths fact', ...extra,
})
const write = (n, prompt, answer, hint, skill, instruction = 'Work it out. Type the answer.', extra = {}) => ({
  id: id('MA-WR', n), interaction: 'typed_short', question_type: 'foundation_write_maths', instruction, prompt, correct_answer: String(answer), accepted_answers: [String(answer)],
  hint, feedback_correct: ok(/[+−-]/.test(prompt) ? `${prompt} = ${answer}` : String(answer)), emoji: '🔢', skill, construct: 'producing a first maths answer', validation: { method: 'number', number_words: true }, ...extra,
})
const speak = (n, prompt, answer, hint, skill, instruction, extra = {}) => ({
  id: id('MA-SPK', n), interaction: 'mic_record', question_type: 'foundation_speak_maths', instruction, prompt, correct_answer: numWord(answer), accepted_answers: perLang((l) => [NUM[l][answer], String(answer)]),
  keywords: perLang((l) => [NUM[l][answer], String(answer)]), sample: numWord(answer), hint, feedback_correct: ok(String(answer)), emoji: '🗣️', skill,
  construct: 'saying a first maths answer aloud', validation: { method: 'speech_keywords', numbers: [answer], number_final: true }, ...extra,
})

module.exports = {
  'math_listen.json': [
    listen(1, A.fourMinusOne, ['3', '5', '2'], '3', H.sub, 'maths.subtraction-within-10', { distractor_insight: { 5: 'added instead of taking away', 2: 'took away one too many' } }),
    listen(2, A.afterSix, ['7', '5', '8'], '7', H.after, 'maths.one-more-one-less', { distractor_insight: { 5: 'gave the number before, not after' } }),
    listen(3, A.twoPlusThree, ['5', '4', '6'], '5', H.add, 'maths.addition-within-10'),
    listen(4, A.samApples, ['3', '2', '1'], '3', H.add, 'maths.word-problems', { construct: 'a one-step spoken story', distractor_insight: { 2: 'gave the starting number, not the new total', 1: 'gave the number added' } }),
    listen(5, A.five, ['5', '3', '8'], '5', H.hear, 'maths.number-recognition', { instruction: 'Listen. Tap the number you hear.' }),
    listen(6, A.beforeTen, ['9', '11', '8'], '9', H.before, 'maths.one-more-one-less', { distractor_insight: { 11: 'gave the number after, not before' } }),
    listen(7, A.threeOrSeven, ['7', '3'], '7', H.more, 'maths.compare-numbers'),
    listen(8, A.onePlusOne, ['2', '1', '3'], '2', H.add, 'maths.addition-within-10'),
  ],
  'math_read.json': [
    read(1, '2 + 2 = ?', ['4', '3', '5'], '4', H.add, 'maths.addition-within-10'),
    read(2, '5 − 1 = ?', ['4', '6', '3'], '4', H.sub, 'maths.subtraction-within-10', { distractor_insight: { 6: 'added instead of taking away' } }),
    read(3, '3 + 3 = ?', ['6', '5', '9'], '6', H.add, 'maths.addition-within-10'),
    read(4, '6 + 0 = ?', ['6', '0', '7'], '6', H.add, 'maths.addition-within-10', { distractor_insight: { 0: 'thought adding zero makes zero' } }),
    read(5, '1 + 2 = ?', ['3', '2', '4'], '3', H.add, 'maths.addition-within-10'),
    { ...read(6, '🍎🍎🍎🍎', ['4', '3', '5'], '4', H.count, 'maths.counting', { instruction: 'Count the pictures. Tap the number.', construct: 'counting a small group' }), feedback_correct: ok('4') },
    { ...read(7, '1, 2, 3, ?', ['4', '5', '2'], '4', H.pattern, 'maths.patterns', { instruction: 'Look at the pattern. Tap what comes next.', construct: 'continuing a counting pattern' }), feedback_correct: ok('1, 2, 3, 4') },
    { ...read(8, '8 − 2 = ?', ['6', '10', '5'], '6', H.sub, 'maths.subtraction-within-10', { distractor_insight: { 10: 'added instead of taking away' } }) },
  ],
  'math_write.json': [
    write(1, '2 + 2', 4, H.add, 'maths.addition-within-10'),
    write(2, '🍎🍎', 2, H.count, 'maths.counting', 'Count the pictures. Type the number.'),
    write(3, '4 − 1', 3, H.sub, 'maths.subtraction-within-10'),
    write(4, '5 + 5', 10, H.add, 'maths.addition-within-10'),
    write(5, '1 + 2', 3, H.add, 'maths.addition-within-10'),
    write(6, '6 − 2', 4, H.sub, 'maths.subtraction-within-10'),
    write(7, '⭐⭐⭐⭐⭐⭐', 6, H.count, 'maths.counting', 'Count the pictures. Type the number.'),
    write(8, '3 + 4', 7, H.add, 'maths.addition-within-10'),
  ],
  'math_speak.json': [
    speak(1, '4', 4, H.read, 'maths.number-recognition', 'Look at the number. Say it out loud.', { validation: { method: 'speech_keywords', numbers: [4] } }),
    speak(2, '🍎🍎🍎', 3, H.count, 'maths.counting', 'Count the pictures out loud.'),
    speak(3, '1 + 1', 2, H.add, 'maths.addition-within-10', 'Work it out. Say the answer.'),
    speak(4, '2', 2, H.read, 'maths.number-recognition', 'Look at the number. Say it out loud.', { validation: { method: 'speech_keywords', numbers: [2] } }),
    speak(5, '3 + 2', 5, H.add, 'maths.addition-within-10', 'Work it out. Say the answer.'),
    speak(6, '⭐⭐', 2, H.count, 'maths.counting', 'Count the pictures out loud.'),
    speak(7, '5 − 1', 4, H.sub, 'maths.subtraction-within-10', 'Work it out. Say the answer.'),
    speak(8, '10', 10, H.read, 'maths.number-recognition', 'Look at the number. Say it out loud.', { validation: { method: 'speech_keywords', numbers: [10] } }),
  ],
}
module.exports.NUM = NUM
module.exports.H = H
