// The teacher's feedback lines: variety, names, tiers, and every language file.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { makePickers, setFeedbackForTest, tierOf, nextKind, firstNameOf, baseLang } from "./feedbackLines.js";

const LOCALES = new URL("../../public/locales/", import.meta.url).pathname;
const LANGS = "en de fr es it pt nl ru tr id ja ko zh vi".split(" ");
const load = (l) => JSON.parse(readFileSync(`${LOCALES}${l}/feedback.json`, "utf8"));
const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

test("a line is not heard again until all the others have been, and never twice in a row", () => {
  setFeedbackForTest("en", load("en"));
  const p = makePickers(seeded());
  const heard = [];
  for (let i = 0; i < 100; i += 1) heard.push(p.pickCorrect({ lang: "en" })); // no name: only the nameless lines
  const nameless = load("en").correct.filter((l) => !l.includes("{name}")).length;
  assert.equal(new Set(heard.slice(0, nameless)).size, nameless, "each nameless line once per bag");
  for (let i = 1; i < heard.length; i += 1) assert.notEqual(heard[i], heard[i - 1], "never the same line twice running");
});

test("a line with {name} is only used when a name is known, and the name is filled in", () => {
  setFeedbackForTest("en", load("en"));
  const p = makePickers(seeded(3));
  for (let i = 0; i < 120; i += 1) {
    const l = p.pickWrong({ lang: "en" });
    assert.ok(l && !l.includes("{name}") && !/,\s*[.!?]/.test(l), l);
  }
  let named = 0;
  for (let i = 0; i < 120; i += 1) {
    const l = p.pickWrong({ lang: "en", name: "Mrs Sharma Devi" });
    assert.ok(!l.includes("{"), l);
    if (l.includes("Mrs Sharma")) named += 1;
  }
  assert.ok(named > 5 && named < 60, `some, not all, lines use the name (${named})`);
});

test("score tiers and the matching next step", () => {
  assert.equal(tierOf(10, 10), "perfect");
  assert.equal(tierOf(9, 10), "high");
  assert.equal(tierOf(8, 10), "high");
  assert.equal(tierOf(7, 10), "mid");
  assert.equal(tierOf(5, 10), "mid");
  assert.equal(tierOf(4, 10), "low");
  assert.equal(tierOf(0, 10), "low");
  assert.deepEqual(["perfect", "high", "mid", "low"].map(nextKind), ["ready", "ready", "again", "gentle"]);
});

test("a summary has a result and a next step, with the score filled in", () => {
  setFeedbackForTest("en", load("en"));
  const p = makePickers(seeded(11));
  for (const [c, t] of [[10, 10], [8, 10], [6, 10], [2, 10], [3, 3], [0, 5]]) {
    const s = p.pickSummary({ lang: "en", name: "Aanya", correct: c, total: t });
    assert.ok(s.result && s.next && s.text.includes(s.result), JSON.stringify(s));
    assert.ok(!/\{|\}/.test(s.text), s.text);
  }
  assert.equal(p.pickSummary({ lang: "en", correct: 0, total: 0 }), null);
});

test("lines not fetched yet give nothing (the callers say their built-in phrase)", () => {
  setFeedbackForTest("en", null);
  const p = makePickers(seeded());
  assert.equal(p.pickCorrect({ lang: "xx" }), "");
  assert.equal(p.pickSummary({ lang: "de", correct: 3, total: 5 }), null);
  setFeedbackForTest("en", load("en"));
});

test("small helpers", () => {
  assert.equal(firstNameOf("Aanya Rao"), "Aanya");
  assert.equal(firstNameOf("Dr. Rao Kumar"), "Dr. Rao");
  assert.equal(firstNameOf("  "), "");
  assert.equal(baseLang("pt-BR"), "pt");
  assert.equal(baseLang("xx"), "en");
});

const COUNTS = { correct: 50, wrong: 50 };
const BANNED = /\b(wrong|stupid|dumb|failed|genius|you always|as usual|on a roll)\b/i; // English file only: the translators' brief covers the rest

for (const lang of LANGS) {
  test(`${lang}: fifty lines in every set, placeholders intact, nothing repeated`, { skip: !existsSync(`${LOCALES}${lang}/feedback.json`) && "file not written yet" }, () => {
    const d = load(lang);
    const en = load("en");
    assert.equal(d.correct.length, 50);
    assert.equal(d.wrong.length, 50);
    for (const t of Object.keys(en.summary)) assert.equal(d.summary[t]?.length, en.summary[t].length, `summary.${t}`);
    for (const t of Object.keys(en.next)) assert.equal(d.next[t]?.length, en.next[t].length, `next.${t}`);
    const lists = { correct: d.correct, wrong: d.wrong, ...Object.fromEntries(Object.entries(d.summary).map(([k, v]) => [`summary.${k}`, v])), ...Object.fromEntries(Object.entries(d.next).map(([k, v]) => [`next.${k}`, v])) };
    for (const [k, list] of Object.entries(lists)) {
      assert.equal(new Set(list).size, list.length, `${k}: duplicate lines`);
      for (const l of list) {
        assert.ok(typeof l === "string" && l.trim().length >= 4, `${k}: empty line`);
        for (const m of l.match(/\{[^}]*\}/g) || []) assert.ok(["{name}", "{correct}", "{total}"].includes(m), `${k}: unknown placeholder ${m} in "${l}"`);
        assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(l), `${k}: emoji in "${l}"`);
        if (lang === "en") assert.ok(!BANNED.test(l), `${k}: "${l}"`);
      }
    }
    // Enough lines work without a name, so a child with no name still hears variety.
    assert.ok(d.correct.filter((l) => !l.includes("{name}")).length >= 35);
    assert.ok(d.wrong.filter((l) => !l.includes("{name}")).length >= 35);
    for (const t of Object.keys(d.summary)) assert.ok(d.summary[t].some((l) => l.includes("{correct}") || l.includes("{total}")), `summary.${t} shows the score somewhere`);
  });
}

test("every language gives a complete summary for every score, with or without a name", () => {
  for (const lang of LANGS) {
    setFeedbackForTest(lang, load(lang));
    const p = makePickers(seeded(5));
    for (let total = 3; total <= 12; total += 3) {
      for (let correct = 0; correct <= total; correct += 1) {
        for (const name of ["", "Aanya Rao"]) {
          for (let k = 0; k < 6; k += 1) {
            const s = p.pickSummary({ lang, name, correct, total });
            assert.ok(s && s.result && s.next, `${lang} ${correct}/${total}`);
            assert.ok(!/[{}]/.test(s.text), `${lang}: leftover placeholder in "${s.text}"`);
            assert.ok(!/\s,|,\s*,|^\s*[,，、]/.test(s.text), `${lang}: stray comma in "${s.text}"`);
            if (!name) assert.ok(!/Aanya/.test(s.text));
          }
        }
      }
    }
    for (const name of ["", "Aanya"]) {
      for (let k = 0; k < 120; k += 1) {
        for (const f of [p.pickCorrect, p.pickWrong]) {
          const l = f({ lang, name });
          assert.ok(l && !/[{}]/.test(l) && !/\s,|^\s*[,，、]/.test(l), `${lang}: "${l}"`);
        }
      }
    }
  }
});
