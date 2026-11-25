// Image posters for the text-only LinkedIn posts (S3–S6), in the hand-drawn style.
//
//   node tools/posters.mjs
//
// Writes linkedin-posters/<id>.png at 1080×1350 (4:5, the size that fills most of the
// LinkedIn feed on a phone). The post text in copy/linkedin/S-search-series.md is the caption.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "linkedin-posters");
mkdirSync(out, { recursive: true });
const asset = (p) => pathToFileURL(path.join(root, "assets", p)).href;
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// kicker: small line above; title: the hook; sub: one supporting line; art: drawings
const POSTERS = {
  "S3-dyslexia-myths": {
    kicker: "What parents still hear at the school gate",
    title: "5 dyslexia myths, and what's closer to the truth",
    sub: "Dyslexia isn't a measure of intelligence. Changing the format helps more than “trying harder”.",
    art: [["kid", "book", 1, "sky", 380, 760, 320, 520]],
  },
  "S4-brain-breaks": {
    kicker: "For teachers, back after the holidays",
    title: "5 brain breaks for kids. 2 minutes. No equipment.",
    sub: "Freeze frame · Mirror me · Air spelling · Count and reach · Traffic lights",
    art: [["kid", "jump", 0, "leaf", 240, 760, 300, 480], ["kid", "wave", 3, "rose", 540, 790, 280, 450], ["draw", "star", 0, 0, 760, 720, 170, 170]],
  },
  "S5-inclusive-classroom": {
    kicker: "Inclusive design is good design",
    title: "6 inclusive classroom ideas that cost nothing",
    sub: "Read questions aloud · Say it or write it · Fewer words · Optional clock · Move · Personal bests",
    art: [["kid", "up", 0, "sun", 150, 800, 230, 370], ["kid", "book", 2, "sky", 360, 800, 230, 370], ["kid", "jump", 4, "leaf", 570, 800, 230, 370], ["kid", "wave", 3, "rose", 780, 800, 230, 370]],
  },
  "S6-bilingual-children": {
    kicker: "For parents of children growing up with two languages",
    title: "Bilingual children aren't behind.",
    sub: "They're learning twice as many words for the same world.",
    art: [["draw", "globe", 0, 0, 380, 720, 330, 330], ["kid", "up", 1, "sun", 170, 860, 200, 320], ["kid", "wave", 4, "lilac", 720, 860, 200, 320]],
  },
};

const head = `<meta charset="utf-8"><link rel="stylesheet" href="${asset("brand/video.css")}">
<script>${readFileSync(path.join(root, "assets/brand/drawings.js"), "utf8")}</script>
<style>
  html, body { margin: 0; width: 1080px; height: 1350px; overflow: hidden; }
  .ink { stroke-dasharray: none; }
  .art { position: absolute; }
  .art svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .k { position: absolute; left: 90px; right: 90px; top: 96px; font: 600 34px var(--font-display); color: #b84800; }
  .t { position: absolute; left: 90px; right: 90px; top: 160px; font-family: "Caveat", cursive; font-weight: 700; color: var(--pencil); font-size: 116px; line-height: 1.0; }
  .s { position: absolute; left: 90px; right: 90px; top: 545px; font: 500 40px/1.35 var(--font-display); color: var(--muted); }
  .foot { position: absolute; left: 0; right: 0; bottom: 0; height: 120px; background: rgba(255,255,255,0.65); display: flex; align-items: center; gap: 22px; padding: 0 90px; }
  .foot img.logo { width: 190px; }
  .foot span { font: 600 32px var(--font-display); color: var(--ink); }
  .foot b { color: #b84800; }
  .pup { position: absolute; right: 60px; bottom: 96px; width: 190px; }
</style>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
try {
  for (const [id, p] of Object.entries(POSTERS)) {
    const art = p.art.map(([kind, name, skin, color, x, y0, w, h]) => ({ kind, name, skin, color, x, y: Math.min(y0, 1220 - h), w, h })).map(({ kind, name, skin, color, x, y, w, h }) =>
      kind === "kid"
        ? `<div class="art" data-kid="${name}" data-skin="${skin}" data-color="${color}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`
        : `<div class="art" data-draw="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`).join("");
    const html = `<html><head>${head}</head><body>
      <div class="bg bg-paper"></div><div class="grain"></div>
      <div class="k">${p.kicker}</div><div class="t">${p.title}</div><div class="s">${p.sub}</div>
      ${art}
      <div class="foot"><img class="logo" src="${asset("brand/logo-wordmark.webp")}"><span>Learning for every kind of mind · <b>learnigo.eu</b></span></div>
    </body></html>`;
    const tmp = path.join(out, `.${id}.html`);
    writeFileSync(tmp, html);
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.evaluate(() => { window.LearnigoDrawings?.fill(); return document.fonts.ready; });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(out, `${id}.png`) });
    await page.close();
    rmSync(tmp);
    console.log(`ok  linkedin-posters/${id}.png`);
  }
} finally {
  await browser.close();
}
