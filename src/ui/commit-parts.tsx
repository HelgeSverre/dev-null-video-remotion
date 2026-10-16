// Shared pieces for the "how it works" scenes (S05 commit, S06 log, S07 identity, S08 lanes).
// Copied/derived from ../dev-null.sh/resources/js/components so the film draws the product's own
// icons (lucide), GitHub mark, sonner toast and composer toolbar. Pure: every animated value is a prop.
import type { CSSProperties, ReactNode } from 'react';
import { MONO, SANS, type Palette } from '../theme';

// ── lucide icons the kit doesn't carry (24-unit viewBox) ───────────────────────────────────
const PATHS = {
  imagePlus: 'M16 5h6 M19 2v6 M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5 m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21 M9 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  chartBar: 'M3 3v16a2 2 0 0 0 2 2h16 M7 16h8 M7 11h12 M7 6h3',
  link2: 'M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 1 1 0 10h-2 M8 12h8',
  eye: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  plus: 'M5 12h14 M12 5v14',
  clock3: 'M12 6v6h4 M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
  arrowUpRight: 'M7 7h10v10 M7 17 17 7',
  arrowUp: 'm5 12 7-7 7 7 M12 19V5',
  gitCommit: 'M12 3v6 M12 15v6 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  bell: 'M10.268 21a2 2 0 0 0 3.464 0 M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
  userRound: 'M12 8m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M20 21a8 8 0 0 0-16 0',
  bookmark: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z',
  settings2: 'M14 17H5 M19 7h-9 M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M7 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  search: 'm21 21-4.34-4.34 M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0',
  check: 'M20 6 9 17l-5-5',
} as const;
export type LucideName = keyof typeof PATHS;

export function Lucide({ name, size = 20, color, stroke = 2, style }: { name: LucideName; size?: number; color: string; stroke?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none', ...style }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

/** components/github-icon.tsx, verbatim path (filled). */
export function GitHubMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block', flex: 'none' }}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

/** The macOS arrow pointer, tip at (0,0). `down` 0..1 squashes it slightly for a click. */
export function Pointer({ x, y, size = 30, down = 0, opacity = 1 }: { x: number; y: number; size?: number; down?: number; opacity?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity, transform: `scale(${1 - 0.12 * down})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
      <svg width={size} height={size * 1.5} viewBox="0 0 20 30" style={{ display: 'block', overflow: 'visible' }}>
        <path d="M1 1 L1 23 L6.5 17.8 L10.2 26.6 L14 25 L10.4 16.4 L18 16.4 Z" fill="#121417" stroke="#ffffff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Sonner toast as the product configures it: popover surface, hairline border, 356px wide, bottom-right. */
export function SonnerToast({ P, children, style }: { P: Palette; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: 356,
        boxSizing: 'border-box',
        padding: 16,
        borderRadius: 8,
        background: P.popover,
        border: `1px solid ${P.hairline}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        color: P.ink,
        fontFamily: MONO,
        fontSize: 13,
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A dashed vertical rail-gray line (border-l-2 border-dashed), the staged composer's tail. */
export function DashedTail({ x, y, h, color, width = 2 }: { x: number; y: number; h: number; color: string; width?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y,
        width,
        height: Math.max(0, h),
        background: `repeating-linear-gradient(to bottom, ${color} 0 6px, transparent 6px 12px)`,
      }}
    />
  );
}

/** Ghost icon button (size-9, size-5 icon) from the composer toolbar. */
export function ToolIcon({ name, P }: { name: LucideName; P: Palette }) {
  return (
    <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flex: 'none' }}>
      <Lucide name={name} size={20} color={P.muted} />
    </span>
  );
}

/** Bordered mono kbd cap as app-aside draws it (border border-b-2 bg-muted px-1.5 text-xs). */
export function AsideKbd({ P, children }: { P: Palette; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-block', borderRadius: 4, border: `1px solid ${P.hairline}`, borderBottomWidth: 2, background: P.wash, padding: '0 6px', fontFamily: MONO, fontSize: 12, lineHeight: '18px', color: P.ink }}>
      {children}
    </span>
  );
}

export const sans = (size: number, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: SANS, fontSize: size, fontWeight: weight, ...extra });
export const mono = (size: number, weight = 400, extra?: CSSProperties): CSSProperties => ({ fontFamily: MONO, fontSize: size, fontWeight: weight, fontVariantNumeric: 'tabular-nums', ...extra });

/** components/page-tabs.tsx: full-width split, 15px medium, active in ink with a 3px blue underline. */
export function PageTabs({ P, tabs, active, width }: { P: Palette; tabs: string[]; active: number; width: number }) {
  return (
    <div style={{ display: 'flex', width, borderBottom: `1px solid ${P.hairline}`, background: P.surface, fontFamily: SANS, fontSize: 15, fontWeight: 500 }}>
      {tabs.map((t, i) => (
        <div key={t} style={{ flex: 1, display: 'flex', justifyContent: 'center', color: i === active ? P.ink : P.muted }}>
          <span style={{ position: 'relative', padding: '14px 0', lineHeight: '22px' }}>
            {t}
            {i === active ? <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: P.primary }} /> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/** node-in's lane pulse drawn as an expanding ring, so it can sit above the row without hiding the avatar. */
export function PulseRing({ x, y, size, color, scale, opacity }: { x: number; y: number; size: number; color: string; scale: number; opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `${3 / scale}px solid ${color}`, opacity: Math.min(1, opacity * 1.6), transform: `scale(${scale})`, boxSizing: 'border-box', pointerEvents: 'none' }} />
  );
}
