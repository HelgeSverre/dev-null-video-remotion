// Seeded randomness and the typing schedule. Shared by React (frames) and the score (seconds).
import { frameAt, FPS } from './clock';
import type { TypeRun } from '../storyboard';

/** mulberry32: same seed, same sequence, every render, every process. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable 32-bit hash of a string (FNV-1a). */
export function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
/** Smooth 1D value noise in [-1, 1]. */
export function noise(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const r = (n: number) => (rng(hash(`${seed}:${n}`))() * 2 - 1);
  const u = f * f * (3 - 2 * f);
  return r(i) * (1 - u) + r(i + 1) * u;
}

/**
 * Absolute film frame (fractional) at which each character of a typing run appears. Characters
 * are spread over [from, to] with seeded jitter; spaces and punctuation get a slightly longer gap,
 * like a person typing. The last character lands exactly on `to`.
 */
export function typeTimes(run: TypeRun): number[] {
  const a = frameAt(run.from);
  const b = frameAt(run.to);
  const r = rng(run.seed);
  const w = [...run.text].map((ch) => (/[\s'|/.,-]/.test(ch) ? 1.6 : 1) * (0.55 + r() * 0.9));
  const total = w.reduce((s, x) => s + x, 0);
  let acc = 0;
  return w.map((x) => {
    acc += x;
    return a + ((b - a) * acc) / total;
  });
}
/** Same schedule in seconds (for the score's key clicks). */
export const typeSeconds = (run: TypeRun) => typeTimes(run).map((f) => f / FPS);
/** Number of characters of a run visible at absolute frame `f`. */
export function typedCount(run: TypeRun, f: number) {
  const t = typeTimes(run);
  let n = 0;
  while (n < t.length && t[n]! <= f) n++;
  return n;
}
