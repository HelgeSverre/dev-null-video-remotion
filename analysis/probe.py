"""First look at the track: tempo, beat grid regularity, downbeat phase, per-bar energy."""
from pathlib import Path
import librosa, numpy as np
ROOT = Path(__file__).resolve().parent.parent
y, sr = librosa.load(ROOT / "assets/music/deviation.mp3", sr=22050, mono=True)
hop = 256
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, bf = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=hop, tightness=200)
beats = librosa.frames_to_time(bf, sr=sr, hop_length=hop)
ibi = np.diff(beats)
print(f"duration {len(y)/sr:.3f}s tempo {float(np.atleast_1d(tempo)[0]):.2f} beats {len(beats)} first {beats[0]:.3f}")
print(f"ibi median {np.median(ibi):.4f} -> {60/np.median(ibi):.2f} bpm, std {ibi.std()*1000:.1f} ms, min {ibi.min():.3f} max {ibi.max():.3f}")
# linear fit of beat times -> constant grid?
k = np.arange(len(beats)); a, b = np.polyfit(k, beats, 1)
res = beats - (a*k+b)
print(f"grid fit period {a:.5f}s ({60/a:.3f} bpm) offset {b:.4f}s; residual max {np.abs(res).max()*1000:.1f} ms")
S = np.abs(librosa.stft(y, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[fr<150]), sr=sr, hop_length=hop)
print("phase low-onset scores", [round(float(np.mean(low[bf[p::4]])),3) for p in range(4)])
rms = librosa.feature.rms(y=y, hop_length=hop)[0]; t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
lowE = np.sqrt(np.mean(S[fr<120]**2,axis=0)); hiE = np.sqrt(np.mean(S[fr>6000]**2,axis=0))
period = a*4
nb = int((len(y)/sr - b)//period)+1
for i in range(-1, nb):
    t0 = b + i*period; m = (t>=t0)&(t<t0+period)
    if not m.any(): continue
    r = 20*np.log10(rms[m].mean()+1e-9); l = 20*np.log10(lowE[m].mean()+1e-9); h = 20*np.log10(hiE[m].mean()+1e-9)
    print(f"bar {i+1:3d} {t0:7.3f}s rms {r:6.1f} low {l:6.1f} hi {h:6.1f} " + "#"*int(max(0,r+40)))
