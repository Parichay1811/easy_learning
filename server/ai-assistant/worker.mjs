// The AI assistant's own process. server.js starts it (services/aiAssistant.js)
// and forwards /api/ai-assistant/* to it, so its CPU-heavy speech, search and
// LLM work never blocks the API's event loop (in-process, it starved the whole
// API on a small server) and a crash here never takes the API down.
//
// It listens on a free port on 127.0.0.1 only and tells the parent which one
// over IPC: { type: "ready", port } once the packs and models are loaded.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A lower CPU priority (nice 10 by default, AI_ASSISTANT_NICE to change it),
// set before the models load so their threads and the speech process inherit
// it: when the server is busy, the API's requests go first.
try {
  os.setPriority(Number(process.env.AI_ASSISTANT_NICE ?? 10));
} catch {
  /* not permitted here: run at the normal priority */
}

// Small servers (2 CPUs or fewer, or under 6 GB of RAM — like the production
// VPS, which it shares with other apps) get a profile that keeps the teacher
// quick there by leaving the heaviest work out. AI_ASSISTANT_PROFILE=full or
// small forces one; any LT_* setting in server/.env still wins over it.
const SMALL = {
  // The voice is the browser's own (speechSynthesis): no voice model on the
  // server (~700 MB of RAM, seconds of CPU per sentence).
  LT_TTS: "browser",
  // No language model (~0.5 GB, the slowest part on a CPU): answers come from
  // the lesson packs, the maths rules, Wikipedia and open data; anything else
  // is a TODO for a new pack, as before.
  LT_LLM: "off",
  // The smaller Moonshine for hearing, with 2 guesses instead of 4: a few
  // times less CPU per question; the lesson-word checks still run.
  LT_ASR: "moonshine-tiny",
  LT_ASR_BEAMS: "2",
};
const profile =
  process.env.AI_ASSISTANT_PROFILE ||
  (os.availableParallelism() <= 2 || os.totalmem() < 6 * 2 ** 30 ? "small" : "full");
if (profile === "small") {
  for (const [k, v] of Object.entries(SMALL)) process.env[k] ??= v;
  // The knowledge base's sentence vectors (~90,000 phrasings) take minutes to
  // make on a fast machine and days on a small, busy one. Without the saved
  // file, search by words only, and say how to bring the file over.
  const data = process.env.LT_DATA || path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
  if (process.env.LT_EMBED === undefined && !fs.existsSync(path.join(data, "embeddings-Xenova_bge_small_en_v1_5.bin"))) {
    process.env.LT_EMBED = "off";
    console.warn(
      "AI assistant: no saved search vectors, so word search only. To search by meaning too, run the assistant once on a faster machine and copy its data/embeddings-Xenova_bge_small_en_v1_5.{bin,keys.json} into " + data,
    );
  }
}
console.log(
  `AI assistant profile: ${profile} (${os.availableParallelism()} CPUs, ${Math.round(os.totalmem() / 2 ** 30)} GB)`,
);

const { createAIAssistant } = await import("./index.mjs");
const assistant = await createAIAssistant();
const server = http.createServer((req, res) => assistant.handle(req, res));
server.listen(0, "127.0.0.1", () => {
  process.send?.({ type: "ready", port: server.address().port });
});

function stop() {
  try {
    assistant.close();
  } finally {
    process.exit(0);
  }
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
// The API went away (its IPC channel closed): go with it.
process.on("disconnect", stop);
// A stray failed promise is logged; it never takes the assistant down.
process.on("unhandledRejection", (e) => console.error("ai-assistant unhandled:", e));
