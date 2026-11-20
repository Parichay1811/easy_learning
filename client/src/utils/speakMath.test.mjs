// node --test client/src/utils/speakMath.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { speakMath, numberToWords, ordinalWords, splitSentences, SPEAK_MATH_LANGS } from "./speakMath.js";

const en = (input, want) => assert.equal(speakMath(input, "en"), want, `en: ${JSON.stringify(input)}`);

test("number words", () => {
  assert.equal(numberToWords(0), "zero");
  assert.equal(numberToWords(7), "seven");
  assert.equal(numberToWords(13), "thirteen");
  assert.equal(numberToWords(42), "forty-two");
  assert.equal(numberToWords(100), "one hundred");
  assert.equal(numberToWords(105), "one hundred and five");
  assert.equal(numberToWords(999), "nine hundred and ninety-nine");
  assert.equal(numberToWords(1000), "one thousand");
  assert.equal(numberToWords(1005), "one thousand and five");
  assert.equal(numberToWords(2024), "two thousand and twenty-four");
  assert.equal(numberToWords(12345), "twelve thousand three hundred and forty-five");
  assert.equal(numberToWords(1000000), "one million");
  assert.equal(numberToWords(-4), "negative four");
  assert.equal(ordinalWords(1), "first");
  assert.equal(ordinalWords(2), "second");
  assert.equal(ordinalWords(3), "third");
  assert.equal(ordinalWords(12), "twelfth");
  assert.equal(ordinalWords(20), "twentieth");
  assert.equal(ordinalWords(21), "twenty-first");
});

test("English operators and equals", () => {
  en("3 + 5", "three plus five");
  en("7 − 2 = ?", "seven minus two equals what?");
  en("7 - 2 = ?", "seven minus two equals what?");
  en("9-4=5", "nine minus four equals five");
  en("6 × 7", "six times seven");
  en("6 x 7 = 42", "six times seven equals forty-two");
  en("3*4", "three times four");
  en("12 ÷ 3 = 4", "twelve divided by three equals four");
  en("8 / 2", "eight divided by two");
  en("What is 6 × 7?", "What is six times seven?");
  en("3 + _ = 5", "three plus what equals five");
  en("_ + 4 = 9", "what plus four equals nine");
  en("10 − ? = 6", "ten minus what equals six");
  en("4 + 4 = __", "four plus four equals what?");
  en("5 □ 3 = 8", "five blank three equals eight");
});

test("English comparisons", () => {
  en("5 > 3", "five is greater than three");
  en("2 < 9", "two is less than nine");
  en("4 ≤ 4", "four is less than or equal to four");
  en("7 ≥ 1", "seven is greater than or equal to one");
  en("3 ≠ 4", "three does not equal four");
  en("9.8 ≈ 10", "nine point eight is about ten");
});

test("English fractions and mixed numbers", () => {
  en("1/2", "one half");
  en("3/4", "three quarters");
  en("1/4", "one quarter");
  en("2/3", "two thirds");
  en("1/3 of 12", "one third of twelve");
  en("5/8", "five eighths");
  en("7/10", "seven tenths");
  en("3/17", "three over seventeen");
  en("½", "one half");
  en("2½", "two and a half");
  en("1 1/4", "one and a quarter");
  en("2 3/4", "two and three quarters");
  en("¾ + ¼ = 1", "three quarters plus one quarter equals one");
  assert.ok(!/quarter|half|fifth/.test(speakMath("12/05/2024", "en")), "a date is not a fraction");
});

test("English decimals, percentages, negatives", () => {
  en("2.5", "two point five");
  en("0.75", "zero point seven five");
  en("3.05 + 1", "three point zero five plus one");
  en("50%", "fifty percent");
  en("12.5 %", "twelve point five percent");
  en("-3", "negative three");
  en("−4 + 6 = 2", "negative four plus six equals two");
  en("5 + −2", "five plus negative two");
  en("x = -4", "x equals negative four");
  en("10 −2", "ten minus two");
  en("twenty-five", "twenty-five");
});

