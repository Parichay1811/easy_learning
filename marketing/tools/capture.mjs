// Capture real screens of learnigo.eu for the videos.
//
//   node tools/capture.mjs                 # all shots, from https://learnigo.eu
//   SITE=http://localhost:5173 node tools/capture.mjs   # from a local dev server
//
// Writes WebP images to assets/screens/. Re-run after a site redesign and every video picks
// up the new look on its next render. Uses your installed Google Chrome (no download).
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "assets", "screens");
const SITE = (process.env.SITE || "https://learnigo.eu").replace(/\/$/, "");

const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));

// name, path, viewport. Desktop shots are 1600x1000 (they get scaled into frames);
// phone shots are 390x844 at 3x for the vertical videos.
const DESKTOP = { width: 1600, height: 1000, deviceScaleFactor: 1.5 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
// Optional 4th item: what to do on the page before the screenshot.
const click = (text) => async (page) => {
  await page.evaluate((t) => [...document.querySelectorAll("button,a,[role=tab]")].find((b) => b.innerText.trim().includes(t))?.click(), text);
  await new Promise((r) => setTimeout(r, 2500));
};
const clickAndScroll = (text, y) => async (page) => {
  await click(text)(page);
  await page.evaluate((dy) => window.scrollBy(0, dy), y);
  await new Promise((r) => setTimeout(r, 1500));
};
const SHOTS = [
  ["entry", "/", DESKTOP],
  ["home", "/home", DESKTOP],
  ["english", "/subject/english", DESKTOP],
  ["maths", "/subject/maths", DESKTOP],
  ["ai-teacher", "/ai-teacher", DESKTOP],
  ["games", "/games", DESKTOP],
  ["pricing", "/pricing", DESKTOP],
  ["pricing-teachers", "/pricing", DESKTOP, click("Teachers")],
  ["pricing-schools", "/pricing", DESKTOP, click("Schools")],
  ["pricing-teachers-cards", "/pricing", DESKTOP, clickAndScroll("Teachers", 520)],
  ["pricing-schools-cards", "/pricing", DESKTOP, clickAndScroll("Schools", 520)],
  ["start-level", "/module/read/english", DESKTOP],
  ["entry-phone", "/", PHONE],
  ["home-phone", "/home", PHONE],
  ["ai-teacher-phone", "/ai-teacher", PHONE],
  ["games-phone", "/games", PHONE],
];

const only = process.argv.slice(2);
await mkdir(out, { recursive: true });
if (!CHROME) throw new Error("Chrome not found; set CHROME_PATH");
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--mute-audio", "--hide-scrollbars", "--no-first-run"],
});
try {
  for (const [name, route, viewport, act] of SHOTS) {
    if (only.length && !only.includes(name)) continue;
    const page = await browser.newPage();
    await page.setViewport(viewport);
    // Quiet, deterministic pages: no speech, English UI, no cookie prompt re-showing.
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("i18nextLng", "en");
        Object.defineProperty(window, "speechSynthesis", {
          value: { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} },
        });
      } catch { /* ignore */ }
    });
    await page.goto(SITE + route, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3500)); // let entrance animations settle
    if (act) await act(page);
    const file = path.join(out, `${name}.webp`);
    await page.screenshot({ path: file, type: "webp", quality: 90 });
    console.log("ok ", name, "←", route);
    await page.close();
  }
} finally {
  await browser.close();
}
