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
from matte import matte, bbox, read_frames, instance_matte  # noqa: E402

WORK = os.path.join(HERE, ".work")
OUT = os.environ.get("COMPANION_OUT") or os.path.join(HERE, "..", "..", "client", "public", "companion")


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def seg_path(src):
    return os.path.join(WORK, "seg", src.replace("/", "_").replace(".mp4", ".npz"))


def unmix(bgr8, rgba8):
    """Colour on soft edges and motion blur, done exactly instead of by despill: an
    edge pixel is C = a*F + (1-a)*screen, so the premultiplied colour is
    C - (1-a)*screen, with the screen's colour measured from this frame. Keeps a fast
    tail or paw from turning yellow-green or pale. Returns RGBA (straight colour)."""
    rgb = cv2.cvtColor(bgr8, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    a = rgba8[..., 3].astype(np.float32) / 255
    screen = np.median(rgb[a < 0.02].reshape(-1, 3), axis=0) if (a < 0.02).any() else np.array([0.0, 1.0, 0.0])
    pre = np.clip(rgb - (1 - a[..., None]) * screen, 0, 1)
    pre = np.minimum(pre, a[..., None])
    # Any green left over on a part-transparent pixel is still the screen: no green in this dog.
    pre[..., 1] = np.minimum(pre[..., 1], np.maximum(pre[..., 0], pre[..., 2]) + 0.02 * a)
    straight = np.where(a[..., None] > 1e-3, pre / np.maximum(a[..., None], 1e-3), 0)
    # Solid pixels keep the keyed colour (it is the same there); only edges change.
    keep = rgba8[..., :3].astype(np.float32) / 255
    w = np.clip((0.98 - a) / 0.2, 0, 1)[..., None]
    out = keep * (1 - w) + np.clip(straight, 0, 1) * w
    return np.dstack([(out * 255 + 0.5).astype(np.uint8), rgba8[..., 3]])


def key_clip(spec):
    """Key one clip. `spec` is a path, or a dict:
      src        the raw clip (relative to .work/)
      range      [first, last] frame, inclusive; first > last plays it backwards
      seg        use the YOLO instance mask (segment.py) as the garbage matte
      grow       how far that mask is grown (px, default 31; tighter keeps nearby things out)
      hold       remove the dog's sideways drift (a walk cycle filmed "in place")
      unmix      exact colour on soft edges and motion blur (see unmix)
      track      record the path of whatever else moves in frame (the butterfly the
                 model painted into "play"): the live butterfly follows it
    Returns (rgba frames, fps, track or None) in full-frame pixel coordinates."""
    if isinstance(spec, str):
        spec = {"src": spec}
    frames, fps = read_frames(os.path.join(WORK, spec["src"]))
    masks = boxes = None
    if spec.get("seg") or spec.get("hold") or spec.get("track"):
        z = np.load(seg_path(spec["src"]))
        masks, boxes = z["masks"], z["boxes"]
    idx = list(range(len(frames)))
    if "range" in spec:
        a, b = spec["range"]
        idx = list(range(a, b + 1)) if a <= b else list(range(a, b - 1, -1))
    shift = np.zeros(len(frames))
    if spec.get("hold"):
        cx = (boxes[:, 0] + boxes[:, 2]) / 2.0
        ok = boxes[:, 0] >= 0
        t = np.arange(len(cx))
        trend = np.polyval(np.polyfit(t[ok], cx[ok], 1), t)
        shift = trend[idx[0]] - trend  # straight-line drift only: the bob of each step stays
        print(f"    hold: drift {trend[-1] - trend[0]:+.1f}px over the clip removed")
    rgba, track = [], []
    for k, i in enumerate(idx):
        g = instance_matte(masks[i], spec.get("grow", 31)) if (spec.get("seg") and masks is not None) else None
        im = matte(frames[i], garbage=g)
        if spec.get("unmix"):
            im = unmix(frames[i], im)
        if spec.get("track") and masks is not None:
            # The butterfly the model painted in: the solid piece just outside the dog's
            # own (YOLO) shape that has dark wing veins (fur tufts YOLO rounded off are
            # light). The tight instance matte ("grow") already keeps it out of the dog's
            # matte; its path is recorded for the live butterfly to follow.
            ell = lambda n: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (n, n))
            solid = matte(frames[i], use_garbage=False, heal=False)[..., 3] > 128
            near = cv2.dilate(masks[i].astype(np.uint8), ell(9)) > 0
            n, labels, stats, cents = cv2.connectedComponentsWithStats((solid & ~near).astype(np.uint8), 8)
            dark = cv2.cvtColor(frames[i], cv2.COLOR_BGR2HSV)[..., 2] < 90
            ok = [j for j in range(1, n) if stats[j, cv2.CC_STAT_AREA] >= 120 and dark[labels == j].mean() >= 0.05]
            if ok:
                j = max(ok, key=lambda j: stats[j, cv2.CC_STAT_AREA])
                track.append([round(k / fps, 3), float(cents[j][0] + shift[i]), float(cents[j][1])])
        if shift[i]:
            m = np.float32([[1, 0, shift[i]], [0, 1, 0]])
            im = cv2.warpAffine(im, m, (im.shape[1], im.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        rgba.append(im)
    return rgba, fps, (track if spec.get("track") else None)


def main():
    sel = json.load(open(os.path.join(HERE, "selection.json")))
    width = sel.get("width", 480)
    pad = sel.get("pad", 16)
    os.makedirs(OUT, exist_ok=True)

    # 1. Key every clip and find the box that holds the dog in all of them.
    keyed, union = {}, None
    tracks = {}
    for cid, spec in sel["clips"].items():
        rgba, fps, track = key_clip(spec)
        keyed[cid] = (rgba, fps)
        if track is not None:
            tracks[cid] = track
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
        if cid in tracks:
            # The painted butterfly's path, as fractions of the output frame (it may
            # leave the frame: values below 0 or above 1), sampled every other frame.
            manifest["clips"][cid]["track"] = [[t, round((x - x0) / cw, 3), round((y - y0) / ch, 3)] for n, (t, x, y) in enumerate(tracks[cid]) if n % 2 == 0]
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
