// S11 follows (bars 25–26, in the groove): "Bring your people." On first sign-in devnull follows
// the developers you follow on GitHub, and your GitHub followers follow you (PRODUCT.md, "GitHub
// follows come over once"). Drawn as a graph at 1.78×: the protagonist's node at the top of his
// teal rail, `$ git pull github following` under it, then the people branching off the rail in
// their own lanes, one per beat from 25.2 (pop in the lane's pitch). Each row is onboarding's
// SuggestedUserRow (components/who-to-follow.tsx: 36px avatar, name, lane-dotted mono handle,
// size-sm Follow button, min-w 90px); its button flips to the outline "Following" on the next beat
// (the last on 26.4), and the ones who follow him on GitHub get the profile's "Follows you" tag.
import { AbsoluteFill } from 'remotion';
import { BEAT, type Pos } from '../lib/clock';
import { useScene } from '../lib/scene';
import { clamp01, easeOut, expoOut, nodeIn, punch, ramp, spring } from '../lib/motion';
import { CAST, type Person } from '../storyboard';
import { Avatar, Button, LaneDot } from '../ui/kit';
import { DashedTail, mono, PulseRing, sans } from '../ui/commit-parts';
import { SANS } from '../theme';

const K = 1.78;
const W = 460; // panel width, product px
const MAIN_X = 26; // the protagonist's rail
const BR_X = 80; // the imported people's nodes
const TEXT_X = 112;
const ROW0 = 112; // first row top
const ROW_H = 60;
const H = ROW0 + 6 * ROW_H; // panel height, product px
const PANEL_X = 1000;
const PANEL_Y = (1080 - H * K) / 2 + 6;

const ada = CAST.ada;
// Fictional, in the cast's style (first/last mash-ups).
const frances: Person = { handle: 'fthompson', name: 'Frances Thompson', lane: 5 };
const anders: Person = { handle: 'aliskov', name: 'Anders Liskov', lane: 1 };

/** Who comes over, in order; `mutual` = also follows him on GitHub ("Follows you"). Lands on `at`. */
export const FOLLOWS: { person: Person; mutual?: boolean; at: Pos }[] = [
  { person: CAST.grace, mutual: true, at: [25, 2] },
  { person: CAST.ken, at: [25, 3] },
  { person: CAST.margaret, mutual: true, at: [25, 4] },
  { person: CAST.dennis, at: [26, 1] },
  { person: frances, mutual: true, at: [26, 2] },
  { person: anders, at: [26, 3] },
];

