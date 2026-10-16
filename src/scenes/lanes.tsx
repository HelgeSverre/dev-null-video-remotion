// S08 lanes (bars 17–18): "Pick your lane." The settings colour picker at 2.7×
// (components/lane-picker.tsx): a live preview row (rail, 48px avatar in the lane ring, lane-dotted
// handle) over seven 28px swatches: dashed "Auto" (the protagonist's hashed lane is teal), then Orange, Green,
// Violet, Teal, Rose, Ochre. The selection ring hops on every beat (LANE_HOPS, pop each), sliding to
// the new swatch while the preview and the big rail behind the headline crossfade into the new lane.
// Lands on teal on 18.4; onboarding's prompt reads `$ export LANE=teal`.
import { AbsoluteFill, interpolateColors } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, expoOut, punch, ramp } from '../lib/motion';
import { CAST, LANE_HOPS, type Lane } from '../storyboard';
import { Avatar, Cursor, LaneDot, Node, Segment } from '../ui/kit';
import { mono, PulseRing, sans } from '../ui/commit-parts';
import { SANS } from '../theme';

const K = 2.7;
const RAIL_X = 176;
const HEAD_Y = 226; // headline node / centre line
const PROMPT_Y = 398;
const PICKER_X = 258;
const PICKER_Y = 474;
const GRID_W = 448; // max-w-md
const CELL = (GRID_W - 6 * 4) / 7;
const AUTO_LANE: Lane = 3; // the protagonist's hashed lane
const NAMES = ['Orange', 'Green', 'Violet', 'Teal', 'Rose', 'Ochre'];
const ada = CAST.ada;

/** Option index in the radio group: 0 = Auto, 1..6 = lanes 0..5. */
const optionOf = (l: Lane | 'auto') => (l === 'auto' ? 0 : l + 1);
const laneOf = (l: Lane | 'auto'): Lane => (l === 'auto' ? AUTO_LANE : l);

