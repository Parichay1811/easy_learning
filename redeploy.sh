#!/bin/bash
# Redeploy script for the Easy Learn VPS (see DEPLOY.md "Updating After a Code Push").
# Run this ON THE SERVER from the repo root: ./redeploy.sh
#
# What it does:
#   1. Pulls the latest main branch
#   2. Installs server deps
#   3. Installs client deps and rebuilds the React app
#   4. Restarts the Express API under PM2
#   5. If the AI voice assistant repo is present, updates and restarts it too
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

log "Checking for local changes to tracked files"
if ! git diff --quiet HEAD -- . ':!server/.env' ':!client/.env'; then
    die "Tracked files have uncommitted changes on the server. Commit, stash, or discard them before redeploying."
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
log "Pulling latest '$BRANCH'"
git pull origin "$BRANCH"

log "Installing server dependencies"
(cd server && npm install)

log "Installing client dependencies and building"
(cd client && npm install && npm run build)

log "Restarting API with PM2"
if pm2 describe easy-learn > /dev/null 2>&1; then
    pm2 restart easy-learn
else
    (cd server && pm2 start server.js --name easy-learn)
fi

if [ -d "$SCRIPT_DIR/client/src/learnigo-ai-assistant/.git" ]; then
    log "AI assistant repo detected — updating"
    (
        cd client/src/learnigo-ai-assistant
        ASSISTANT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
        git pull origin "$ASSISTANT_BRANCH"
        npm install
    )
    if pm2 describe learnigo-ai-assistant > /dev/null 2>&1; then
        pm2 restart learnigo-ai-assistant
    else
        pm2 start server.mjs --name learnigo-ai-assistant --cwd "$SCRIPT_DIR/client/src/learnigo-ai-assistant"
    fi
else
    log "AI assistant repo not found — skipping (optional component, see DEPLOY.md)"
fi

pm2 save

log "Done — current PM2 status:"
pm2 status
