// Voiceover + captions for one video, from its voiceover.json.
//
//   node tools/voice.mjs videos/01-meet-learnigo
//
// For every line in voiceover.json this:
//   1. speaks it with HyperFrames' offline voice (Kokoro) → assets/voice/<video>/<id>.wav
//      (cached: a line is only re-spoken when its words, voice or speed change)
//   2. lays the lines end to end with small gaps → assets/voice/<video>/vo.wav
//   3. writes <video>/compositions/captions.html (burned-in captions, 3–6 words at a time)
//   4. writes <video>/captions.srt (upload it to YouTube/LinkedIn as well) and timing.json
//
// The composition (index.html) times its scenes to the line starts in timing.json.
//
// voiceover.json:
// { "voice": "af_heart", "speed": 1.0, "lead": 0.4, "gap": 0.35, "captionStyle": "soft" (optional),
//   "width": 1920, "height": 1080, "captionBottom": 96,
//   "lines": [ { "id": "hook", "text": "On-screen words, *highlight* in yellow", "say": "optional spoken form",
//                "gap": 0.6, "caption": false /* skip when the picture already shows the words */ } ] }
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const videoDir = path.resolve(process.argv[2] || "");
if (!existsSync(path.join(videoDir, "voiceover.json"))) {
  console.error("usage: node tools/voice.mjs videos/<name>   (folder with voiceover.json)");
  process.exit(1);
}
const name = path.basename(videoDir);
const cfg = JSON.parse(readFileSync(path.join(videoDir, "voiceover.json"), "utf8"));
const voice = cfg.voice || "af_heart";
const speed = cfg.speed || 1.0;
const lead = cfg.lead ?? 0.4;
const defaultGap = cfg.gap ?? 0.35;
const W = cfg.width || 1920;
const H = cfg.height || 1080;
const outDir = path.join(root, "assets", "voice", name);
mkdirSync(outDir, { recursive: true });
mkdirSync(path.join(videoDir, "compositions"), { recursive: true });

const python = process.env.HYPERFRAMES_PYTHON || path.join(root, ".venv", "bin", "python");
const env = { ...process.env, HYPERFRAMES_PYTHON: python };
const hf = path.join(root, "node_modules", ".bin", "hyperframes");
const plain = (t) => t.replace(/\*/g, "");
const duration = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

// 1. Speak each line (cached by content hash).
const cachePath = path.join(outDir, "cache.json");
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const lines = cfg.lines.map((l) => {
  const say = l.say || plain(l.text);
  const lineVoice = l.voice || voice;
  const lineSpeed = l.speed || speed;
  const hash = createHash("sha1").update(`${say}|${lineVoice}|${lineSpeed}`).digest("hex").slice(0, 12);
  const wav = path.join(outDir, `${l.id}.wav`);
  if (cache[l.id] !== hash || !existsSync(wav)) {
    execFileSync(hf, ["tts", say, "--voice", lineVoice, "--speed", String(lineSpeed), "-o", wav], { env, stdio: "inherit" });
    cache[l.id] = hash;
  }
  return { ...l, wav, dur: duration(wav) };
});
writeFileSync(cachePath, JSON.stringify(cache, null, 2));

