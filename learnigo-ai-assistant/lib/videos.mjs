// Videos to watch next on a topic, from YouTube's search (yt-search-lib,
// MIT, no API key). Called from the server only, so no proxy is needed.
// Results are cached on disk for a week: one search per topic, not per
// student. Shorts, live streams and very long videos are left out.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeWhole } from './files.mjs';

const WEEK = 7 * 24 * 3600 * 1000;

export function createVideos({ dataDir, limit = 3, log = () => {} } = {}) {
  const file = path.join(dataDir, 'videos.json');
  let cache = {};
  cache = readJson(file, {});
  let client = null;
  let busy = Promise.resolve();
  const save = () => writeWhole(file, JSON.stringify(cache)).catch(() => {});
  const seconds = (d) => String(d || '').split(':').reduce((s, p) => s * 60 + Number(p || 0), 0);

  async function search(topic) {
    const q = String(topic || '').replace(/[^\p{L}\p{N} '’,-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (q.length < 3) return [];
    const key = q.toLowerCase();
    const hit = cache[key];
    if (hit && Date.now() - hit.at < WEEK) return hit.videos;
    // One search at a time, so a busy class does not hammer YouTube.
    const run = busy.then(async () => {
      if (!client) { const { YouTubeClient } = await import('yt-search-lib'); client = new YouTubeClient({ useCache: false }); }
      const found = await Promise.race([client.search(`${q} explained`, { limit: 10 }), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 6000))]);
      const videos = found
        .filter((v) => v.type === 'video' && v.id && seconds(v.duration) >= 90 && seconds(v.duration) <= 40 * 60 && !/#shorts|live/i.test(v.title))
        .slice(0, limit)
        .map((v) => ({ id: v.id, title: v.title, channel: v.author || '', duration: v.duration || '', thumb: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`, url: `https://www.youtube.com/watch?v=${v.id}` }));
      cache[key] = { at: Date.now(), videos };
      save();
      return videos;
    });
    busy = run.catch(() => {});
    return run.catch((e) => { log(`videos: ${e.message}`); return hit?.videos || []; });
  }
  return { search };
}
