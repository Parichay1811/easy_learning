// LinkedIn document carousels (PDF), in the mission films' hand-drawn style.
//
//   node tools/carousels.mjs
//
// Writes linkedin-carousels/<id>.pdf (1080×1350 pages, LinkedIn's 4:5 document format) and
// a PNG of each cover for checking. Edit the slide text in DECKS below.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "linkedin-carousels");
mkdirSync(out, { recursive: true });
const asset = (p) => pathToFileURL(path.join(root, "assets", p)).href;
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// art: a data-draw name, or "kid:<pose>"
const DECKS = {
  "S1-dyslexia-at-home": {
    cover: { title: "7 small ways to help a child with dyslexia at home", sub: "No tutor needed. Swipe →", art: "kid:book" },
    slides: [
      { title: "Read to them, not just with them.", sub: "Hearing the story keeps the love of books alive.", art: "book" },
      { title: "Let them answer out loud.", sub: "Knowing it and writing it are two different skills.", art: "kid:wave" },
      { title: "Ten minutes beats an hour.", sub: "Short and regular. Stop while it's going well.", art: "clock" },
      { title: "Audiobooks count as reading.", sub: "Words and imagination grow either way.", art: "book" },
      { title: "Bigger text. More space.", sub: "A calmer page is an easier page.", art: "spacing" },
      { title: "Praise the effort, out loud.", sub: "“You kept going on that hard word.”", art: "star" },
      { title: "Find their strength. Give it time.", sub: "Building, drawing, talking, sport.", art: "kite" },
    ],
  },
  "S2-adhd-homework": {
    cover: { title: "ADHD homework tips: 6 changes for calmer evenings", sub: "From families who've tried everything. Swipe →", art: "kid:jump" },
    slides: [
      { title: "Short bursts.", sub: "10 minutes on, 2 minutes moving. Repeat.", art: "clock" },
      { title: "One task in sight.", sub: "Put the rest of the worksheet away.", art: "book" },
      { title: "Start with an easy win.", sub: "Momentum is real.", art: "star" },
      { title: "Let them move.", sub: "Stand, wobble, walk while spelling out loud.", art: "kid:jump" },
      { title: "A timer? Let them choose.", sub: "It helps some children and stresses others.", art: "clock" },
      { title: "Finish on a success.", sub: "So tomorrow starts well.", art: "sprout" },
    ],
  },
};

const head = `<meta charset="utf-8"><link rel="stylesheet" href="${asset("brand/video.css")}">
<script>${readFileSync(path.join(root, "assets/brand/drawings.js"), "utf8")}</script>
<style>
  @page { size: 1080px 1350px; margin: 0; }
  html, body { margin: 0; background: #fbf6ea; }
  .ink { stroke-dasharray: none; }
  .page { position: relative; width: 1080px; height: 1350px; overflow: hidden; page-break-after: always; }
  .art { position: absolute; }
  .art svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .num { position: absolute; left: 90px; top: 90px; width: 96px; height: 96px; border-radius: 50%; background: var(--yellow);
    font: 700 52px/96px var(--font-display); color: var(--navy); text-align: center; }
  .count { position: absolute; right: 90px; top: 110px; font: 600 30px var(--font-display); color: var(--muted); }
  .t { position: absolute; left: 90px; right: 90px; font-family: "Caveat", cursive; font-weight: 700; color: var(--pencil); line-height: 1.02; }
  .s { position: absolute; left: 90px; right: 90px; font: 500 44px/1.3 var(--font-display); color: var(--muted); }
  .brand { position: absolute; left: 90px; bottom: 70px; display: flex; align-items: center; gap: 18px; font: 600 30px var(--font-display); color: var(--muted); }
  .brand img { width: 170px; }
</style>`;

const artHtml = (art, style) => {
  if (art === "spacing") {
    return `<div style="position:absolute;${style};display:flex;flex-direction:column;justify-content:center;gap:26px;font:500 64px var(--font-display);color:var(--pencil)">
      <div style="font-size:38px;letter-spacing:-0.5px;line-height:1.05;color:var(--muted)">tightlypackedwordsthataretiring</div>
      <div style="letter-spacing:4px;word-spacing:18px;line-height:1.6">words with<br>room to breathe</div></div>`;
  }
  if (art.startsWith("kid:")) return `<div class="art" data-kid="${art.slice(4)}" data-skin="2" data-color="sky" style="${style}"></div>`;
  return `<div class="art" data-draw="${art}" style="${style}"></div>`;
};
const brand = `<div class="brand"><img src="${asset("brand/logo-wordmark.webp")}"><span>Learning for every kind of mind</span></div>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
try {
  for (const [id, deck] of Object.entries(DECKS)) {
    const total = deck.slides.length + 2;
    let pages = `<div class="page"><div class="bg bg-paper"></div>
      <div class="t" style="top:150px;font-size:118px">${deck.cover.title}</div>
      <div class="s" style="top:640px">${deck.cover.sub}</div>
      ${artHtml(deck.cover.art, "left:640px;top:760px;width:330px;height:500px")}${brand}</div>`;
    deck.slides.forEach((s, i) => {
      pages += `<div class="page"><div class="bg bg-paper"></div>
        <div class="num">${i + 1}</div><div class="count">${i + 2} / ${total}</div>
        <div class="t" style="top:250px;font-size:112px">${s.title}</div>
        <div class="s" style="top:560px">${s.sub}</div>
        ${artHtml(s.art, "left:300px;top:720px;width:480px;height:480px")}${brand}</div>`;
    });
    pages += `<div class="page"><div class="bg bg-paper"></div>
      <img src="${asset("brand/logo-wordmark.webp")}" style="position:absolute;left:240px;top:250px;width:600px">
      <div class="t" style="top:600px;text-align:center;font-size:96px">Learning for every<br>kind of mind</div>
      <div class="s" style="top:860px;text-align:center">Free for families · 14 languages<br><b style="color:var(--pencil)">learnigo.eu</b></div>
      <div class="s" style="top:1040px;text-align:center;font-size:36px">Save this post · Share it with a parent who needs it</div>
      <img src="${asset("companion/hello.png")}" style="position:absolute;left:440px;top:1120px;width:200px"></div>`;

    const tmp = path.join(out, `.${id}.html`);
    writeFileSync(tmp, `<html><head>${head}</head><body>${pages}</body></html>`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.evaluate(() => { window.LearnigoDrawings?.fill(); return document.fonts.ready; });
    await new Promise((r) => setTimeout(r, 400));
    await page.pdf({ path: path.join(out, `${id}.pdf`), width: "1080px", height: "1350px", printBackground: true, pageRanges: "" });
    // preview of every slide (screen layout stacks the pages vertically)
    await page.setViewport({ width: 1080, height: 1350 * total });
    await page.screenshot({ path: path.join(out, `.${id}-all.png`) });
    await page.close();
    rmSync(tmp);
    console.log(`ok  linkedin-carousels/${id}.pdf (${total} pages)`);
  }
} finally {
  await browser.close();
}
