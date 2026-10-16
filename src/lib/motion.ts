// Deterministic motion helpers. No randomness, no wall clock, no CSS keyframes: everything is a
// pure function of the frame.
import { Easing, interpolate } from 'remotion';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** DESIGN.md's expo-out (nav slides, node-in). */
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(x)));

/** 0→1 over [at, at+dur] frames, eased (default cubic out). */
export function ramp(f: number, at: number, dur: number, ease: (x: number) => number = easeOut) {
  if (dur <= 0) return f >= at ? 1 : 0;
  return ease((f - at) / dur);
}
/** 1→0 window: rises over `inDur` at `a`, falls over `outDur` ending at `b`. */
export function window(f: number, a: number, b: number, inDur = 8, outDur = 8) {
  return Math.min(ramp(f, a, inDur), 1 - ramp(f, b - outDur, outDur, easeIn));
}

/**
 * Damped spring 0→1 starting at frame `at` (critically under-damped, the house "pop").
 * `frames` ≈ settle time; `bounce` 0..1 controls overshoot.
 */
export function spring(f: number, at: number, frames = 18, bounce = 0.35) {
  const t = (f - at) / frames;
  if (t <= 0) return 0;
  if (t >= 1.6) return 1;
  const zeta = 1 - bounce * 0.85;
  const w = 9;
  const wd = w * Math.sqrt(Math.max(0.0001, 1 - zeta * zeta));
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
}

/** devnull's node-in: scale 0 → 1.25 → 1 over 21 frames (700 ms), expo-out. */
export function nodeIn(f: number, at: number) {
  const t = (f - at) / 21;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.45 ? interpolate(t, [0, 0.45], [0, 1.25], { easing: Easing.out(Easing.exp) }) : interpolate(t, [0.45, 1], [1.25, 1], { easing: Easing.inOut(Easing.cubic) });
}
/** The lane-coloured pulse ring that accompanies node-in: radius scale and opacity. */
export function pulse(f: number, at: number, frames = 24) {
  const t = clamp01((f - at) / frames);
  return { scale: 1 + 1.6 * easeOut(t), opacity: f < at ? 0 : 0.55 * (1 - t) };
}

/** Kick-style punch: 1 at the hit decaying to 0 over `frames`. */
export function punch(f: number, at: number, frames = 10) {
  const t = (f - at) / frames;
  return t < 0 || t > 1 ? 0 : Math.pow(1 - t, 2);
}
