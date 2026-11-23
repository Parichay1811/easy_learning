#!/usr/bin/env node
// Background plates without the baked-in puppy and butterflies, so the live
// companion and butterflies can own those roles.
//   REPLICATE_API_TOKEN=… node plates.mjs edit      # frame -> clean still (nano-banana)
//   REPLICATE_API_TOKEN=… node plates.mjs loop      # clean still -> seamless breeze loop (p-video)
//   node plates.mjs encode                           # -> client/src/assets/videos/meadow-*.mp4 + posters
//   REPLICATE_API_TOKEN=… node plates.mjs stills    # clean the still meadows (dashboard cards, entry pages)
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { upload, run, download, firstUrl } from "./replicate.mjs";

const step = process.argv[2];
const W = ".work/plates";
mkdirSync(W, { recursive: true });
const VIDEOS = "../../client/src/assets/videos";
const PLATES = [
  { id: "laptop", src: `${VIDEOS}/bg-laptop.mp4`, at: "2.0", aspect: "16:9", out: [1920, 1080] },
  { id: "tab", src: `${VIDEOS}/bg-tab.mp4`, at: "2.0", aspect: "1:1", out: [1440, 1440] },
  { id: "mobile", src: `${VIDEOS}/bg-mobile.mp4`, at: "2.0", aspect: "9:16", out: [1080, 1920] },
];
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
const only = process.argv[3]?.split(",");
const plates = PLATES.filter((p) => !only || only.includes(p.id));

const EDIT = "Remove the cartoon puppy dog and every butterfly and sparkle from this picture. Fill those areas naturally with the same grass, flowers and tree that surround them. Keep everything else exactly the same: same composition, same camera, same colours, same painterly 3D cartoon style. No animals, no characters, no text.";
const LOOP = "Locked-off static camera, no zoom, no pan. A calm sunny meadow: the grass and flowers sway gently in a soft breeze, tree leaves rustle slightly, clouds drift very slowly. No animals, no butterflies, no birds, no people, no characters, no text. Subtle, peaceful, natural motion.";

if (step === "edit") {
  await Promise.all(plates.map(async (p) => {
    const frame = `${W}/${p.id}-frame.png`;
    ff("-ss", p.at, "-i", p.src, "-frames:v", "1", frame);
    const url = await upload(frame);
    const r = await run("google/nano-banana", { prompt: EDIT, image_input: [url], aspect_ratio: "match_input_image", output_format: "png" }, { log: console.log });
    await download(firstUrl(r.output), `${W}/${p.id}-clean.png`);
    console.log(`clean ${p.id}`);
  }));
} else if (step === "loop") {
  await Promise.all(plates.map(async (p) => {
    const url = await upload(`${W}/${p.id}-clean.png`);
    const r = await run("prunaai/p-video", { prompt: LOOP, image: url, last_frame_image: url, duration: 6, resolution: "1080p", fps: 24, save_audio: false, prompt_upsampling: false }, { log: console.log });
    await download(firstUrl(r.output), `${W}/${p.id}-loop.mp4`);
    console.log(`loop ${p.id}`);
  }));
} else if (step === "stills") {
  // The still meadows used behind dashboard cards and the entry pages: same clean-up.
  const STILLS = [
    { id: "dash-meadow", src: "../../client/src/assets/dash/meadow.webp" },
    { id: "meadow-scene", src: "../../client/public/brand/meadow-scene.webp" },
  ];
  await Promise.all(STILLS.map(async (st) => {
    const png = `${W}/${st.id}-src.png`;
    ff("-i", st.src, png);
    const url = await upload(png);
    const r = await run("google/nano-banana", { prompt: EDIT, image_input: [url], aspect_ratio: "match_input_image", output_format: "png" }, { log: console.log });
    await download(firstUrl(r.output), `${W}/${st.id}-clean.png`);
    const size = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", png]).toString().trim();
    ff("-i", `${W}/${st.id}-clean.png`, "-vf", `scale=${size.replace(",", ":")}:flags=lanczos`, "-c:v", "libwebp", "-quality", "82", st.src);
    console.log(`${st.src} ${(statSync(st.src).size / 1024).toFixed(0)} KB`);
  }));
} else if (step === "encode") {
  for (const p of plates) {
    const [w, h] = p.out;
    const src = `${W}/${p.id}-loop.mp4`;
    const out = `${VIDEOS}/meadow-${p.id}.mp4`;
    // Seamless loop: the model's last frame is near, not equal to, its first (a pop every
    // loop). Cross-fade the last second into the first: out = mix(tail, head) + body.
    const n = Number(execFileSync("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", src]).toString().trim());
    const N = 24;
    const graph = [
      `[0]scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},setsar=1,split=3[a][b][c]`,
      `[a]trim=start_frame=${n - N}:end_frame=${n},setpts=PTS-STARTPTS[tail]`,
      `[b]trim=start_frame=0:end_frame=${N},setpts=PTS-STARTPTS[head]`,
      `[c]trim=start_frame=${N}:end_frame=${n - N},setpts=PTS-STARTPTS[body]`,
      `[tail][head]xfade=transition=fade:duration=${N / 24}:offset=0[mix]`,
      `[mix][body]concat=n=2:v=1:a=0[out]`,
    ].join(";");
    // No audio, faststart; a gentle CRF: it sits under a soft overlay.
    ff("-i", src, "-filter_complex", graph, "-map", "[out]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "slow", "-crf", "27", "-g", "600", "-keyint_min", "600", "-movflags", "+faststart", "-an", out);
    ff("-i", `${W}/${p.id}-clean.png`, "-vf", `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`, "-c:v", "libwebp", "-quality", "78", `${VIDEOS}/meadow-${p.id}.webp`);
    console.log(`${out} ${(statSync(out).size / 1024).toFixed(0)} KB, poster ${(statSync(`${VIDEOS}/meadow-${p.id}.webp`).size / 1024).toFixed(0)} KB`);
  }
} else {
  console.log("usage: node plates.mjs edit|loop|encode [laptop,tab,mobile]");
  process.exit(existsSync(W) ? 0 : 1);
}
