// The AI assistant's own process. server.js starts it (services/aiAssistant.js)
// and forwards /api/ai-assistant/* to it, so its CPU-heavy speech, search and
// LLM work never blocks the API's event loop (in-process, it starved the whole
// API on a small server) and a crash here never takes the API down.
//
// It listens on a free port on 127.0.0.1 only and tells the parent which one
// over IPC: { type: "ready", port } once the packs and models are loaded.
import http from "node:http";
import os from "node:os";

// A lower CPU priority (nice 10 by default, AI_ASSISTANT_NICE to change it),
// set before the models load so their threads and the speech process inherit
// it: when the server is busy, the API's requests go first.
try {
  os.setPriority(Number(process.env.AI_ASSISTANT_NICE ?? 10));
} catch {
  /* not permitted here: run at the normal priority */
}

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