test("English times, money, units, powers, ordinals", () => {
  en("3:30", "three thirty");
  en("3:05", "three oh five");
  en("4:00", "four o'clock");
  en("10:45", "ten forty-five");
  en("3:30 pm", "three thirty p m");
  en("(clock showing 4:30)", "(clock showing four thirty)");
  en("£2.50", "two pounds fifty");
  en("£1", "one pound");
  en("£0.50", "fifty pence");
  en("50p", "fifty pence");
  en("$3.25", "three dollars twenty-five");
  en("€4.10", "four euros ten");
  en("£1,250", "one thousand two hundred and fifty pounds");
  en("5 cm", "five centimetres");
  en("1 kg", "one kilogram");
  en("2.5m", "two point five metres");
  en("30°C", "thirty degrees Celsius");
  en("90°", "ninety degrees");
  en("5²", "five squared");
  en("2³", "two cubed");
  en("the 3rd day", "the third day");
  en("1st and 2nd", "first and second");
  en("1,000 + 2,000", "one thousand plus two thousand");
});

test("English sentences stay natural", () => {
  en("Listen. Tap the number.", "Listen. Tap the number.");
  en("Counting backward: 30, 25, 20, what comes next?", "Counting backward: thirty, twenty-five, twenty, what comes next?");
  en("I ___ happy.", "I blank happy.");
  en("Tap the two groups with the same amount: 🐶🐶🐶🐶  🐶🐶", "Tap the two groups with the same amount:");
  en("Sam has 2 apples 🍎 and gets 1 more. How many now?", "Sam has two apples and gets one more. How many now?");
  en("Which is bigger?", "Which is bigger?");
  en("What's in the box?", "What's in the box?");
  en("Tap it – quickly", "Tap it – quickly");
  en("|0---2---4---6|", "zero two four six");
  en("Build a true equation using: 3, 4, 7, +, =", "Build a true equation using: three, four, seven, plus, equals");
  en("", "");
  en("   ", "");
  assert.equal(speakMath(null), "");
});

test("other languages: operators, equals and 'what'", () => {
  const cases = {
    es: "7 menos 2 es igual a cuánto?",
    fr: "7 moins 2 égale combien?",
    pt: "7 menos 2 é igual a quanto?",
    it: "7 meno 2 uguale quanto?",
    de: "7 minus 2 ist gleich wie viel?",
    nl: "7 min 2 is hoeveel?",
    ru: "7 минус 2 равно сколько?",
    tr: "7 eksi 2 eşittir kaç?",
    ja: "7 ひく 2 は いくつ?",
    ko: "7 빼기 2 는 얼마?",
    id: "7 kurang 2 sama dengan berapa?",
    vi: "7 trừ 2 bằng mấy?",
    zh: "7 减 2 等于 多少?",
  };
  for (const [lang, want] of Object.entries(cases)) assert.equal(speakMath("7 − 2 = ?", lang), want, lang);
  assert.equal(speakMath("3 + 5", "de"), "3 plus 5");
  assert.equal(speakMath("3 + 5", "es"), "3 más 5");
  assert.equal(speakMath("6 × 7", "fr"), "6 fois 7");
  assert.equal(speakMath("12 ÷ 3", "it"), "12 diviso 3");
  assert.equal(speakMath("4 × 2 = 8", "ja"), "4 かける 2 は 8");
  assert.equal(speakMath("9 ÷ 3", "zh"), "9 除以 3");
  assert.equal(speakMath("2 + 2 = 4", "ko"), "2 더하기 2 는 4");
});

test("other languages: fractions", () => {
  assert.equal(speakMath("1/2", "es"), "un medio");
  assert.equal(speakMath("3/4", "es"), "3 cuartos");
  assert.equal(speakMath("1/3", "fr"), "un tiers");
  assert.equal(speakMath("3/4", "fr"), "3 quarts");
  assert.equal(speakMath("1/4", "pt"), "um quarto");
  assert.equal(speakMath("2/3", "it"), "2 terzi");
  assert.equal(speakMath("3/4", "de"), "3 Viertel");
  assert.equal(speakMath("1/2", "de"), "ein halb");
  assert.equal(speakMath("1/4", "nl"), "een kwart");
  assert.equal(speakMath("1/2", "ru"), "одна вторая");
  assert.equal(speakMath("2/3", "ru"), "две третьих");
  assert.equal(speakMath("3/4", "tr"), "dörtte 3");
  assert.equal(speakMath("3/4", "ja"), "4分の3");
  assert.equal(speakMath("3/4", "ko"), "4분의 3");
  assert.equal(speakMath("3/4", "zh"), "4分之3");
  assert.equal(speakMath("1/2", "id"), "setengah");
  assert.equal(speakMath("3/4", "id"), "3 perempat");
  assert.equal(speakMath("3/4", "vi"), "3 phần 4");
  assert.equal(speakMath("5/17", "es"), "5 entre 17");
  assert.equal(speakMath("2 1/2", "es"), "2 y medio");
  assert.equal(speakMath("2 1/2", "fr"), "2 et demi");
  assert.equal(speakMath("½", "de"), "ein halb");
});

