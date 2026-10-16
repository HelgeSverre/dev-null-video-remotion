# Fold onset envelopes (full + low band) over the beat period: where in the beat do onsets peak?
from pathlib import Path
import librosa, numpy as np
y, sr = librosa.load(Path(__file__).parent.parent / "assets/music/deviation.mp3", sr=44100, mono=True)
hop = 64; P = 0.41600; B1 = 1.138
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
for name, band in [("all", fr > 0), ("low<150", fr < 150), ("high>4k", fr > 4000)]:
    e = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[band]), sr=sr, hop_length=hop, lag=1, max_size=1)
    t = np.arange(len(e)) * hop / sr
    m = (t > 6.2) & (t < 50)  # groove only
    ph = ((t[m] - B1) / P) % 1.0
    h, edges = np.histogram(ph, bins=48, weights=e[m])
    c = np.histogram(ph, bins=48)[0]; h = h / c
    k = int(np.argmax(h))
    print(f"{name:8s} peak at phase {edges[k]:.3f}-{edges[k+1]:.3f} beat = {(edges[k]*P)*1000:.0f} ms after grid; top bins:", [round(edges[i],3) for i in np.argsort(h)[-4:][::-1]])
