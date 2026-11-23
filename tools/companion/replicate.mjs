// A very small Replicate client for the companion asset pipeline.
// The token comes from REPLICATE_API_TOKEN only: it is never written to disk,
// printed, or sent anywhere except api.replicate.com.
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const API = "https://api.replicate.com/v1";

function token() {
  const t = process.env.REPLICATE_API_TOKEN;
  if (!t) throw new Error("Set REPLICATE_API_TOKEN in the environment (never commit it).");
  return t;
}

async function call(path, init = {}, tries = 6) {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, ...(init.headers || {}) },
  });
  // Throttled (low-credit accounts get a small burst): wait as told, then try again.
  if (res.status === 429 && tries > 0) {
    const wait = Number(res.headers.get("retry-after")) || 6;
    await new Promise((r) => setTimeout(r, (wait + Math.random() * 2) * 1000));
    return call(path, init, tries - 1);
  }
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) throw new Error(`Replicate ${res.status}: ${typeof body === "string" ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
  return body;
}

const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".mp4": "video/mp4" };

/** Upload a local file to Replicate's file store; returns a URL usable as a model input. */
export async function upload(file) {
  const data = await readFile(file);
  const form = new FormData();
  form.append("content", new Blob([data], { type: TYPES[extname(file).toLowerCase()] || "application/octet-stream" }), basename(file));
  const out = await call("/files", { method: "POST", body: form });
  return out.urls.get;
}

/**
 * Run a model and wait for the result. `model` is "owner/name" (latest version)
 * or "owner/name:version". Returns the finished prediction.
 */
export async function run(model, input, { pollMs = 2500, timeoutMs = 15 * 60_000, log = () => {} } = {}) {
  const [name, version] = model.split(":");
  const created = version
    ? await call("/predictions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version, input }) })
    : await call(`/models/${name}/predictions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
  const started = Date.now();
  let p = created;
  log(`  ${name}: ${p.id} ${p.status}`);
  while (!["succeeded", "failed", "canceled"].includes(p.status)) {
    if (Date.now() - started > timeoutMs) throw new Error(`timed out waiting for ${p.id}`);
    await new Promise((r) => setTimeout(r, pollMs));
    p = await call(`/predictions/${p.id}`);
  }
  if (p.status !== "succeeded") throw new Error(`${name} ${p.status}: ${p.error || "no detail"}`);
  log(`  ${name}: ${p.id} done in ${((Date.now() - started) / 1000).toFixed(1)}s (predict ${p.metrics?.predict_time?.toFixed?.(1) ?? "?"}s)`);
  return p;
}

/** Download a URL (Replicate output) to a local file. */
export async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

export const firstUrl = (output) => (Array.isArray(output) ? output[0] : typeof output === "object" && output ? Object.values(output)[0] : output);
