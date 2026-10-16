// devnull's design tokens, verbatim from ../dev-null.sh/DESIGN.md. Light is the default; the film
// flips to dark once (S12 → S13). `mix(theme, t)` interpolates every colour for the 320 ms flip.
import { interpolateColors } from 'remotion';
import type { Lane, Theme } from './storyboard';

export const LIGHT = {
  shell: '#f6f7f8',
  surface: '#ffffff',
  popover: '#ffffff',
  ink: '#121417',
  muted: '#5b616b',
  hairline: '#e1e4e8',
  rail: '#d3d7dd',
  wash: '#eef0f2',
  primary: '#3b6fe0',
  primaryHover: '#2e5ccb',
  primarySoft: '#e8effc',
  primaryInk: '#ffffff',
  destructive: '#c92a2a',
  amber: '#b7791f',
  lanes: ['#d9480f', '#2f9e44', '#9c36b5', '#0c8599', '#c2255c', '#b7791f'],
};
export type Palette = typeof LIGHT;

export const DARK: Palette = {
  shell: '#111112',
  surface: '#18181a',
  popover: '#1f1f22',
  ink: '#ececec',
  muted: '#a1a1a6',
  hairline: '#2a2a2d',
  rail: '#36363a',
  wash: '#232326',
  primary: '#7aa2f7',
  primaryHover: '#94b5f9',
  primarySoft: '#18233a',
  primaryInk: '#ffffff',
  destructive: '#ff6b6b',
  amber: '#fcc419',
  lanes: ['#ff8a4c', '#51cf66', '#da77f2', '#3bc9db', '#f06595', '#fcc419'],
};

export const palette = (t: Theme): Palette => (t === 'dark' ? DARK : LIGHT);

/** Every token interpolated from light (k=0) to dark (k=1). */
export function mixPalette(k: number): Palette {
  if (k <= 0) return LIGHT;
  if (k >= 1) return DARK;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(LIGHT) as (keyof Palette)[]) {
    const a = LIGHT[key];
    const b = DARK[key];
    out[key] = Array.isArray(a) ? a.map((c, i) => interpolateColors(k, [0, 1], [c, (b as string[])[i]!])) : interpolateColors(k, [0, 1], [a as string, b as string]);
  }
  return out as Palette;
}

export const lane = (p: Palette, l: Lane) => p.lanes[l]!;

export const SANS = 'Geist, ui-sans-serif, system-ui, sans-serif';
export const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
/** Body text features from DESIGN.md. */
export const BODY_FEATURES = "'ss01', 'cv11'";
