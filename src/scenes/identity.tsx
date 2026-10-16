// S07 identity (bars 15–16): "Your identity is GitHub." A big "Sign in with GitHub" button is
// pressed on 15.1 (thock). On the right, onboarding's `$ whoami` step at 1.78×: the read-only profile
// list from settings (components/github-profile.tsx: hairline 8px list, mono keys in a 6.5rem column,
// sans values) fills one field per beat on 15.2, 15.3, 15.4, 16.1, 16.2
// (click each; website on 16.2.5). The protagonist's avatar lands on 15.2 with its lane ring. Then "Nothing to fill in." and the
// outline "Edit on GitHub ↗" button.
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, nodeIn, punch, ramp, spring } from '../lib/motion';
import type { Pos } from '../lib/clock';
import { CAST } from '../storyboard';
import { Avatar, Node } from '../ui/kit';
import { DashedTail, GitHubMark, Lucide, mono, Pointer, PulseRing, sans } from '../ui/commit-parts';
import { SANS } from '../theme';

const K = 1.78;
const PANEL_X = 1000;
const PANEL_Y = 136;
const LIST_W = 392; // product px (content column)
const RAIL = 56; // onboarding rail column (sm:w-14)

const ada = CAST.ada;
// The protagonist's real, public GitHub profile (director's call). Same keys and order as
// components/github-profile.tsx; `sponsors` is left off because we don't know its value.
const FIELDS: { key: string; value: string | null; at: Pos }[] = [
  { key: 'name', value: ada.name, at: [15, 2] },
  { key: 'username', value: `@${ada.handle}`, at: [15, 3] },
  { key: 'bio', value: ada.bio, at: [15, 4] },
  { key: 'company', value: 'Crescat AS', at: [16, 1] },
  { key: 'location', value: 'Bergen, Norway', at: [16, 2] },
  { key: 'website', value: 'https://helgesver.re', at: [16, 2.5] },
];

