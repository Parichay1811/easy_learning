#!/usr/bin/env python3
"""Companion asset matting: green-screen clips -> clean transparent frames.

Why a chroma key first: the clips are generated on a flat green background, so a
per-pixel "how green is this" key keeps fine fur edges and is the same on every
frame (no flicker). A segmentation mask (largest connected shape, or YOLO when
asked) is used only as a garbage matte: it removes stray specks the video model
may add, never the edges. See docs/companion/PIPELINE.md.

Sub-commands
  ref    mascot RGBA -> the mascot on green (to upscale)
  place  upscaled green image -> square "home pose" plate for the video model
  key    green clip (mp4) -> RGBA PNG frames + stats.json (bbox, flicker)
  stack  RGBA frames -> colour-over-alpha frames (one H.264 file plays everywhere)
  compare  frames from a clip -> chroma vs YOLO matte comparison sheet + numbers
"""
import argparse
import json
import os
import subprocess
import sys

import cv2
import numpy as np

GREEN = (0, 255, 0)  # RGB


def key_alpha(rgb):
    """Alpha from green dominance: G - max(R, B). Float RGB 0..1 in, alpha 0..1 out."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dom = g - np.maximum(r, b)
    # below t0 = foreground, above t1 = background, linear in between (soft fur edges)
    t0, t1 = 0.05, 0.28
    return 1.0 - np.clip((dom - t0) / (t1 - t0), 0.0, 1.0)


def despill(rgb):
    """Pull green spill out of edges: G can not be greener than max(R, B).

    The character has no green and no yellow-green (golden fur is R > G > B, the star
    is R >= G), so a "greener than red, little blue" pixel is spill from the screen
    (e.g. where the source cut-out had a ragged bite in an ear): warm it back to fur.
    """
    out = rgb.copy()
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lim = np.maximum(r, b)
    out[..., 1] = np.minimum(g, lim + 0.02)
    yellow_green = (g > r) & (b < 0.7 * g)
    out[..., 1] = np.where(yellow_green, np.minimum(out[..., 1], r * 0.9), out[..., 1])
    return out


def garbage_matte(alpha, grow=18):
    """Keep only the biggest solid shape (the dog), grown a little so edges survive."""
    solid = (alpha > 0.5).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    if n <= 1:
        return np.ones_like(alpha)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    keep = (labels == big).astype(np.uint8)
    # fill holes (eyes, mouth are not holes in alpha, but be safe)
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
    return keep.astype(np.float32)


def heal_bites(a, rgb, kernel=17, max_area=900, head_share=0.45):
    """Fill small bites in the head's outline (the source cut-out had a ragged notch in
    one ear, which the video model painted green). Only in the top part of the dog, and
    only small pieces: real gaps lower down (tail, legs) are left alone. The colour of
    a filled pixel is inpainted from the fur around it."""
    solid = (a > 0.5).astype(np.uint8)
    ys, xs = np.where(solid)
    if len(ys) == 0:
        return a, rgb
    y0, y1 = ys.min(), ys.max()
    limit = int(y0 + head_share * (y1 - y0))
    closed = cv2.morphologyEx(solid, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel, kernel)))
    bite = ((closed > 0) & (solid == 0)).astype(np.uint8)
    bite[limit:] = 0
    n, labels, stats, _ = cv2.connectedComponentsWithStats(bite, 8)
    fill = np.zeros_like(bite)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] <= max_area:
            fill[labels == i] = 1
    if not fill.any():
        return a, rgb
    soft = cv2.GaussianBlur(fill.astype(np.float32), (5, 5), 0)
    a = np.maximum(a, np.clip(soft * 1.4, 0, 1))
    grow = cv2.dilate(fill, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    rgb8 = (np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)
    painted = cv2.inpaint(rgb8, grow, 6, cv2.INPAINT_TELEA).astype(np.float32) / 255
    rgb = np.where(grow[..., None] > 0, painted, rgb)
    return a, rgb


def instance_matte(mask, grow=31):
    """A YOLO instance mask (segment.py), grown so the chroma key keeps the fur edge:
    YOLO decides WHICH pixels are the dog, the key decides the exact edge."""
    m = cv2.dilate(mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
    return cv2.GaussianBlur(m.astype(np.float32), (9, 9), 0)


def matte(bgr8, use_garbage=True, heal=True, garbage=None):
    """`garbage`: an instance matte from instance_matte() to use instead of the
    largest-shape rule (clips run through segment.py)."""
    rgb = cv2.cvtColor(bgr8, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    a = key_alpha(rgb)
    # a whisker of blur on the alpha hides compression blocks on the edge
    a = cv2.GaussianBlur(a, (3, 3), 0)
    if garbage is not None:
        a = a * garbage  # only the dog instance...
    if use_garbage:
        a = a * garbage_matte(a)  # ...and only its one solid shape: no floating specks
    rgb = despill(rgb)
    if heal:
        a, rgb = heal_bites(a, rgb)
    rgba = np.dstack([rgb, a])
    return (np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8)


def bbox(alpha8, thr=128):
    ys, xs = np.where(alpha8 >= thr)
    if len(xs) == 0:
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]


def read_frames(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    cap.release()
    return frames, fps


def cmd_ref(a):
    im = cv2.imread(a.input, cv2.IMREAD_UNCHANGED)
    h, w = im.shape[:2]
    pad = a.pad
    canvas = np.zeros((h + 2 * pad, w + 2 * pad, 3), np.float32)
    canvas[:] = (GREEN[2] / 255, GREEN[1] / 255, GREEN[0] / 255)
    fg = im[..., :3].astype(np.float32) / 255
    al = im[..., 3:4].astype(np.float32) / 255
    roi = canvas[pad:pad + h, pad:pad + w]
    canvas[pad:pad + h, pad:pad + w] = fg * al + roi * (1 - al)
    cv2.imwrite(a.out, (canvas * 255 + 0.5).astype(np.uint8))
    print(json.dumps({"out": a.out, "size": [w + 2 * pad, h + 2 * pad]}))


def cmd_place(a):
    im = cv2.imread(a.input, cv2.IMREAD_COLOR)
    rgba = matte(im)
    bb = bbox(rgba[..., 3])
    x0, y0, x1, y1 = bb
    dog = rgba[y0:y1 + 1, x0:x1 + 1]
    S = a.size
    target_h = int(S * a.height)
    scale = target_h / dog.shape[0]
    dog = cv2.resize(dog, (int(dog.shape[1] * scale), target_h), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((S, S, 3), np.float32)
    canvas[:] = (GREEN[2] / 255, GREEN[1] / 255, GREEN[0] / 255)
    dh, dw = dog.shape[:2]
    ox = (S - dw) // 2
    oy = S - int(S * a.floor) - dh
    fg = cv2.cvtColor(dog[..., :3], cv2.COLOR_RGB2BGR).astype(np.float32) / 255
    al = dog[..., 3:4].astype(np.float32) / 255
    roi = canvas[oy:oy + dh, ox:ox + dw]
    canvas[oy:oy + dh, ox:ox + dw] = fg * al + roi * (1 - al)
    cv2.imwrite(a.out, (canvas * 255 + 0.5).astype(np.uint8))
    print(json.dumps({"out": a.out, "dog": [ox, oy, ox + dw, oy + dh], "size": S}))


def cmd_key(a):
    frames, fps = read_frames(a.input)
    os.makedirs(a.out, exist_ok=True)
    boxes, prev, flicker = [], None, []
    for i, f in enumerate(frames):
        rgba = matte(f, use_garbage=not a.no_garbage)
        al = rgba[..., 3]
        boxes.append(bbox(al))
        if prev is not None:
            # edge flicker: mean alpha change where either frame is semi-transparent
            band = ((prev > 8) & (prev < 247)) | ((al > 8) & (al < 247))
            if band.any():
                flicker.append(float(np.abs(al[band].astype(np.int16) - prev[band].astype(np.int16)).mean()))
        prev = al
        cv2.imwrite(os.path.join(a.out, f"f{i:04d}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    h, w = frames[0].shape[:2]
    valid = [b for b in boxes if b]
    union = [min(b[0] for b in valid), min(b[1] for b in valid), max(b[2] for b in valid), max(b[3] for b in valid)] if valid else None
    first, last = boxes[0], boxes[-1]
    stats = {
        "frames": len(frames), "fps": fps, "size": [w, h], "union": union, "first": first, "last": last,
        "edge_flicker_mean": round(float(np.mean(flicker)), 2) if flicker else 0,
        "edge_flicker_p95": round(float(np.percentile(flicker, 95)), 2) if flicker else 0,
    }
    with open(os.path.join(a.out, "stats.json"), "w") as fh:
        json.dump(stats, fh, indent=1)
    print(json.dumps(stats))


def cmd_stack(a):
    """RGBA frames -> frames with colour on top and alpha (as grey) below.

    The page draws the top half and uses the bottom half as transparency, in WebGL.
    Colour is premultiplied on black so edges never show a fringe when filtered.
    """
    names = sorted(n for n in os.listdir(a.input) if n.endswith(".png"))
    os.makedirs(a.out, exist_ok=True)
    crop = json.loads(a.crop) if a.crop else None
    for i, n in enumerate(names):
        im = cv2.imread(os.path.join(a.input, n), cv2.IMREAD_UNCHANGED)
        if crop:
            x0, y0, x1, y1 = crop
            im = im[y0:y1, x0:x1]
        if a.width:
            h = int(round(im.shape[0] * a.width / im.shape[1] / 2) * 2)
            im = cv2.resize(im, (a.width, h), interpolation=cv2.INTER_AREA)
        al = im[..., 3:4].astype(np.float32) / 255
        col = (im[..., :3].astype(np.float32) * al + 0.5).astype(np.uint8)
        alpha = np.repeat(im[..., 3:4], 3, axis=2)
        cv2.imwrite(os.path.join(a.out, f"s{i:04d}.png"), np.vstack([col, alpha]))
    print(json.dumps({"frames": len(names), "out": a.out}))


def cmd_compare(a):
    """Chroma key vs YOLO segmentation on sample frames: picture + numbers."""
    frames, _ = read_frames(a.input)
    idx = sorted(set([0, len(frames) // 4, len(frames) // 2, (3 * len(frames)) // 4, len(frames) - 1]))
    try:
        from ultralytics import YOLO
    except ImportError:
        print("ultralytics not installed", file=sys.stderr)
        sys.exit(2)
    model = YOLO(a.model)
    rows, report = [], []
    prev_y = prev_c = None
    for i in range(len(frames)):
        f = frames[i]
        c = matte(f)[..., 3]
        res = model.predict(f, verbose=False, retina_masks=True, conf=0.15)[0]
        y = np.zeros(f.shape[:2], np.uint8)
        label = "none"
        if res.masks is not None and len(res.masks):
            areas = res.masks.data.sum(dim=(1, 2)).cpu().numpy()
            k = int(np.argmax(areas))
            y = (res.masks.data[k].cpu().numpy() > 0.5).astype(np.uint8) * 255
            if y.shape != f.shape[:2]:
                y = cv2.resize(y, (f.shape[1], f.shape[0]), interpolation=cv2.INTER_NEAREST)
            label = res.names[int(res.boxes.cls[k])]
        cb = c >= 128
        yb = y >= 128
        inter = (cb & yb).sum()
        union = (cb | yb).sum()
        row = {"frame": i, "yolo_class": label, "iou_vs_chroma": round(float(inter / union), 3) if union else 0}
        if prev_y is not None:
            row["yolo_frame_iou"] = round(float(((prev_y >= 128) & yb).sum() / max(1, ((prev_y >= 128) | yb).sum())), 3)
            row["chroma_frame_iou"] = round(float(((prev_c >= 128) & cb).sum() / max(1, ((prev_c >= 128) | cb).sum())), 3)
        prev_y, prev_c = y, c
        report.append(row)
        if i in idx:
            def on_dark(alpha8):
                al = alpha8.astype(np.float32)[..., None] / 255
                bg = np.zeros_like(f, np.float32)
                bg[:] = (60, 40, 30)
                return (f.astype(np.float32) * al + bg * (1 - al)).astype(np.uint8)
            tile = np.hstack([f, on_dark(c), on_dark(y)])
            rows.append(cv2.resize(tile, (tile.shape[1] // 2, tile.shape[0] // 2)))
    cv2.imwrite(a.out, np.vstack(rows))
    ious = [r["iou_vs_chroma"] for r in report]
    yf = [r["yolo_frame_iou"] for r in report if "yolo_frame_iou" in r]
    cf = [r["chroma_frame_iou"] for r in report if "chroma_frame_iou" in r]
    summary = {
        "frames": len(report),
        "yolo_found_dog_frames": sum(1 for r in report if r["yolo_class"] != "none"),
        "yolo_classes": sorted(set(r["yolo_class"] for r in report)),
        "mean_iou_yolo_vs_chroma": round(float(np.mean(ious)), 3),
        "yolo_frame_to_frame_iou_mean": round(float(np.mean(yf)), 4) if yf else None,
        "chroma_frame_to_frame_iou_mean": round(float(np.mean(cf)), 4) if cf else None,
    }
    with open(a.out.rsplit(".", 1)[0] + ".json", "w") as fh:
        json.dump({"summary": summary, "frames": report}, fh, indent=1)
    print(json.dumps(summary))


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("ref"); r.add_argument("input"); r.add_argument("out"); r.add_argument("--pad", type=int, default=24)
    pl = sub.add_parser("place"); pl.add_argument("input"); pl.add_argument("out")
    pl.add_argument("--size", type=int, default=1440); pl.add_argument("--height", type=float, default=0.66); pl.add_argument("--floor", type=float, default=0.06)
    k = sub.add_parser("key"); k.add_argument("input"); k.add_argument("out"); k.add_argument("--no-garbage", action="store_true")
    s = sub.add_parser("stack"); s.add_argument("input"); s.add_argument("out"); s.add_argument("--crop"); s.add_argument("--width", type=int)
    c = sub.add_parser("compare"); c.add_argument("input"); c.add_argument("out"); c.add_argument("--model", default="yolo11m-seg.pt")
    a = p.parse_args()
    {"ref": cmd_ref, "place": cmd_place, "key": cmd_key, "stack": cmd_stack, "compare": cmd_compare}[a.cmd](a)


if __name__ == "__main__":
    main()
