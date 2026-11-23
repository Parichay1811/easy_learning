#!/usr/bin/env python3
"""Build the companion's web assets from the reviewed clips.

  python3 build.py            # reads selection.json, writes client/public/companion/

For every chosen clip: key (matte.py) -> crop all clips to ONE shared box (so the
dog never shifts between clips) -> stack colour over alpha -> H.264 MP4.
Also writes poster.webp (the home pose, transparent) and manifest.json.

Why stacked alpha in H.264 rather than WebM-alpha + HEVC-alpha: one file per
clip that every browser decodes in hardware; the page joins colour and alpha in
a tiny WebGL shader (see client/src/companion/AlphaVideo.js).
"""
import json
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from matte import matte, bbox, read_frames  # noqa: E402

WORK = os.path.join(HERE, ".work")
OUT = os.path.join(HERE, "..", "..", "client", "public", "companion")


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    sel = json.load(open(os.path.join(HERE, "selection.json")))
    width = sel.get("width", 480)
    pad = sel.get("pad", 16)
    os.makedirs(OUT, exist_ok=True)

    # 1. Key every clip and find the box that holds the dog in all of them.
    keyed, union = {}, None
    for cid, src in sel["clips"].items():
        frames, fps = read_frames(os.path.join(WORK, src))
        rgba = [matte(f) for f in frames]
        keyed[cid] = (rgba, fps)
        for im in rgba:
            b = bbox(im[..., 3], thr=24)
            if not b:
                continue
            union = b if union is None else [min(union[0], b[0]), min(union[1], b[1]), max(union[2], b[2]), max(union[3], b[3])]
    H, W = next(iter(keyed.values()))[0][0].shape[:2]
    x0, y0 = max(0, union[0] - pad), max(0, union[1] - pad)
    x1, y1 = min(W, union[2] + pad), min(H, union[3] + pad)
    cw, ch = x1 - x0, y1 - y0
    height = int(round(ch * width / cw / 2) * 2)
    print(f"shared crop {[x0, y0, x1, y1]} ({cw}x{ch}) -> {width}x{height} per half")

    # 2. Stack and encode each clip.
    manifest = {"version": sel.get("version", 1), "width": width, "height": height, "fps": 24, "clips": {}}
    tmp = os.path.join(WORK, "stack")
    for cid, (rgba, fps) in keyed.items():
        shutil.rmtree(tmp, ignore_errors=True)
        os.makedirs(tmp)
        for i, im in enumerate(rgba):
            im = cv2.resize(im[y0:y1, x0:x1], (width, height), interpolation=cv2.INTER_AREA)
            al = im[..., 3:4].astype(np.float32) / 255
            col = (im[..., :3].astype(np.float32) * al + 0.5).astype(np.uint8)  # premultiplied
            stacked = np.vstack([col, np.repeat(im[..., 3:4], 3, axis=2)])
            cv2.imwrite(os.path.join(tmp, f"s{i:04d}.png"), cv2.cvtColor(stacked, cv2.COLOR_RGB2BGR))
        out = os.path.join(OUT, f"{cid}.mp4")
        run(["ffmpeg", "-y", "-framerate", str(int(round(fps))), "-i", os.path.join(tmp, "s%04d.png"),
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "main", "-preset", "slow",
             "-crf", str(sel.get("crf", 24)), "-tune", "animation", "-g", "24", "-movflags", "+faststart", "-an", out])
        manifest["clips"][cid] = {
            "src": f"{cid}.mp4", "frames": len(rgba), "duration": round(len(rgba) / fps, 3),
            "bytes": os.path.getsize(out), **sel.get("meta", {}).get(cid, {}),
        }
        print(f"  {cid:10s} {len(rgba):4d} frames  {os.path.getsize(out) / 1024:6.1f} KB")

    # 3. Poster: the home pose (first frame of idle), transparent WebP, plus a 2x PNG for print.
    home = cv2.resize(keyed["idle"][0][0][y0:y1, x0:x1], (width, height), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUT, "poster.webp"), cv2.cvtColor(home, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 90])
    manifest["poster"] = "poster.webp"

    # 4. Where the dog's body parts are, as fractions of the frame (for gaze, bubble, shadow).
    hb = bbox(home[..., 3], thr=128)
    manifest["body"] = {
        "left": round(hb[0] / width, 4), "top": round(hb[1] / height, 4),
        "right": round(hb[2] / width, 4), "bottom": round(hb[3] / height, 4),
        **sel.get("anchors", {}),
    }
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
    total = sum(c["bytes"] for c in manifest["clips"].values())
    print(f"total {total / 1024:.0f} KB for {len(manifest['clips'])} clips; poster {os.path.getsize(os.path.join(OUT, 'poster.webp')) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
