// S06 log (bars 13–14): "A timeline is a log." The whoosh on 13.1 starts the pull-back: from the
// feed at ~1.9× (where S05 left us) out to the whole three-column app laid back in CSS 3D (nav,
// 620px feed, aside), while the feed scrolls on a multi-lane rail past "Today" and HEAD@{last visit}.
// Bar 14 dollies back toward the sticky tabs, where "↑ 3 new commits" drops on 14.1 (blip).
import { AbsoluteFill, interpolate } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, spring } from '../lib/motion';
import { CAST, type Person } from '../storyboard';
import { CommitRow } from '../ui/kit';
import { Composer } from '../ui/commit-composer';
import { PageTabs } from '../ui/commit-parts';
import { AppAside, AppNav, APP_W, FeedMarker, FEED_W, NAV_W, NewCommitsPill } from '../ui/log-app';
import { SANS } from '../theme';

const APP_H = 1500;
const TABS_H = 51;

type Row = { kind: 'commit'; who: Person; body: string; time: string; hash: string; stars: number } | { kind: 'marker'; label: string; dashed?: boolean };
const { ada, grace, ken, margaret, dennis, barbara } = CAST;
const FEED: Row[] = [
  { kind: 'marker', label: 'Today' },
  { kind: 'commit', who: ada, body: 'Shipped the parser benchmark. 3.2× faster.', time: 'now', hash: '7f3a9c1', stars: 3 },
  { kind: 'commit', who: grace, body: 'Rewrote the lexer over the weekend. The tests are the slow part now.', time: '12m', hash: 'a41c0e7', stars: 9 },
  { kind: 'commit', who: dennis, body: 'Paged at 3am. The fix was one line. The postmortem is four pages.', time: '40m', hash: 'c81d2e0', stars: 21 },
  { kind: 'marker', label: 'HEAD@{last visit}', dashed: true },
  { kind: 'commit', who: ken, body: 'Wrote a code generator for the code generator. It generates fine.', time: '1h', hash: '3b9f2d1', stars: 14 },
  { kind: 'commit', who: margaret, body: 'Deployed on a Friday. Nothing broke. Suspicious.', time: '2h', hash: '9e04b7a', stars: 32 },
  { kind: 'commit', who: barbara, body: 'Added one type annotation. Found three bugs.', time: '3h', hash: '5a7c1f2', stars: 18 },
  { kind: 'commit', who: grace, body: 'Bisected 400 commits to find a missing semicolon.', time: '5h', hash: 'e2f9a03', stars: 7 },
  { kind: 'commit', who: ken, body: 'Code review tip: read the tests first. Then read them again.', time: '7h', hash: '0c4e8d6', stars: 11 },
  { kind: 'marker', label: 'Yesterday' },
  { kind: 'commit', who: dennis, body: 'Rotated the certs. Rotated them back. Rotated them again.', time: '1d', hash: '06b3c9d', stars: 26 },
  { kind: 'commit', who: margaret, body: 'Wrote the migration. Wrote the rollback. Slept fine.', time: '1d', hash: 'b5d20f9', stars: 15 },
  { kind: 'commit', who: barbara, body: 'Generics finally clicked. Now everything is generic.', time: '1d', hash: '4f8a1c3', stars: 12 },
];

/** Camera keys: target point on the app plane (px), scale, tilt (deg). */
type Cam = { tx: number; ty: number; s: number; rx: number; rz: number };
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ tx: a.tx + (b.tx - a.tx) * t, ty: a.ty + (b.ty - a.ty) * t, s: a.s * Math.pow(b.s / a.s, t), rx: a.rx + (b.rx - a.rx) * t, rz: a.rz + (b.rz - a.rz) * t });

