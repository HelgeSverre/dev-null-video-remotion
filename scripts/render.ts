/**
 * Chunked render (pattern from claude-in-the-standup): bundle once -> render frame ranges in fresh
 * processes (muted, retried, resumable) -> ffmpeg concat (-c copy) -> mux public/audio/mix.wav once
 * -> frame-count check -> web copy + poster.
 *
 *   bun scripts/render.ts [--comp Full] [--draft] [--concurrency 6] [--chunk 1200] [--fresh]
 *
 * Outputs: out/dev-null-launch.mp4 (master), out/dev-null-launch-web.mp4,
 * out/poster.jpg; --draft -> out/draft.mp4 at half size. Chunks are deleted after a successful
 * concat to save disk.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getCompositions } from '@remotion/renderer';
import { sceneFrom } from '../src/lib/scene';
import { SCENES } from '../src/storyboard';

const ROOT = resolve(import.meta.dir, '..');
const OUT = join(ROOT, 'out');
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string, d: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1]! : d);
const comp = opt('comp', 'Full');
const draft = flag('draft');
const concurrency = Number(opt('concurrency', '6'));
const chunkSize = Number(opt('chunk', '1200'));

function run(cmd: string, argv: string[]) {
  console.log(`[render] ${cmd} ${argv.join(' ')}`);
  return spawnSync(cmd, argv, { cwd: ROOT, stdio: 'inherit' }).status === 0;
}
function must(cmd: string, argv: string[]) {
  if (!run(cmd, argv)) throw new Error(`${cmd} failed`);
}
function frameCount(file: string): number {
  if (!existsSync(file)) return -1;
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return r.status === 0 ? Number(r.stdout.trim()) : -1;
}
const mb = (p: string) => `${(statSync(p).size / 1e6).toFixed(1)} MB`;

const t0 = performance.now();
const name = comp === 'Full' ? (draft ? 'draft' : 'dev-null-launch') : `${comp}${draft ? '-draft' : ''}`;
const bundle = join(OUT, 'bundle');
const chunkDir = join(OUT, 'chunks', name);
if (flag('fresh')) rmSync(chunkDir, { recursive: true, force: true });
mkdirSync(chunkDir, { recursive: true });
if (!flag('skip-bundle')) must('bunx', ['remotion', 'bundle', 'src/index.ts', '--out-dir', bundle, '--log=error']);

const comps = await getCompositions(bundle, { logLevel: 'error' });
const meta = comps.find((c) => c.id === comp);
if (!meta) throw new Error(`no composition ${comp}`);
const startFrame = Number((meta.props as { startFrame?: number }).startFrame ?? 0);
const total = meta.durationInFrames;

// Chunk boundaries snap to scene starts where possible.
const ranges: [number, number][] = [];
let a = 0;
const sceneStarts = SCENES.map((s) => sceneFrom(s) - startFrame).filter((f) => f > 0 && f < total);
while (a < total) {
  let b = Math.min(total - 1, a + chunkSize - 1);
  const snap = sceneStarts.filter((s) => s > a + chunkSize / 2 && s <= b + 1).pop();
  if (snap !== undefined && b < total - 1) b = snap - 1;
  ranges.push([a, b]);
  a = b + 1;
}
const quality = draft ? ['--scale=0.5', '--crf=26', '--jpeg-quality=80'] : [];
const files: string[] = [];
const rs = performance.now();
for (const [i, [x, y]] of ranges.entries()) {
  const file = join(chunkDir, `${String(i).padStart(2, '0')}_${x}-${y}.mp4`);
  files.push(file);
  if (frameCount(file) === y - x + 1) {
    console.log(`[render] chunk ${i + 1}/${ranges.length} ${x}-${y}: reusing`);
    continue;
  }
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    const s = performance.now();
    ok = run('bunx', ['remotion', 'render', bundle, comp, file, `--frames=${x}-${y}`, '--muted', `--concurrency=${concurrency}`, '--log=error', ...quality]);
    ok &&= frameCount(file) === y - x + 1;
    const secs = (performance.now() - s) / 1000;
    console.log(`[render] chunk ${i + 1}/${ranges.length} ${x}-${y}: ${ok ? 'ok' : 'FAILED'} in ${secs.toFixed(0)} s (${((y - x + 1) / secs).toFixed(1)} fps)`);
  }
  if (!ok) throw new Error(`chunk ${x}-${y} failed`);
}
const renderSecs = (performance.now() - rs) / 1000;

const list = join(chunkDir, 'chunks.txt');
writeFileSync(list, files.map((f) => `file '${f}'`).join('\n') + '\n');
const video = join(chunkDir, 'video.mp4');
must('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
const output = join(OUT, `${name}.mp4`);
const duration = total / meta.fps;
must('ffmpeg', [
  '-loglevel', 'error', '-y', '-i', video,
  '-ss', (startFrame / meta.fps).toFixed(6), '-t', duration.toFixed(6), '-i', join(ROOT, 'public/audio/mix.wav'),
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', output,
]);
const frames = frameCount(output);
if (frames !== total) throw new Error(`${output}: ${frames} frames, expected ${total}`);
console.log(`[render] ${output}: ${frames} frames (${duration.toFixed(2)} s), ${mb(output)}; ${(total / renderSecs).toFixed(1)} fps`);
rmSync(chunkDir, { recursive: true, force: true });

if (comp === 'Full' && !draft) {
  const web = join(OUT, `${name}-web.mp4`);
  must('ffmpeg', ['-loglevel', 'error', '-y', '-i', output, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', web]);
  const title = SCENES.find((s) => s.id === 'title')!;
  const poster = join(OUT, 'poster.jpg');
  must('ffmpeg', ['-loglevel', 'error', '-y', '-ss', ((sceneFrom(title) + 100) / meta.fps).toFixed(3), '-i', output, '-frames:v', '1', '-q:v', '2', poster]);
  console.log(`[render] web ${mb(web)}, poster ${poster}`);
}
console.log(`[render] done in ${((performance.now() - t0) / 60000).toFixed(1)} min`);
