/**
 * The acceptance gate for a render: bun scripts/verify.ts [out/dev-null-launch.mp4]
 *  1. frame count equals the film's DURATION;
 *  2. the audio track equals public/audio/mix.wav in time: cross-correlating 5 ms energy envelopes
 *     at 8 probes across the film must find |lag| <= 20 ms;
 *  3. the music's section edges are where the film's clock puts them: Deviation's groove comes in
 *     on bar 5, the breakdown starts on bar 31, the drop hits on bar 33 (the cuts the picture lands
 *     on). Energy in the 250 ms after each downbeat must rise (or fall) by more than 15 %.
 */
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { DURATION, secAt, type Pos } from '../src/lib/clock';

const ROOT = resolve(import.meta.dir, '..');
const file = resolve(process.argv[2] ?? join(ROOT, 'out/dev-null-launch.mp4'));
const SR = 8000;
const fail: string[] = [];

const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', file], { encoding: 'utf8' });
const frames = Number(probe.stdout.trim());
if (frames !== DURATION) fail.push(`frames ${frames} != ${DURATION}`);
console.log(`[verify] frames ${frames} / expected ${DURATION}`);

function pcm(src: string): Float32Array {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-map', 'a:0', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`decode failed: ${src}`);
  const b = r.stdout as Buffer;
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}
const vid = pcm(file);
const ref = pcm(join(ROOT, 'public/audio/mix.wav'));
const envOf = (x: Float32Array) => {
  const hop = SR / 200;
  const out = new Float32Array(Math.floor(x.length / hop));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = 0; j < hop; j++) s += x[i * hop + j]! ** 2;
    out[i] = Math.sqrt(s / hop);
  }
  return out;
};
const ev = envOf(vid), er = envOf(ref);
for (let p = 1; p <= 8; p++) {
  const c = Math.floor((er.length * p) / 9);
  let best = 0, bestLag = 0;
  for (let lag = -40; lag <= 40; lag++) {
    let s = 0;
    for (let i = c; i < c + 800; i++) s += (er[i] ?? 0) * (ev[i + lag] ?? 0);
    if (s > best) { best = s; bestLag = lag; }
  }
  console.log(`[verify] probe ${p} @ ${((c * 5) / 1000).toFixed(0)} s: lag ${bestLag * 5} ms`);
  if (Math.abs(bestLag * 5) > 20) fail.push(`probe ${p}: audio lag ${bestLag * 5} ms`);
}
const rms = (a: number, b: number) => {
  const i0 = Math.max(0, Math.floor(a * SR)), i1 = Math.floor(b * SR);
  let s = 0;
  for (let i = i0; i < i1; i++) s += (vid[i] ?? 0) ** 2;
  return Math.sqrt(s / Math.max(1, i1 - i0));
};
const SECTIONS: [Pos, 'up' | 'down'][] = [[[5, 1], 'up'], [[31, 1], 'down'], [[33, 1], 'up']];
for (const [p, dir] of SECTIONS) {
  const t = secAt(p);
  const r = rms(t, t + 0.25) / Math.max(1e-6, rms(t - 0.25, t));
  const ratio = dir === 'up' ? r : 1 / Math.max(1e-6, r);
  console.log(`[verify] section ${dir} at bar ${p[0]} (${t.toFixed(2)} s): ${ratio.toFixed(2)}x`);
  if (ratio < 1.15) fail.push(`no section ${dir} at bar ${p[0]} (${ratio.toFixed(2)}x)`);
}
if (fail.length) {
  console.error(`[verify] FAIL\n  ${fail.join('\n  ')}`);
  process.exit(1);
}
console.log('[verify] PASS');
