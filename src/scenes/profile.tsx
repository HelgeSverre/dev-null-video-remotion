// S11 profile (bars 25–26, the breakdown): the protagonist's profile page as pages/user/show.tsx
// draws it, at 1.8×. The header (80px avatar with the lane ring offset 4px, name, lane-dotted
// handle, the `Lv. 4 · maintainer` pill, bio, metadata, counts), then Commit activity: he joined
// this month, so the product shows the 30-day strip (DESIGN.md → Commit Activity), which grows in
// cell by cell across bar 25, then the mono streak strip. Bar 26 drifts down to the achievements
// shelf, where init, uptime, max payload and authorized_keys unlock one per beat.
import { AbsoluteFill, interpolateColors } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, lerp, ramp, spring } from '../lib/motion';
import { noise } from '../lib/rand';
import { CAST } from '../storyboard';
import { Avatar, Button, LaneDot } from '../ui/kit';
import { Glyph, type GlyphName } from '../ui/star-feed';
import { BODY_FEATURES, MONO, SANS, type Palette } from '../theme';

const W = 620;
const S = 1.8;
const ME = CAST.ada;

// ── data (mock, but internally consistent with the product's rules) ──────────────────────
// 30 UTC days ending Fri 16 Oct 2026; joined 1 Oct. 46 commits, longest streak 12, current 3.
const DAYS: { label: string | null; count: number }[] = (() => {
  const counts = [2, 4, 3, 5, 1, 3, 6, 2, 4, 3, 2, 4, 0, 2, 3, 2]; // Oct 1 → Oct 16
  const out: { label: string | null; count: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.UTC(2026, 9, 16 - 29 + i));
    const mon = d.getUTCDay() === 1 && i < 27;
    const label = mon ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCDate()}` : null;
    out.push({ label, count: i >= 14 ? counts[i - 14]! : 0 });
  }
  return out;
})();
const TOTAL = DAYS.reduce((s, d) => s + d.count, 0); // 46
const MAX = Math.max(...DAYS.map((d) => d.count));
const levelOf = (c: number) => (c === 0 ? 0 : Math.max(1, Math.ceil((c / MAX) * 4)));
const MIX = [0, 0.32, 0.56, 0.8, 1];

// XP: 46·10 + 12·15 + 20·5 + 3·5 + 6·2 = 767 → maintainer (400–1000).
const XP = 767;
const BADGES: { name: string; icon: GlyphName; unlockBeat?: number; progress?: string }[] = [
  { name: 'init', icon: 'terminal', unlockBeat: 1 },
  { name: 'syntax', icon: 'fileCode' },
  { name: 'uptime', icon: 'flame', unlockBeat: 2 },
  { name: 'daemon', icon: 'zap', progress: '12/30' },
  { name: 'sysadmin', icon: 'server', progress: '12/100' },
  { name: 'stdout', icon: 'box', progress: '46/50' },
  { name: 'kernel space', icon: 'shield', progress: '46/100' },
  { name: 'stargazer', icon: 'star', progress: '6/10' },
  { name: 'superstar', icon: 'sparkles', progress: '20/25' },
  { name: 'pipe', icon: 'gitMerge', progress: '3/5' },
  { name: 'max payload', icon: 'maximize', unlockBeat: 3 },
  { name: 'authorized_keys', icon: 'key', unlockBeat: 4 },
];

function Badge({ P, b, k, lane }: { P: Palette; b: (typeof BADGES)[number]; k: number; lane: string }) {
  // k: 0 locked → 1 unlocked (with a pop); locked pills are dashed and faint, as in the product.
  const on = k > 0.02;
  const pop = on ? 1 + 0.22 * Math.sin(Math.PI * clamp01(k)) * (1 - clamp01(k - 0.5)) : 1;
  const ring = on ? interpolateColors(clamp01(k * 1.4), [0, 0.5, 1], [P.hairline, lane, P.hairline]) : `${P.muted}4d`;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px ${on ? 'solid' : 'dashed'} ${ring}`,
        background: on ? P.surface : `${P.wash}55`,
        color: on ? P.ink : `${P.muted}99`,
        fontFamily: MONO,
        fontSize: 12,
        lineHeight: '16px',
        boxShadow: on ? '0 1px 2px rgba(18,20,23,0.05)' : 'none',
        transform: `scale(${pop})`,
      }}
    >
      <Glyph name={b.icon} size={14} color={on ? P.ink : `${P.muted}80`} />
      <span>{b.name}</span>
      {!on && b.progress ? <span style={{ fontSize: 10, color: `${P.muted}99` }}>({b.progress})</span> : null}
    </span>
  );
}

