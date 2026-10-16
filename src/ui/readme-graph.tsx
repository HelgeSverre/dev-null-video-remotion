// The public activity graph SVG (`/@{username}/graph.svg`), rebuilt from
// ../dev-null.sh/app/Actions/CreateUserActivityGraph.php and resources/views/svg/activity-graph.blade.php:
// same geometry (10px cells on a 13px step, grid at 48,66, 196px tall, 754px wide for 53 weeks),
// same palettes, the same Oklab level mix (0.32 / 0.56 / 0.8 / 1.0 of the lane over the card),
// the same month-label rule and the same mono stats line. Pure: the scene passes in how far each
// column has filled, how far the streak text has arrived, and the light→dark amount.
import type { ReactNode } from 'react';
import { interpolateColors } from 'remotion';
import { clamp01 } from '../lib/motion';
import { rng } from '../lib/rand';
import type { Lane } from '../storyboard';
import { MONO, SANS } from '../theme';

const CELL = 10;
const STEP = 13;
const PADDING = 20;
const GRID_X = 48;
const GRID_Y = 66;
export const GRAPH_H = 196;
const LEGEND_LABEL = 28;
const LEVEL_MIX = [0, 0.32, 0.56, 0.8, 1.0];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS: [string, number][] = [['Mon', 1], ['Wed', 3], ['Fri', 5]];

type Theme = { card: string; border: string; ink: string; muted: string; empty: string; lanes: string[] };
const LIGHT: Theme = { card: '#ffffff', border: '#e1e4e8', ink: '#121417', muted: '#5b616b', empty: '#eef0f2', lanes: ['#d9480f', '#2f9e44', '#9c36b5', '#0c8599', '#c2255c', '#b7791f'] };
const DARK: Theme = { card: '#18181a', border: '#2a2a2d', ink: '#ececec', muted: '#a1a1a6', empty: '#232326', lanes: ['#ff8a4c', '#51cf66', '#da77f2', '#3bc9db', '#f06595', '#fcc419'] };

