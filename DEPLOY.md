# Learnigo — Hostinger VPS Deployment Guide

**Domain:** `www.learnigo.eu` (canonical) — `learnigo.eu` and `quizify.cloud` 301-redirect here  
**Stack:** React 19 (Vite) + Express.js + MongoDB Atlas (MERN)  
**Node version:** `22.18.0` (matches local dev machine)  
**Strategy:** Nginx serves the built React SPA (including the AI voice assistant's page at `/ai-assistant/`); PM2 keeps the Express API alive (one PM2 process, which runs the AI voice assistant as a supervised child process); MongoDB Atlas as the database.

---

## Before You Start — Remote Allowlists

Do these two things **before touching the server**, or the app will fail to connect.

### MongoDB Atlas — Whitelist the VPS IP
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to **Network Access → Add IP Address**
3. Add the VPS IP (`31.97.224.109`) → Save — Atlas needs the IP, not a domain name

### Firebase — Authorize the Domain
1. Open [Firebase Console](https://console.firebase.google.com) → project **learningo-c9ac4**
2. Go to **Authentication → Settings → Authorized Domains**
3. Add `www.learnigo.eu` and `learnigo.eu` → Save

---

## 1. Connect to the Server

```bash
ssh root@www.learnigo.eu
```

---

## 2. System Updates & Essential Tools

```bash
apt update && apt upgrade -y
apt install -y git curl build-essential ufw nginx
```

---

## 3. Install Node.js 22.18.0

This matches your local dev machine exactly.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v   # must print v22.x.x
npm -v    # should print 10.x.x
```

---

## 4. Install PM2

```bash
npm install -g pm2
```

---

## 5. Clone the Repository

```bash
cd /var/www
git clone https://github.com/SutirthaChakraborty/easy_learning.git
cd easy_learning
```

> Replace the URL with your actual GitHub repo URL.

---

## 6. Set Up Server Environment Variables

```bash
cd /var/www/easy_learning/server
nano .env
```

Copy the block below and fill in your values. Your local `server/.env` already has all of these — copy every value across (not just `MONGODB_URI`/`JWT_SECRET`), and only update `CLIENT_URL`. The app uses **three separate MongoDB connections** (main, admin, super-admin) and **four separate JWT secrets** (student, admin, super-admin, teacher) — if any of these are missing, that login flow's Google sign-in throws and the API returns a generic "Internal server error".

```env
PORT=5000

# Main app DB (students)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.wqthdik.mongodb.net/mydb?retryWrites=true&w=majority
JWT_SECRET=<replace-with-a-long-random-string>
JWT_EXPIRES_IN=7d

# Admin DB (org admins + tutors/teachers) — separate cluster
ADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.r9mcewc.mongodb.net/admindb?retryWrites=true&w=majority
ADMIN_JWT_SECRET=<replace-with-a-long-random-string>
ADMIN_JWT_EXPIRES_IN=7d

# Super-admin DB — separate cluster
SUPERADMIN_MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xszbqqt.mongodb.net/superadmindb?retryWrites=true&w=majority
SUPERADMIN_JWT_SECRET=<replace-with-a-long-random-string>

# Teacher auth (uses the admin DB's Tutor model, but its own JWT secret)
TEACHER_JWT_SECRET=<replace-with-a-long-random-string>
TEACHER_JWT_EXPIRES_IN=7d

CLIENT_URL=https://www.learnigo.eu
```

> **`CLIENT_URL`** must be exactly `https://www.learnigo.eu` — this is what Express uses for CORS.  
> **`MONGODB_URI` / `ADMIN_MONGODB_URI` / `SUPERADMIN_MONGODB_URI`** — copy the full URIs from your local `server/.env`; each points to a different Atlas cluster (`wqthdik`, `r9mcewc`, `xszbqqt` respectively).  
> **Every `*_JWT_SECRET`** — generate a strong secret per key: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. It's fine to reuse your local `.env` values instead of regenerating.  
> **MongoDB Atlas Network Access** — remember all three clusters need the VPS IP whitelisted (see "Before You Start"), not just the one `mydb` cluster.

---

## 7. Set Up Client Environment Variables

```bash
cd /var/www/easy_learning/client
nano .env
```

```env
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_API_BASE_URL=https://www.learnigo.eu/api
```

> **`VITE_FIREBASE_API_KEY`** — copy from your local `client/.env`.  
> **`VITE_API_BASE_URL`** — tells React where to send API requests; Nginx will proxy `/api` → Express on port 5000.  
> All other Firebase values (`authDomain`, `projectId`, etc.) are already hardcoded in `client/src/firebase/auth.js` — no changes needed there.

---

## 8. Install Dependencies & Build the Client

```bash
# Server dependencies
cd /var/www/easy_learning/server
npm install

# Client dependencies + production build
cd /var/www/easy_learning/client
npm install
npm run build
```

The production-ready static files are now in `/var/www/easy_learning/client/dist/` (the AI voice assistant's page is in `dist/ai-assistant/`). The server install includes the assistant's native speech/LLM packages — see "The AI Voice Assistant" below for disk and RAM.

---

## 9. Seed the Database (First Deploy Only)

```bash
cd /var/www/easy_learning/server
npm run seed
```

Skip this on subsequent deploys.

---

## 10. Start the API with PM2

```bash
cd /var/www/easy_learning/server
pm2 start server.js --name easy-learn
pm2 save

# Make PM2 auto-start on server reboot
pm2 startup
# Run the command that PM2 prints out
```

Check it is running:

```bash
pm2 status
pm2 logs easy-learn --lines 30
```

---

## 11. Configure Nginx

```bash
nano /etc/nginx/sites-available/easy-learn
```

Paste:

```nginx
# Canonical app — www.learnigo.eu
server {
    listen 80;
    server_name www.learnigo.eu;

    # Serve the React build
    root /var/www/easy_learning/client/dist;
    index index.html;

    # React Router — all unknown paths fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy /api/* to Express on port 5000
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Bare apex redirects to the canonical www host
server {
    listen 80;
    server_name learnigo.eu;
    return 301 https://www.learnigo.eu$request_uri;
}

# Old domain redirects to the canonical host
server {
    listen 80;
    server_name quizify.cloud www.quizify.cloud;
    return 301 https://www.learnigo.eu$request_uri;
}
```

Run `certbot --nginx -d www.learnigo.eu -d learnigo.eu -d quizify.cloud -d www.quizify.cloud` afterward — it detects these server blocks by `server_name`, issues/reuses certificates, and rewrites each block in place to add the `listen 443 ssl` and HTTP→HTTPS redirect directives automatically. Say yes when it offers to redirect HTTP to HTTPS.

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/easy-learn /etc/nginx/sites-enabled/
nginx -t                  # must say "syntax is ok"
systemctl reload nginx
```

---

## 12. Open the Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'    # opens ports 80 and 443
ufw enable
ufw status
```

---

## 13. Verify Everything Works

Open in your browser:

```
https://www.learnigo.eu
```

Test the API directly from your machine:

```bash
curl https://www.learnigo.eu/api/learn
```

Also confirm the old hosts redirect correctly:

```bash
curl -I https://learnigo.eu/
curl -I https://quizify.cloud/
```

Both should return `301` with `Location: https://www.learnigo.eu/`.

---

## The AI Voice Assistant

The AI voice assistant ("AI teacher", **`server/ai-assistant/`**) is part of the app, not a separate service:

- its API is served by the Express app (`easy-learn`) at `/api/ai-assistant/*`, so the existing Nginx `location /api/` already serves it. The API runs the assistant's heavy speech/LLM work in its own child process at a lower CPU priority (nice 10, `AI_ASSISTANT_NICE`), restarts it if it exits, and stops it with the API — so it can't block or crash the API on a small, busy server;
- its page is part of the **React build** (`client/dist/ai-assistant/`), served by the existing `try_files` at `/ai-assistant/`. Students reach it from the **AI Teacher** item in the main navigation (`/ai-teacher`, a site page that embeds it) or the floating "Ask AI" button.

So there is no extra PM2 process, subdomain, Nginx block or env var. Steps 8 and 10 above already install, build and start it.

**Resources:** the server install includes native speech/LLM packages (`node-llama-cpp`, `onnxruntime-node`, `@huggingface/transformers`), so `npm install` in `server/` needs a few GB of disk; models download on first start into `~/.cache/learnigo-teacher`.

The assistant picks a profile from the machine (override with `AI_ASSISTANT_PROFILE=small|full` in `server/.env`):

| | **small** (≤ 2 CPUs or < 6 GB RAM — this VPS) | **full** |
|---|---|---|
| Teacher's voice | the student's browser (`speechSynthesis`) — no server CPU | Supertonic on the server |
| Language model | off: answers from lesson packs, maths rules, Wikipedia, open data; misses become TODOs | Qwen3.5 0.8B for questions outside the packs |
| Hearing | Moonshine tiny, 2 guesses | Moonshine base, 4 guesses |
| RAM (assistant processes) | ~1.1 GB | ~2.5 GB |

**Search vectors — copy them, don't make them on the VPS.** Meaning-based search needs vectors for ~90,000 phrasings: minutes on a laptop, days on a small busy server. After running the assistant once locally (`npm run dev`), copy them over; until they're there, a small server searches by words only (and says so in `pm2 logs easy-learn`):

```bash
scp server/ai-assistant/data/embeddings-Xenova_bge_small_en_v1_5.{bin,keys.json} root@31.97.224.109:/var/www/easy_learning/server/ai-assistant/data/
ssh root@31.97.224.109 'pm2 restart easy-learn'
```

They stay valid until the lesson packs change; new packs only add a few vectors, which the server makes itself.

**CPU steal:** Hostinger throttles a VPS whose CPU stays maxed out (`top` shows it as `st`). Keep crash-looping processes off this box (`pm2 ls` — watch the ↺ restarts column), or every app on it slows down, the assistant first.

**Startup:** the API listens immediately; the assistant's process loads its packs and models (under a minute when the models are cached) and its routes answer 503 until then. `pm2 logs easy-learn` shows "AI assistant ready (pid …)". Check it with:

```bash
curl -s http://127.0.0.1:5000/api/ai-assistant/health | head -c 200   # "ready":true once loaded
```

**Optional Nginx tweaks** in the `www.learnigo.eu` server block, inside `location /api/`:

```nginx
        client_max_body_size 2m;   # spoken questions over ~15 s are sent as ~1.3 MB of audio (default limit: 1m)
```

(Streaming answers already work: the assistant sends `X-Accel-Buffering: no`.)

### Moving from the old standalone assistant (one time)

Earlier deploys ran it as its own app in `learnigo-ai-assistant/` (PM2 process `learnigo-ai-assistant`, port 4173, `assistant.learnigo.eu`). The new `redeploy.sh` retires that automatically: it deletes the old PM2 process, moves its saved data (learned speech corrections, TODO list, voice cache) to `server/ai-assistant/data/`, and removes the old folder. Because the *old* copy of the script is what runs the first `git pull`, run it like this **once**:

```bash
cd /var/www/easy_learning
git pull origin main && ./redeploy.sh
```

There is no separate assistant subdomain any more: the AI Teacher is a page of the site (`https://www.learnigo.eu/ai-teacher`, in the main navigation). Remove the old `assistant.learnigo.eu` Nginx block and its certificate, and delete its DNS A record:

```bash
mv /etc/nginx/sites-enabled/learnigo-ai-assistant /root/backups/
nginx -t && systemctl reload nginx
certbot delete --cert-name assistant.learnigo.eu
```

`VITE_AI_ASSISTANT_URL` in `client/.env` is no longer used and can be deleted.

---

## Updating After a Code Push

Run the redeploy script every time you push new commits:

```bash
cd /var/www/easy_learning
./redeploy.sh
```

It pulls the current branch (then re-runs its freshly pulled self), reinstalls server dependencies (the API and the AI voice assistant), reinstalls client dependencies and rebuilds the site (which includes the assistant's page), and restarts the API under PM2. It refuses to run if tracked files have uncommitted local changes, so it never overwrites server-side edits.

Equivalent manual steps, if you need to do it by hand:

```bash
cd /var/www/easy_learning
git pull origin main

# If client code changed — rebuild
cd client && npm install && npm run build

# If server code changed — restart API
cd ../server && npm install && pm2 restart easy-learn
```

---

## Quick Reference

| What | Location |
|------|----------|
| React build output | `/var/www/easy_learning/client/dist/` |
| Express API | `localhost:5000` (PM2 process: `easy-learn`) |
| Nginx config | `/etc/nginx/sites-available/easy-learn` |
| Server env file | `/var/www/easy_learning/server/.env` |
| Client env file | `/var/www/easy_learning/client/.env` |
| PM2 logs | `pm2 logs easy-learn` |
| Nginx error log | `/var/log/nginx/error.log` |
| AI voice assistant | a child process of `easy-learn`: API at `/api/ai-assistant/*`, page at `https://www.learnigo.eu/ai-assistant/` (code: `server/ai-assistant/`) |
| AI assistant data / models | `server/ai-assistant/data/` (corrections, TODOs, voice cache) / `~/.cache/learnigo-teacher` |
| Redeploy script | `/var/www/easy_learning/redeploy.sh` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page / 404 | Check `client/dist/` exists; confirm `try_files` line in Nginx config |
| API returns 502 Bad Gateway | PM2 is down → `pm2 restart easy-learn` |
| CORS error in browser | `CLIENT_URL` in `server/.env` must exactly match the browser origin (`https://www.learnigo.eu`) |
| Google sign-in fails | Add `www.learnigo.eu` to Firebase Console → Authentication → Authorized Domains |
| MongoDB connection refused | Add the VPS IP (`31.97.224.109`) to MongoDB Atlas → Network Access → IP Allowlist |
| `npm run build` fails | Confirm `client/.env` has `VITE_FIREBASE_API_KEY` set |
| AI assistant says it is warming up / `/api/ai-assistant/health` returns 503 | Still loading (first start downloads ~1.2 GB of models) — `pm2 logs easy-learn`; look for "AI assistant ready" or "AI assistant failed to start" |
| `/ai-assistant/` shows the site's 404 page | The client wasn't rebuilt after pulling — `cd client && npm run build` |
| Server `npm install` fails with `ENOSPC` | The assistant's native speech/LLM dependencies need real disk space — `df -h` and free space before retrying `npm install` |
