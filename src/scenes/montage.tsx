// S13 montage (bars 29–34, dark): "and the rest". Twelve hard cuts, one every two beats from 29.1
// (MONTAGE / montageAt). One idea per cut: a 2–4 word headline and the product UI as proof at
// ~2× scale. Each cut lands with a short expo-out slide from a side that alternates, then drifts;
// something inside each vignette resolves before the next cut. A mini graph rail on the left edge
// lights one node per cut in rotating lane colours and ties the cuts together.
import { BEAT } from '../lib/clock';
import type { ComponentType } from 'react';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeOut, expoOut, nodeIn, pulse, punch } from '../lib/motion';
import { MONTAGE, montageAt } from '../storyboard';
import { MONO, SANS, type Palette } from '../theme';
import { Node, Words } from '../ui/kit';
import { ApiV, CodeV, EmbedsV, LastVisitV, NotificationsV, PollV, RateLimitV, SearchV, SecretsV, SeriesV, StashV, UndoV, type VProps } from '../ui/montage-vignettes';

type Layout = 'left' | 'right' | 'top' | 'none';
type Cut = { id: (typeof MONTAGE)[number]; V: ComponentType<VProps>; label: string; sub?: string; layout: Layout; scale: number; from: [number, number]; ui?: [number, number] };

/** UI centre per layout (screen px), label box per layout. */
const UI_AT: Record<Layout, [number, number]> = { left: [1260, 540], right: [720, 540], top: [960, 620], none: [960, 540] };

const CUTS: Cut[] = [
  { id: 'undo', V: UndoV, label: 'Undo for\n30 seconds.', layout: 'left', scale: 1.85, from: [1, 0] },
  { id: 'stash', V: StashV, label: 'Drafts\ncome back.', layout: 'right', scale: 1.8, from: [-1, 0] },
  { id: 'secrets', V: SecretsV, label: 'Secrets get caught.', layout: 'top', scale: 1.7, from: [0, 1], ui: [960, 680] },
  { id: 'poll', V: PollV, label: 'Ask the log.', layout: 'left', scale: 1.85, from: [1, 0] },
  { id: 'code', V: CodeV, label: 'Code, highlighted.', layout: 'top', scale: 2.2, from: [0, 1], ui: [960, 580] },
  { id: 'series', V: SeriesV, label: 'Say more,\nin a series.', layout: 'right', scale: 1.85, from: [-1, 0] },
  { id: 'search', V: SearchV, label: 'Find anyone.', layout: 'top', scale: 1.95, from: [0, 0], ui: [960, 560] },
  { id: 'embeds', V: EmbedsV, label: 'Links play\ninline.', layout: 'left', scale: 1.75, from: [1, 0] },
  { id: 'notifications', V: NotificationsV, label: 'Your inbox\nis a log.', layout: 'right', scale: 1.85, from: [-1, 0] },
  { id: 'ratelimit', V: RateLimitV, label: '', layout: 'none', scale: 2.2, from: [-1, 0], ui: [1000, 540] },
  { id: 'lastvisit', V: LastVisitV, label: 'Where you\nleft off.', layout: 'left', scale: 1.8, from: [1, 0] },
  { id: 'api', V: ApiV, label: 'Read it with curl.', layout: 'top', scale: 1.0, from: [0, 1], ui: [990, 615] },
];

const RAIL_X = 64;
const RAIL_TOP = 200;
const RAIL_STEP = 62;
const NODE = 16;

