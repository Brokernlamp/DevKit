#!/usr/bin/env python3
"""Build assets/score.wav: a ducked music bed plus placed SFX for the 38 s composition.

Run from anywhere: python3 scripts/build-score.py (requires ffmpeg on PATH).
"""
import array
import pathlib
import subprocess
import sys
import wave

ROOT = pathlib.Path(__file__).resolve().parents[1]
SR = 48000
DUR = 38.0
N = int(DUR * SR)
MUSIC = ROOT / "assets/music/happy-beats-business-moves-vol-10-by-ende-dot-app.mp3"
OUT = ROOT / "assets/score.wav"

SFX = [
    ("sfx/impact/impactSoft_medium_001.ogg", 1.90, 0.8),
    ("sfx/casino/card-slide-1.ogg", 3.80, 0.6),
    ("sfx/impact/impactBell_heavy_000.ogg", 10.38, 0.8),
    ("sfx/casino/card-slide-1.ogg", 13.85, 0.5),
    *[(f"sfx/keyboard/keypress-{(k % 8) + 1:03d}.wav", 15.0 + 0.2 * k, 0.45) for k in range(12)],
    ("sfx/interface/click_002.ogg", 17.9, 0.5),
    ("sfx/interface/drop_001.ogg", 18.4, 0.7),
    ("sfx/interface/click_002.ogg", 18.9, 0.5),
    ("sfx/interface/click_002.ogg", 19.5, 0.45),
    ("sfx/casino/card-slide-1.ogg", 23.6, 0.5),
    ("sfx/casino/card-slide-1.ogg", 28.85, 0.6),
    ("sfx/interface/click_002.ogg", 29.5, 0.5),
    ("sfx/impact/impactBell_heavy_000.ogg", 34.5, 0.7),
    ("sfx/interface/click_002.ogg", 35.4, 0.5),
]


def clamp01(x):
    return 0.0 if x <= 0 else (1.0 if x >= 1 else x)


def bed_gain(t):
    """Music at 0.55; ducks to about 0.18 under founder clips 01 (4.10-10.38) and 02 (24.01-29.00)."""
    duck1 = clamp01((t - 4.10) / 0.3) - clamp01((t - 10.38) / 0.3)
    duck2 = clamp01((t - 24.01) / 0.3) - clamp01((t - 29.00) / 0.3)
    level = 0.55 - 0.37 * (duck1 + duck2)
    return level * clamp01(t / 0.5) * (1.0 - clamp01((t - 35.0) / 3.0))


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-t", str(DUR), "-i", str(path),
         "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    samples = array.array("f")
    samples.frombytes(raw)
    if sys.byteorder == "big":
        samples.byteswap()
    return samples


def main():
    buf = [0.0] * (2 * N)

    music = decode(MUSIC)
    for i in range(min(N, len(music) // 2)):
        g = bed_gain(i / SR)
        buf[2 * i] = music[2 * i] * g
        buf[2 * i + 1] = music[2 * i + 1] * g

    for rel, when, gain in SFX:
        sfx = decode(ROOT / "assets" / rel)
        start = round(when * SR)
        for j in range(min(len(sfx) // 2, N - start)):
            buf[2 * (start + j)] += sfx[2 * j] * gain
            buf[2 * (start + j) + 1] += sfx[2 * j + 1] * gain

    peak = max(abs(x) for x in buf)
    scale = 0.89 / peak if peak > 0.89 else 1.0
    pcm = array.array("h", (int(round(max(-1.0, min(1.0, x * scale)) * 32767)) for x in buf))
    if sys.byteorder == "big":
        pcm.byteswap()

    with wave.open(str(OUT), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())

    print(f"wrote {OUT} duration={N / SR:.2f}s peak_before_scale={peak:.3f} scale={scale:.3f}")


if __name__ == "__main__":
    main()
