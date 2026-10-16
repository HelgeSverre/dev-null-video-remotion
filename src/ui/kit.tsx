// devnull's UI, rebuilt for the film from ../dev-null.sh/DESIGN.md and resources/js/components.
// Components are pure: every animated quantity comes in as a prop computed from the frame.
import { BEAT } from '../lib/clock';
import type { CSSProperties, ReactNode } from 'react';
import { Img, staticFile } from 'remotion';
import { hash } from '../lib/rand';
import type { Lane, Person } from '../storyboard';
import { BODY_FEATURES, MONO, SANS, type Palette } from '../theme';

// ── brand ──────────────────────────────────────────────────────────────────────────────────

/** The null-sign mark: a solid ink stroke and a hollow lane-0 stroke (public/favicon.svg). */
export function Mark({ size, P, ink, accent, draw = 1 }: { size: number; P: Palette; ink?: string; accent?: string; draw?: number }) {
  return (
    <svg width={size} height={size} viewBox="1.6 1.5 45 45" style={{ display: 'block', overflow: 'visible' }}>
      <path d="M2 42h10L26 6H16Z" fill={ink ?? P.ink} style={{ opacity: Math.min(1, draw * 2) }} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.81 43.5h13.22L46.19 4.5H32.97ZM22.19 40.5l12.84-33h6.78l-12.84 33Z"
        fill={accent ?? P.lanes[0]}
        style={{ opacity: Math.max(0, Math.min(1, draw * 2 - 1)) }}
      />
    </svg>
  );
}

/** The `/dev/null` wordmark: the second slash is hollow and stroked in lane-0 (og.png). */
export function Wordmark({ size, P, chars = 9 }: { size: number; P: Palette; chars?: number }) {
  const text = '/dev/null';
  const shown = text.slice(0, chars);
  return (
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: '-0.045em', lineHeight: 1, color: P.ink, whiteSpace: 'pre' }}>
      {[...shown].map((ch, i) =>
        i === 4 ? (
          <span key={i} style={{ color: 'transparent', WebkitTextStroke: `${Math.max(2, size * 0.028)}px ${P.lanes[0]}` }}>
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </div>
  );
}

// ── people ─────────────────────────────────────────────────────────────────────────────────

/** GitHub-style identicon: a 5×5 mirrored grid in one colour from the handle's hash. */
export function Identicon({ handle, size }: { handle: string; size: number }) {
  const h = hash(handle);
  const hue = h % 360;
  const color = `hsl(${hue} 55% 52%)`;
  const cells: ReactNode[] = [];
  const pad = size * 0.12;
  const cell = (size - pad * 2) / 5;
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 3; x++) {
      const bit = (h >>> (y * 3 + x + 3)) & 1;
      if (!bit) continue;
      for (const xx of x === 2 ? [2] : [x, 4 - x])
        cells.push(<rect key={`${xx}-${y}`} x={pad + xx * cell} y={pad + y * cell} width={cell + 0.5} height={cell + 0.5} fill={color} />);
    }
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="#f0f0f0" />
      {cells}
    </svg>
  );
}

/** Avatar: the person's real avatar (public/) or an identicon, in a circle, optionally inside a 2px lane ring with a 2px gap (the feed's rail node). */
export function Avatar({ person, size, P, ring, dashed, ringColor, gap = 2, ringWidth = 2 }: { person: Person; size: number; P: Palette; ring?: boolean; dashed?: boolean; ringColor?: string; gap?: number; ringWidth?: number }) {
  const rc = ringColor ?? P.lanes[person.lane]!;
  const inner = (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: P.wash }}>
      {person.avatar ? <Img src={staticFile(person.avatar)} style={{ width: size, height: size, display: 'block', objectFit: 'cover' }} /> : <Identicon handle={person.handle} size={size} />}
    </div>
  );
  if (!ring) return inner;
  return (
    <div style={{ padding: gap, borderRadius: '50%', border: `${ringWidth}px ${dashed ? 'dashed' : 'solid'} ${rc}`, background: P.surface, display: 'inline-block', lineHeight: 0 }}>
      {inner}
    </div>
  );
}

