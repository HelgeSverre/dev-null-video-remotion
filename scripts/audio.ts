/**
 * The soundtrack. Default (pass 2): Helge's track "Deviation" (assets/music/deviation.mp3) as the
 * bed, with the film's UI sound effects (typing, pops, clicks, star, whooshes) placed on top from
 * src/storyboard.ts — the same [bar, beat] cues the picture uses, on the track's measured grid.
 *
 *   bun scripts/audio.ts           -> Deviation + UI effects
 *   bun scripts/audio.ts --synth   -> pass 1: the synthesized score below (written for 120 BPM / 40 bars)
 *
 * Pass 1 score: 120 BPM, D minor, 40 bars. Drums, offbeat bass, supersaw pad, pluck arp,
 * stabs and every sound effect, placed sample-exactly from src/storyboard.ts (the same numbers the
 * picture uses). No samples, no libraries: oscillators, filters, seeded noise, a Freeverb and a
 * ping-pong delay. Same bytes on every run.
 *
 * Output: public/audio/mix.wav (48 kHz stereo 24-bit, -14 LUFS, -1 dBTP).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BAR, BEAT, DURATION, FPS, secAt, type Pos } from '../src/lib/clock';
import { rng, typeSeconds } from '../src/lib/rand';
import { SFX, TYPING, type Lane } from '../src/storyboard';

const ROOT = resolve(import.meta.dir, '..');
const SYNTH = process.argv.includes('--synth');
const SR = 48000;
const LEN_S = DURATION / FPS;
const N = Math.ceil(LEN_S * SR);
const TAU = Math.PI * 2;
const SPB = (BEAT / FPS) * SR; // samples per beat (24000)
const at = (sec: number) => Math.round(sec * SR);
const pos = (bar: number, beat = 1) => secAt([bar, beat]);
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ── buses ────────────────────────────────────────────────────────────────────────────────────
type Bus = { L: Float32Array; R: Float32Array };
const bus = (): Bus => ({ L: new Float32Array(N), R: new Float32Array(N) });
const drums = bus(); // kick, clap, hats, rolls, crash — not ducked
const bass = bus(); // ducked by the kick
const music = bus(); // pad, arp, stabs — ducked by the kick
const fx = bus(); // sound effects — never ducked
const verbSend = bus();
const delaySend = bus();

/** Gain applied to everything written to the effects bus (set per cue kind over Deviation). */
let fxScale = 1;
/** Render `len` seconds of `fn(t)` into a bus at `start` seconds, equal-power panned, with sends. */
function play(b: Bus, start: number, len: number, fn: (t: number) => number, pan = 0, verb = 0, delay = 0) {
  const o = at(start);
  const n = at(len);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = o + i;
    if (k < 0) continue;
    if (k >= N) break;
    const v = fn(i / SR) * (b === fx ? fxScale : 1);
    b.L[k]! += v * gl;
    b.R[k]! += v * gr;
    if (verb) {
      verbSend.L[k]! += v * gl * verb;
      verbSend.R[k]! += v * gr * verb;
    }
    if (delay) {
      delaySend.L[k]! += v * gl * delay;
      delaySend.R[k]! += v * gr * delay;
    }
  }
}