export function Log() {
  const { f, P, at } = useScene();
  const pillAt = at([14, 1]);

  // ── camera ──
  const FEED_CX = NAV_W + 1 + FEED_W / 2;
  const A: Cam = { tx: 520, ty: 282, s: 1.85, rx: 0, rz: 0 };
  const B: Cam = { tx: APP_W / 2 + 40, ty: 360, s: 1.0, rx: 26, rz: -6 };
  const B2: Cam = { tx: APP_W / 2 + 30, ty: 350, s: 1.04, rx: 25, rz: -5.6 };
  const C: Cam = { tx: FEED_CX + 70, ty: 205, s: 1.72, rx: 19, rz: -3.6 };
  const C2: Cam = { tx: FEED_CX + 74, ty: 212, s: 1.78, rx: 18, rz: -3.2 };
  const pull = interpolate(f, [0, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 4) });
  const hold = interpolate(f, [44, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dolly = interpolate(f, [50, 84], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut });
  const drift = interpolate(f, [84, 119], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  let cam = lerpCam(A, B, pull);
  if (f > 44) cam = lerpCam(B, B2, hold);
  if (f > 50) cam = lerpCam(lerpCam(B, B2, hold), C, dolly);
  if (f > 84) cam = lerpCam(C, C2, drift);

  // ── feed scroll (continuous, product px) ──
  const scroll = 8 + f * 3.4;

  // ── pill ──
  const pill = spring(f, pillAt, 16, 0.3);

  // ── headline ──
  const words = ['A', 'timeline', 'is', 'a', 'log.'];
  const wordP = (i: number) => easeOut((f - at([13, 2]) - 2 - i * 2.5) / 10);

  let prevLane: string = P.rail;
  return (
    <AbsoluteFill style={{ background: P.shell, perspective: 2400, perspectiveOrigin: '50% 50%', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 960 - cam.tx,
          top: 540 - cam.ty,
          width: APP_W,
          height: APP_H,
          transformOrigin: `${cam.tx}px ${cam.ty}px`,
          transform: `scale(${cam.s}) rotateX(${cam.rx}deg) rotateZ(${cam.rz}deg)`,
          background: P.shell,
          display: 'flex',
        }}
      >
        <AppNav P={P} me={ada} height={1080} />
        {/* feed column */}
        <div style={{ position: 'relative', width: FEED_W, height: APP_H, background: P.surface, borderLeft: `1px solid ${P.hairline}`, borderRight: `1px solid ${P.hairline}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: TABS_H - scroll, width: FEED_W }}>
            <Composer P={P} person={ada} body="" width={FEED_W} staged remaining={280} buttonOpacity={0.5} />
            {FEED.map((r, i) => {
              if (r.kind === 'marker') return <FeedMarker key={i} P={P} width={FEED_W} label={r.label} dashed={r.dashed} />;
              const above = prevLane;
              prevLane = P.lanes[r.who.lane]!;
              return <CommitRow key={i} P={P} person={r.who} body={r.body} time={r.time} hash={r.hash} stars={r.stars} above={above} below={P.lanes[r.who.lane]} width={FEED_W} />;
            })}
          </div>
          {/* sticky tabs + the new-commits pill that hangs under them */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: FEED_W }}>
            <PageTabs P={P} tabs={['Following', 'Latest', 'Trending']} active={0} width={FEED_W} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: TABS_H, paddingTop: 12, display: 'flex', justifyContent: 'center', opacity: clamp01(pill * 3), transform: `translateY(${(1 - pill) * -14}px)` }}>
              <NewCommitsPill P={P} count={3} />
            </div>
          </div>
        </div>
        <AppAside P={P} me={ada} height={1080} stats={[128, 64, 211]} />
      </div>

      {/* soft shell scrim at the top so the headline always sits on quiet ground (no blur) */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.shell} 0%, ${P.shell}e6 17%, ${P.shell}00 30%)`, opacity: clamp01(wordP(0) * 1.5) }} />
      <div style={{ position: 'absolute', left: 112, top: 70, display: 'flex', columnGap: '0.26em', fontFamily: SANS, fontWeight: 600, fontSize: 124, letterSpacing: '-0.04em', lineHeight: 1.04, color: P.ink }}>
        {words.map((w, i) => {
          const p = wordP(i);
          return (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
              <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, opacity: p > 0 ? 1 : 0 }}>{w}</span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
