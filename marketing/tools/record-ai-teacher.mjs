// Record the live AI teacher answering a question, as footage for the videos.
//
//   node tools/record-ai-teacher.mjs ["Why do plants need sunlight?"]
//
// Writes assets/footage/ai-teacher.mp4 (1600x1000 page, recorded at 30 fps).
// Needs ffmpeg on PATH (puppeteer's screencast uses it).
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "assets", "footage");
const SITE = (process.env.SITE || "https://learnigo.eu").replace(/\/$/, "");
const QUESTION = process.argv[2] || "Why do plants need sunlight?";
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

await mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--mute-audio", "--hide-scrollbars"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${SITE}/ai-teacher`, { waitUntil: "networkidle2", timeout: 60000 });
  await wait(3);
  const frame = page.frames().find((f) => f.url().includes("/ai-assistant/"));
  if (!frame) throw new Error("AI teacher frame not found");
  await frame.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Start the lesson"))?.click());
  await wait(1.5);
  const input = await frame.$("input[type=text], input:not([type])");
  const recorder = await page.screencast({ path: path.join(outDir, "ai-teacher.webm") });
  await wait(1);
  await input.click();
  await input.type(QUESTION, { delay: 70 }); // visible typing
  await wait(0.6);
  await page.keyboard.press("Enter");
  await wait(Number(process.env.RECORD_SECONDS || 26)); // the board draws and narrates
  await recorder.stop();
  console.log("ok  assets/footage/ai-teacher.webm");
} finally {
  await browser.close();
}
