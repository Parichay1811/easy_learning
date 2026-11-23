#!/usr/bin/env node
// Generate the companion's clips with an image-to-video model.
//   REPLICATE_API_TOKEN=… node generate.mjs [--draft] [--only id,id] [--seed N] [--tag name]
// Reads clips.json; uses .work/home.png as both the first and the last frame, so every
// clip begins and ends on the same pose. A clip with "from"/"to" starts or ends on
// another key pose instead (.work/<pose>.png, made by poses.mjs): stand up, walk, sit down. Raw clips land in .work/raw/<tag>/<id>.mp4 with
// a sidecar .json (prompt, seed, prediction id, cost estimate) for review.
import { mkdir, writeFile, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { upload, run, download, firstUrl } from "./replicate.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const draft = flag("--draft");
const only = opt("--only", "")?.split(",").filter(Boolean);
const seed = opt("--seed") ? Number(opt("--seed")) : undefined;
const tag = opt("--tag", draft ? "draft" : "final");
const resolution = opt("--resolution", "720p");
const home = opt("--home", ".work/home.png");
const parallel = Number(opt("--parallel", 4));

const spec = JSON.parse(readFileSync(new URL("./clips.json", import.meta.url), "utf8"));
const clips = spec.clips.filter((c) => !only?.length || only.includes(c.id));
const dir = `.work/raw/${tag}`;
await mkdir(dir, { recursive: true });

// Per second of output, from the model page (Nov 2026): $0.02 at 720p, $0.005 in draft.
const rate = draft ? 0.005 : resolution === "1080p" ? 0.04 : 0.02;
const homeUrl = await upload(home);
const poseUrls = { home: homeUrl };
for (const c of clips) for (const k of [c.from, c.to]) if (k && !poseUrls[k]) poseUrls[k] = await upload(`.work/${k}.png`);
console.log(`${clips.length} clip(s), ${draft ? "draft" : resolution}, ~$${(clips.reduce((s, c) => s + c.seconds, 0) * rate).toFixed(2)}`);

async function one(c) {
  const out = `${dir}/${c.id}.mp4`;
  if (!flag("--force")) { try { await access(out); console.log(`skip ${c.id} (exists)`); return; } catch { /* make it */ } }
  const input = {
    prompt: `${c.move ? spec.commonMove : spec.common} ${c.prompt}`,
    image: poseUrls[c.from || "home"],
    last_frame_image: poseUrls[c.to || "home"],
    duration: c.seconds,
    resolution,
    fps: 24,
    draft,
    save_audio: false,
    prompt_upsampling: false,
    ...(seed !== undefined ? { seed } : c.seed !== undefined ? { seed: c.seed } : {}),
  };
  const p = await run(spec.model, input, { log: console.log });
  await download(firstUrl(p.output), out);
  await writeFile(`${dir}/${c.id}.json`, JSON.stringify({ id: c.id, prediction: p.id, model: spec.model, input: { ...input, image: `${c.from || "home"}.png`, last_frame_image: `${c.to || "home"}.png` }, predict_time: p.metrics?.predict_time, cost_estimate: +(c.seconds * rate).toFixed(3) }, null, 1));
  console.log(`saved ${out}`);
}

const queue = [...clips];
await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
  while (queue.length) {
    const c = queue.shift();
    try { await one(c); } catch (e) { console.error(`FAILED ${c.id}: ${e.message}`); }
  }
}));
