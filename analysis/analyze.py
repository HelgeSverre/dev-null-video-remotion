"""
Deviation (helgesverre, Suno) -> src/data/track.json: the film's clock for pass 2.

  uv run analyze.py

The track sits on a fixed grid (~144 BPM). We fit period and phase by maximising onset energy
sampled on the grid (fine search), pick the downbeat phase by low-band onset energy, and write
per-bar energy (rms / low / high, dB) so sections can be read off the data.
"""
import json
from pathlib import Path
import librosa, numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "assets/music/deviation.mp3"
OUT = ROOT / "src/data/track.json"
y, sr = librosa.load(AUDIO, sr=44100, mono=True)
dur = len(y) / sr
hop = 128
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, aggregate=np.median)
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[fr < 150]), sr=sr, hop_length=hop)
t_env = np.arange(len(env)) * hop / sr

def score(period, offset, e):
    ts = offset + period * np.arange(int((dur - offset) / period))
    return float(np.interp(ts, t_env, e).sum())

best = (0, 0, 0)
for period in np.arange(0.4160, 0.4175, 0.00002):
    for offset in np.arange(0.55, 0.55 + period, 0.002):
        s = score(period, offset, env)
        if s > best[0]: best = (s, period, offset)
_, period, offset = best
# Downbeat phase. The kick hits every beat, so kick-band onset strength can't tell beat 1 from
# beat 2 (it picked the wrong one). Anchor on structure instead: the breakdown starts on a
# downbeat, at the biggest beat-to-beat fall in low-band (<150 Hz) energy between 45 and 56 s. With that phase the
# lift (bar 9), breakdown (31) and drop (33) all land on beat 1, and the swells before them become
# one-beat pickups, as written.
beats = offset + period * np.arange(int((dur - offset) / period))
phase_scores = [float(np.interp(beats[k::4], t_env, low).mean()) for k in range(4)]
lowS = np.sqrt(np.mean(S[fr < 150] ** 2, axis=0))
beat_low = np.array([20 * np.log10(lowS[(t_env >= b) & (t_env < b + period)].mean() + 1e-9) for b in beats])
win = [i for i, b in enumerate(beats) if 45 < b < 56]
anchor = int(min(win, key=lambda i: beat_low[i] - beat_low[i - 1]))
phase = anchor % 4
t0 = offset + phase * period
while t0 - 4 * period > 0: t0 -= 4 * period  # earliest downbeat at or after 0 — bar numbering from the first real bar
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
lowE = np.sqrt(np.mean(S[fr < 120] ** 2, axis=0)); hiE = np.sqrt(np.mean(S[fr > 6000] ** 2, axis=0))
db = lambda v: round(float(20 * np.log10(v + 1e-9)), 1)
bars = []
n = 0
while t0 + n * 4 * period < dur:
    a = t0 + n * 4 * period; m = (t_env >= a) & (t_env < a + 4 * period)
    bars.append({"bar": n + 1, "t": round(a, 4), "rms": db(rms[m[: len(rms)]].mean()), "low": db(lowE[m[: lowE.size]].mean()), "high": db(hiE[m[: hiE.size]].mean())})
    n += 1
out = {"anchor": round(float(beats[anchor]), 4), "file": "assets/music/deviation.mp3", "duration": round(dur, 4), "bpm": round(60 / period, 4), "beat": round(period, 6), "bar1": round(t0, 4), "phaseScores": [round(x, 3) for x in phase_scores], "bars": bars}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, indent=1))
print(f"bpm {60/period:.3f} beat {period:.5f}s bar1 {t0:.4f}s phase {phase} {phase_scores}; {len(bars)} bars; dur {dur:.2f}")
for b in bars: print(f"{b['bar']:3d} {b['t']:7.3f} rms {b['rms']:6.1f} low {b['low']:6.1f} hi {b['high']:6.1f}")