export function Identity() {
  const { f, P, at } = useScene();
  const lane = P.lanes[ada.lane]!;

  // the press lands on the cut: fully down on frame 0, springs back
  const pressed = punch(f, 0, 9);
  const pointerAway = ramp(f, 10, 24, easeInOut);
  const avatarAt = at([15, 2]);
  const stepNode = 3; // onboarding's current-step node pops just after the press

  // camera: slow 2 % drift
  const cam = 1.0 + 0.02 * ramp(f, 0, 119, (x) => x);

  const caption = ramp(f, at([16, 3]), 10);
  const editBtn = spring(f, at([16, 3]) + 4, 16, 0.3);

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '50% 50%' }}>
        {/* headline + the button that starts it */}
        <div style={{ position: 'absolute', left: 120, top: 288, fontFamily: SANS, fontWeight: 600, fontSize: 124, letterSpacing: '-0.04em', lineHeight: 1.06, color: P.ink }}>
          <div>Your identity</div>
          <div>is GitHub.</div>
        </div>
        <div style={{ position: 'absolute', left: 124, top: 650 }}>
          <div style={{ position: 'relative', transform: `scale(${1 - 0.05 * pressed})`, transformOrigin: '50% 50%' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 18,
                height: 84,
                padding: '0 38px',
                borderRadius: 13,
                background: pressed > 0.15 ? P.primaryHover : P.primary,
                color: P.primaryInk,
                ...sans(32, 500),
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <GitHubMark size={34} color={P.primaryInk} />
              Sign in with GitHub
            </div>
          </div>
          <Pointer x={330 + pointerAway * 70} y={46 + pointerAway * 120} size={30} down={f < 5 ? 1 : 0} opacity={1 - ramp(f, 22, 10)} />
        </div>

        {/* onboarding's `$ whoami` step at 1.78× */}
        <div style={{ position: 'absolute', left: PANEL_X, top: PANEL_Y, width: RAIL + LIST_W, transform: `scale(${K})`, transformOrigin: '0 0', display: 'flex', fontFamily: SANS, color: P.ink }}>
          <div style={{ position: 'relative', width: RAIL, flex: 'none' }}>
            <DashedTail x={RAIL / 2} y={12} h={420} color={P.rail} />
            <div style={{ position: 'absolute', left: RAIL / 2 - 7, top: 12 - 7 }}>
              <Node size={14} color={lane} P={P} ring={2} gapColor={P.shell} scale={nodeIn(f, stepNode)} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...mono(13), lineHeight: '24px', color: P.muted }}>$ whoami</div>

            {/* avatar, name, handle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, height: 64 }}>
              <div style={{ position: 'relative', flex: 'none', width: 64, height: 64 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px dashed ${P.rail}`, opacity: 1 - clamp01((f - avatarAt) / 4) }} />
                <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${nodeIn(f, avatarAt)})` }}>
                  <Avatar person={ada} size={56} P={P} ring ringColor={lane} gap={2} ringWidth={2} />
                </div>
                <PulseRing x={32} y={32} size={64} color={lane} {...pulseOf(f, avatarAt)} />
              </div>
              <div style={{ minWidth: 0, opacity: ramp(f, avatarAt + 2, 8), transform: `translateX(${(1 - ramp(f, avatarAt + 2, 10, easeOut)) * -10}px)` }}>
                <div style={{ ...sans(16, 600), lineHeight: '24px' }}>{ada.name}</div>
                <div style={{ ...mono(14), lineHeight: '20px', color: P.muted }}>@{ada.handle}</div>
              </div>
            </div>

            {/* the read-only list */}
            <div style={{ marginTop: 20, border: `1px solid ${P.hairline}`, borderRadius: 8, background: P.surface, overflow: 'hidden' }}>
              {FIELDS.map((fl, i) => {
                const t = at(fl.at);
                const v = ramp(f, t - 3, 9, easeOut);
                const flash = f >= t - 1 ? Math.max(0, 1 - (f - t + 1) / 16) : 0;
                return (
                  <div key={fl.key} style={{ display: 'grid', gridTemplateColumns: '6.5rem minmax(0,1fr)', gap: 12, padding: '10px 16px', borderTop: i ? `1px solid ${P.hairline}` : 'none', background: flash > 0 ? mixWash(P.wash, flash) : P.surface, alignItems: 'baseline' }}>
                    <span style={{ ...mono(13), color: P.muted, lineHeight: '20px' }}>{fl.key}</span>
                    <span style={{ minHeight: 20, opacity: v, transform: `translateX(${(1 - v) * -14}px)` }}>
                      {fl.value === null ? <span style={{ ...mono(13), color: P.muted, lineHeight: '20px' }}>null</span> : <span style={{ ...sans(14), lineHeight: '20px' }}>{fl.value}</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* caption + outline button */}
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ ...sans(15), color: P.muted, opacity: caption, transform: `translateY(${(1 - caption) * 6}px)` }}>Nothing to fill in.</div>
              <div style={{ opacity: editBtn > 0 ? clamp01(editBtn * 2) : 0, transform: `scale(${0.9 + 0.1 * editBtn})`, transformOrigin: '0 50%', marginLeft: 'auto' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', borderRadius: 6, border: `1px solid ${P.rail}`, background: P.shell, ...sans(14, 500) }}>
                  Edit on GitHub
                  <Lucide name="arrowUpRight" size={16} color={P.ink} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

const pulseOf = (f: number, at: number) => {
  const t = clamp01((f - at) / 22);
  return { scale: 1 + 0.9 * easeOut(t), opacity: f < at ? 0 : 0.5 * (1 - t) };
};

/** Hover Wash fading back to the surface (white) as `k` goes 1→0. */
function mixWash(wash: string, k: number) {
  const a = Math.round(k * 255)
    .toString(16)
    .padStart(2, '0');
  return `${wash}${a}`;
}