export function Follows() {
  const { f, P, at, len } = useScene();
  const teal = P.lanes[ada.lane]!;

  const rows = FOLLOWS.map((r, i) => {
    const t = at(r.at);
    const flip = t + BEAT; // the button flips on the next beat
    return { ...r, i, t, flip, top: ROW0 + i * ROW_H };
  });
  const arrived = rows.filter((r) => f >= r.t - 6).length;

  // the main rail grows down ahead of each arrival
  const lastTop = arrived ? rows[arrived - 1]!.top : ROW0 - 20;
  const railEnd = 56 + (lastTop + ROW_H - 56) * 1; // to the bottom of the newest row
  const railGrow = arrived ? ramp(f, rows[arrived - 1]!.t - 7, 7, easeOut) : 1;
  const prevEnd = arrived > 1 ? rows[arrived - 2]!.top + ROW_H : ROW0;
  const railY = arrived ? prevEnd + (railEnd - prevEnd) * railGrow : ROW0;

  // the protagonist's node lands with the cut
  const meHit = punch(f, 0, 12);
  const mePulse = { scale: 1 + 0.9 * clamp01(f / 20), opacity: 0.5 * (1 - clamp01(f / 20)) };

  // camera: slow 2 % drift
  const cam = 1 + 0.02 * (f / len);

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '55% 50%' }}>
        {/* headline + sub line */}
        <div style={{ position: 'absolute', left: 120, top: 318, fontFamily: SANS, fontWeight: 600, fontSize: 132, letterSpacing: '-0.04em', lineHeight: 1.04, color: P.ink }}>
          <div>Bring your</div>
          <div>people.</div>
        </div>
        <div style={{ position: 'absolute', left: 124, top: 636, ...sans(40), letterSpacing: '-0.01em', color: P.muted }}>Your GitHub follows come with you.</div>

        {/* the graph at 1.78× */}
        <div style={{ position: 'absolute', left: PANEL_X, top: PANEL_Y, width: W, height: H, transform: `scale(${K})`, transformOrigin: '0 0', fontFamily: SANS, color: P.ink }}>
          {/* main rail: teal where people have come in, staged dashes below */}
          <div style={{ position: 'absolute', left: MAIN_X - 1, top: 56, width: 2, height: Math.max(0, railY - 56), background: teal }} />
          <DashedTail x={MAIN_X} y={railY + 4} h={H + 30 - railY} color={P.rail} />

          {/* branches */}
          <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            {rows.map((r) => {
              const d = ramp(f, r.t - 7, 7, easeOut);
              if (d <= 0) return null;
              const y0 = r.top - 14;
              const y1 = r.top + ROW_H / 2 - 22;
              return <path key={r.i} d={`M ${MAIN_X} ${y0} C ${MAIN_X} ${y0 + 16}, ${BR_X} ${y1 - 18}, ${BR_X} ${y1}`} fill="none" stroke={P.lanes[r.person.lane]} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} />;
            })}
          </svg>

          {/* the protagonist */}
          <div style={{ position: 'absolute', left: MAIN_X - 28, top: 0, width: 56, height: 56 }}>
            <PulseRing x={28} y={28} size={56} color={teal} {...mePulse} />
            <div style={{ transform: `scale(${1 + 0.1 * meHit})` }}>
              <Avatar person={ada} size={48} P={P} ring ringColor={teal} />
            </div>
          </div>
          <div style={{ position: 'absolute', left: 68, top: 5 }}>
            <div style={{ ...sans(17, 600), lineHeight: '24px' }}>{ada.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono(14), lineHeight: '20px', color: P.muted }}>
              <LaneDot color={teal} size={7} />@{ada.handle}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 68, top: 70, ...mono(13), lineHeight: '24px', color: P.muted, whiteSpace: 'pre' }}>$ git pull github following</div>

          {/* the people */}
          {rows.map((r) => {
            const lc = P.lanes[r.person.lane]!;
            const show = ramp(f, r.t - 4, 9, expoOut);
            if (f < r.t - 6) return null;
            const following = f >= r.flip;
            const press = punch(f, r.flip, 8);
            const tag = r.mutual ? spring(f, r.flip + BEAT / 2, 12, 0.4) : 0;
            const ns = nodeIn(f, r.t - 4);
            const pl = { scale: 1 + 0.9 * clamp01((f - r.t) / 20), opacity: f < r.t ? 0 : 0.5 * (1 - clamp01((f - r.t) / 20)) };
            return (
              <div key={r.i} style={{ position: 'absolute', left: 0, top: r.top, width: W, height: ROW_H }}>
                <div style={{ position: 'absolute', left: BR_X - 22, top: ROW_H / 2 - 22, width: 44, height: 44 }}>
                  <PulseRing x={22} y={22} size={44} color={lc} {...pl} />
                  <div style={{ transform: `scale(${ns})` }}>
                    <Avatar person={r.person} size={36} P={P} ring ringColor={lc} />
                  </div>
                </div>
                <div style={{ position: 'absolute', left: TEXT_X, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${P.hairline}`, opacity: clamp01(show * 1.4), transform: `translateX(${(1 - show) * 22}px)` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...sans(15, 600), lineHeight: '20px', whiteSpace: 'nowrap' }}>{r.person.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono(13), lineHeight: '18px', color: P.muted, whiteSpace: 'nowrap' }}>
                      <LaneDot color={lc} size={6} />@{r.person.handle}
                      {tag > 0 ? (
                        <span style={{ marginLeft: 4, borderRadius: 4, background: P.wash, padding: '1px 6px', ...sans(12), lineHeight: '16px', color: P.ink, opacity: clamp01(tag * 2), transform: `scale(${0.7 + 0.3 * tag})`, transformOrigin: '0 50%', display: 'inline-block' }}>Follows you</span>
                      ) : null}
                    </div>
                  </div>
                  <Button P={P} variant={following ? 'outline' : 'primary'} height={32} fontSize={14} pressed={press} style={{ minWidth: 90, padding: '0 8px', flex: 'none' }}>
                    {following ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
