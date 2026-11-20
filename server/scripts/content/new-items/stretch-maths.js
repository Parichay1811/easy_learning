// Maths stretch set, levels 6-8 (age_band "all"): negative numbers, fractions/decimals/percentages,
// ratio, simple linear equations, powers and roots. Every answer comes from `compute`, and
// test/content-stretch.test.js checks each key against it. Prompts are written in maths notation
// (language-neutral) wherever possible; spoken text is translated into all 13 languages.
const A = {
  minusThreePlusFive: { en: 'What is minus three plus five?', es: '¿Cuánto es menos tres más cinco?', fr: 'Combien font moins trois plus cinq ?', pt: 'Quanto é menos três mais cinco?', it: 'Quanto fa meno tre più cinque?', de: 'Wie viel ist minus drei plus fünf?', nl: 'Hoeveel is min drie plus vijf?', ru: 'Сколько будет минус три плюс пять?', tr: 'Eksi üç artı beş kaç eder?', zh: '负三加五等于几?', ja: 'マイナス3たす5はいくつ?', ko: '마이너스 3 더하기 5는 얼마예요?', id: 'Berapa hasil negatif tiga ditambah lima?', vi: 'Âm ba cộng năm bằng mấy?' },
  colder: { en: 'It is two degrees. It gets five degrees colder. What is the temperature now?', es: 'Hace dos grados. La temperatura baja cinco grados. ¿Qué temperatura hace ahora?', fr: 'Il fait deux degrés. La température baisse de cinq degrés. Quelle est la température maintenant ?', pt: 'Estão dois graus. A temperatura desce cinco graus. Qual é a temperatura agora?', it: 'Ci sono due gradi. La temperatura scende di cinque gradi. Quanti gradi ci sono adesso?', de: 'Es sind zwei Grad. Es wird fünf Grad kälter. Wie warm ist es jetzt?', nl: 'Het is twee graden. Het wordt vijf graden kouder. Hoe warm is het nu?', ru: 'Сейчас два градуса. Становится на пять градусов холоднее. Какая теперь температура?', tr: 'Hava iki derece. Beş derece daha soğuyor. Şimdi sıcaklık kaç derece?', zh: '现在是二度。气温又下降了五度。现在是多少度?', ja: 'いまの気温は2度です。5度下がりました。いまは何度?', ko: '지금 기온은 2도예요. 5도 더 추워졌어요. 지금 기온은 몇 도일까요?', id: 'Suhunya dua derajat. Lalu turun lima derajat. Berapa suhunya sekarang?', vi: 'Trời đang hai độ. Nhiệt độ giảm thêm năm độ. Bây giờ là bao nhiêu độ?' },
  halfOfThirty: { en: 'What is half of thirty?', es: '¿Cuánto es la mitad de treinta?', fr: 'Combien fait la moitié de trente ?', pt: 'Quanto é metade de trinta?', it: 'Quanto fa la metà di trenta?', de: 'Wie viel ist die Hälfte von dreißig?', nl: 'Hoeveel is de helft van dertig?', ru: 'Сколько будет половина от тридцати?', tr: 'Otuzun yarısı kaçtır?', zh: '三十的一半是多少?', ja: '30の半分はいくつ?', ko: '30의 절반은 얼마예요?', id: 'Berapa setengah dari tiga puluh?', vi: 'Một nửa của ba mươi là bao nhiêu?' },
  tenPercent: { en: 'What is ten percent of fifty?', es: '¿Cuánto es el diez por ciento de cincuenta?', fr: 'Combien font dix pour cent de cinquante ?', pt: 'Quanto é dez por cento de cinquenta?', it: 'Quanto fa il dieci per cento di cinquanta?', de: 'Wie viel sind zehn Prozent von fünfzig?', nl: 'Hoeveel is tien procent van vijftig?', ru: 'Сколько будет десять процентов от пятидесяти?', tr: 'Ellinin yüzde onu kaçtır?', zh: '五十的百分之十是多少?', ja: '50の10パーセントはいくつ?', ko: '50의 10퍼센트는 얼마예요?', id: 'Berapa sepuluh persen dari lima puluh?', vi: 'Mười phần trăm của năm mươi là bao nhiêu?' },
  plusSeven: { en: 'A number plus seven makes twelve. What is the number?', es: 'Un número más siete es doce. ¿Cuál es el número?', fr: 'Un nombre plus sept fait douze. Quel est ce nombre ?', pt: 'Um número mais sete dá doze. Qual é o número?', it: 'Un numero più sette fa dodici. Qual è il numero?', de: 'Eine Zahl plus sieben ergibt zwölf. Wie heißt die Zahl?', nl: 'Een getal plus zeven is twaalf. Welk getal is het?', ru: 'Какое-то число плюс семь равно двенадцати. Что это за число?', tr: 'Bir sayının yedi fazlası on ikidir. Bu sayı kaçtır?', zh: '一个数加七等于十二。这个数是多少?', ja: 'ある数に7をたすと12になります。その数はいくつ?', ko: '어떤 수에 7을 더하면 12가 돼요. 그 수는 얼마일까요?', id: 'Sebuah bilangan ditambah tujuh hasilnya dua belas. Berapa bilangan itu?', vi: 'Một số cộng bảy bằng mười hai. Số đó là bao nhiêu?' },
  ratioSweets: { en: 'Share twelve sweets in the ratio two to one. How many sweets are in the bigger share?', es: 'Reparte doce caramelos en la razón dos a uno. ¿Cuántos caramelos hay en la parte mayor?', fr: 'Partage douze bonbons dans le rapport deux pour un. Combien de bonbons y a-t-il dans la plus grande part ?', pt: 'Divide doze doces na razão dois para um. Quantos doces há na parte maior?', it: 'Dividi dodici caramelle nel rapporto due a uno. Quante caramelle ci sono nella parte più grande?', de: 'Teile zwölf Bonbons im Verhältnis zwei zu eins. Wie viele Bonbons sind im größeren Teil?', nl: 'Verdeel twaalf snoepjes in de verhouding twee staat tot één. Hoeveel snoepjes zitten er in het grootste deel?', ru: 'Раздели двенадцать конфет в отношении два к одному. Сколько конфет в большей части?', tr: 'On iki şekeri ikiye bir oranında paylaştır. Büyük payda kaç şeker var?', zh: '把十二颗糖按二比一分。多的那份有几颗?', ja: '12このあめを2対1に分けます。多いほうは何こ?', ko: '사탕 12개를 2 대 1로 나눠요. 더 많은 쪽에는 사탕이 몇 개 있을까요?', id: 'Bagilah dua belas permen dengan perbandingan dua banding satu. Berapa permen di bagian yang lebih besar?', vi: 'Chia mười hai cái kẹo theo tỉ lệ hai trên một. Phần lớn hơn có bao nhiêu cái kẹo?' },
  fourSquared: { en: 'What is four squared?', es: '¿Cuánto es cuatro al cuadrado?', fr: 'Combien fait quatre au carré ?', pt: 'Quanto é quatro ao quadrado?', it: 'Quanto fa quattro al quadrato?', de: 'Wie viel ist vier hoch zwei?', nl: 'Hoeveel is vier in het kwadraat?', ru: 'Сколько будет четыре в квадрате?', tr: 'Dördün karesi kaçtır?', zh: '四的平方是多少?', ja: '4の2乗はいくつ?', ko: '4의 제곱은 얼마예요?', id: 'Berapa empat kuadrat?', vi: 'Bốn bình phương bằng bao nhiêu?' },
  rootSixtyFour: { en: 'What is the square root of sixty-four?', es: '¿Cuál es la raíz cuadrada de sesenta y cuatro?', fr: 'Quelle est la racine carrée de soixante-quatre ?', pt: 'Qual é a raiz quadrada de sessenta e quatro?', it: 'Qual è la radice quadrata di sessantaquattro?', de: 'Was ist die Quadratwurzel aus vierundsechzig?', nl: 'Wat is de wortel van vierenzestig?', ru: 'Чему равен квадратный корень из шестидесяти четырёх?', tr: 'Altmış dördün karekökü kaçtır?', zh: '根号六十四等于多少?', ja: 'ルート64はいくつ?', ko: '루트 64는 얼마예요?', id: 'Berapa akar kuadrat dari enam puluh empat?', vi: 'Căn bậc hai của sáu mươi tư bằng bao nhiêu?' },
}
const PCT_OF_80 = { en: '25% of 80', es: '25 % de 80', fr: '25 % de 80', pt: '25% de 80', it: '25% di 80', de: '25 % von 80', nl: '25% van 80', ru: '25 % от 80', tr: "80'in %25'i", zh: '80的25%', ja: '80の25%', ko: '80의 25%', id: '25% dari 80', vi: '25% của 80' }

