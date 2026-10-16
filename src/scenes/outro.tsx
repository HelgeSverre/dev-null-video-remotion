// S14 outro (bars 35–38, light): the film is a log. `git log --graph --oneline` of the film itself,
// one row per SCENES entry, newest first, drawn on a tilted plane. The camera climbs the log from
// the root while rows pop in on eighth notes (bars 35–36) and slide down past the lens. It lands
// (37.1, pop) above HEAD on a hollow blue staged node: "Your first commit is 280 characters away.",
// a primary "Sign in with GitHub" and mono `dev-null.sh`. Bar 38 holds on a slow drift.
import { BEAT } from '../lib/clock';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, lerp, nodeIn, pulse, punch, ramp, spring } from '../lib/motion';
import { SCENES } from '../storyboard';
import { MONO, SANS } from '../theme';
import { Button, Icon, Node, Words } from '../ui/kit';

const RAIL_X = 300; // screen x of the rail
const FOCUS = 250; // screen y the camera keeps the newest row at while climbing
const HEAD_Y = 580; // plane y of HEAD (the staged node is at plane y 0)
const ROW_H = 120;
const NODE = 36;
const STEP = BEAT / 2; // an eighth note
const SETTLE_AT = 105; // HEAD arrives here; then the camera eases up to the staged node
const SETTLE_LEN = 24;
const STAGED_SCREEN_Y = 352;

/** Rows newest first: HEAD (this scene) at the top, the root commit at the bottom. */
const ROWS = [...SCENES.filter((s) => s.id !== 'root').reverse(), ...SCENES.filter((s) => s.id === 'root')];
const N = ROWS.length;
const rowY = (j: number) => HEAD_Y + j * ROW_H;
/** Rows arrive oldest first, one per eighth note from 35.1. */
const arrive = (j: number) => (N - 1 - j) * STEP;

/** Plane y under the focus line: linear climb, then a velocity-matched ease onto the staged node. */
function focusY(f: number) {
  const y0 = rowY(N - 1);
  const y1 = rowY(0);
  if (f <= SETTLE_AT) return lerp(y0, y1, f / SETTLE_AT);
  const end = FOCUS - STAGED_SCREEN_Y; // staged node (plane 0) lands at STAGED_SCREEN_Y
  const s = clamp01((f - SETTLE_AT) / SETTLE_LEN);
  const v0 = ((y1 - y0) / SETTLE_AT) * SETTLE_LEN; // per unit s
  // cubic Hermite from (y1, v0) to (end, 0)
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  return h00 * y1 + h10 * v0 + h01 * end;
}