// ── Oklab mix, as CreateUserActivityGraph::mix does it ─────────────────────────────────────
const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function toOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => toLin(c / 255)) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]: [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return (
    '#' +
    [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
      .map((v) => {
        const c = Math.max(0, Math.min(1, v));
        const e = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
        return Math.round(e * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}
const mixOklab = (color: string, base: string, k: number) => {
  const a = toOklab(base);
  const b = toOklab(color);
  return fromOklab([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
};
const levels = (t: Theme, lane: Lane) => LEVEL_MIX.map((k, i) => (i === 0 ? t.empty : mixOklab(t.lanes[lane]!, t.card, k)));

// ── the year (mock, internally consistent) ─────────────────────────────────────────────────
// ActivityScale::Year: 52 weeks back from Fri 16 Oct 2026, from the Sunday of that week. 370 days,
// 53 columns, the last one Sun–Fri. Longest streak 12 days, current 3 (same as the profile scene).
const START = Date.UTC(2025, 9, 12); // Sun 12 Oct 2025
const DAYS = 370;
export const COLUMNS = Math.ceil(DAYS / 7);
export const GRAPH_W = GRID_X + COLUMNS * STEP - (STEP - CELL) + PADDING; // 754
export const LONGEST = 12;
export const CURRENT = 3;
/** First day of the planted longest streak. */
const STREAK_AT = 247;

export const COUNTS: number[] = (() => {
  const r = rng(20261016);
  const out: number[] = [];
  for (let i = 0; i < DAYS; i++) {
    const dow = i % 7;
    const season = 0.72 + 0.22 * Math.sin(i / 37 + 1.1) + 0.08 * Math.sin(i / 9);
    const p = (dow === 0 ? 0.28 : dow === 6 ? 0.36 : 0.74) * season;
    out.push(r() < p ? 1 + Math.floor(Math.pow(r(), 1.7) * 9) : 0);
  }
  // no run longer than the planted one
  let run = 0;
  for (let i = 0; i < DAYS; i++) {
    run = out[i]! > 0 ? run + 1 : 0;
    if (run > LONGEST - 2) {
      out[i] = 0;
      run = 0;
    }
  }
  // the longest streak, fenced by empty days
  out[STREAK_AT - 1] = 0;
  out[STREAK_AT + LONGEST] = 0;
  for (let i = 0; i < LONGEST; i++) out[STREAK_AT + i] = Math.max(2, out[STREAK_AT + i]!, 3 + ((i * 5) % 6));
  // the current streak: the last three days, after a day off
  out[DAYS - CURRENT - 1] = 0;
  for (let i = DAYS - CURRENT; i < DAYS; i++) out[i] = Math.max(1, out[i]!);
  return out;
})();
const MAX = Math.max(1, ...COUNTS);
const LEVEL = COUNTS.map((c) => (c === 0 ? 0 : Math.max(1, Math.ceil((c / MAX) * 4))));
export const TOTAL = COUNTS.reduce((s, c) => s + c, 0);
export const isStreakDay = (i: number) => i >= STREAK_AT && i < STREAK_AT + LONGEST;

/** CreateUserActivityGraph::months(): the month of each week that starts one, skipping a cramped first label. */
const MONTH_LABELS = (() => {
  const months: number[] = [];
  for (let c = 0; c < COLUMNS; c++) months.push(new Date(START + c * 7 * 86400000).getUTCMonth());
  const out: { label: string; x: number }[] = [];
  months.forEach((m, c) => {
    const changes = c === 0 || m !== months[c - 1];
    const close = c === 0 && months.slice(1, 3).some((x) => x !== m);
    if (changes && !close) out.push({ label: MONTHS[m]!, x: GRID_X + c * STEP });
  });
  return out;
})();

const fmt = (n: number) => n.toLocaleString('en-US');

export type GraphProps = {
  lane: Lane;
  /** 0 = ?theme=light (the default), 1 = ?theme=dark. */
  dark?: number;
  /** Fill progress 0..1 of column `c` (cells pop in from the empty colour). */
  column: (c: number) => number;
  /** 0..1: the "longest streak · current" part of the stats line. */
  streak: number;
  /** 0..1 flash on the longest-streak cells (full lane colour, slight swell), staggered by day. */
  streakFlash?: (day: number) => number;
};

/** The SVG, at its own 754×196 product size. */
export function ActivityGraphSvg({ lane, dark = 0, column, streak, streakFlash }: GraphProps) {
  const L = levels(LIGHT, lane);
  const D = levels(DARK, lane);
  const c = (a: string, b: string) => (dark <= 0 ? a : dark >= 1 ? b : interpolateColors(dark, [0, 1], [a, b]));
  const T = { card: c(LIGHT.card, DARK.card), border: c(LIGHT.border, DARK.border), ink: c(LIGHT.ink, DARK.ink), muted: c(LIGHT.muted, DARK.muted), lane: c(LIGHT.lanes[lane]!, DARK.lanes[lane]!) };
  const lv = L.map((x, i) => c(x, D[i]!));

  const cells: ReactNode[] = [];
  let shown = 0;
  for (let i = 0; i < DAYS; i++) {
    const col = Math.floor(i / 7);
    const p = clamp01(column(col));
    const level = LEVEL[i]!;
    if (p >= 0.5) shown += COUNTS[i]!;
    const lit = level > 0 && p > 0;
    // a lit cell pops: 0.55 → 1.12 → 1 as p runs 0 → 1
    const pop = lit ? (p < 0.6 ? 0.55 + (1.12 - 0.55) * (p / 0.6) : 1.12 - 0.12 * ((p - 0.6) / 0.4)) : 1;
    const flash = streakFlash && isStreakDay(i) ? streakFlash(i - STREAK_AT) : 0;
    const s = CELL * pop * (1 + 0.2 * flash);
    const x = GRID_X + col * STEP + (CELL - s) / 2;
    const y = GRID_Y + (i % 7) * STEP + (CELL - s) / 2;
    const base = lit ? (p >= 1 ? lv[level]! : interpolateColors(Math.min(1, p * 1.6), [0, 1], [lv[0]!, lv[level]!])) : lv[0]!;
    const fill = flash > 0.01 ? interpolateColors(flash, [0, 1], [base, lv[4]!]) : base;
    cells.push(<rect key={i} x={x} y={y} width={s} height={s} rx={2} fill={fill} />);
  }
  const legendX = (l: number) => GRAPH_W - PADDING - LEGEND_LABEL - CELL - (4 - l) * STEP;

  return (
    <svg width={GRAPH_W} height={GRAPH_H} viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} style={{ display: 'block', overflow: 'visible' }}>
      <rect x={0.5} y={0.5} width={GRAPH_W - 1} height={GRAPH_H - 1} rx={6} fill={T.card} stroke={T.border} />
      <circle cx={PADDING + 4} cy={27.5} r={4} fill={T.lane} />
      <text x={PADDING + 14} y={32} fontSize={13} fill={T.ink} fontFamily={MONO}>
        @helgesverre
      </text>
      <path transform={`translate(${GRAPH_W - PADDING - 80} 20.5) scale(0.5833)`} fillRule="evenodd" fill={T.ink} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.5c1.6 0 3.08.5 4.3 1.37L5.87 16.3A7.5 7.5 0 0 1 12 4.5Zm0 15a7.47 7.47 0 0 1-4.3-1.37L18.13 7.7A7.5 7.5 0 0 1 12 19.5Z" />
      <text x={GRAPH_W - PADDING} y={32} fontSize={13} fontWeight={600} textAnchor="end" fill={T.ink} fontFamily={SANS} textLength={60} lengthAdjust="spacingAndGlyphs">
        /dev/null
      </text>
      <g fontSize={10} fill={T.muted} fontFamily={SANS}>
        {MONTH_LABELS.map((m) => (
          <text key={`${m.label}${m.x}`} x={m.x} y={58}>
            {m.label}
          </text>
        ))}
        {WEEKDAYS.map(([label, row]) => (
          <text key={label} x={PADDING} y={GRID_Y + row * STEP + CELL / 2 + 3.5}>
            {label}
          </text>
        ))}
      </g>
      <g>{cells}</g>
      <text x={PADDING} y={180} fontSize={11} fill={T.muted} fontFamily={MONO}>
        <tspan fill={T.ink}>{fmt(shown)}</tspan> {shown === 1 ? 'commit' : 'commits'} in the last year
        <tspan opacity={clamp01(streak * 1.5)}>
          {' · longest streak '}
          <tspan fill={T.ink}>{LONGEST}</tspan> days · <tspan fill={T.lane}>●</tspan> current <tspan fill={T.ink}>{CURRENT}</tspan>
        </tspan>
      </text>
      <g fontSize={10} fill={T.muted} fontFamily={SANS}>
        <text x={legendX(0) - 4} y={180} textAnchor="end">
          Less
        </text>
        <text x={legendX(4) + CELL + 4} y={180}>
          More
        </text>
      </g>
      {[0, 1, 2, 3, 4].map((l) => (
        <rect key={l} x={legendX(l)} y={171} width={CELL} height={CELL} rx={2} fill={lv[l]} />
      ))}
    </svg>
  );
}
