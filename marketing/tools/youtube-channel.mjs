// Build the YouTube channel images.
//
//   node tools/youtube-channel.mjs
//
// Writes to youtube-channel/:
//   banner-2560x1440.png   channel banner; everything that matters sits in the centre
//                          1546×423 "safe area" that every device shows
//   avatar-800.png         profile picture (shown as a circle)
//   watermark-150.png      video watermark (bottom-right "subscribe" button on every video)
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "youtube-channel");
mkdirSync(out, { recursive: true });
const asset = (p) => pathToFileURL(path.join(root, "assets", p)).href;
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const head = `<meta charset="utf-8"><link rel="stylesheet" href="${asset("brand/video.css")}">
<script>${readFileSync(path.join(root, "assets/brand/drawings.js"), "utf8")}</script>
<style>.ink{stroke-dasharray:none}.art{position:absolute}.art svg{width:100%;height:100%;display:block;overflow:visible}</style>`;

// safe area: x 507–2053, y 508–931
const pages = {
  "banner-2560x1440.png": {
    w: 2560, h: 1440,
    html: `<html><head>${head}</head><body style="margin:0;width:2560px;height:1440px;position:relative;overflow:hidden">
      <div class="bg bg-meadow" style="background-position:center 70%"></div>
      <div style="position:absolute;left:0;right:0;top:470px;height:500px;background:linear-gradient(180deg,rgba(251,246,234,0) 0%,rgba(251,246,234,0.86) 18%,rgba(251,246,234,0.86) 82%,rgba(251,246,234,0) 100%)"></div>
      <img src="${asset("brand/logo-wordmark.webp")}" style="position:absolute;left:560px;top:540px;width:640px">
      <div class="hand" style="position:absolute;left:1250px;top:545px;font-size:104px;line-height:1">Learning for every<br>kind of mind</div>
      <div style="position:absolute;left:1256px;top:790px;font:600 40px var(--font-display);color:var(--ink)">New films every week · learnigo.eu</div>
      <div class="art" data-kid="wave" data-skin="3" data-color="rose" style="left:2100px;top:620px;width:150px;height:242px"></div>
      <div class="art" data-kid="jump" data-skin="0" data-color="sun" style="left:2240px;top:620px;width:150px;height:242px"></div>
      <div class="art" data-kid="book" data-skin="2" data-color="sky" style="left:300px;top:620px;width:150px;height:242px"></div>
    </body></html>`,
  },
  "avatar-800.png": {
    w: 800, h: 800,
    html: `<html><head>${head}</head><body style="margin:0;width:800px;height:800px">
      <div style="position:absolute;inset:0;background:radial-gradient(120% 120% at 50% 20%, #d9f0ff 0%, #9fd8ff 55%, #7cc36b 56%, #5fae55 100%)"></div>
      <img src="${asset("companion/hello.png")}" style="position:absolute;left:90px;top:110px;width:620px;height:574px;object-fit:contain">
    </body></html>`,
  },
  "watermark-150.png": {
    w: 150, h: 150, transparent: true,
    html: `<html><head>${head}</head><body style="margin:0;width:150px;height:150px;background:transparent">
      <div style="position:absolute;inset:6px;border-radius:50%;background:#fffaf0;box-shadow:0 0 0 4px #ff8a1f"></div>
      <img src="${asset("companion/hello.png")}" style="position:absolute;left:14px;top:16px;width:122px;height:113px;object-fit:contain">
    </body></html>`,
  },
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
try {
  for (const [file, p] of Object.entries(pages)) {
    const page = await browser.newPage();
    await page.setViewport({ width: p.w, height: p.h, deviceScaleFactor: 1 });
    const tmp = path.join(out, `.${file}.html`);
    writeFileSync(tmp, p.html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.evaluate(() => { window.LearnigoDrawings?.fill(); return document.fonts.ready; });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(out, file), omitBackground: !!p.transparent });
    await page.close();
    rmSync(tmp);
    console.log("ok ", path.join("youtube-channel", file));
  }
} finally {
  await browser.close();
}