/** The persistent mini rail: one node per cut, filled in rotating lane colours as the cuts pass. */
function MiniRail({ P, cut, t }: { P: Palette; cut: number; t: number }) {
  const y = (i: number) => RAIL_TOP + i * RAIL_STEP;
  const lc = (i: number) => P.lanes[(i + 2) % 6]!;
  return (
    <>
      {CUTS.slice(0, -1).map((_, i) => {
        const drawn = i < cut ? 1 : 0;
        return (
          <div key={`s${i}`} style={{ position: 'absolute', left: RAIL_X - 1, top: y(i) + NODE / 2, width: 2, height: RAIL_STEP - NODE, background: P.rail }}>
            <div style={{ width: 2, height: `${100 * drawn}%`, background: lc(i) }} />
          </div>
        );
      })}
      {CUTS.map((_, i) => {
        const past = i < cut;
        const now = i === cut;
        return (
          <div key={`n${i}`} style={{ position: 'absolute', left: RAIL_X - NODE / 2, top: y(i) - NODE / 2 }}>
            <Node size={NODE} P={P} color={past || now ? lc(i) : P.rail} hollow={!(past || now)} ring={2} gapColor={P.shell} scale={now ? nodeIn(t + 3, 0) : 1} pulse={now ? pulse(t + 3, 0, 20) : undefined} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: RAIL_X - 22, top: y(CUTS.length - 1) + 34, fontFamily: MONO, fontSize: 18, color: P.muted, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: P.ink }}>{String(cut + 1).padStart(2, '0')}</span>/12
      </div>
    </>
  );
}

function Label({ text, sub, layout, t, P }: { text: string; sub?: string; layout: Layout; t: number; P: Palette }) {
  if (layout === 'none') return null;
  const lines = text.split('\n');
  const top = layout === 'top';
  const style = {
    position: 'absolute' as const,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: top ? 96 : 100,
    letterSpacing: '-0.04em',
    lineHeight: 1.04,
    color: P.ink,
    ...(top ? { left: 0, right: 0, top: 118 } : layout === 'left' ? { left: 150, width: 560, top: 540, transform: 'translateY(-50%)' } : { left: 1290, width: 600, top: 540, transform: 'translateY(-50%)' }),
  };
  return (
    <>
      <div style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: top ? 'center' : 'flex-start' }}>
        {lines.map((line, li) => {
          const before = lines.slice(0, li).join(' ').split(' ').filter(Boolean).length;
          return <Words key={li} words={line.split(' ')} progress={(i) => easeOut((t + 6 - (before + i) * 0.8) / 6)} />;
        })}
      </div>
      {sub ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: P.muted, opacity: clamp01((t - 2) / 6) }}>{sub}</div>
      ) : null}
    </>
  );
}

export function Montage() {
  const { f, F, P, at } = useScene();
  const starts = CUTS.map((_, i) => at(montageAt(i)));
  let cut = 0;
  for (let i = 0; i < starts.length; i++) if (f >= starts[i]!) cut = i;
  // Vignettes are authored for 30-frame cuts; at 144 BPM a cut is 2 beats ≈ 25 frames, so play them at that speed.
  const t = (f - starts[cut]!) * (30 / (2 * BEAT));
  const c = CUTS[cut]!;
  const V = c.V;

  // Cut-in: expo-out slide from the cut's side (6 frames), a tiny scale settle, then drift.
  const land = expoOut(clamp01(t / 7));
  const dx = (1 - land) * c.from[0] * 80;
  const dy = (1 - land) * c.from[1] * 60;
  const sc = c.scale * (1.035 - 0.035 * land) * (1 + 0.018 * clamp01(t / 30));
  const [ux, uy] = c.ui ?? UI_AT[c.layout];
  // Rate-limit cut: the page gets "throttled" with a short horizontal shudder.
  const shudder = c.id === 'ratelimit' ? Math.sin(t * 2.6) * 10 * punch(t, 0, 9) : 0;
  // Whole-frame camera drift so no frame is static; a small kick on every cut.
  const cam = 1 + 0.012 * punch(t, 0, 8) + 0.004 * Math.sin(f / 40);

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <div style={{ position: 'absolute', left: ux + dx + shudder, top: uy + dy, transform: `translate(-50%, -50%) scale(${sc})`, transformOrigin: '50% 50%' }}>
          <V t={t} P={P} F={F} />
        </div>
        <Label text={c.label} sub={c.sub} layout={c.layout} t={t} P={P} />
      </AbsoluteFill>
      <MiniRail P={P} cut={cut} t={t} />
      {/* the drop on 29.1: a short flash after the beat of silence */}
      <AbsoluteFill style={{ background: P.ink, opacity: punch(f, 0, 6) * 0.22, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