const S = (n) => String(n)
const ok = (s) => `${s} ✔️`
const id = (p, level, n) => `${p}-S0${level}-Q${String(n).padStart(2, '0')}`
const QT = { 'maths.negative-numbers': 'stretch_negative_numbers', 'maths.fractions-decimals-percentages': 'stretch_fdp', 'maths.ratio': 'stretch_ratio', 'maths.linear-equations': 'stretch_equations', 'maths.powers': 'stretch_powers' }

// level, skill, answer from compute(); options: first is the answer.
const listen = (level, n, audio, compute, wrong, hint, skill) => ({
  id: id('MA-LIS', level, n), level, interaction: 'tap_mcq', question_type: QT[skill], instruction: 'Listen. Tap the answer.', audio_text: audio, prompt: '',
  options: [S(compute()), ...wrong.map(S)], correct_answer: S(compute()), hint, feedback_correct: ok(hint), emoji: '👂', skill, compute, construct: 'a spoken stretch problem',
})
const read = (level, n, prompt, compute, wrong, hint, skill, instruction = 'Read the equation. Tap the answer.') => ({
  id: id('MA-RD', level, n), level, interaction: 'tap_mcq', question_type: QT[skill], instruction, prompt,
  options: [S(compute()), ...wrong.map(S)], correct_answer: S(compute()), hint, feedback_correct: ok(hint), emoji: '🔢', skill, compute, construct: 'a written stretch problem',
})
const write = (level, n, prompt, compute, hint, skill, instruction = 'Work it out. Type the answer.', extra = {}) => ({
  id: id('MA-WR', level, n), level, interaction: 'typed_short', question_type: QT[skill], instruction, prompt, correct_answer: S(compute()), accepted_answers: [S(compute())],
  hint, feedback_correct: ok(hint), emoji: '🔢', skill, compute, construct: 'producing a stretch answer', validation: { method: 'number', number_words: true }, ...extra,
})