// ── DSP primitives ───────────────────────────────────────────────────────────────────────────
/** PolyBLEP band-limited saw. */
function saw(freq: number, phase0 = 0) {
  let ph = phase0;
  const dt = freq / SR;
  return () => {
    let v = 2 * ph - 1;
    if (ph < dt) {
      const x = ph / dt;
      v -= x + x - x * x - 1;
    } else if (ph > 1 - dt) {
      const x = (ph - 1) / dt;
      v -= x * x + x + x + 1;
    }
    ph += dt;
    if (ph >= 1) ph -= 1;
    return v;
  };
}
/** TPT state-variable filter; call with a cutoff (Hz) and resonance per sample. */
function svf() {
  let ic1 = 0, ic2 = 0;
  return (x: number, cutoff: number, q = 0.7, mode: 'lp' | 'bp' | 'hp' = 'lp') => {
    const g = Math.tan((Math.PI * Math.min(cutoff, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return mode === 'lp' ? v2 : mode === 'bp' ? v1 : x - k * v1 - v2;
  };
}
const adsr = (t: number, a: number, d: number, s: number, len: number, r: number) => {
  let v = t < a ? t / a : t < a + d ? 1 - (1 - s) * ((t - a) / d) : s;
  if (t > len) v *= Math.max(0, 1 - (t - len) / r);
  return v;
};
const noiseGen = (seed: number) => {
  const r = rng(seed);
  return () => r() * 2 - 1;
};

// ── harmony ──────────────────────────────────────────────────────────────────────────────────
type Chord = { name: string; root: number; pad: number[]; arp: number[] };
const CH: Record<string, Chord> = {
  Dm: { name: 'Dm', root: 38, pad: [50, 57, 60, 65, 69], arp: [62, 65, 69, 72, 74, 77] },
  Bb: { name: 'Bb', root: 34, pad: [46, 53, 57, 62, 65], arp: [58, 62, 65, 69, 70, 74] },
  F: { name: 'F', root: 41, pad: [53, 57, 60, 64, 67], arp: [60, 64, 65, 69, 72, 76] },
  C: { name: 'C', root: 36, pad: [48, 55, 60, 62, 67], arp: [60, 62, 64, 67, 72, 74] },
};
const LOOP = ['Dm', 'Bb', 'F', 'C'];
const PROG: string[] = Array.from({ length: 40 }, (_, i) => LOOP[i % 4]!);
// Outro re-harmonised so the film resolves home: 35 Dm, 36 Bb, 37 F, 38 C, 39–40 Dm.
Object.assign(PROG, { 34: 'Dm', 35: 'Bb', 36: 'F', 37: 'C', 38: 'Dm', 39: 'Dm' });
const chordAt = (bar: number) => CH[PROG[bar - 1]!]!;
const inBars = (bar: number, ...ranges: [number, number][]) => ranges.some(([a, b]) => bar >= a && bar <= b);

// ── instruments ──────────────────────────────────────────────────────────────────────────────
const kicks: number[] = [];
function kick(t0: number, gain = 1) {
  kicks.push(t0);
  const n = noiseGen(at(t0));
  play(drums, t0, 0.5, (t) => {
    const f = 46 + 110 * Math.exp(-t * 38);
    const ph = TAU * (46 * t + (110 / 38) * (1 - Math.exp(-t * 38)));
    void f;
    const body = Math.sin(ph) * Math.exp(-t * 7.5);
    const click = n() * Math.exp(-t * 900) * 0.35;
    return Math.tanh((body * 1.25 + click) * 1.4) * 0.8 * gain;
  });
}
function clap(t0: number, gain = 1) {
  const n = noiseGen(at(t0) + 3);
  const f = svf();
  play(drums, t0, 0.35, (t) => {
    const bursts = [0, 0.011, 0.022].reduce((s, d) => s + (t >= d ? Math.exp(-(t - d) * (d === 0.022 ? 22 : 180)) : 0), 0);
    return f(n(), 1400, 1.1, 'bp') * bursts * 0.9 * gain;
  }, 0.05, 0.35);
}
function hat(t0: number, gain = 0.3, open = false, pan = 0.25) {
  const n = noiseGen(at(t0) + 5);
  const f = svf();
  play(drums, t0, open ? 0.35 : 0.06, (t) => f(n(), 8500, 0.8, 'hp') * Math.exp(-t * (open ? 11 : 70)) * gain, pan, 0.05);
}
function snare(t0: number, gain = 0.5) {
  const n = noiseGen(at(t0) + 9);
  const f = svf();
  play(drums, t0, 0.2, (t) => (f(n(), 3200, 0.6, 'bp') * 0.8 + Math.sin(TAU * 190 * t) * 0.4) * Math.exp(-t * 26) * gain, -0.05, 0.25);
}
function crash(t0: number, gain = 0.32) {
  const nl = noiseGen(at(t0) + 21), nr = noiseGen(at(t0) + 22);
  const fl = svf(), fr = svf();
  const o = at(t0), len = at(2.6);
  for (let i = 0; i < len && o + i < N; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 1.6) * Math.min(1, t * 2000) * gain;
    drums.L[o + i]! += fl(nl(), 6000, 0.7, 'hp') * e;
    drums.R[o + i]! += fr(nr(), 6000, 0.7, 'hp') * e;
    verbSend.L[o + i]! += fl(0, 6000) * 0;
  }
}
function bassNote(t0: number, midi: number, len: number, cutoff = 700, gain = 0.5) {
  const o1 = saw(mtof(midi)), o2 = saw(mtof(midi) * 1.004, 0.3);
  const f = svf();
  play(bass, t0, len + 0.08, (t) => {
    const e = adsr(t, 0.004, 0.12, 0.6, len, 0.06);
    const c = cutoff * (0.6 + 1.6 * Math.exp(-t * 18));
    return Math.tanh(f((o1() + o2()) * 0.5, c, 1.4) * 1.6) * e * gain + Math.sin(TAU * mtof(midi - 12) * t) * e * gain * 0.55;
  });
}
function padChord(t0: number, notes: number[], len: number, cutoff: number, gain = 0.1, attack = 0.35) {
  notes.forEach((m, k) => {
    const voices = [-0.11, -0.04, 0.04, 0.11].map((d, j) => saw(mtof(m) * Math.pow(2, d / 12), (k * 0.37 + j * 0.21) % 1));
    const f = svf();
    play(music, t0, len + 0.9, (t) => {
      const e = adsr(t, attack, 0.6, 0.85, len, 0.8);
      const v = voices.reduce((s, o) => s + o(), 0) / voices.length;
      return f(v, cutoff * (0.85 + 0.15 * Math.sin(TAU * 0.11 * (t0 + t))), 0.75) * e * gain;
    }, k % 2 ? 0.55 : -0.55, 0.55);
  });
}
function pluck(t0: number, midi: number, cutoff: number, gain = 0.16, pan = 0) {
  const o1 = saw(mtof(midi)), o2 = saw(mtof(midi) * 1.007, 0.5);
  const f = svf();
  play(music, t0, 0.42, (t) => {
    const e = Math.exp(-t * 9) * Math.min(1, t * 1500);
    const c = 180 + cutoff * Math.exp(-t * 16);
    return f((o1() + o2() * 0.6) * 0.6, c, 2.2) * e * gain;
  }, pan, 0.22, 0.32);
}
function stab(t0: number, notes: number[], gain = 0.12, len = 0.22) {
  notes.forEach((m, k) => {
    const voices = [-0.14, -0.05, 0.05, 0.14].map((d, j) => saw(mtof(m + 12) * Math.pow(2, d / 12), (j * 0.29 + k * 0.13) % 1));
    const f = svf();
    play(music, t0, len + 0.3, (t) => {
      const e = adsr(t, 0.003, 0.08, 0.5, len, 0.2);
      return f(voices.reduce((s, o) => s + o(), 0) / 4, 600 + 5200 * Math.exp(-t * 10), 0.9) * e * gain;
    }, k % 2 ? 0.4 : -0.4, 0.35, 0.18);
  });
}
function bell(t0: number, midi: number, gain = 0.08, pan = 0) {
  const f = mtof(midi);
  play(music, t0, 1.6, (t) => {
    const e = Math.exp(-t * 3.2) * Math.min(1, t * 3000);
    const mod = Math.sin(TAU * f * 3.5 * t) * 1.6 * Math.exp(-t * 6);
    return Math.sin(TAU * f * t + mod) * e * gain;
  }, pan, 0.4, 0.4);
}

// ── arrangement (bars are 1-indexed) ────────────────────────────────────────────────────────
function score() {
for (let bar = 1; bar <= 40; bar++) {
  const t = pos(bar);
  const ch = chordAt(bar);
  const beatT = (b: number) => pos(bar, b);
  const sixteenth = (s: number) => t + (s * SPB) / 4 / SR;

  // Pad: fades in over the cold open; out for the break (bar 8); thin in the outro.
  if (bar !== 8 && bar <= 38) {
    const intro = bar <= 2 ? 0.55 + 0.25 * (bar - 1) : 1;
    const cutoff = bar <= 4 ? 900 + bar * 250 : inBars(bar, [25, 26]) ? 1400 : inBars(bar, [29, 34]) ? 3200 : 2200;
    padChord(t, ch.pad, 2 - 0.05, cutoff, 0.11 * intro, bar === 1 ? 1.4 : 0.25);
  }

  // Kick: four on the floor in the grooves; out in the cold open, break and breakdown.
  if (inBars(bar, [5, 7], [9, 24], [29, 36])) for (let b = 1; b <= 4; b++) kick(beatT(b), bar <= 7 ? 0.62 : 0.85);
  if (bar === 8) kick(beatT(1), 0.9); // the stop
  if (bar === 28) [1, 2, 3].forEach((b) => kick(beatT(b), 0.6 + 0.13 * b));

  // Bass: offbeat eighths (the "and"), root then octave pulse.
  if (inBars(bar, [5, 7], [9, 24], [29, 36])) {
    for (let b = 1; b <= 4; b++) {
      const midi = ch.root + (b === 4 && bar % 2 === 0 ? 12 : 0);
      bassNote(beatT(b + 0.5), midi, 0.2, inBars(bar, [29, 34]) ? 900 : 650, bar <= 7 ? 0.26 : 0.4);
    }
  }

  // Clap on 2 and 4 in the main grooves.
  if (inBars(bar, [9, 24], [29, 34])) [2, 4].forEach((b) => clap(beatT(b)));

  // Hats: ticks from bar 3, full 16ths in the grooves, open hats in the drive.
  if (inBars(bar, [3, 7], [9, 24], [25, 26], [29, 36])) {
    for (let s = 0; s < 16; s++) {
      const accent = s % 4 === 2 ? 1 : s % 2 ? 0.55 : 0.75;
      const level = bar <= 4 ? 0.14 : inBars(bar, [25, 26]) ? 0.12 : bar <= 7 ? 0.2 : 0.34;
      hat(sixteenth(s), level * accent, false, s % 2 ? 0.3 : -0.15);
    }
  }
  if (inBars(bar, [13, 24], [29, 34])) [1.5, 2.5, 3.5, 4.5].forEach((b) => hat(beatT(b), 0.14, true, -0.3));

  // Pluck arp: 16ths over chord tones. Filter opens with the energy of the section.
  if (inBars(bar, [3, 7], [9, 38])) {
    const pattern = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 3, 2, 1, 2];
    const cutoff = bar <= 4 ? 500 + (bar - 3) * 500 : bar <= 7 ? 1400 + (bar - 5) * 300 : inBars(bar, [25, 26]) ? 1200 : inBars(bar, [27, 28]) ? 1200 + ((bar - 27) * 4 + 1) * 380 : inBars(bar, [29, 34]) ? 4200 : bar >= 35 ? 2600 - (bar - 35) * 350 : 2800;
    for (let s = 0; s < 16; s++) {
      if (bar === 28 && s >= 12) continue; // the beat of silence
      pluck(sixteenth(s), ch.arp[pattern[s]!]!, cutoff, bar <= 4 ? 0.12 : 0.19, s % 2 ? 0.45 : -0.45);
    }
  }

  // Bell hook over the drops: a call (bar A) and an answer (bar B).
  if (inBars(bar, [13, 16], [21, 24], [29, 34])) {
    const call: [number, number][] = [[1, 0], [1.5, 2], [2.5, 1], [3.5, 3]];
    const answer: [number, number][] = [[1, 4], [2, 3], [2.5, 2], [4, 1]];
    for (const [b, idx] of bar % 2 ? call : answer) bell(beatT(b), ch.arp[idx]! + 12, 0.07, b % 1 ? 0.3 : -0.3);
  }
}

// Breaks and builds: snare rolls into the drops.
for (let s = 0; s < 16; s++) snare(pos(8) + (s * SPB) / 4 / SR, 0.12 + 0.4 * (s / 15));
for (let s = 0; s < 24; s++) snare(pos(27, 3) + (s * SPB) / 4 / SR, 0.08 + 0.35 * (s / 23));
for (let s = 0; s < 8; s++) snare(pos(28, 2) + (s * SPB) / 8 / SR, 0.3 + 0.2 * (s / 7));
[pos(9), pos(29), pos(35), pos(39)].forEach((t) => crash(t));
// Montage stabs on every cut (every two beats in bars 29–34).
for (let i = 0; i < 12; i++) stab(pos(29 + Math.floor(i / 2), (i % 2) * 2 + 1), chordAt(29 + Math.floor(i / 2)).pad.slice(1), 0.09);
// The final chord: Dm add9, long, wide.
padChord(pos(39), [38, 50, 57, 62, 64, 65, 69], 3.2, 2400, 0.12, 0.01);
stab(pos(39), [50, 57, 64, 65], 0.12, 1.2);
bassNote(pos(39), 38, 2.4, 500, 0.55);
bell(pos(39), 81, 0.09);
bell(pos(39, 2), 76, 0.06, 0.3);
bell(pos(40), 74, 0.06, -0.3);
}
if (SYNTH) score();

// ── sound effects ───────────────────────────────────────────────────────────────────────────
const LANE_NOTE: Record<Lane, number> = { 0: 74, 1: 77, 2: 79, 3: 81, 4: 84, 5: 86 };
const SFX_FN: Record<string, (t: number, s: (typeof SFX)[number]) => void> = {
  enter: (t0) => {
    const n = noiseGen(at(t0) + 31);
    const f = svf();
    play(fx, t0, 0.18, (t) => (f(n(), 2200, 0.9, 'bp') * Math.exp(-t * 60) * 0.9 + Math.sin(TAU * 120 * t) * Math.exp(-t * 30) * 0.5), 0.1, 0.15);
  },
  thock: (t0) => {
    const n = noiseGen(at(t0) + 33);
    const f = svf();
    play(fx, t0, 0.2, (t) => (f(n(), 900, 1, 'bp') * Math.exp(-t * 50) * 0.8 + Math.sin(TAU * (160 + 90 * Math.exp(-t * 60)) * t) * Math.exp(-t * 24) * 0.6), 0, 0.12);
  },
  click: (t0) => {
    const n = noiseGen(at(t0) + 35);
    const f = svf();
    play(fx, t0, 0.05, (t) => (f(n(), 5000, 1, 'bp') * 0.6 + Math.sin(TAU * 2600 * t) * 0.25) * Math.exp(-t * 140), 0.2, 0.08);
  },
  pop: (t0, s) => {
    const fr = mtof(LANE_NOTE[s.lane ?? 3]);
    play(fx, t0, 0.5, (t) => {
      const sweep = fr * (0.75 + 0.25 * (1 - Math.exp(-t * 60)));
      return Math.sin(TAU * sweep * t) * Math.exp(-t * 9) * Math.min(1, t * 2500) * 0.32 + Math.sin(TAU * sweep * 2 * t) * Math.exp(-t * 22) * 0.08;
    }, 0.15, 0.3, 0.2);
  },
  zap: (t0) => {
    const o = saw(1);
    const f = svf();
    let ph = 0;
    play(fx, t0, 0.26, (t) => {
      const fr = 2400 * Math.exp(-t * 16) + 70;
      ph += fr / SR;
      const sq = (ph % 1) < 0.5 ? 1 : -1;
      const crushed = Math.round(sq * Math.exp(-t * 6) * 6) / 6;
      void o;
      return f(crushed, 3000, 0.8) * 0.26 * Math.exp(-t * 7);
    }, -0.1, 0.2);
  },
  star: (t0) => {
    play(fx, t0, 1.2, (t) => {
      const e = Math.exp(-t * 4.5) * Math.min(1, t * 3000);
      return (Math.sin(TAU * 1318.5 * t) * 0.5 + Math.sin(TAU * 1975.5 * t) * 0.35 * Math.exp(-t * 3) + Math.sin(TAU * 2637 * t) * 0.15 * Math.exp(-t * 9)) * e * 0.3;
    }, 0.2, 0.45, 0.3);
  },
  blip: (t0) => {
    [0, 0.06].forEach((d, k) => play(fx, t0 + d, 0.18, (t) => Math.sin(TAU * (k ? 1318.5 : 987.8) * t) * Math.exp(-t * 28) * Math.min(1, t * 2000) * 0.22, k ? 0.3 : -0.3, 0.2));
  },
  whoosh: (t0) => {
    // Centred so its peak lands on the cut.
    const n = noiseGen(at(t0) + 41);
    const f = svf();
    const L = 0.55, peak = 0.32;
    play(fx, t0 - peak, L, (t) => {
      const e = t < peak ? Math.pow(t / peak, 2) : Math.exp(-(t - peak) * 14);
      return f(n(), 500 + 5200 * Math.min(1, t / peak), 1.6, 'bp') * e * 0.42;
    }, 0, 0.15);
  },
  riser: (t0, s) => {
    const len = ((s.len ?? 4) * SPB) / SR;
    const n = noiseGen(at(t0) + 43);
    const f = svf();
    play(fx, t0, len, (t) => {
      const p = t / len;
      return (f(n(), 300 + 7000 * p * p, 2.5, 'bp') * 0.5 + Math.sin(TAU * (200 * p + 400 * p * p) * t) * 0.08) * p * p * 0.5;
    }, 0, 0.3);
  },
  impact: (t0) => {
    const n = noiseGen(at(t0) + 47);
    const f = svf();
    play(fx, t0, 3.2, (t) => {
      const sub = Math.sin(TAU * (34 * t + (60 / 9) * (1 - Math.exp(-t * 9)))) * Math.exp(-t * 1.3) * 0.75;
      const body = f(n(), 220, 0.8) * Math.exp(-t * 4) * 1.4;
      return Math.tanh(sub + body);
    }, 0, 0.35);
  },
  flip: (t0) => {
    const n = noiseGen(at(t0) + 51);
    const f = svf();
    play(fx, t0, 0.7, (t) => (f(n(), 4000 * Math.exp(-t * 6) + 200, 2, 'bp') * 0.4 + Math.sin(TAU * (90 * Math.exp(-t * 3)) * t) * 0.5 * Math.exp(-t * 4)) * Math.min(1, t * 400), 0, 0.3);
  },
};
// Over Deviation the track carries the builds and drops: risers, impacts and the flip sweep are synth-only.
const TRACK_OWNS = new Set(['riser', 'impact', 'flip']);
const OVER_TRACK: Partial<Record<string, number>> = { zap: 0.3, whoosh: 0.55, pop: 0.8 };
for (const s of SFX) {
  if (!SYNTH && TRACK_OWNS.has(s.kind)) continue;
  fxScale = SYNTH ? 1 : (OVER_TRACK[s.kind] ?? 1);
  SFX_FN[s.kind]!(secAt(s.at), s);
}
fxScale = SYNTH ? 1 : 0.8; // key clicks

// Typing: one key click per character, from the same schedule the picture uses.
let keys = 0;
for (const [name, run] of Object.entries(TYPING)) {
  const r = rng(run.seed * 7919);
  typeSeconds(run).forEach((t0, i) => {
    const ch = run.text[i]!;
    const n = noiseGen(at(t0) + i);
    const f = svf();
    const tone = ch === ' ' ? 900 : 1700 + r() * 900;
    const g = name === 'leftQ' ? 0.22 : 0.3;
    play(fx, t0, 0.06, (t) => (f(n(), tone, 1.6, 'bp') * 0.9 + Math.sin(TAU * (ch === ' ' ? 180 : 260) * t) * 0.3 * Math.exp(-t * 90)) * Math.exp(-t * 110) * g, (r() - 0.5) * 0.5, 0.04);
    keys++;
  });
}

// ── effects returns ─────────────────────────────────────────────────────────────────────────
function freeverb(inp: Bus, room = 0.84, damp = 0.25, spread = 23): Bus {
  const out = bus();
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  for (const [ch, x, y, off] of [['L', inp.L, out.L, 0], ['R', inp.R, out.R, spread]] as const) {
    void ch;
    const cb = combs.map((d) => ({ buf: new Float32Array(d + off), i: 0, store: 0 }));
    const ab = aps.map((d) => ({ buf: new Float32Array(d + off), i: 0 }));
    for (let n = 0; n < N; n++) {
      const v = x[n]! * 0.015;
      let s = 0;
      for (const c of cb) {
        const o = c.buf[c.i]!;
        c.store = o * (1 - damp) + c.store * damp;
        c.buf[c.i] = v + c.store * room;
        c.i = (c.i + 1) % c.buf.length;
        s += o;
      }
      for (const a of ab) {
        const o = a.buf[a.i]!;
        a.buf[a.i] = s + o * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        s = o - s;
      }
      y[n] = s;
    }
  }
  return out;
}
function pingpong(inp: Bus, time = 0.375, fb = 0.38): Bus {
  const out = bus();
  const d = at(time);
  const lp = [svf(), svf()];
  for (let n = 0; n < N; n++) {
    const fromR = n >= d ? out.R[n - d]! : 0;
    const fromL = n >= d ? out.L[n - d]! : 0;
    out.L[n] = lp[0]!(inp.L[n]! * 0.5 + inp.R[n]! * 0.5 + fromR * fb, 4500);
    out.R[n] = lp[1]!(fromL * (fb + 0.4), 4500);
  }
  return out;
}
const verb = freeverb(verbSend);
const echo = pingpong(delaySend);

// ── mix ─────────────────────────────────────────────────────────────────────────────────────
// Sidechain: duck bass and music after every kick.
const duck = new Float32Array(N).fill(1);
for (const k of kicks) {
  const o = at(k);
  for (let i = 0; i < at(0.3) && o + i < N; i++) {
    const t = i / SR;
    const g = 1 - 0.62 * (t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) / 0.09));
    duck[o + i] = Math.min(duck[o + i]!, g);
  }
}
// Hard silence for the beat before the montage drop (28.4 → 29.1); effects keep their tails.
const gate = new Float32Array(N).fill(1);
{
  const a = at(pos(28, 4)), b = at(pos(29)), ramp = at(0.012);
  for (let i = a - ramp; i < b; i++) if (i >= 0) gate[i] = Math.min(gate[i]!, i < a ? 1 - (i - (a - ramp)) / ramp : 0);
}
const mixL = new Float32Array(N), mixR = new Float32Array(N);
if (!SYNTH) {
  // Deviation as the bed, decoded to 48 kHz stereo float; effects sit under it with their reverb.
  const dec = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', join(ROOT, 'assets/music/deviation.mp3'), '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  if (dec.status !== 0) throw new Error('could not decode deviation.mp3');
  const pcm = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, dec.stdout.length / 4);
  const FX = 0.5;
  for (let i = 0; i < N; i++) {
    const mL = pcm[i * 2] ?? 0, mR = pcm[i * 2 + 1] ?? 0;
    mixL[i] = mL + Math.tanh((fx.L[i]! + verb.L[i]! * 0.5) * FX);
    mixR[i] = mR + Math.tanh((fx.R[i]! + verb.R[i]! * 0.5) * FX);
  }
} else
for (let i = 0; i < N; i++) {
  const g = gate[i]!, d = duck[i]!;
  const l = drums.L[i]! * 0.9 + bass.L[i]! * d * 0.85 + music.L[i]! * d + verb.L[i]! * 0.9 * (0.4 + 0.6 * d) + echo.L[i]! * 0.5 * d;
  const r = drums.R[i]! * 0.9 + bass.R[i]! * d * 0.85 + music.R[i]! * d + verb.R[i]! * 0.9 * (0.4 + 0.6 * d) + echo.R[i]! * 0.5 * d;
  mixL[i] = Math.tanh((l * g + fx.L[i]! * 0.85) * 0.9);
  mixR[i] = Math.tanh((r * g + fx.R[i]! * 0.85) * 0.9);
}
// Fade the last 1.5 s so the film ends in silence.
if (SYNTH) for (let i = N - at(1.5); i < N; i++) {
  const g = (N - i) / at(1.5);
  mixL[i]! *= g * g;
  mixR[i]! *= g * g;
}