/** 8px lane dot before a handle in profile contexts. */
export const LaneDot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color, flex: 'none' }} />
);

// ── graph ──────────────────────────────────────────────────────────────────────────────────

/**
 * A graph node: a ring in `color` with a punched gap in the surface colour, filled for a commit,
 * hollow for staged/root. `scale` drives node-in; `pulse` draws the expanding lane ring.
 */
export function Node({ size, color, P, hollow, scale = 1, pulse, ring = 2, gapColor }: { size: number; color: string; P: Palette; hollow?: boolean; scale?: number; pulse?: { scale: number; opacity: number }; ring?: number; gapColor?: string }) {
  const gap = Math.max(2, size * 0.2);
  return (
    <div style={{ position: 'relative', width: size, height: size, transform: `scale(${scale})` }}>
      {pulse && pulse.opacity > 0 ? (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: pulse.opacity, transform: `scale(${pulse.scale})` }} />
      ) : null}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${ring}px solid ${color}`, background: gapColor ?? P.surface }} />
      {!hollow ? <div style={{ position: 'absolute', inset: ring + gap * 0.5, borderRadius: '50%', background: color }} /> : null}
    </div>
  );
}

/** Vertical rail segment; `draw` 0..1 grows it downward (rail-draw). */
export function Segment({ x, y, h, color, draw = 1, width = 2, dashed }: { x: number; y: number; h: number; color: string; draw?: number; width?: number; dashed?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: y,
        width,
        height: Math.max(0, h * draw),
        background: dashed ? `repeating-linear-gradient(to bottom, ${color} 0 6px, transparent 6px 12px)` : color,
      }}
    />
  );
}

// ── controls ───────────────────────────────────────────────────────────────────────────────

export function Button({ children, P, variant = 'primary', scale = 1, pressed = 0, style, height = 36, fontSize = 14 }: { children: ReactNode; P: Palette; variant?: 'primary' | 'outline' | 'ghost' | 'destructive'; scale?: number; pressed?: number; style?: CSSProperties; height?: number; fontSize?: number }) {
  const bg = variant === 'primary' ? (pressed > 0.5 ? P.primaryHover : P.primary) : variant === 'destructive' ? P.destructive : variant === 'outline' ? P.shell : 'transparent';
  const color = variant === 'primary' || variant === 'destructive' ? P.primaryInk : P.ink;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: height * 0.22,
        height,
        padding: `0 ${height * 0.44}px`,
        borderRadius: height / 6,
        background: bg,
        color,
        border: variant === 'outline' ? `1px solid ${P.rail}` : 'none',
        fontFamily: SANS,
        fontWeight: 500,
        fontSize,
        whiteSpace: 'nowrap',
        transform: `scale(${scale * (1 - 0.06 * pressed)})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Bordered mono key cap (`kbd`); `down` 0..1 presses it. */
export function Kbd({ children, P, size = 13, down = 0 }: { children: ReactNode; P: Palette; size?: number; down?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size * 1.9,
        height: size * 1.9,
        padding: `0 ${size * 0.5}px`,
        borderRadius: size * 0.35,
        border: `1px solid ${P.rail}`,
        borderBottomWidth: Math.max(2, size * 0.16) * (1 - down * 0.6),
        background: down > 0.3 ? P.primarySoft : P.wash,
        color: down > 0.3 ? P.primary : P.ink,
        fontFamily: MONO,
        fontSize: size,
        fontWeight: 500,
        transform: `translateY(${down * size * 0.12}px)`,
      }}
    >
      {children}
    </span>
  );
}

/** Mono toast, the way `git commit` reports. */
export function Toast({ children, P, style }: { children: ReactNode; P: Palette; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, background: P.ink, color: P.surface, fontFamily: MONO, fontSize: 14, ...style }}>
      {children}
    </div>
  );
}