module.exports = {
  'math_listen.json': [
    listen(6, 1, A.minusThreePlusFive, () => -3 + 5, [-8, 8], '−3 + 5 = 2', 'maths.negative-numbers'),
    listen(6, 2, A.colder, () => 2 - 5, [3, 7], '2 − 5 = −3', 'maths.negative-numbers'),
    listen(6, 3, A.halfOfThirty, () => 30 / 2, [60, 3], '30 ÷ 2 = 15', 'maths.fractions-decimals-percentages'),
    listen(6, 4, A.tenPercent, () => (50 * 10) / 100, [10, 40], '10% × 50 = 50 ÷ 10 = 5', 'maths.fractions-decimals-percentages'),
    listen(7, 1, A.plusSeven, () => 12 - 7, [19, 7], '? + 7 = 12 → 12 − 7 = 5', 'maths.linear-equations'),
    listen(7, 2, A.ratioSweets, () => (12 / 3) * 2, [6, 4], '12 ÷ (2 + 1) = 4, 4 × 2 = 8', 'maths.ratio'),
    listen(8, 1, A.fourSquared, () => 4 ** 2, [8, 6], '4² = 4 × 4 = 16', 'maths.powers'),
    listen(8, 2, A.rootSixtyFour, () => Math.sqrt(64), [32, 6], '8 × 8 = 64', 'maths.powers'),
  ],
  'math_read.json': [
    read(6, 1, '−4 + 9 = ?', () => -4 + 9, [-13, 13], '−4 + 9 = 5', 'maths.negative-numbers'),
    { ...read(6, 2, '−7 ? −2', () => '<', ['>', '='], '−7 < −2', 'maths.negative-numbers', 'Which symbol makes it true?'), options: ['<', '>', '='] },
    { ...read(6, 3, '0.25 = ?', () => '1/4', ['1/2', '2/5'], '0.25 = 25/100 = 1/4', 'maths.fractions-decimals-percentages') },
    { ...read(6, 4, '3/4 = ?', () => '75%', ['34%', '43%'], '3/4 = 75/100 = 75%', 'maths.fractions-decimals-percentages') },
    read(7, 1, 'x + 7 = 12   x = ?', () => 12 - 7, [19, 12], 'x = 12 − 7 = 5', 'maths.linear-equations', 'Find the missing number.'),
    read(7, 2, '3x = 21   x = ?', () => 21 / 3, [18, 63], 'x = 21 ÷ 3 = 7', 'maths.linear-equations', 'Find the missing number.'),
    read(7, 3, '3 : 1 = 15 : ?', () => 15 / 3, [13, 45], '15 = 3 × 5, so 1 × 5 = 5', 'maths.ratio', 'Find the missing number.'),
    read(8, 1, '5² = ?', () => 5 ** 2, [10, 7], '5² = 5 × 5 = 25', 'maths.powers'),
    read(8, 2, '√49 = ?', () => Math.sqrt(49), ['24.5', 9], '7 × 7 = 49', 'maths.powers'),
  ],
  'math_write.json': [
    write(6, 1, '4 − 9', () => 4 - 9, '4 − 9 = −5', 'maths.negative-numbers'),
    write(6, 2, '−6 + 10', () => -6 + 10, '−6 + 10 = 4', 'maths.negative-numbers'),
    write(6, 3, PCT_OF_80, () => (80 * 25) / 100, '25% = 1/4, 80 ÷ 4 = 20', 'maths.fractions-decimals-percentages'),
    write(6, 4, '0.5 + 0.25', () => 0.5 + 0.25, '0.5 + 0.25 = 0.75', 'maths.fractions-decimals-percentages', 'Work it out. Type the answer.', { validation: { method: 'number', number_words: true, equivalent_forms: true } }),
    write(7, 1, '2x + 3 = 11   x = ___', () => (11 - 3) / 2, '2x = 11 − 3 = 8, x = 8 ÷ 2 = 4', 'maths.linear-equations', 'Type the missing number.'),
    write(7, 2, '5x − 4 = 21   x = ___', () => (21 + 4) / 5, '5x = 21 + 4 = 25, x = 25 ÷ 5 = 5', 'maths.linear-equations', 'Type the missing number.'),
    write(7, 3, '4 : 3 = 12 : ___', () => (12 / 4) * 3, '12 = 4 × 3, so 3 × 3 = 9', 'maths.ratio', 'Type the missing number.'),
    write(8, 1, '2³', () => 2 ** 3, '2³ = 2 × 2 × 2 = 8', 'maths.powers'),
    write(8, 2, '√81', () => Math.sqrt(81), '9 × 9 = 81', 'maths.powers'),
    write(8, 3, '3² + 4²', () => 3 ** 2 + 4 ** 2, '9 + 16 = 25', 'maths.powers'),
  ],
}