// ── write + master ──────────────────────────────────────────────────────────────────────────
function wavFloat(L: Float32Array, R: Float32Array) {
  const data = Buffer.alloc(L.length * 8);
  for (let i = 0; i < L.length; i++) {
    data.writeFloatLE(L[i]!, i * 8);
    data.writeFloatLE(R[i]!, i * 8 + 4);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
mkdirSync(join(ROOT, 'build'), { recursive: true });
mkdirSync(join(ROOT, 'public/audio'), { recursive: true });
const raw = join(ROOT, 'build/mix-raw.wav');
writeFileSync(raw, wavFloat(mixL, mixR));

// Two-pass loudnorm (linear) to -14 LUFS / -1 dBTP, trimmed to the film's exact length.
const LN = 'loudnorm=I=-14:TP=-1.0:LRA=9';
const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `${LN}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const m = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{'), p1.stderr.lastIndexOf('}') + 1)) as Record<string, string>;
const af = `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const final = join(ROOT, 'public/audio/mix.wav');
const p2 = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', String(SR), '-t', LEN_S.toFixed(6), '-c:a', 'pcm_s24le', final]);
if (p2.status !== 0) throw new Error(`loudnorm failed: ${p2.stderr}`);
console.log(`[audio] ${SYNTH ? 'synth score' : 'Deviation'} + ${SFX.length} cues, ${keys} key clicks, ${kicks.length} kicks; input ${m.input_i} LUFS → -14; ${LEN_S.toFixed(1)} s (${DURATION} frames) -> public/audio/mix.wav`);
void BAR;
export type { Pos };
