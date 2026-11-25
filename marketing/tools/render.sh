#!/usr/bin/env bash
# Render the videos for upload.
#
#   bash tools/render.sh                 # every video in videos/
#   bash tools/render.sh 04-ai-teacher   # just one (folder name under videos/)
#   QUALITY=draft bash tools/render.sh   # fast preview quality
#
# For each video this writes to renders/:
#   <name>.mp4        final file: H.264, AAC, loudness -14 LUFS / -1.5 dBTP (YouTube + LinkedIn)
#   <name>.srt        captions to upload alongside (YouTube "Subtitles", LinkedIn "Captions")
#   <name>-thumb.jpg  thumbnail from the hook frame
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
cd "$here"
quality="${QUALITY:-delivery}"
mkdir -p renders
node tools/inline-drawings.mjs >/dev/null   # the renderer can't load external scripts

# second at which the hook is fully on screen (used for the thumbnail)
thumb_at() {
  case "$1" in
    01-meet-learnigo) echo 4.3 ;;
    02-every-kind-of-mind) echo 4.4 ;;
    03-schools-and-teachers) echo 3.8 ;;
    04-ai-teacher) echo 2.6 ;;
    05-learn-by-moving) echo 1.2 ;;
    m1-born-curious) echo 2.8 ;;
    m2-dear-child) echo 16.8 ;;
    m3-same-wonder) echo 4.9 ;;
    m4-ten-minutes) echo 7.9 ;;
    *) echo 1 ;;
  esac
}

videos=("$@")
[ ${#videos[@]} -eq 0 ] && videos=($(ls videos))
for v in "${videos[@]}"; do
  dir="videos/$v"
  [ -f "$dir/index.html" ] || { echo "skip $v"; continue; }
  echo "▶ $v"
  if ! (cd "$dir" && npx hyperframes render --quality "$quality" --strict -o "../../renders/$v.raw.mp4" > "$here/renders/.$v.log" 2>&1); then
    echo "  ✗ render failed, see renders/.$v.log"; continue
  fi
  rm -f "renders/.$v.log"
  ffmpeg -v error -y -i "renders/$v.raw.mp4" -c:v copy \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "renders/$v.mp4"
  rm "renders/$v.raw.mp4"
  cp "$dir/captions.srt" "renders/$v.srt"
  ffmpeg -v error -y -ss "$(thumb_at "$v")" -i "renders/$v.mp4" -frames:v 1 -q:v 2 "renders/$v-thumb.jpg"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "renders/$v.mp4")
  size=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=s=x:p=0 "renders/$v.mp4")
  echo "  ✓ renders/$v.mp4  ${size}  ${dur}s"
done
