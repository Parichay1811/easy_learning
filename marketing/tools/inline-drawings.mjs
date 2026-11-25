// Copy assets/brand/drawings.js into every composition that uses it.
//
//   node tools/inline-drawings.mjs     (render.sh runs this for you)
//
// The HyperFrames renderer bundles media but not external scripts, so the drawing library
// is inlined between <!-- drawings:begin --> and <!-- drawings:end --> in each index.html.
// Edit assets/brand/drawings.js, never the inlined copy.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lib = readFileSync(path.join(root, "assets/brand/drawings.js"), "utf8");
const block = `<!-- drawings:begin (inlined from assets/brand/drawings.js by tools/inline-drawings.mjs; edit that file) -->\n  <script>\n${lib}\n  </script>\n  <!-- drawings:end -->`;
const re = /<!-- drawings:begin[\s\S]*?<!-- drawings:end -->|<script src="assets\/brand\/drawings\.js"><\/script>/;
for (const v of readdirSync(path.join(root, "videos"))) {
  const f = path.join(root, "videos", v, "index.html");
  if (!existsSync(f)) continue;
  const html = readFileSync(f, "utf8");
  if (!re.test(html)) continue;
  writeFileSync(f, html.replace(re, block));
  console.log("inlined drawings →", v);
}
