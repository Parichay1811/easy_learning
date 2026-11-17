# Lesson pack format

One JSON file per topic, named by its topic id (`MATH-MENS-01.json`). The
packs are the teacher's database: everything the teacher says comes from
here or from a template in `shared/solvers.js`. A small model never writes
a fact; it only finds and words what is here. So the more complete the packs,
the smaller the model the site needs.

```jsonc
{
  "id": "MATH-MENS-02",              // the topic id of the master brief
  "title": "Circles",
  "template": "circle_area",         // the maths tool for follow-up numbers (optional)
  "keywords": ["circle", "radius"],  // words that name the topic
  "examples": ["Area of a circle with diameter 10 cm"],   // shown as suggestions
  "figure": [ /* draw ops: the topic's picture beside a quick answer */ ],
  "explain": [                       // the short lesson, 3 to 5 steps
    { "say": "One or two spoken sentences.",
      "draw": [ { "op": "circle", "r": 5, "at": "radius" } ] }   // at = a word of say
  ],
  "faq": [                           // common questions with checked answers
    ["Question?", "Spoken answer."],
    { "q": "Question?", "a": "Spoken answer.",
      "asks": ["the same question in other words", "how a student might say it"] }
  ],
  "facts": ["Optional single checked facts, found by search too."],
  "quiz": [                          // three questions: recall, apply, exam-style
    { "say": "Spoken question.", "show": "Question on screen",
      "options": [ { "show": "25π cm²", "say": "25 pi square centimetres" } ],
      "answer": 1, "why": "Why the answer is right.",
      "wrong": { "0": "Why option A is the tempting mistake." } }
  ]
}
```

- **`asks` makes a small model unnecessary.** Each other phrasing is
  searched by meaning, so add the ways students really ask: take them from
  the admin question log.
- **Answers are spoken.** Write numbers as a voice reads them where it
  matters ("25 pi"), keep each to one to three short sentences.
- **Draw ops:** `clear`, `title`, `text`, `formula`, `note`, `box`, `card`,
  `question`, `options`, `chips`, `rect`, `tri`, `circle`, `vecgrid`, `vec`,
  `colvec`, `grid` and `trace` (on a shape's `id`), and the diagrams `flow`
  and `cycle` (`items`: 2 to 6 short steps), `timeline` (`items` written
  "when: what"), `compare` (`left`, `right`, and their `a` and `b` lists),
  `bullets` (`items`), `bignum` (`value`, `label`), `parts` (`center`,
  `items`), `tree` (`root`, `items` as "kind: example"), `venn` (`left`,
  `right`, `a`, `b`, `both`), `bars` (`items` as "name: number", `label`) and
  `pyramid` (`items`, top first), `line` and `pie` (`items` as "name:
  number", `label`), `table` (`items` as "cell | cell", headings first),
  `map` (`items` place names, `items2` routes "A > B", `label`), `graph`
  (`expr` like "y = x^2 - 4", `items` points like "root (2, 0)"),
  `numberline` (`items` "label: number"), `fraction` (`value` "3/4"),
  `angle` (`value` degrees), `balance` (`left`, `right`), `forces`
  (`center`, `items` like "up: Lift 500 N"), `wave` (`items` two labels),
  `circuit` (`items` components), `atom` (`value` element), `orbits`
  (`center`, `items`), `quote` (`value`, `label`) and `count` (`value`,
  `label`); see `public/board.js`, `public/figures.js` and `public/map.js`.
  A diagram's `at` is a spoken word, like any cue.
- **Check it:** `npm test` (every cue is a spoken word, every answer can be
  said back) and `node eval-kb.mjs` after adding questions to
  `eval.json` (does search find the right card for students' own words?).
