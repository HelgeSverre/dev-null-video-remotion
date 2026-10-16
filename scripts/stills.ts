/**
 * Bundle once, render many stills: bun scripts/stills.ts S04-title:20 Full:500 …
 * -> out/stills/<comp>-<frame>.jpg
 */
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const ROOT = resolve(import.meta.dir, '..');
const out = join(ROOT, 'out/stills');
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: join(ROOT, 'src/index.ts') });
for (const arg of process.argv.slice(2)) {
  const [id, frame] = arg.split(':');
  const composition = await selectComposition({ serveUrl, id: id!, });
  const output = join(out, `${id}-${frame}.jpg`);
  await renderStill({ serveUrl, composition, frame: Number(frame), output, imageFormat: 'jpeg', jpegQuality: 85, });
  console.log(output);
}
// The bundle is ~200 MB in $TMPDIR; stale ones filled the disk once. Remove it.
rmSync(serveUrl, { recursive: true, force: true });
