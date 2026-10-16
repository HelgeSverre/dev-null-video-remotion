import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { FONT_FILES } from './font-files';

/** Resolves once every face is loaded (each loadFont also holds the render via delayRender). */
export const fontsReady = Promise.all(
  FONT_FILES.flatMap(([family, pkg, weights]) =>
    weights.map((weight) => loadFont({ family, weight: String(weight), style: 'normal', url: staticFile(`fonts/${pkg}-latin-${weight}-normal.woff2`) })),
  ),
);