export function Pill({ children, color, bg, P, mono = true, style }: { children: ReactNode; color: string; bg: string; P: Palette; mono?: boolean; style?: CSSProperties }) {
  void P;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, background: bg, color, fontFamily: mono ? MONO : SANS, fontSize: 12, fontWeight: 500, lineHeight: 1.6, ...style }}>
      {children}
    </span>
  );
}

// ── icons (lucide paths, 24-unit viewBox) ───────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  star: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  reply: 'M9 17 4 12l5-5 M20 18v-2a4 4 0 0 0-4-4H4',
  quote: 'M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  bookmark: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z',
  bell: 'M10.268 21a2 2 0 0 0 3.464 0 M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  commit: 'M12 3v6 M12 15v6 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  settings: 'M20 7h-9 M14 17H5 M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M7 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  search: 'm21 21-4.34-4.34 M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0',
  image: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  chart: 'M3 3v16a2 2 0 0 0 2 2h16 M18 17V9 M13 17V5 M8 17v-3',
  eye: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  clock: 'M12 6v6l4 2 M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
  trash: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
  github: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4 M9 18c-4.51 2-5-2-7-2',
  key: 'm15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4 M21 2l-9.6 9.6 M7.5 15.5m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0',
  terminal: 'M12 19h8 M4 17l6-6-6-6',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
  pin: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  sun: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  alert: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3 M12 9v4 M12 17h.01',
  plus: 'M5 12h14 M12 5v14',
  check: 'M20 6 9 17l-5-5',
};
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16, color, fill = 'none', stroke = 2 }: { name: IconName; size?: number; color: string; fill?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }}>
      <path d={ICONS[name]} />
    </svg>
  );
}

// ── the commit row (signature) ──────────────────────────────────────────────────────────────

export type CommitRowProps = {
  P: Palette;
  person: Person;
  body: ReactNode;
  time: string;
  hash: string;
  /** Override the author's lane (S08 recolours live). */
  laneColor?: string;
  stars?: number;
  starred?: number; // 0..1 fill
  starScale?: number;
  replies?: number;
  /** Extra blocks under the body (quote card, poll, code…). */
  extra?: ReactNode;
  /** Rail colours: segment above the node (previous author) and below (this author). */
  above?: string | null;
  below?: string | null;
  /** node-in scale for the avatar node, and its pulse. */
  nodeScale?: number;
  pulse?: { scale: number; opacity: number };
  pill?: ReactNode;
  replyingTo?: string;
  width?: number;
  /** Background tint (focus highlight in S12). */
  tint?: string;
  bodySize?: number;
  /** Hide the action row. */
  bare?: boolean;
};

/** Rail column width and avatar size in the feed (commit-card.tsx: 4rem rail, 40px avatar). */
export const RAIL_W = 72;
export const AVATAR = 40;