export function Lanes() {
  const { f, P, at } = useScene();

  // which hop are we on, and how far into its transition
  const hops = LANE_HOPS.map((h) => ({ ...h, t: at(h.at) }));
  // each hop starts LEAD frames early so the ring is already moving when the pop sounds on the beat
  const LEAD = 2;
  let k = 0;
  for (let i = 0; i < hops.length; i++) if (f >= hops[i]!.t - LEAD) k = i;
  const cur = hops[k]!;
  const prev = hops[Math.max(0, k - 1)]!;
  const tr = k === 0 ? 1 : ramp(f, cur.t - LEAD, 8, expoOut);
  const fade = k === 0 ? 1 : ramp(f, cur.t - LEAD, 6);
  const laneColor = interpolateColors(fade, [0, 1], [P.lanes[laneOf(prev.lane)]!, P.lanes[laneOf(cur.lane)]!]);
  const optFrom = optionOf(prev.lane);
  const optTo = optionOf(cur.lane);
  const optPos = optFrom + (optTo - optFrom) * tr;
  const hit = punch(f, cur.t, 9);
  const pulseNow = { scale: 1 + 1.2 * clamp01((f - cur.t) / 18), opacity: f < cur.t ? 0 : 0.55 * (1 - clamp01((f - cur.t) / 18)) };

  const landed = f >= at([18, 4]);
  const value = cur.lane === 'auto' ? 'auto' : NAMES[cur.lane]!.toLowerCase();

  // camera: slow 2 % drift
  const cam = 1 + 0.02 * ramp(f, 0, 119, (x) => x);

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '40% 50%' }}>
        {/* the big rail, recolouring live */}
        <Segment x={RAIL_X} y={-20} h={HEAD_Y + 20 - 16} color={laneColor} width={3} />
        <Segment x={RAIL_X} y={HEAD_Y + 16} h={PROMPT_Y - HEAD_Y - 32} color={laneColor} width={3} />
        <Segment x={RAIL_X} y={PROMPT_Y + 16} h={1200} color={laneColor} width={3} />
        {[HEAD_Y, PROMPT_Y].map((y, i) => (
          <div key={i} style={{ position: 'absolute', left: RAIL_X - 16, top: y - 16 }}>
            <PulseRing x={16} y={16} size={32} color={laneColor} {...pulseNow} />
            <Node size={32} color={laneColor} P={P} ring={3} gapColor={P.shell} scale={1 + 0.18 * hit} />
          </div>
        ))}

        {/* headline */}
        <div style={{ position: 'absolute', left: 258, top: HEAD_Y - 80, fontFamily: SANS, fontWeight: 600, fontSize: 140, letterSpacing: '-0.04em', lineHeight: 1, color: P.ink, whiteSpace: 'nowrap' }}>Pick your lane.</div>

        {/* onboarding's prompt, live */}
        <div style={{ position: 'absolute', left: 262, top: PROMPT_Y - 26, ...mono(42), lineHeight: '52px', color: P.muted, whiteSpace: 'pre', display: 'flex', alignItems: 'center' }}>
          <span>$ export LANE=</span>
          <span style={{ color: landed ? P.ink : P.muted, display: 'inline-block', transform: `translateY(${(1 - ramp(f, cur.t - LEAD, 6)) * (k ? 10 : 0)}px)`, opacity: k ? 0.3 + 0.7 * ramp(f, cur.t - LEAD, 5) : 1 }}>{value}</span>
          {landed ? <Cursor f={f} color={P.primary} h="1em" w="0.55em" solid={f < at([18, 4]) + 8} /> : null}
        </div>

        {/* the picker at 2.7× */}
        <div style={{ position: 'absolute', left: PICKER_X, top: PICKER_Y, width: GRID_W, transform: `scale(${K})`, transformOrigin: '0 0', fontFamily: SANS, color: P.ink }}>
          {/* LanePreview */}
          <div style={{ display: 'flex', overflow: 'hidden', borderRadius: 8, border: `1px solid ${P.hairline}`, background: P.surface }}>
            <div style={{ position: 'relative', width: 72, height: 64, flex: 'none' }}>
              <div style={{ position: 'absolute', left: 35, top: 0, width: 2, height: 64, background: laneColor }} />
              <div style={{ position: 'absolute', left: 36 - 24, top: 32 - 24, transform: `scale(${1 + 0.08 * hit})` }}>
                <Avatar person={ada} size={40} P={P} ring ringColor={laneColor} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16 }}>
              <div>
                <div style={{ ...sans(16, 600), lineHeight: '24px' }}>{ada.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono(14), lineHeight: '20px', color: P.muted }}>
                  <LaneDot color={laneColor} />@{ada.handle}
                </div>
              </div>
            </div>
          </div>

          {/* LaneOptions */}
          <div style={{ position: 'relative', marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Auto', ...NAMES].map((label, i) => {
              const l: Lane = i === 0 ? AUTO_LANE : ((i - 1) as Lane);
              const c = P.lanes[l]!;
              const checked = i === optTo && tr > 0.5;
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                  <span style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(i === 0 ? { border: `2px dashed ${c}` } : { background: c }) }}>
                    {i === 0 ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} /> : null}
                  </span>
                  <span style={{ ...sans(12, checked ? 500 : 400), lineHeight: '16px', color: checked ? P.ink : P.muted }}>{label}</span>
                </div>
              );
            })}
            {/* the selection ring slides between swatches */}
            {(() => {
              const inset = optPos < 1 ? 6 - 2 * clamp01(optPos) : 4;
              const size = 28 + inset * 2;
              const cx = optPos * (CELL + 4) + CELL / 2;
              return <div style={{ position: 'absolute', left: cx - size / 2, top: 8 + 14 - size / 2, width: size, height: size, borderRadius: '50%', border: `2px solid ${laneColor}`, boxSizing: 'border-box', transform: `scale(${1 + 0.1 * hit})` }} />;
            })()}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

