#!/bin/sh
# Renders Learnigo's 3D pictures headless, one scene at a time, then writes
# shared/renders.js from factory/blender/meta.
#   factory/blender/render-all.sh                 every scene
#   factory/blender/render-all.sh heart lungs     some scenes
#   ARGS="--no-loop" factory/blender/render-all.sh heart   the still only (keeps the old loop)
#   ARGS="--fast" ...                              half size, few samples (a quick look)
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/../.." || exit 1
if [ $# -eq 0 ]; then set -- $(ls "$DIR/scenes" | sed -n 's/\.py$//p'); fi
fail=0
for name in "$@"; do
  f="$DIR/scenes/$name.py"
  [ -f "$f" ] || { echo "no scene $name"; fail=1; continue; }
  echo "== $name"
  "$BLENDER" -b --factory-startup -P "$f" -- $ARGS 2>&1 | grep -E "^(STILL|LOOP|MP4|DONE|WARNING)|Error|Traceback" || true
  [ -f "$DIR/meta/$name.json" ] || fail=1
done
node "$DIR/build-manifest.mjs"
exit $fail
