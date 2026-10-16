/** Contact sheet: three frames (20/55/90 % in) of every scene, in order -> out/contact.jpg (6×9 grid, no labels: this ffmpeg lacks drawtext). */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FPS } from '../src/lib/clock';
import { sceneFrom, sceneLen } from '../src/lib/scene';
import { SCENES } from '../src/storyboard';

const ROOT = resolve(import.meta.dir, '..');
const file = resolve(process.argv[2] ?? join(ROOT, 'out/dev-null-launch.mp4'));
const tmp = join(ROOT, 'out/contact-frames');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const list: string[] = [];
let k = 0;
for (const s of SCENES)
  for (const q of [0.2, 0.55, 0.9]) {
    const frame = Math.floor(sceneFrom(s) + sceneLen(s) * q);
    spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', (frame / FPS).toFixed(3), '-i', file, '-frames:v', '1', '-vf', 'scale=480:-1', join(tmp, `${String(k++).padStart(3, '0')}.jpg`)]);
    list.push(`${k} ${s.id} frame ${frame}`);
  }
const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-pattern_type', 'glob', '-i', join(tmp, '*.jpg'), '-vf', 'tile=6x9:padding=4:color=0x888888', '-frames:v', '1', join(ROOT, 'out/contact.jpg')]);
if (r.status !== 0) throw new Error(String(r.stderr));
writeFileSync(join(ROOT, 'out/contact.txt'), list.join('\n') + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log('out/contact.jpg (+ contact.txt)');
