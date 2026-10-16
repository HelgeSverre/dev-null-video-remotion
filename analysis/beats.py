import json, librosa, numpy as np
from pathlib import Path
R = Path(__file__).parent.parent
t = json.loads((R / "src/data/track.json").read_text())
y, sr = librosa.load(R / t["file"], sr=22050, mono=True)
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=256)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
tt = np.arange(S.shape[1]) * 256 / sr
lo = np.sqrt((S[fr < 150] ** 2).mean(0)); mid = np.sqrt((S[(fr > 300) & (fr < 3000)] ** 2).mean(0)); hi = np.sqrt((S[fr > 5000] ** 2).mean(0))
db = lambda v: 20 * np.log10(v + 1e-9)
for bars in [(1, 6), (15, 20), (24, 28)]:
    print(f"--- bars {bars}")
    for b in range(bars[0], bars[1] + 1):
        row = []
        for k in range(4):
            a = t["bar1"] + ((b - 1) * 4 + k) * t["beat"]; m = (tt >= a) & (tt < a + t["beat"])
            row.append(f"{db(lo[m].mean()):5.0f}/{db(mid[m].mean()):4.0f}/{db(hi[m].mean()):4.0f}")
        print(f"bar {b:2d}  " + "   ".join(row))
