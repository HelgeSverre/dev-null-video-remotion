// S09 star (bars 19–20): "Star. Reply. Quote. That's it." Dennis's commit at ~1.9×. The star pops
// on 19.1 and the mono count ticks up on the eighths; 20.1 opens the thread in place (compact
// 28px replies on dashed lane elbows, commit-thread.tsx); 20.3 Barbara's quote of it lands on the
// rail above (quoted-commit.tsx embed). The four words land on the same beats.
import { BEAT } from '../lib/clock';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, lerp, nodeIn, pulse, ramp } from '../lib/motion';
import { noise } from '../lib/rand';
import { CAST } from '../storyboard';
import { Words } from '../ui/kit';
import { FeedColumn, FeedCommit, QuoteEmbed, Thread, type Reply } from '../ui/star-feed';
import { SANS } from '../theme';

const W = 600; // feed column, product px
const H_QUOTE = 196; // Barbara's quoting commit row (measured)
const H_THREAD = 262; // the three replies (measured)

const DENNIS_BODY = "Moved our cron jobs off 00:00. Turns out everyone else's are there too.";
const REPLIES: Reply[] = [
  { person: CAST.grace, body: '03:17 gang.', time: '4m', stars: 2 },
  { person: CAST.ken, body: 'Wait until you meet 00:00 UTC on January 1st.', time: '2m' },
  { person: CAST.margaret, body: 'Ours run at :07. Nobody picks :07.', time: '1m' },
];

export function Star() {
  const { f, P, at } = useScene();
  const pop = at([19, 1]);
  const open = at([20, 1]);
  const quote = at([20, 3]);

  // ── star: pop on 19.1, then +1 on every eighth through 19.4.5 ──
  const eighth = BEAT / 2;
  const ticks = Math.max(0, Math.min(7, Math.floor((f - pop) / eighth)));
  const count = 1 + ticks;
  const sinceTick = f - pop - ticks * eighth;
  const star = { starred: true, count, pop: clamp01((f - pop) / 14), tick: ticks === 0 ? 1 : easeOut(sinceTick / 3), press: 1 - ramp(f, pop + 6, 14) };

  // ── thread + quote heights ──
  const kT = ramp(f, open, 14, expoOut);
  const kQ = ramp(f, quote, 14, expoOut);
  const hQ = H_QUOTE * kQ;

  // ── camera (product → screen): screen = S·(p − c) + anchor ──
  // bar 19: pushed in on the star; 20.1 eases back to hold the thread; 20.3 rises to the quote.
  const push = ramp(f, 0, 58, (x) => x);
  const back = ramp(f, open, 18, easeInOut);
  const rise = ramp(f, quote, 20, easeInOut);
  const drift = 0.012 * (f / 119);
  const S = lerp(lerp(1.9 + 0.1 * push, 1.86, back), 1.84, rise) + drift;
  const starY = 96; // star row in Dennis's commit (before the quote lands)
  const cx = lerp(lerp(60, 300, back), 300, rise);
  const cy = lerp(lerp(starY, 210, back), 150, rise);
  const ax = lerp(lerp(818, 1260, back), 1260, rise) + noise(f / 40, 3) * 4;
  const ay = lerp(lerp(560, 520, back), 470, rise) + noise(f / 40, 9) * 3;

  const qNode = nodeIn(f, quote + 7);
  const words = ['Star.', 'Reply.', 'Quote.', "That's it."];
  const wordAt = [pop - 5, open, quote, at([20, 4])];

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, transformOrigin: '0 0', transform: `translate(${ax - S * cx}px, ${ay - S * cy}px) scale(${S})` }}>
        <FeedColumn P={P} width={W} />
        <div style={{ position: 'relative' }}>
          {/* a newer commit above, cut by the frame */}
          <div style={{ position: 'absolute', left: 0, bottom: '100%' }}>
            <FeedCommit P={P} person={CAST.ken} width={W} time="9m" hash="c81f2a0" above={P.lanes[1]} tail={P.lanes[2]} body="The codegen now writes its own changelog. I've been automated out of release notes." star={{ starred: false, count: 4 }} />
          </div>
          {/* Barbara quotes it: a new commit lands on the rail above */}
          <div style={{ height: hQ, overflow: kQ < 0.97 ? 'hidden' : 'visible', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, bottom: 0, width: W, transform: `translateX(${(1 - kQ) * 60}px)`, opacity: clamp01(kQ * 1.6) }}>
              <FeedCommit
                P={P}
                person={CAST.barbara}
                width={W}
                time="now"
                hash="745cf8e"
                above={P.lanes[2]}
                tail={P.lanes[5]}
                nodeScale={qNode}
                pulse={pulse(f, quote + 7, 18)}
                body="Every scheduler is a shared resource if you're unlucky enough."
                quote={<QuoteEmbed P={P} person={CAST.dennis} time="12m" body={DENNIS_BODY} />}
                star={{ starred: false, count: 0 }}
              />
            </div>
          </div>
          <FeedCommit
            P={P}
            person={CAST.dennis}
            width={W}
            time="12m"
            hash="3e1a9b2"
            above={kQ > 0.02 ? P.lanes[5] : P.lanes[2]}
            tail={P.lanes[4]}
            body={DENNIS_BODY}
            star={star}
            replies={{ count: 3, open: ramp(f, open, 8, easeInOut) }}
            thread={<Thread P={P} parentLane={P.lanes[4]!} replies={REPLIES} reveal={(i) => ramp(f, open + i * 2, 8, expoOut)} />}
            threadHeight={H_THREAD * kT}
          />
          <FeedCommit P={P} person={CAST.grace} width={W} time="31m" hash="b04e7d1" above={P.lanes[4]} tail={P.lanes[1]} body="Rewrote the flaky test. It's now reliably failing." star={{ starred: false, count: 6 }} />
          <FeedCommit P={P} person={CAST.margaret} width={W} time="44m" hash="5d2c9e3" above={P.lanes[1]} tail={P.lanes[0]} body="Friday deploy went out at 16:58. Weekend still intact. For now." star={{ starred: false, count: 11 }} />
        </div>
      </div>

      {/* shell gutter on the left so the headline sits on clean ground */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 640, background: `linear-gradient(to right, ${P.shell} 82%, ${P.shell}00)` }} />
      <Words
        words={words}
        progress={(i) => easeOut((f - wordAt[i]!) / 9)}
        style={{ position: 'absolute', left: 104, top: 236, width: 520, flexDirection: 'column', fontFamily: SANS, fontWeight: 600, fontSize: 124, letterSpacing: '-0.04em', lineHeight: 1.04, color: P.ink }}
        accent={{ 3: { color: P.muted } }}
      />
    </AbsoluteFill>
  );
}