test("other languages: decimals, percentages, money, negatives, comparisons", () => {
  assert.equal(speakMath("2.5", "de"), "2,5");
  assert.equal(speakMath("2.5", "fr"), "2,5");
  assert.equal(speakMath("2.5", "ja"), "2.5");
  assert.equal(speakMath("2.5", "zh"), "2.5");
  assert.equal(speakMath("50%", "de"), "50 Prozent");
  assert.equal(speakMath("50%", "tr"), "yüzde 50");
  assert.equal(speakMath("50%", "zh"), "百分之50");
  assert.equal(speakMath("25%", "es"), "25 por ciento");
  assert.equal(speakMath("€2.50", "de"), "2,50 Euro");
  assert.equal(speakMath("€2.50", "es"), "2,50 euros");
  assert.equal(speakMath("$3", "ja"), "3 ドル");
  assert.equal(speakMath("-3", "de"), "minus 3");
  assert.equal(speakMath("−4 + 6", "fr"), "moins 4 plus 6");
  assert.equal(speakMath("5 > 3", "de"), "5 ist größer als 3");
  assert.equal(speakMath("2 < 9", "es"), "2 es menor que 9");
  assert.equal(speakMath("2 < 9", "ja"), "2は9より小さい");
  assert.equal(speakMath("5 > 3", "ko"), "5는 3보다 크다");
  assert.equal(speakMath("3:30", "de"), "3:30");
  assert.equal(speakMath("5²", "de"), "5 hoch zwei");
});

test("every voice language is covered and never throws", () => {
  for (const lang of ["en", "es", "fr", "pt", "it", "de", "nl", "ru", "tr", "ja", "ko", "id", "vi", "zh"]) {
    assert.ok(SPEAK_MATH_LANGS.includes(lang), lang);
    const out = speakMath("Sam has £2.50 and 3/4 of a cake. 7 − 2 = ? 50% 3:30 −4 2.5 🍎", lang);
    assert.equal(typeof out, "string");
    assert.ok(!/[−×÷=]/.test(out), `${lang}: no raw symbols left: ${out}`);
    assert.ok(!/🍎/u.test(out), `${lang}: no emoji`);
  }
  // A language without a word table is only tidied.
  assert.equal(speakMath("3 + 4 🍎", "ar"), "3 + 4");
  assert.equal(speakMath("7 − 2 = ?", "de-AT"), "7 minus 2 ist gleich wie viel?");
});

test("edge cases", () => {
  en("7 − 2 = ? Then add 1.", "seven minus two equals what? Then add one.");
  en("Is 5 > 3?", "Is five greater than three?");
  en("Is 2 < 9?", "Is two less than nine?");
  en("A train leaves at 9:15 am.", "A train leaves at nine fifteen a m.");
  en("What is 1/2 of 10?", "What is one half of ten?");
  assert.ok(!/divided/.test(speakMath("on 12/05/2024", "en")), "a date is not a division");
  assert.equal(speakMath("7 − 2 = ? 50%", "de"), "7 minus 2 ist gleich wie viel? 50 Prozent");
});

test("sentences for natural pacing", () => {
  assert.deepEqual(splitSentences("Listen. Tap the number."), ["Listen.", "Tap the number."]);
  assert.deepEqual(splitSentences("What is 2.5 + 1? Think!"), ["What is 2.5 + 1?", "Think!"]);
  assert.deepEqual(splitSentences("Mr. Smith has 3 cats. He likes them."), ["Mr. Smith has 3 cats.", "He likes them."]);
  assert.deepEqual(splitSentences("这是什么？请回答。"), ["这是什么？", "请回答。"]);
  assert.deepEqual(splitSentences("Hi! What is this?"), ["Hi! What is this?"]);
  assert.deepEqual(splitSentences("One line\nTwo line"), ["One line", "Two line"]);
  assert.deepEqual(splitSentences(""), []);
  const long = splitSentences(`${"word ".repeat(70)}, ${"more ".repeat(70)}, end.`);
  assert.ok(long.length >= 2 && long.every((p) => p.length <= 400));
});

test("a sign after a word is said 'minus'", () => {
  en("Bridge through 10: 12-2=10, then -5 more.", "Bridge through ten: twelve minus two equals ten, then minus five more.");
  en("It is -3 degrees", "It is minus three degrees");
  en("-3 + 1", "negative three plus one");
});