export function Outro() {
  const { f, P, at } = useScene();
  const staged = at([41, 1]);
  const settle = easeInOut(clamp01((f - SETTLE_AT + 6) / (SETTLE_LEN + 6)));
  const tilt = 26 * (1 - settle);
  const planeTop = FOCUS - focusY(f);
  // hold drift (bar 38) + tiny landing kick
  const drift = 1 + 0.022 * ramp(f, staged, 120, (x) => x);
  const kick = 1 + 0.01 * punch(f, staged, 10);
  const hud = 1 - ramp(f, SETTLE_AT, 12);

  const headline = ['Your', 'first', 'commit', 'is', '280', 'characters', 'away.'];
  const btn = spring(f, staged + 9, 16, 0.35);
  const url = spring(f, staged + 18, 16, 0.3);
  const tail = ramp(f, staged - 6, 10);

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: `${RAIL_X + 380}px 30%` }}>
        <AbsoluteFill style={{ transform: `scale(${drift * kick}) rotateX(${tilt}deg)`, transformOrigin: `50% ${FOCUS}px`, transformStyle: 'preserve-3d' }}>
          <div style={{ position: 'absolute', left: RAIL_X, top: planeTop, width: 0, height: 0 }}>
            {/* staged tail: dashed rail gray from the staged node down to HEAD */}
            <div style={{ position: 'absolute', left: -1.5, top: NODE / 2 + 4, width: 3, height: (HEAD_Y - NODE - 8) * tail, background: `repeating-linear-gradient(to bottom, ${P.rail} 0 10px, transparent 10px 20px)` }} />
            {/* segments between rows, coloured by the newer row's lane, drawn downward when it lands */}
            {ROWS.slice(0, -1).map((def, j) => (
              <div key={`seg-${def.id}`} style={{ position: 'absolute', left: -1.5, top: rowY(j) + NODE / 2 + 2, width: 3, height: (ROW_H - NODE - 4) * ramp(f, arrive(j) - 1, 6), background: P.lanes[def.lane] }} />
            ))}
            {ROWS.map((def, j) => {
              const a = arrive(j);
              if (f < a - 0.01) return null;
              const isRoot = j === N - 1;
              const isHead = j === 0;
              const k = expoOut(clamp01((f - a) / 8));
              const lc = P.lanes[def.lane]!;
              return (
                <div key={def.id} style={{ position: 'absolute', left: 0, top: rowY(j) }}>
                  <div style={{ position: 'absolute', left: -NODE / 2, top: -NODE / 2 }}>
                    <Node size={NODE} color={lc} P={P} hollow={isRoot} ring={3} gapColor={P.shell} scale={nodeIn(f, a)} pulse={pulse(f, a)} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: 64,
                      top: 0,
                      transform: `translate(${(1 - k) * -24}px, -50%)`,
                      opacity: k,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 26,
                      whiteSpace: 'nowrap',
                      fontFamily: MONO,
                      fontSize: 58,
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <span style={{ color: P.muted }}>{def.hash}</span>
                    {isHead ? <span style={{ color: P.muted }}>(HEAD -&gt; production)</span> : null}
                    <span style={{ color: P.ink, fontWeight: 500 }}>{def.commit}</span>
                  </div>
                </div>
              );
            })}

            {/* the staged node: hollow Commit Blue, your next commit */}
            {f >= staged ? (
              <div style={{ position: 'absolute', left: -20, top: -20 }}>
                <Node size={40} color={P.primary} P={P} hollow ring={3} gapColor={P.shell} scale={nodeIn(f, staged)} pulse={pulse(f, staged)} />
              </div>
            ) : null}
            <div style={{ position: 'absolute', left: 76, top: -70, width: 1400 }}>
              <Words
                words={headline}
                progress={(i) => easeOut((f - staged - i * 1.5) / 10)}
                style={{ fontFamily: SANS, fontWeight: 600, fontSize: 120, letterSpacing: '-0.04em', lineHeight: 1.04, color: P.ink, maxWidth: 1190 }}
              />
              <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', gap: 44 }}>
                <div style={{ opacity: clamp01(btn * 3), transform: `translateY(${(1 - btn) * 24}px)`, transformOrigin: 'left center' }}>
                  <Button P={P} height={96} fontSize={36} style={{ padding: '0 44px', gap: 18, borderRadius: 14 }}>
                    <Icon name="github" size={38} color={P.primaryInk} />
                    Sign in with GitHub
                  </Button>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 500, color: P.ink, letterSpacing: '-0.02em', opacity: clamp01(url * 3), transform: `translateY(${(1 - url) * 24}px)` }}>dev-null.sh</div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* depth haze: rows far up the tilted plane fade into the shell */}
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${P.shell} 0%, ${P.shell}00 ${26 * (1 - settle)}%)`, pointerEvents: 'none' }} />
      {/* the command, as tiny chrome while the log scrolls */}
      <div style={{ position: 'absolute', left: 120, top: 70, fontFamily: MONO, fontSize: 30, color: P.muted, opacity: hud }}>
        <span>$ </span>
        <span style={{ color: P.ink }}>git log --graph --oneline</span>
      </div>
      {/* impact flash on 35.1 */}
      <AbsoluteFill style={{ background: '#ffffff', opacity: punch(f, 0, 7) * 0.85, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
