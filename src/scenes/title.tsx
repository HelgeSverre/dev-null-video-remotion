// S04 title (bars 9–10): the drop. og.png brought to life at 1.6× scale: the mark slams in on 9.1,
// the wordmark types itself, the rail draws down through an orange node, a green node (headline,
// 9.3) and a hollow blue staged node (the sub line, 10.1).
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeOut, nodeIn, pulse, punch, ramp, spring } from '../lib/motion';
import { Mark, Node, Segment, Words, Wordmark } from '../ui/kit';
import { SANS } from '../theme';

const RAIL_X = 176;
const Y1 = 370; // wordmark
const Y2 = 630; // headline
const Y3 = 740; // sub line
const NODE = 30;

export function Title() {
  const { f, P, at } = useScene();
  const hit = at([9, 1]);
  const n2 = at([9, 3]);
  const n3 = at([10, 1]);

  // Camera: lands from a 1.12 push on the impact, then a slow 2 % drift for the rest of the scene.
  const land = spring(f, hit, 16, 0.25);
  const cam = 1.12 - 0.12 * land + 0.022 * ramp(f, 16, 104, (x) => x);
  const shake = punch(f, hit, 8) * 6;

  const markIn = spring(f, hit, 14, 0.45);
  const chars = Math.round(9 * clamp01((f - 2) / 12));
  const headline = 'A social network for developers.'.split(' ');
  const sub = 'Sign in with GitHub. Commit plain text to a shared log.'.split(' ');

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam}) translate(${shake * 0.6}px, ${-shake}px)`, transformOrigin: '42% 50%' }}>
        {/* rail */}
        <Segment x={RAIL_X} y={0} h={Y1 - NODE / 2} color={P.rail} draw={ramp(f, hit - 2, 8)} />
        <Segment x={RAIL_X} y={Y1 + NODE / 2} h={Y2 - Y1 - NODE} color={P.lanes[0]!} draw={ramp(f, at([9, 2]), 12)} />
        <Segment x={RAIL_X} y={Y2 + NODE / 2} h={Y3 - Y2 - NODE} color={P.lanes[1]!} draw={ramp(f, at([9, 4]), 10)} />
        {[
          { y: Y1, color: P.lanes[0]!, at: hit, hollow: false },
          { y: Y2, color: P.lanes[1]!, at: n2, hollow: false },
          { y: Y3, color: P.primary, at: n3, hollow: true },
        ].map((n, i) => (
          <div key={i} style={{ position: 'absolute', left: RAIL_X - NODE / 2, top: n.y - NODE / 2 }}>
            <Node size={NODE} color={n.color} P={P} hollow={n.hollow} ring={3} scale={nodeIn(f, n.at)} pulse={pulse(f, n.at)} gapColor={P.shell} />
          </div>
        ))}

        {/* mark + wordmark */}
        <div style={{ position: 'absolute', left: 258, top: Y1 - 92, display: 'flex', alignItems: 'center', gap: 56 }}>
          <div style={{ transform: `scale(${0.4 + 0.6 * markIn}) rotate(${(1 - markIn) * -14}deg)`, opacity: clamp01(markIn * 3) }}>
            <Mark size={170} P={P} />
          </div>
          <Wordmark size={196} P={P} chars={chars} />
        </div>

        {/* headline + sub */}
        <Words
          words={headline}
          progress={(i) => easeOut((f - n2 - i * 2) / 10)}
          style={{ position: 'absolute', left: 258, top: Y2 - 64, fontFamily: SANS, fontWeight: 600, fontSize: 104, letterSpacing: '-0.04em', color: P.ink, lineHeight: 1.1 }}
        />
        <Words
          words={sub}
          progress={(i) => easeOut((f - n3 - i * 1.5) / 9)}
          style={{ position: 'absolute', left: 260, top: Y3 - 24, fontFamily: SANS, fontWeight: 400, fontSize: 40, letterSpacing: '-0.01em', color: P.muted }}
        />
      </AbsoluteFill>
      {/* impact flash */}
      <AbsoluteFill style={{ background: '#ffffff', opacity: punch(f, hit, 7) * 0.85, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}