export function CommitRow({ P, person, body, time, hash: h, laneColor, stars = 0, starred = 0, starScale = 1, replies = 0, extra, above, below, nodeScale = 1, pulse, pill, replyingTo, width = 620, tint, bodySize = 15, bare }: CommitRowProps) {
  const lc = laneColor ?? P.lanes[person.lane]!;
  const nodeTop = 12;
  const nodeSize = AVATAR + 8;
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `${RAIL_W}px 1fr`, width, background: tint ?? P.surface, fontFamily: SANS, color: P.ink }}>
      <div style={{ position: 'relative' }}>
        {above ? <div style={{ position: 'absolute', left: RAIL_W / 2 - 1, top: 0, height: nodeTop, width: 2, background: above }} /> : null}
        {below ? <div style={{ position: 'absolute', left: RAIL_W / 2 - 1, top: nodeTop + nodeSize, bottom: 0, width: 2, background: below }} /> : null}
        <div style={{ position: 'absolute', left: RAIL_W / 2 - nodeSize / 2, top: nodeTop, transform: `scale(${nodeScale})` }}>
          {pulse && pulse.opacity > 0 ? <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: lc, opacity: pulse.opacity, transform: `scale(${pulse.scale})` }} /> : null}
          <div style={{ position: 'relative' }}>
            <Avatar person={person} size={AVATAR} P={P} ring ringColor={lc} />
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 16px 12px 0', borderBottom: `1px solid ${P.hairline}`, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 15, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 600 }}>{person.name}</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: P.muted }}>@{person.handle}</span>
          <span style={{ color: P.muted }}>·</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: P.muted }}>{time}</span>
          {pill}
          <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13, color: P.muted }}>{h}</span>
        </div>
        {replyingTo ? <div style={{ fontFamily: MONO, fontSize: 12, color: P.muted, marginTop: 2 }}>↳ replying to @{replyingTo}</div> : null}
        <div style={{ fontSize: bodySize, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: 2 }}>{body}</div>
        {extra}
        {!bare ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 10, fontSize: 13, color: P.muted }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: starred > 0.5 ? P.primary : P.muted }}>
              <span style={{ transform: `scale(${starScale}) rotate(${(starScale - 1) * -34}deg)`, display: 'inline-block' }}>
                <Icon name="star" size={16} color={starred > 0.5 ? P.primary : P.muted} fill={starred > 0.5 ? P.primary : 'none'} />
              </span>
              {stars > 0 ? <span style={{ fontFamily: MONO, fontWeight: 500 }}>{stars}</span> : null}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="quote" size={15} color={P.muted} />
              Quote
            </span>
            <span>Reply</span>
            {replies > 0 ? <span style={{ color: P.primary }}>▾ {replies} {replies === 1 ? 'reply' : 'replies'}</span> : null}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 16 }}>
              <Icon name="bookmark" size={16} color={P.muted} />
              <Icon name="link" size={16} color={P.muted} />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── windows ────────────────────────────────────────────────────────────────────────────────

/** A terminal window. `dark` gives the classic dark body on the light shell. */
export function TerminalWindow({ P, title = 'zsh', dark, width, height, children, style }: { P: Palette; title?: string; dark?: boolean; width: number; height?: number; children: ReactNode; style?: CSSProperties }) {
  const bg = dark ? '#121417' : P.surface;
  const fg = dark ? '#ececec' : P.ink;
  return (
    <div style={{ width, height, borderRadius: 14, overflow: 'hidden', background: bg, color: fg, border: `1px solid ${dark ? '#2a2a2d' : P.hairline}`, boxShadow: '0 30px 80px -30px rgba(18,20,23,0.35)', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ height: 44, flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: `1px solid ${dark ? '#2a2a2d' : P.hairline}`, background: dark ? '#18181a' : P.shell }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 13, color: dark ? '#a1a1a6' : P.muted, marginRight: 52 }}>{title}</span>
      </div>
      <div style={{ flex: 1, padding: '22px 26px', fontFamily: MONO, fontSize: 22, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{children}</div>
    </div>
  );
}

/** Blinking block cursor, blinking on the beat (on for the first half of each beat). */
export function Cursor({ f, color, solid, h = '1.1em', w = '0.55em' }: { f: number; color: string; solid?: boolean; h?: string; w?: string }) {
  const on = solid || Math.floor(f / (BEAT / 2)) % 2 === 0;
  return <span style={{ display: 'inline-block', width: w, height: h, verticalAlign: 'text-bottom', background: color, opacity: on ? 1 : 0, marginLeft: 2 }} />;
}

// ── kinetic headline ───────────────────────────────────────────────────────────────────────

/**
 * Headline whose words rise in one by one. `progress` per word comes from the caller (so words can
 * land on beats); 0 = hidden below, 1 = set. No blur (filters differ between render tabs).
 */
export function Words({ words, progress, style, accent }: { words: string[]; progress: (i: number) => number; style?: CSSProperties; accent?: Record<number, CSSProperties> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', ...style }}>
      {words.map((w, i) => {
        const p = progress(i);
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, opacity: p > 0 ? 1 : 0, ...accent?.[i] }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
}

export const laneColor = (P: Palette, l: Lane) => P.lanes[l]!;