// 2. Lay them out and build one track.
let t = lead;
for (const l of lines) {
  l.start = +t.toFixed(3);
  l.end = +(t + l.dur).toFixed(3);
  t = l.end + (l.gap ?? defaultGap);
}
const total = +(lines.at(-1).end + 0.2).toFixed(3);
const inputs = lines.flatMap((l) => ["-i", l.wav]);
const delays = lines.map((l, i) => `[${i}:a]aresample=48000,adelay=${Math.round(l.start * 1000)}:all=1[a${i}]`).join(";");
const mix = lines.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${total}[out]`;
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `${delays};${mix}`, "-map", "[out]", "-ac", "1", "-ar", "48000", path.join(outDir, "vo.wav")]);

// 3. Captions: split each line into short groups at punctuation / 5 words, and share the
// line's time between groups by character count.
function groupsOf(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const groups = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const ends = /[.!?,:;]["”’*]*$/.test(w);
    if ((ends && cur.length >= 2) || cur.length >= (cfg.maxWords || 5)) {
      groups.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) {
    if (cur.length === 1 && groups.length) groups[groups.length - 1] += " " + cur[0];
    else groups.push(cur.join(" "));
  }
  // A *highlight* that spans two groups: close it at the end of one, reopen in the next.
  let open = false;
  return groups.map((g) => {
    let out = open ? "*" + g : g;
    if ((out.match(/\*/g) || []).length % 2) { out += "*"; open = true; } else open = false;
    return out.replace(/\*\*/g, "");
  });
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');
const caps = [];
for (const l of lines) {
  if (l.caption === false) continue; // the picture already shows these words
  const gs = groupsOf(l.text);
  const chars = gs.reduce((n, g) => n + plain(g).length, 0);
  let s = l.start;
  for (const g of gs) {
    const d = (l.dur * plain(g).length) / chars;
    caps.push({ text: g, start: +s.toFixed(3), end: +(s + d).toFixed(3) });
    s += d;
  }
}
// Each group stays up until just before the next one starts (or a short hold after a line).
caps.forEach((c, i) => {
  const next = caps[i + 1];
  c.show = +Math.max(0.1, c.start - 0.05).toFixed(3);
  c.hide = next ? +Math.min(c.end + 0.35, next.start - 0.05).toFixed(3) : +(c.end + 0.4).toFixed(3);
});

const bottom = cfg.captionBottom ?? (H > W ? 690 : 96);
const fontSize = cfg.captionSize ?? (W >= 1920 ? 54 : H > W ? 58 : 52);
const maxWidth = Math.round(W * (H > W ? 0.78 : 0.8));
// "soft" captions (mission films): cream paper pill, ink text. Default: navy pill, white text.
const soft = cfg.captionStyle === "soft";
const capBg = soft ? "rgba(255, 250, 240, 0.94)" : "rgba(18, 31, 58, 0.84)";
const capInk = soft ? "#23304a" : "#ffffff";
const capHl = soft ? "#b84800" : "#ffd24d";
const capShadow = soft ? "0 8px 24px rgba(60, 50, 30, 0.18)" : "0 10px 30px rgba(10, 20, 40, 0.25)";
const capHtml = `<template>
  <!-- Generated by tools/voice.mjs from voiceover.json. Edit the words there, not here. -->
  <style>
    @font-face { font-family: "Fredoka"; font-weight: 600; src: url("assets/fonts/fredoka-latin-600-normal.woff2") format("woff2"); }
    #root { position: absolute; inset: 0; pointer-events: none; }
    #root .cap {
      position: absolute; left: 0; right: 0; bottom: ${bottom}px;
      display: flex; justify-content: center; overflow: visible;
    }
    #root .cap span.pill {
      display: inline-block; max-width: ${maxWidth}px; text-align: center;
      font-family: "Fredoka", sans-serif; font-weight: 600; font-size: ${fontSize}px; line-height: 1.18;
      color: ${capInk}; background: ${capBg}; border-radius: 22px;
      padding: 12px 30px 14px; box-shadow: ${capShadow};
    }
    #root .cap .hl { color: ${capHl}; }
  </style>
  <div id="root" data-composition-id="captions" data-width="${W}" data-height="${H}">
${caps
  .map(
    (c, i) =>
      `    <div id="cap-${i}" class="cap clip" data-start="${c.show}" data-duration="${+(c.hide - c.show).toFixed(3)}" data-track-index="0"><span class="pill">${html(c.text)}</span></div>`,
  )
  .join("\n")}
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
${caps
  .map(
    (c, i) =>
      `    tl.fromTo("#cap-${i} .pill", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, ${c.show});`,
  )
  .join("\n")}
    window.__timelines["captions"] = tl;
  </script>
</template>
`;
writeFileSync(path.join(videoDir, "compositions", "captions.html"), capHtml);

// 4. SRT (line-level, the way people read subtitles) + timing for the composition.
const ts = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
writeFileSync(
  path.join(videoDir, "captions.srt"),
  lines.map((l, i) => `${i + 1}\n${ts(l.start)} --> ${ts(l.end + 0.2)}\n${plain(l.text)}\n`).join("\n"),
);
const timing = { voice, speed, total, lines: lines.map(({ id, start, end, dur }) => ({ id, start, end, dur: +dur.toFixed(3) })) };
writeFileSync(path.join(videoDir, "timing.json"), JSON.stringify(timing, null, 2));
console.log(`\n${name}: ${lines.length} lines, ${caps.length} caption groups, voice ends at ${total}s`);
for (const l of timing.lines) console.log(`  ${l.id.padEnd(12)} ${l.start.toFixed(2).padStart(6)} → ${l.end.toFixed(2).padStart(6)}`);
