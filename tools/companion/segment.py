#!/usr/bin/env python3
"""YOLO instance segmentation for the companion's clips.

  .work/venv/bin/python segment.py raw/move-b/play.mp4 [raw/move-a/walk.mp4 ...]

For every frame of each clip (paths relative to .work/), YOLO11-seg finds the
instances in the frame; we keep the one that is the dog and follow it from frame to
frame (best overlap with the previous frame's mask, so a butterfly or a sparkle can
never take its place). Writes .work/seg/<clip path with / -> _>.npz with:

  masks  bool [N, H, W]  the dog, at the clip's resolution
  boxes  int  [N, 4]     its box (x0, y0, x1, y1), -1 when not found
  conf   float [N]

build.py uses the mask, grown a little, as the garbage matte: the chroma key still
draws the fine fur edge, but only pixels of the dog instance survive. That drops what
the video model painted around the dog (the butterfly in "play", sparkles), and the
boxes let build.py hold a walking dog in place. Why YOLO for this and not for the
edge itself: see docs/companion/PIPELINE.md (its masks are low resolution and round
off fur tufts, but it is reliable about WHICH pixels belong to the dog).
"""
import os
import sys

import cv2
import numpy as np
from ultralytics import YOLO

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, ".work")
# What YOLO (COCO classes) calls this cartoon puppy, depending on the pose.
DOGLIKE = {"dog", "teddy bear", "cat", "bear", "sheep", "horse"}


def iou(a, b):
    inter = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return inter / union if union else 0.0


def segment(path, model, device):
    cap = cv2.VideoCapture(os.path.join(WORK, path))
    masks, boxes, confs = [], [], []
    prev = None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        h, w = frame.shape[:2]
        r = model.predict(frame, imgsz=640, conf=0.1, retina_masks=True, verbose=False, device=device)[0]
        best, best_score, best_conf = None, -1.0, 0.0
        if r.masks is not None:
            data = r.masks.data.cpu().numpy() > 0.5
            for i, m in enumerate(data):
                if m.shape != (h, w):
                    m = cv2.resize(m.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST) > 0
                area = m.mean()
                if area < 0.01:
                    continue
                name = r.names[int(r.boxes.cls[i])]
                # Follow the dog: overlap with last frame's dog wins; on the first frame,
                # the biggest dog-like instance (any instance if none is dog-like).
                score = iou(m, prev) * 2 if prev is not None else (1 if name in DOGLIKE else 0) + area
                if score > best_score:
                    best, best_score, best_conf = m, score, float(r.boxes.conf[i])
        if best is None:
            best = prev if prev is not None else np.zeros((h, w), bool)
        else:
            # YOLO sometimes folds a nearby small thing (the painted butterfly) into the
            # dog's instance as a separate island: keep the dog's own, biggest piece.
            n, labels, stats, _ = cv2.connectedComponentsWithStats(best.astype(np.uint8), 8)
            if n > 2:
                best = labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        prev = best
        ys, xs = np.where(best)
        boxes.append([xs.min(), ys.min(), xs.max(), ys.max()] if len(xs) else [-1, -1, -1, -1])
        masks.append(best)
        confs.append(best_conf)
    cap.release()
    out = os.path.join(WORK, "seg", path.replace("/", "_").replace(".mp4", ".npz"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    np.savez_compressed(out, masks=np.array(masks), boxes=np.array(boxes, dtype=np.int32), conf=np.array(confs, dtype=np.float32))
    found = sum(1 for c in confs if c > 0)
    print(f"{path}: {len(masks)} frames, dog found in {found}, mean conf {np.mean([c for c in confs if c > 0] or [0]):.2f} -> {os.path.relpath(out, HERE)}")


def main():
    import torch
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = YOLO(os.path.join(WORK, "models", "yolo11m-seg.pt"))
    for p in sys.argv[1:]:
        segment(p, model, device)


if __name__ == "__main__":
    main()
