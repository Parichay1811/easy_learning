// Build the LinkedIn page kit: logo, cover image and the per-language page fields.
//
//   node tools/linkedin-page.mjs
//
// Writes to linkedin-page/:
//   logo-400.png          page logo (LinkedIn shows it at 400×400 and crops to a rounded square)
//   cover-1128x191.png    cover image, rendered at 2× (2256×382) for sharp retina display
//   share-1200x627.png    image for link posts and the Featured section
//   translations.md       name, tagline and description in each of the site's 14 languages
//
// The translated text is the website's own (client/public/locales/<lang>/seo.json), so the
// LinkedIn page and the site say the same thing in every language.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "linkedin-page");
mkdirSync(out, { recursive: true });
const asset = (p) => pathToFileURL(path.join(root, "assets", p)).href;
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const head = `<meta charset="utf-8"><link rel="stylesheet" href="${asset("brand/video.css")}">
<script>${readFileSync(path.join(root, "assets/brand/drawings.js"), "utf8")}</script>
<style>.ink{stroke-dasharray:none}.art{position:absolute}.art svg{width:100%;height:100%;display:block;overflow:visible}</style>`;

const pages = {
  "logo-400.png": {
    w: 400, h: 400, scale: 1,
    html: `<html><head>${head}</head><body style="margin:0;width:400px;height:400px">
      <div style="position:absolute;inset:0;background:radial-gradient(120% 120% at 50% 20%, #d9f0ff 0%, #9fd8ff 55%, #7cc36b 56%, #5fae55 100%)"></div>
      <img src="${asset("companion/hello.png")}" style="position:absolute;left:28px;top:44px;width:344px;height:318px;object-fit:contain">
    </body></html>`,
  },
  "cover-1128x191.png": {
    w: 1128, h: 191, scale: 2,
    html: `<html><head>${head}</head><body style="margin:0;width:1128px;height:191px;position:relative;overflow:hidden">
      <div class="bg bg-paper"></div><div class="grain"></div>
      <div class="art" data-kid="up" data-skin="0" data-color="sun" style="left:250px;top:40px;width:84px;height:136px"></div>
      <div class="art" data-kid="wave" data-skin="3" data-color="rose" style="left:320px;top:52px;width:76px;height:124px"></div>
      <div class="art" data-kid="book" data-skin="2" data-color="sky" style="left:388px;top:40px;width:84px;height:136px"></div>
      <div class="art" data-kid="jump" data-skin="4" data-color="leaf" style="left:460px;top:40px;width:84px;height:136px"></div>
      <div class="hand" style="position:absolute;left:575px;top:36px;font-size:48px;line-height:1">Learning for every<br>kind of mind</div>
      <div style="position:absolute;left:577px;top:142px;font:600 17px var(--font-display);color:var(--muted)">learnigo.eu · free for families · 14 languages</div>
      <img src="${asset("brand/logo-wordmark.webp")}" style="position:absolute;right:30px;top:48px;width:132px">
    </body></html>`,
  },
  "share-1200x627.png": {
    w: 1200, h: 627, scale: 1,
    html: `<html><head>${head}</head><body style="margin:0;width:1200px;height:627px;position:relative;overflow:hidden">
      <div class="bg bg-paper"></div><div class="grain"></div>
      <img src="${asset("brand/logo-wordmark.webp")}" style="position:absolute;left:80px;top:70px;width:360px">
      <div class="hand" style="position:absolute;left:80px;top:260px;font-size:84px">Learning for every<br>kind of mind</div>
      <div style="position:absolute;left:84px;top:470px;font:500 30px var(--font-display);color:var(--muted)">Free for families · 14 languages · learnigo.eu</div>
      <div class="art" data-kid="up" data-skin="0" data-color="sun" style="left:720px;top:250px;width:150px;height:242px"></div>
      <div class="art" data-kid="wave" data-skin="3" data-color="rose" style="left:850px;top:280px;width:136px;height:220px"></div>
      <div class="art" data-kid="book" data-skin="2" data-color="sky" style="left:970px;top:250px;width:150px;height:242px"></div>
      <img src="${asset("companion/hello.png")}" style="position:absolute;left:870px;top:40px;width:220px">
    </body></html>`,
  },
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
try {
  for (const [file, p] of Object.entries(pages)) {
    const page = await browser.newPage();
    await page.setViewport({ width: p.w, height: p.h, deviceScaleFactor: p.scale });
    const tmp = path.join(out, `.${file}.html`);
    writeFileSync(tmp, p.html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.evaluate(() => { window.LearnigoDrawings?.fill(); return document.fonts.ready; });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(out, file) });
    await page.close();
    (await import("node:fs")).rmSync(tmp);
    console.log("ok ", path.join("linkedin-page", file));
  }
} finally {
  await browser.close();
}

// Per-language page fields from the website's own translations
const locDir = path.join(root, "..", "client", "public", "locales");
const NAMES = { en: "English", de: "German", es: "Spanish", fr: "French", id: "Indonesian", it: "Italian", ja: "Japanese", ko: "Korean", nl: "Dutch", pt: "Portuguese", ru: "Russian", tr: "Turkish", vi: "Vietnamese", zh: "Chinese (Simplified)" };
if (existsSync(locDir)) {
  let md = `# LinkedIn page · other languages\n\nLinkedIn → your page → **Edit page → Page info → Manage languages → Add language**.\nFor each language: **Name** stays \`Learnigo\`; paste the tagline and description below.\nThe text comes from the website's own translations (\`client/public/locales/<lang>/seo.json\`).\n`;
  for (const lang of readdirSync(locDir).sort()) {
    if (lang === "en") continue;
    const f = path.join(locDir, lang, "seo.json");
    if (!existsSync(f)) continue;
    const seo = JSON.parse(readFileSync(f, "utf8"));
    const tagline = seo.pages["/"].h1;
    const desc = `${seo.site.orgDescription}\n\n${seo.site.offer}\n\nhttps://learnigo.eu`;
    md += `\n---\n\n## ${NAMES[lang] || lang} (\`${lang}\`)\n\n**Tagline** (${tagline.length}/120)\n\n\`\`\`\n${tagline}\n\`\`\`\n\n**Description** (${desc.length}/2000)\n\n\`\`\`\n${desc}\n\`\`\`\n`;
  }
  writeFileSync(path.join(out, "translations.md"), md);
  console.log("ok  linkedin-page/translations.md");
}
