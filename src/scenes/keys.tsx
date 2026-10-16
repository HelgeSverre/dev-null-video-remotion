// S12 keys (bars 27–28): "Keyboard first." A log at 1.8×; j, j, k move the focus highlight (the
// Accent wash) between commits on the beats and y yanks the focused commit's link (mono toast
// `Copied link to <hash>`, link icon swaps to a check), as copy-link-button.tsx does. On 28.1 the
// appearance switch picks Dark and every colour eases at once over 10 frames (mixPalette). Then a
// held, dark push-in under the riser, `$ man devnull` waiting at the prompt, into the montage.
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, expoOut, lerp, punch, ramp } from '../lib/motion';
import { noise } from '../lib/rand';
import { CAST, KEYS, type Person } from '../storyboard';
import { Cursor, Kbd, Toast } from '../ui/kit';
import { FeedColumn, FeedCommit, Glyph, type GlyphName } from '../ui/star-feed';
import { MONO, SANS, mixPalette, type Palette } from '../theme';

const W = 600;
const ROW = 106; // one-line commit row, product px
const FS = 1.8;

type Row = { person: Person; body: string; time: string; hash: string; stars: number };
const ROWS: Row[] = [
  { person: CAST.margaret, body: 'Postmortem: the cache was fine. Invalidation was not.', time: '3m', hash: 'c3a91f0', stars: 7 },
  { person: CAST.ada, body: 'Dark mode shipped. The CSS variables did all the work.', time: '8m', hash: '5e8b2d7', stars: 12 },
  { person: CAST.ken, body: 'Replaced 400 lines of YAML with 40 lines of YAML.', time: '15m', hash: '0f4c6a2', stars: 5 },
  { person: CAST.grace, body: 'Reviewed my own PR from last year. Requested changes.', time: '22m', hash: '9a7d3e1', stars: 3 },
];
const LABELS: Record<string, string> = { j: 'Next commit', k: 'Previous commit', y: 'Copy link' };

function Segmented({ P, k }: { P: Palette; k: number }) {
  // appearance-tabs.tsx: bordered group, Blue Wash under the picked option, slides on change.
  const opts: { label: string; icon: GlyphName }[] = [
    { label: 'Light', icon: 'sun' },
    { label: 'Dark', icon: 'moon' },
    { label: 'System', icon: 'monitor' },
  ];
  const optW = [104, 100, 118];
  const x0 = 4;
  const x1 = 4 + optW[0]! + 4;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: 4, padding: 4, borderRadius: 8, border: `1px solid ${P.hairline}`, fontFamily: SANS, fontSize: 14, fontWeight: 500 }}>
      <div style={{ position: 'absolute', top: 4, bottom: 4, left: lerp(x0, x1, k), width: lerp(optW[0]!, optW[1]!, k), borderRadius: 6, background: P.primarySoft }} />
      {opts.map((o, i) => {
        const on = i === 0 ? 1 - k : i === 1 ? k : 0;
        const c = on > 0.5 ? P.primary : P.muted;
        return (
          <span key={o.label} style={{ position: 'relative', width: optW[i], boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 14px', color: c }}>
            <Glyph name={o.icon} size={16} color={c} />
            {o.label}
          </span>
        );
      })}
    </div>
  );
}

