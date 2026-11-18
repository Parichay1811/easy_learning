#!/bin/bash
# Redeploy script for the Learnigo VPS (see DEPLOY.md "Updating After a Code Push").
# Run this ON THE SERVER from the repo root: ./redeploy.sh
#
# What it does:
#   1. Pulls the latest commit of the current branch (then re-runs itself, so
#      the steps below are always the pulled version of this script)
#   2. Installs server deps (Express API + the AI voice assistant inside it)
#   3. Installs client deps and rebuilds the React site (which includes the AI
#      assistant's page at /ai-assistant/)
#   4. Restarts the API under PM2
#
# It refuses to run if there are uncommitted local changes to tracked files,
# so it never silently clobbers something edited directly on the server.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

trap 'die "redeploy failed (line $LINENO). Nothing further was run — check the output above."' ERR

[ -f "$SCRIPT_DIR/server/server.js" ] || die "server/server.js not found — is \$SCRIPT_DIR ($SCRIPT_DIR) really the repo root?"

if [ "${1:-}" != "--pulled" ]; then
    log "Checking for local changes to tracked files"
    if ! git diff --quiet HEAD -- . ':!server/.env' ':!client/.env'; then
        die "Tracked files have uncommitted changes on the server. Commit, stash, or discard them before redeploying."
    fi

    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    log "Pulling latest '$BRANCH'"
    git pull origin "$BRANCH"
    exec "$SCRIPT_DIR/redeploy.sh" --pulled
fi

# One-time move: the AI assistant used to be a standalone app in
# learnigo-ai-assistant/ with its own PM2 process. It is now part of the API
# (server/ai-assistant/). Keep its saved data (learned speech fixes, TODO list,
# voice cache) and retire the old process and folder.
OLD="$SCRIPT_DIR/learnigo-ai-assistant"
if [ -d "$OLD" ]; then
    log "Retiring the standalone AI assistant (now part of the API)"
    if pm2 describe learnigo-ai-assistant > /dev/null 2>&1; then
        pm2 delete learnigo-ai-assistant
    fi
    if [ -d "$OLD/data" ] && [ ! -d server/ai-assistant/data ]; then
        mv "$OLD/data" server/ai-assistant/data
    fi
    rm -rf "$OLD"
fi

log "Installing server dependencies (API + AI assistant)"
# --omit=dev: test-only packages (an in-memory MongoDB) are not needed in production.
(cd server && npm install --omit=dev)

log "Installing client dependencies and building"
(cd client && npm install && npm run build)

log "Restarting API with PM2"
if pm2 describe easy-learn > /dev/null 2>&1; then
    pm2 restart easy-learn
else
    (cd server && pm2 start server.js --name easy-learn)
fi
pm2 save

log "Done — current PM2 status:"
pm2 status
echo "The AI assistant loads in the background; check it with:"
echo "  curl -s http://127.0.0.1:\${PORT:-5000}/api/ai-assistant/health | head -c 200"
