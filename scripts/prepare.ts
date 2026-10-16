// Copy font files from @fontsource into public/fonts (Remotion serves them via staticFile).
import { copyFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FONT_FILES } from '../src/font-files';

const ROOT = resolve(import.meta.dir, '..');
mkdirSync(join(ROOT, 'public/fonts'), { recursive: true });
for (const [, pkg, weights] of FONT_FILES)
  for (const w of weights) {
    const name = `${pkg}-latin-${w}-normal.woff2`;
    copyFileSync(join(ROOT, 'node_modules/@fontsource', pkg, 'files', name), join(ROOT, 'public/fonts', name));
  }
console.log('[prepare] fonts copied');
