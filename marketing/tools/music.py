"""Music beds for the videos, made from code (so they are ours to use).

    .venv/bin/python tools/music.py            # warm  -> assets/audio/bed.mp3 (75 s, product videos)
    .venv/bin/python tools/music.py gentle     # gentle -> assets/audio/bed-gentle.mp3 (80 s, mission films)

Placeholders you can keep, or swap for licensed tracks (same file names) before
publishing. Deterministic: the same file every run.

  warm   : pad + music-box arpeggio + soft shaker, 84 BPM, C-G-Am-F
  gentle : slow piano-like notes over a quiet pad, 64 BPM, C-Am-F-G, no percussion
"""
import os
import subprocess
import sys
import wave

import numpy as np

SR = 48000
MOOD = (sys.argv[1] if len(sys.argv) > 1 else "warm").lower()
rng = np.random.default_rng(7)
here = os.path.dirname(os.path.abspath(__file__))
name = "bed" if MOOD == "warm" else f"bed-{MOOD}"
wav_path = os.path.join(here, "..", "assets", "audio", f"{name}.wav")
mp3_path = wav_path[:-4] + ".mp3"
os.makedirs(os.path.dirname(wav_path), exist_ok=True)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(length, attack, release):
    e = np.ones(length)
    a = min(int(attack * SR), length)
    r = min(int(release * SR), length)
    e[:a] = np.linspace(0, 1, a)
    e[length - r:] *= np.linspace(1, 0, r)
    return e


def pad(mix, start, length, notes, level, attack=0.9, release=1.2):
    end = min(start + length, len(mix))
    seg = np.arange(end - start) / SR
    e = env(end - start, attack, release)
    for note in notes:
        f = hz(note)
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            mix[start:end] += level * e * (np.sin(2 * np.pi * ff * seg) + 0.18 * np.sin(4 * np.pi * ff * seg))


def piano(mix, s, note, level, decay=1.6, length=3.0):
    """A soft piano-ish tone: a few harmonics, the upper ones fading faster."""
    if s >= len(mix):
        return
    e2 = min(s + int(length * SR), len(mix))
    t = np.arange(e2 - s) / SR
    f = hz(note)
    tone = (np.sin(2 * np.pi * f * t) * np.exp(-t * decay)
            + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * decay * 1.8)
            + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * decay * 2.6))
    mix[s:e2] += level * tone * env(e2 - s, 0.006, 0.3)


def warm():
    BPM, LENGTH = 84, 75.0
    BEAT = 60 / BPM
    BAR = 4 * BEAT
    n = int(LENGTH * SR)
    mix = np.zeros(n)
    chords = [[48, 55, 60, 64, 67], [43, 55, 59, 62, 67], [45, 57, 60, 64, 69], [41, 53, 57, 60, 65]]
    arp = [[72, 76, 79, 84, 79, 76, 72, 67], [71, 74, 79, 83, 79, 74, 71, 67],
           [72, 76, 81, 84, 81, 76, 72, 69], [69, 72, 77, 81, 77, 72, 69, 65]]
    for b in range(int(LENGTH / BAR) + 1):
        start = int(b * BAR * SR)
        pad(mix, start, int(BAR * 1.15 * SR), chords[b % 4], 0.045)
        if b >= 1:  # music box
            for i, note in enumerate(arp[b % 4]):
                s = start + int(i * BEAT / 2 * SR)
                if s >= n:
                    break
                e2 = min(s + int(1.4 * SR), n)
                t = np.arange(e2 - s) / SR
                f = hz(note)
                tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
                mix[s:e2] += 0.05 * np.exp(-t * 3.2) * tone * env(e2 - s, 0.004, 0.05)
        if b >= 2:  # shaker on the off-beats + soft low pulse
            for i in range(1, 8, 2):
                s = start + int(i * BEAT / 2 * SR)
                L = int(0.09 * SR)
                if s + L >= n:
                    break
                noise = np.diff(rng.standard_normal(L), prepend=0)
                mix[s:s + L] += 0.018 * noise * np.exp(-np.arange(L) / SR * 45)
            L = int(0.5 * SR)
            if start + L < n:
                t = np.arange(L) / SR
                mix[start:start + L] += 0.09 * np.sin(2 * np.pi * 55 * t) * np.exp(-t * 9)
    return mix, 1.5, 4.0


def gentle():
    BPM, LENGTH = 64, 80.0
    BEAT = 60 / BPM
    BAR = 4 * BEAT
    n = int(LENGTH * SR)
    mix = np.zeros(n)
    # C, Am, F, G with soft 7ths/9ths
    chords = [[48, 55, 64, 67, 71], [45, 52, 60, 64, 67], [41, 53, 57, 64, 69], [43, 50, 59, 62, 69]]
    # a simple melody: per bar, {beat: midi note}
    melody = [
        {0: 76, 2: 74, 3: 72}, {0: 72, 2: 71, 3: 69}, {0: 69, 2: 72, 3: 77}, {0: 74, 3: 71},
        {0: 76, 1: 79, 2: 76}, {0: 72, 2: 76, 3: 74}, {0: 72, 2: 69, 3: 72}, {0: 74, 2: 71},
    ]
    for b in range(int(LENGTH / BAR) + 1):
        start = int(b * BAR * SR)
        chord = chords[b % 4]
        pad(mix, start, int(BAR * 1.2 * SR), chord[1:], 0.022, attack=1.6, release=1.8)
        # left hand: root, then two chord tones
        piano(mix, start, chord[0], 0.07, decay=0.9, length=4.0)
        piano(mix, start + int(1.5 * BEAT * SR), chord[2], 0.045, decay=1.2)
        piano(mix, start + int(2.5 * BEAT * SR), chord[3], 0.04, decay=1.3)
        if b >= 2:  # melody enters after two bars
            for beat, note in melody[(b - 2) % len(melody)].items():
                piano(mix, start + int(beat * BEAT * SR), note, 0.075, decay=1.1, length=3.5)
    return mix, 3.0, 6.0


mix, fade_in_s, fade_out_s = (gentle if MOOD == "gentle" else warm)()
n = len(mix)
# Simple stereo width: a slightly delayed copy on the right
d = int(0.012 * SR)
st = np.stack([mix, np.concatenate([np.zeros(d), mix[: n - d]])], axis=1)
fi, fo = int(fade_in_s * SR), int(fade_out_s * SR)
st[:fi] *= np.linspace(0, 1, fi)[:, None]
st[-fo:] *= np.linspace(1, 0, fo)[:, None]
st = st / np.max(np.abs(st)) * 0.7
pcm = (st * 32767).astype(np.int16)
with wave.open(wav_path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

# Ship an MP3 (small enough to keep in git); the WAV is only an intermediate.
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav_path, "-c:a", "libmp3lame", "-b:a", "192k", mp3_path], check=True)
os.remove(wav_path)
print("ok ", os.path.relpath(mp3_path), f"{n / SR:.0f}s")
