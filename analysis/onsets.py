from pathlib import Path
import librosa, numpy as np
y, sr = librosa.load(Path(__file__).parent.parent / "assets/music/deviation.mp3", sr=44100, mono=True)
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=128)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[fr < 150]), sr=sr, hop_length=128)
pk = librosa.util.peak_pick(low, pre_max=20, post_max=20, pre_avg=40, post_avg=40, delta=4, wait=60)
t = pk * 128 / sr
grid = lambda x: (x - 1.138) / 0.416
for lo, hi in [(5, 8), (50, 56)]:
    sel = t[(t > lo) & (t < hi)]
    print(lo, hi, [f"{v:.3f}(b{grid(v):+.2f})" for v in sel])