export function Keys() {
  const { f, at } = useScene();
  const flipAt = at([32, 1]);
  const theme = ramp(f, flipAt, 10, easeInOut);
  const P = mixPalette(theme);

  // ── keys and focus ──
  const presses = KEYS.map((k) => ({ ...k, f: at(k.at) }));
  let focus = 0;
  let from = 0;
  let movedAt = -999;
  for (const p of presses) {
    if (f < p.f) break;
    if (p.key === 'j' || p.key === 'k') {
      from = focus;
      focus = Math.max(0, Math.min(ROWS.length - 1, focus + (p.key === 'j' ? 1 : -1)));
      movedAt = p.f;
    }
  }
  const mv = ramp(f, movedAt, 7, expoOut);
  const focusY = lerp(from, focus, mv) * ROW;
  const current = [...presses].reverse().find((p) => f >= p.f) ?? presses[0]!;
  const down = punch(f, current.f, 9);
  const yank = at([31, 4]);
  const copied = f >= yank;
  const toast = ramp(f, yank + 1, 8, expoOut) * (1 - ramp(f, at([32, 2]), 10));

  // ── left column: kbd cap → appearance switch at 27.4.5 → `$ man devnull` at 28.2 ──
  const capOut = ramp(f, at([31, 4.5]), 5);
  const segIn = ramp(f, at([31, 4.5]) + 3, 10, expoOut) * (1 - ramp(f, at([32, 2]), 10));
  const manIn = ramp(f, at([32, 2]), 10, expoOut);

  // ── camera: drift, then a slow push into the dark from 28.2; one frozen beat on 28.4 ──
  const push = ramp(f, at([32, 1.5]), 60, (x) => clamp01(x) * clamp01(x));
  const cam = 1 + 0.012 * (f / 119) + 0.045 * push;
  const dx = noise(f / 50, 5) * 4;
  const dy = noise(f / 50, 6) * 3;

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${cam})`, transformOrigin: '62% 50%' }}>
        {/* the log */}
        <div style={{ position: 'absolute', left: 770, top: 200, width: W, transform: `scale(${FS})`, transformOrigin: '0 0' }}>
          <FeedColumn P={P} width={W} />
          <div style={{ position: 'absolute', left: 0, bottom: '100%', width: W }}>
            <FeedCommit P={P} person={CAST.barbara} width={W} time="1m" hash="b7e2c40" above={P.lanes[2]} tail={P.lanes[5]} body="Types are just tests you can't forget to write." star={{ starred: false, count: 2 }} />
          </div>
          {/* focus highlight (Accent) */}
          <div style={{ position: 'absolute', left: 0, top: focusY, width: W, height: ROW - 1, background: P.wash }} />
          {ROWS.map((r, i) => (
            <div key={r.hash} style={{ position: 'relative', height: ROW }}>
              <FeedCommit
                P={P}
                person={r.person}
                width={W}
                time={r.time}
                hash={r.hash}
                above={P.lanes[i === 0 ? 5 : ROWS[i - 1]!.person.lane]}
                tail={P.lanes[r.person.lane]}
                body={r.body}
                star={{ starred: false, count: r.stars }}
                linkCopied={copied && i === 1 && f < at([32, 3])}
                surface={i === Math.round(lerp(from, focus, mv)) ? P.wash : P.surface}
              />
            </div>
          ))}
          <FeedCommit P={P} person={CAST.dennis} width={W} time="31m" hash="4d1b8e6" above={P.lanes[1]} tail={P.lanes[4]} body="Rotated the certs. Calendar reminder set for the next time I forget." star={{ starred: false, count: 8 }} />
        </div>

        {/* headline */}
        <div style={{ position: 'absolute', left: 104, top: 200, fontFamily: SANS, fontWeight: 600, fontSize: 124, letterSpacing: '-0.04em', lineHeight: 1.04, color: P.ink }}>
          Keyboard
          <br />
          first.
        </div>

        {/* the key cap and what it did */}
        <div style={{ position: 'absolute', left: 104, top: 560, display: 'flex', alignItems: 'center', gap: 40, opacity: 1 - capOut, transform: `translateY(${capOut * -16}px)` }}>
          <span style={{ display: 'inline-flex', transform: `scale(${1 - 0.04 * down})` }}>
            <Kbd P={P} size={92} down={down}>
              {current.key}
            </Kbd>
          </span>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 44, letterSpacing: '-0.02em', color: P.ink }}>
            {LABELS[current.key]}
            <div style={{ marginTop: 6, fontFamily: MONO, fontWeight: 400, fontSize: 26, letterSpacing: 0, color: P.muted }}>{['j', 'j', 'k', 'y'].map((k, i) => (
              <span key={i} style={{ marginRight: 14, color: presses[i] && f >= presses[i]!.f ? P.ink : P.rail }}>{k}</span>
            ))}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 104, top: 600, opacity: segIn, transform: `translateY(${(1 - segIn) * 16}px) scale(1.8)`, transformOrigin: '0 0' }}>
          <Segmented P={P} k={ramp(f, flipAt, 9, expoOut)} />
        </div>
        <div style={{ position: 'absolute', left: 104, top: 596, fontFamily: MONO, fontSize: 52, color: P.ink, opacity: manIn, transform: `translateY(${(1 - manIn) * 16}px)`, whiteSpace: 'pre' }}>
          <span style={{ color: P.muted }}>$ </span>man devnull
          <Cursor f={f} color={P.primary} solid={f >= at([32, 4])} />
        </div>

        {/* toast */}
        <div style={{ position: 'absolute', left: 770 + (W * FS) / 2, top: 930, transform: `translate(-50%, ${(1 - toast) * 30}px) scale(${1.9})`, transformOrigin: '50% 50%', opacity: clamp01(toast * 1.5) }}>
          <Toast P={P} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
            Copied link to {ROWS[1]!.hash}
          </Toast>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
