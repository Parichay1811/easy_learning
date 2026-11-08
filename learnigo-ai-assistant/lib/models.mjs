// Where the teacher's models live, and which voices exist. The website keeps
// its own model cache, separate from anything else on the machine:
// $LT_CACHE, or ~/.cache/learnigo-teacher. Models download there on first use.
import os from 'node:os';
import path from 'node:path';

export function cacheRoot() {
  return process.env.LT_CACHE || path.join(os.homedir(), '.cache', 'learnigo-teacher');
}

export const modelDir = () => path.join(cacheRoot(), 'models');

// Kokoro voice ids (the optional fallback voice engine): af_heart, bm_george...
export const isKokoroVoice = (v) => /^[abehijpz][fm]_[a-z]+$/.test(v || '');
// Supertonic voices: the four whose styles are downloaded (speech-worker.mjs).
export const isSupertonicVoice = (v) => /^[FM][12]$/.test(v || '');
