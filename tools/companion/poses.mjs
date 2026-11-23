#!/usr/bin/env node
// Key poses other than "home", edited from .work/home.png with an image model, for
// clips that start or end somewhere else (stand up, walk, sit down).
//   REPLICATE_API_TOKEN=… node poses.mjs [--only walk] [--takes 3]
// Takes land in .work/poses/<id>-<n>.png. Pick one per pose in selection.json
// ("poses": { "walk": "walk-2" }); `node poses.mjs --use` copies the picks to
// .work/<id>.png, which clips.json refers to as "from"/"to".
import { mkdir, copyFile, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { upload, run, download, firstUrl } from "./replicate.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const spec = JSON.parse(readFileSync(new URL("./clips.json", import.meta.url), "utf8"));
const poses = Object.entries(spec.poses || {}).filter(([id]) => !opt("--only") || opt("--only").split(",").includes(id));

if (args.includes("--use")) {
  const sel = JSON.parse(await readFile(new URL("./selection.json", import.meta.url), "utf8")).poses || {};
  for (const [id, take] of Object.entries(sel)) {
    await copyFile(`.work/poses/${take}.png`, `.work/${id}.png`);
    console.log(`${take} -> .work/${id}.png`);
  }
  process.exit(0);
}

const takes = Number(opt("--takes", 3));
await mkdir(".work/poses", { recursive: true });
const home = await upload(".work/home.png");
// About $0.039 per image (Nov 2026).
console.log(`${poses.length} pose(s) x ${takes} take(s), ~$${(poses.length * takes * 0.039).toFixed(2)}`);
await Promise.all(
  poses.flatMap(([id, p]) =>
    Array.from({ length: takes }, async (_, n) => {
      const out = `.work/poses/${id}-${n + 1}.png`;
      try {
        const r = await run("google/nano-banana", { prompt: `${spec.poseCommon} ${p.prompt}`, image_input: [home], aspect_ratio: "match_input_image", output_format: "png" }, { log: console.log });
        await download(firstUrl(r.output), out);
        console.log(`saved ${out}`);
      } catch (e) {
        console.error(`FAILED ${out}: ${e.message}`);
      }
    })
  )
);
