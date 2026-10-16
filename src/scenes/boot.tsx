// S01 boot (bars 1–4): the cold open. A light terminal types the curl one-liner that commits
// `hello world`; Enter on 3.3 prints the commit URL. On 3.4 the camera pans down past the terminal
// onto the log, landing on 4.1 as Helge's commit pops onto the rail. On 4.3 @world answers it.
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, lerp, nodeIn, punch, ramp } from '../lib/motion';
import { typedCount } from '../lib/rand';
import { CAST, TYPING } from '../storyboard';
import { CommitRow, Cursor, Segment, TerminalWindow } from '../ui/kit';

// ── layout (world coordinates, px) ──────────────────────────────────────────────────────────
const TERM_W = 1400;
const TERM_H = 400;
const TERM_X = (1920 - TERM_W) / 2;
const TERM_Y = 340;

/** Feed scale: product px → film px. */
const S = 2.2;
const COL_W = 620; // product px
const FEED_X = (1920 - COL_W * S) / 2;
const FEED_Y = 1240; // world y of the column's top edge
const RAIL = 36; // rail x inside a row (RAIL_W / 2)
const ADA_TOP = 172; // product px from the column top to Ada's row
/** Height of Ada's row in product px (measured from a still: hairline at the bottom). */
const ADA_H = 101;
const NODE = 48; // avatar 40 + gap + ring
const NODE_TOP = 12;
/** Where Ada's row should sit on screen once the camera lands. */
const LAND_Y = 300;
const PAN = FEED_Y + ADA_TOP * S - LAND_Y;

export function Boot() {
  const { f, F, P, at } = useScene();

  const enter = at([3, 3]);
  const out = enter + 3; // the server answers a beat-fraction after Enter
  const panAt = at([3, 4]);
  const adaAt = at([4, 1]);
  const worldAt = at([4, 3]);

  // ── camera ──
  // Slow push on the terminal (bars 1–3), an eased pan down onto the log that lands on 4.1, then
  // a slow 2 % drift while the reply lands.
  const pan = easeInOut((f - panAt + 1) / 16);
  const panS = easeInOut((f - panAt + 1) / 16);
  const push = 1 + 0.045 * ramp(f, 0, panAt, (x) => x * (2 - x));
  const drift = 0.022 * ramp(f, adaAt, 60, (x) => x);
  const cam = lerp(push, 1, panS) + drift + 0.008 * punch(f, enter, 9);
  const camY = -PAN * pan;

  // ── terminal ──
  const typed = TYPING.bootCmd.text.slice(0, typedCount(TYPING.bootCmd, F));
  const typing = typed.length > 0 && f < enter;
  const entered = f >= enter;
  const printed = f >= out;
  // Real CLI output: the URL carries the commit's UUID; its short hash is the last 7 hex digits.
  const url = `https://dev-null.sh/@${CAST.ada.handle}/commits/9b2f6c1e-4d3a-4f0e-8c21-7a5e30be0130`;

  // ── feed ──
  const grayDraw = ramp(f, panAt + 4, adaAt - panAt - 4, easeInOut);
  const tealDraw = ramp(f, worldAt - 7, 7, easeInOut);
  const worldIn = ramp(f, worldAt - 1, 8, expoOut);
  const tailDraw = ramp(f, at([4, 4]), 14, easeInOut);
  const worldTop = ADA_TOP + ADA_H;

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam}) translateY(${camY}px)`, transformOrigin: '50% 50%' }}>
        {/* the terminal */}
        <div style={{ position: 'absolute', left: TERM_X, top: TERM_Y }}>
          <TerminalWindow P={P} title="~/code — zsh" width={TERM_W} height={TERM_H}>
            <div style={{ fontSize: 30, lineHeight: 1.65, padding: '6px 4px' }}>
              <div>
                <span style={{ color: P.muted }}>$ </span>
                <span>{typed}</span>
                {!entered ? <Cursor f={f} color={P.primary} solid={typing} /> : null}
              </div>
              {printed ? (
                <div>
                  <span>Committed: </span>
                  <span style={{ color: P.primary }}>{url}</span>
                </div>
              ) : null}
              {printed ? (
                <div>
                  <span style={{ color: P.muted }}>$ </span>
                  <Cursor f={f - out} color={P.primary} />
                </div>
              ) : null}
            </div>
          </TerminalWindow>
        </div>

        {/* the log */}
        <div style={{ position: 'absolute', left: FEED_X, top: FEED_Y, width: COL_W, transform: `scale(${S})`, transformOrigin: '0 0' }}>
          {/* the feed column */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: COL_W, height: 1400, background: P.surface, borderLeft: `1px solid ${P.hairline}`, borderRight: `1px solid ${P.hairline}`, boxSizing: 'border-box' }} />
          {/* rail: Rail Gray down to the first commit, teal from Ada to @world, then green on */}
          <Segment x={RAIL} y={0} h={ADA_TOP + NODE_TOP} color={P.rail} draw={grayDraw} />
          <Segment x={RAIL} y={ADA_TOP + NODE_TOP + NODE} h={worldTop + NODE_TOP - (ADA_TOP + NODE_TOP + NODE)} color={P.lanes[3]!} draw={tealDraw} />
          <Segment x={RAIL} y={worldTop + NODE_TOP + NODE} h={600} color={P.lanes[1]!} draw={tailDraw} />

          {f >= panAt - 1 ? (
            <div style={{ position: 'absolute', left: 0, top: ADA_TOP }}>
                              <CommitRow
                  P={P}
                  person={CAST.ada}
                  body="hello world"
                  time="now"
                  hash="0be0130"
                  tint="transparent"
                  width={COL_W}
                  replies={f >= worldAt ? 1 : 0}
                  nodeScale={nodeIn(f, adaAt - 1)}
                  pulse={ring(f, adaAt - 1)}
                />
                          </div>
          ) : null}
          {f >= worldAt - 1 ? (
            <div style={{ position: 'absolute', left: 0, top: worldTop, opacity: clamp01(worldIn * 1.6), transform: `translateY(${(1 - worldIn) * 6}px)` }}>
                              <CommitRow P={P} person={CAST.world} body={`Hello, ${CAST.ada.name}.`} time="now" hash="9e1f4a7" width={COL_W} tint="transparent" replyingTo={CAST.ada.handle} nodeScale={nodeIn(f, worldAt - 1)} pulse={ring(f, worldAt - 1)} />
                          </div>
          ) : null}

        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
}

/** node-in's lane pulse, sized down for a 48px avatar node at film scale. */
function ring(f: number, at: number) {
  const t = clamp01((f - at) / 20);
  return { scale: 1 + 0.5 * easeOut(t), opacity: f < at ? 0 : 0.32 * (1 - t) };
}
