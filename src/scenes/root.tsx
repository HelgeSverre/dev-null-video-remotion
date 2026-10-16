// S15 root (bars 39–40, light): the end card, and the end of history. Final chord + impact on
// 39.1: the mark and `/dev/null` wordmark land centre with og.png's mono line "Everything else goes
// to /dev/null." under them. On 40.1 (pop) a short rail draws down to a hollow root node: "That's
// the root commit. There's nothing before it." (commit-feed.tsx). Then everything fades into the
// shell on the reverb tail; the root node goes last, so the final frame is a near-empty shell.
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, nodeIn, pulse, punch, ramp, spring } from '../lib/motion';
import { MONO, SANS } from '../theme';
import { Mark, Node, Segment, Wordmark } from '../ui/kit';

const CX = 960;
const MARK_Y = 400; // centre line of mark + wordmark
const TAG_Y = 560;
const RAIL_TOP = 640;
const NODE_Y = 760;
const NODE = 30;

export function Root() {
  const { f, P, at, len } = useScene();
  const hit = at([42, 1]);
  const root = at([43, 1]);
  const lc = P.lanes[3]!;

  // Camera: lands from a slight push on the impact, then a slow pull-back for the whole scene.
  const land = spring(f, hit, 18, 0.2);
  const cam = 1.06 - 0.06 * land - 0.03 * easeInOut(clamp01(f / len));
  const shake = punch(f, hit, 8) * 4;
  // Bar 39 sits the card at optical centre; on 40.1 the frame eases down to make room for the root.
  const pan = 95 * (1 - easeInOut(ramp(f, root - 8, 26, (x) => x)));

  const markIn = spring(f, hit - 2, 16, 0.4);
  const wordIn = spring(f, hit, 18, 0.3);
  const tag = easeOut(clamp01((f - hit - 8) / 14));
  const rail = ramp(f, root - 7, 8);
  const sent = easeOut(clamp01((f - root - 4) / 12));

  // Fade on the reverb tail: the card over the last half bar, the root node a little later and not
  // quite to zero (the final frame keeps a ghost of the root node on the shell).
  const fade = 1 - easeInOut(clamp01((f - (len - 34)) / 26));
  const nodeFade = 1 - 0.9 * easeInOut(clamp01((f - (len - 24)) / 23));

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam}) translate(${shake * 0.5}px, ${pan - shake}px)`, transformOrigin: '50% 52%' }}>
        <div style={{ opacity: fade }}>
          {/* mark + wordmark, centred */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: MARK_Y - 85, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48 }}>
            <div style={{ transform: `scale(${0.5 + 0.5 * markIn}) rotate(${(1 - markIn) * -12}deg)`, opacity: clamp01(markIn * 3) }}>
              <Mark size={150} P={P} />
            </div>
            <div style={{ transform: `translateX(${(1 - wordIn) * 40}px)`, opacity: clamp01(wordIn * 3) }}>
              <Wordmark size={176} P={P} />
            </div>
          </div>
          {/* og.png's mono line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: TAG_Y - 26, textAlign: 'center', fontFamily: MONO, fontSize: 46, color: P.muted, letterSpacing: '-0.01em', opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
            Everything else goes to /dev/null.
          </div>
          {/* the root commit's line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: NODE_Y + 52, textAlign: 'center', fontFamily: SANS, fontSize: 38, color: P.muted, letterSpacing: '-0.005em', opacity: sent, transform: `translateY(${(1 - sent) * 14}px)` }}>
            That's the root commit. There's nothing before it.
          </div>
        </div>
        {/* short rail down to the hollow root node */}
        <div style={{ opacity: nodeFade }}>
          <Segment x={CX} y={RAIL_TOP} h={NODE_Y - NODE / 2 - RAIL_TOP - 4} color={lc} draw={rail} width={3} />
          <div style={{ position: 'absolute', left: CX - NODE / 2, top: NODE_Y - NODE / 2 }}>
            <Node size={NODE} color={lc} P={P} hollow ring={3} gapColor={P.shell} scale={nodeIn(f, root)} pulse={pulse(f, root)} />
          </div>
        </div>
      </AbsoluteFill>
      {/* impact flash on 39.1 */}
      <AbsoluteFill style={{ background: '#ffffff', opacity: punch(f, hit, 7) * 0.8, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
