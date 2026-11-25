#!/usr/bin/env bash
# Turn the site's puppy clips into transparent WebM files for the videos.
#
# The site stores each clip "stacked": colour on top, alpha mask underneath
# (480x888 -> 480x444 + 480x444). Browsers can't use that directly in a video, so we
# merge the two halves into a real alpha channel (VP9 + yuva420p) once, here.
#
# Usage: bash marketing/tools/companion.sh   (from the repo root or anywhere)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
src="$here/../../client/public/companion"
out="$here/../assets/companion"
mkdir -p "$out"

for clip in hello idle cheer point play talk walk tilt sleepy comfort lookLeft lookRight sitDown standUp; do
  [ -f "$src/$clip.mp4" ] || { echo "skip $clip (missing)"; continue; }
  ffmpeg -v error -y -i "$src/$clip.mp4" -filter_complex \
    "[0:v]crop=iw:ih/2:0:0[c];[0:v]crop=iw:ih/2:0:ih/2,format=gray[a];[c][a]alphamerge,format=yuva420p[v]" \
    -map "[v]" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -row-mt 1 -an "$out/$clip.webm"
  # A still PNG (first good frame) for places that want an image, not a clip.
  ffmpeg -v error -y -ss 0.5 -i "$src/$clip.mp4" -filter_complex \
    "[0:v]crop=iw:ih/2:0:0[c];[0:v]crop=iw:ih/2:0:ih/2,format=gray[a];[c][a]alphamerge[v]" \
    -map "[v]" -frames:v 1 "$out/$clip.png"
  echo "ok  $clip"
done