export function Profile() {
  const { f, P, at } = useScene();
  const lane = P.lanes[ME.lane]!;

  // ── camera: arrives on the whoosh, glides down to the shelf for bar 26, drifts ──
  const arrive = ramp(f, 0, 26, expoOut);
  const glide = ramp(f, at([29, 3]), 40, easeInOut);
  const y = lerp(40, -345, glide) + 26 * (1 - arrive) - 10 * (f / 119) + noise(f / 60, 7) * 3;
  const scale = S * (1.025 - 0.025 * arrive + 0.012 * (f / 119));
  const x = (1920 - W) / 2 + noise(f / 70, 11) * 4;

  // ── strip sweep across bar 25: one cell every ~1.5 frames from 25.1.5 ──
  const sweep0 = at([29, 1.25]);
  const cellK = (i: number) => ramp(f, sweep0 + i * 1.45, 12, expoOut);
  const streak = ramp(f, at([29, 4]), 12);
  const unlocked = BADGES.filter((b) => b.unlockBeat && f >= at([30, b.unlockBeat])).length;

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: x, top: y, width: W, transform: `scale(${scale})`, transformOrigin: '50% 0', fontFamily: SANS, color: P.ink }}>
        <div style={{ position: 'absolute', left: 0, top: -2000, width: W, height: 5000, background: P.surface, borderLeft: `1px solid ${P.hairline}`, borderRight: `1px solid ${P.hairline}`, boxSizing: 'border-box' }} />
        <div style={{ position: 'relative' }}>
          {/* sticky page header */}
          <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', borderBottom: `1px solid ${P.hairline}` }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{ME.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: P.muted }}>{TOTAL} commits</span>
          </div>

          {/* header */}
          <header style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${P.hairline}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Avatar person={ME} size={80} P={P} ring gap={4} ringWidth={2} ringColor={lane} />
              <Button P={P} variant="outline" height={36} fontSize={14}>
                Edit on GitHub
                <Glyph name="externalLink" size={14} color={P.ink} />
              </Button>
            </div>
            <div style={{ marginTop: 16, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.33 }}>{ME.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 14, color: P.muted }}>
                <LaneDot color={lane} />@{ME.handle}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: `1px solid ${lane}40`, background: `${lane}15`, color: lane, padding: '2px 8px', fontFamily: MONO, fontSize: 11, fontWeight: 500, lineHeight: '16px' }}>
                Lv. 4 · maintainer
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES }}>{ME.bio}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 6, fontSize: 14, color: P.muted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph name="building" size={16} color={P.muted} />
                Crescat AS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph name="pin" size={16} color={P.muted} />
                Bergen, Norway
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph name="link2" size={16} color={P.muted} />
                <span style={{ color: P.primary }}>helgesver.re</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph name="github" size={16} color={P.muted} />
                <span style={{ color: P.primary }}>github.com/{ME.handle}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Glyph name="calendar" size={16} color={P.muted} />
                Joined October 2026
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 20, fontSize: 14 }}>
              {[
                [TOTAL, 'commits'],
                [42, 'following'],
                [57, 'followers'],
              ].map(([n, l]) => (
                <span key={l} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontWeight: 500 }}>{n}</span>
                  <span style={{ color: P.muted }}>{l}</span>
                </span>
              ))}
            </div>
          </header>

          {/* commit activity: the 30-day strip */}
          <section style={{ padding: '20px 24px', borderBottom: `1px solid ${P.hairline}` }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Commit activity</span>
              <span style={{ fontSize: 14, color: P.muted }}>
                <span style={{ fontFamily: MONO, color: P.ink }}>{TOTAL}</span> commits in the last 30 days
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))', gap: 3 }}>
              {DAYS.map((d, i) => {
                const lv = levelOf(d.count);
                const k = cellK(i);
                // the skeleton is there from the first frame; the sweep fills each day as it passes
                const full = lv === 0 ? P.wash : interpolateColors(MIX[lv]!, [0, 1], [P.surface, lane]);
                const bg = interpolateColors(clamp01(k * 1.3), [0, 1], [P.wash, full]);
                const bump = 1 + (lv === 0 ? 0.06 : 0.16) * Math.sin(Math.PI * clamp01(k * 1.2));
                return <span key={i} style={{ height: 48, borderRadius: 2, background: bg, transform: `scaleY(${bump})`, transformOrigin: '50% 100%' }} />;
              })}
            </div>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))', fontSize: 12, color: P.muted }}>
              {DAYS.map((d, i) => (
                <span key={i} style={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {d.label}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 12, color: P.muted }}>
              <span style={{ marginRight: 4 }}>Less</span>
              {MIX.map((m, l) => (
                <span key={l} style={{ width: 10, height: 10, borderRadius: 2, background: l === 0 ? P.wash : interpolateColors(m, [0, 1], [P.surface, lane]) }} />
              ))}
              <span style={{ marginLeft: 4 }}>More</span>
            </div>
          </section>

          {/* streaks */}
          <p style={{ margin: 0, padding: '12px 24px', borderBottom: `1px solid ${P.hairline}`, display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 13, color: P.muted }}>
            <span style={{ opacity: streak, transform: `translateY(${(1 - streak) * 6}px)` }}>
              longest streak <span style={{ fontWeight: 500, color: P.ink }}>12</span> days
            </span>
            <span style={{ opacity: ramp(f, at([29, 4]) + 4, 10) }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: ramp(f, at([29, 4]) + 6, 10) }}>
              <span style={{ transform: `scale(${spring(f, at([29, 4]) + 6, 16, 0.5)})`, display: 'inline-flex' }}>
                <LaneDot color={lane} />
              </span>
              current <span style={{ fontWeight: 500, color: P.ink }}>3</span>
            </span>
          </p>

          {/* achievements shelf */}
          <section style={{ padding: '12px 24px 16px', borderBottom: `1px solid ${P.hairline}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 13, color: P.muted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Glyph name="award" size={16} color={P.ink} />
                <span style={{ fontWeight: 500, color: P.ink }}>Lv. 4 · maintainer</span>
                <span>·</span>
                <span>{XP} XP</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <span style={{ display: 'inline-block', minWidth: '1ch' }}>{unlocked}</span> / {BADGES.length} unlocked
                <Glyph name="chevronRight" size={14} color={P.muted} />
              </span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: P.muted }}>
              <span>{XP} / 1000 XP</span>
              <span>{1000 - XP} XP to wheel</span>
            </div>
            <div style={{ marginTop: 4, height: 6, borderRadius: 999, background: P.wash, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${61 * easeOut(ramp(f, at([29, 4]), 30, (v) => v))}%`, borderRadius: 999, background: lane }} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BADGES.map((b) => (
                <Badge key={b.name} P={P} b={b} lane={lane} k={b.unlockBeat ? ramp(f, at([30, b.unlockBeat]), 12, (v) => v) : 0} />
              ))}
            </div>
          </section>
          <div style={{ height: 56, display: 'flex', borderBottom: `1px solid ${P.hairline}`, fontSize: 15, fontWeight: 500 }}>
            {['Commits', 'Replies'].map((t, i) => (
              <span key={t} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? P.ink : P.muted, position: 'relative' }}>
                {t}
                {i === 0 ? <span style={{ position: 'absolute', bottom: 0, width: 64, height: 3, borderRadius: 2, background: P.primary }} /> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
