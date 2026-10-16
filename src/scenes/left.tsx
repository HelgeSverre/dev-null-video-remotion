// S03 left (bar 8): the break. A near-empty shell: `$ ls /dev/null` types, Enter on 8.2 prints
// nothing and the cursor drops to an empty line, a hollow node appears where output would be.
// On 8.3 the cursor jumps to display size and types "What's left?". Under the riser the camera
// pushes in on an accelerating curve and the node's pulse speeds up to 16ths, into S04's flash.
import { BEAT } from '../lib/clock';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeIn, nodeIn, punch, ramp } from '../lib/motion';
import { noise, typedCount } from '../lib/rand';
import { TYPING } from '../storyboard';
import { Cursor, Node } from '../ui/kit';
import { MONO, SANS } from '../theme';

const TEXT_X = 470;
const PROMPT_Y = 330;
const MONO_SIZE = 46;
const MONO_LH = 74;
const HEAD_Y = 520; // top of the headline line box
const HEAD_SIZE = 150;
const NODE_X = 372;
const NODE_Y = HEAD_Y + HEAD_SIZE * 0.56;
const NODE = 54;

export function Left() {
  const { f, F, P, at, len } = useScene();
  const enter = at([8, 2]);
  const qAt = at([8, 3]);
  const last = at([8, 4]);

  // ── camera: an accelerating push (riser), a little nervous shake in the last beat.
  const push = 1 + 0.11 * easeIn(f / (len - 1));
  const shakeAmt = 3.5 * ramp(f, last, len - 1 - last, (x) => x * x);
  const sx = noise(f * 0.9, 11) * shakeAmt;
  const sy = noise(f * 0.9, 23) * shakeAmt;

  // ── terminal lines
  const ls = TYPING.leftLs;
  const cmd = ls.text.slice(0, typedCount(ls, F));
  const typingLs = cmd.length > 0 && f < enter;
  const entered = f >= enter;

  // ── headline
  const q = TYPING.leftQ;
  const head = q.text.slice(0, typedCount(q, F));
  const typingQ = f >= qAt && head.length < q.text.length;

  // ── the hollow node: appears on Enter (the output is nothing), pulses on the beat, then on 8ths
  // on beat 3 and on 16ths through the last beat.
  const pulses = [enter, qAt, qAt + BEAT / 2, last, last + BEAT / 4, last + BEAT / 2, last + BEAT * 0.75];
  const lastPulse = [...pulses].reverse().find((p) => f >= p) ?? -999;
  const ring = pulseRing(f, lastPulse, lastPulse >= last ? 9 : 14);
  const throb = pulses.reduce((m, p) => Math.max(m, punch(f, p, 6)), 0);
  const nodeScale = nodeIn(f, enter - 1) * (1 + 0.14 * throb);

  // ── a slight whitening in the last frames, so S04's impact flash reads as the peak of the riser.
  const pre = 0.16 * ramp(f, len - 5, 4, easeIn);

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: `${(NODE_X + 1370) / 2}px ${NODE_Y - 60}px` }}>
        {/* the shell */}
        <div style={{ position: 'absolute', left: TEXT_X, top: PROMPT_Y, fontFamily: MONO, fontSize: MONO_SIZE, lineHeight: `${MONO_LH}px`, color: P.ink, whiteSpace: 'pre' }}>
          <div>
            <span style={{ color: P.muted }}>$ </span>
            {cmd}
            {!entered ? <Cursor f={f} color={P.primary} solid={typingLs} /> : null}
          </div>
          <div style={{ height: MONO_LH }}>{entered && f < qAt ? <Cursor f={f - enter} color={P.primary} /> : null}</div>
        </div>

        {/* the hollow node: nothing came back */}
        {f >= enter - 1 ? (
          <div style={{ position: 'absolute', left: NODE_X - NODE / 2, top: NODE_Y - NODE / 2 }}>
            <Node size={NODE} color={P.primary} P={P} hollow ring={4} scale={nodeScale} pulse={ring} gapColor={P.shell} />
          </div>
        ) : null}

        {/* the question */}
        {f >= qAt ? (
          <div style={{ position: 'absolute', left: TEXT_X - 6, top: HEAD_Y, fontFamily: SANS, fontWeight: 600, fontSize: HEAD_SIZE, letterSpacing: '-0.04em', lineHeight: 1.12, color: P.ink, whiteSpace: 'pre' }}>
            {head}
            <Cursor f={f - qAt} color={P.primary} solid={typingQ} h="0.82em" w="0.42em" />
          </div>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#ffffff', opacity: pre, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}

/** A lane-style pulse disc behind the node, sized for a shorter period as the pulses speed up. */
function pulseRing(f: number, at: number, frames: number) {
  const t = clamp01((f - at) / frames);
  return { scale: 1 + 1.5 * (1 - Math.pow(1 - t, 3)), opacity: f < at ? 0 : 0.42 * (1 - t) };
}
