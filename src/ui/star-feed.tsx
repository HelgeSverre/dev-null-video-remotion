// Product-faithful log pieces for S09–S12 (star, terminal, profile, keys): the commit row as
// commit-card.tsx draws it (72px rail, 48px ringed avatar node centred 32px down, ThreadActions
// row), compact reply rows with the dashed lane elbows of commit-thread.tsx, and the quoted-commit
// embed. Everything is in product pixels; scenes scale a wrapper. Pure: all motion comes in as props.
import type { CSSProperties, ReactNode } from 'react';
import type { Person } from '../storyboard';
import { BODY_FEATURES, MONO, SANS, type Palette } from '../theme';
import { Avatar, Icon, type IconName } from './kit';

// ── extra lucide icons (24-unit viewBox) ────────────────────────────────────────────────────
const EXTRA: Record<string, string> = {
  messageReply: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z M10 8l-3 3 3 3 M17 14v-1a2 2 0 0 0-2-2H7',
  chevronDown: 'm6 9 6 6 6-6',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  maximize: 'M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3',
  award: 'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526 M12 8m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  monitor: 'M2 3h20v14H2z M8 21h8 M12 17v4',
  circleCheck: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M9 12l2 2 4-4',
  gitBranch: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  server: 'M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z M6 6h.01 M6 18h.01',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12',
  shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
  gitMerge: 'M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M6 21V9a9 9 0 0 0 9 9',
  chevronRight: 'm9 18 6-6-6-6',
  link2: 'M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 1 1 0 10h-2 M8 12h8',
  externalLink: 'M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  fileCode: 'M10 12.5 8 15l2 2.5 M14 12.5l2 2.5-2 2.5 M14 2v4a2 2 0 0 0 2 2h4 M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z',
};
export type GlyphName = IconName | keyof typeof EXTRA;

export function Glyph({ name, size = 16, color, fill = 'none', stroke = 2, style }: { name: GlyphName; size?: number; color: string; fill?: string; stroke?: number; style?: CSSProperties }) {
  const d = EXTRA[name as string];
  if (!d) return <span style={{ display: 'inline-flex', ...style }}><Icon name={name as IconName} size={size} color={color} fill={fill} stroke={stroke} /></span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none', ...style }}>
      <path d={d} />
    </svg>
  );
}

// ── geometry (product px) ──────────────────────────────────────────────────────────────────
export const FEED_RAIL = 72; // sm:w-18
export const NODE_Y = 32; // top-8, node centred
export const NODE = 48; // 40px avatar + 2px pad + 2px ring

export type StarState = {
  starred: boolean;
  count: number;
  /** star-pop progress 0..1 (scale 1 → 1.35 + −12° → 1). */
  pop?: number;
  /** 0..1 roll of the count digit after a tick. */
  tick?: number;
  /** 0..1 hover/press wash behind the button (the click). */
  press?: number;
};

/** star-pop: scale 1 → 1.35 rotate −12° → 1 (app.css), back-out overall. */
export function starPopTransform(p: number) {
  if (p <= 0 || p >= 1) return 'none';
  const k = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5;
  const e = Math.sin((k * Math.PI) / 2);
  return `scale(${1 + 0.35 * e}) rotate(${-12 * e}deg)`;
}

export function StarButton({ P, star, small }: { P: Palette; star: StarState; small?: boolean }) {
  const c = star.starred ? P.primary : P.muted;
  const tick = star.tick ?? 1;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: small ? '2px 8px' : '2px 8px', fontFamily: MONO, fontSize: 13, color: c, borderRadius: 6, background: star.press ? `color-mix(in srgb, ${P.wash} ${Math.round(star.press * 100)}%, transparent)` : 'transparent' }}>
      <span style={{ display: 'inline-flex', transform: starPopTransform(star.pop ?? 1) }}>
        <Glyph name="star" size={16} color={c} fill={star.starred ? c : 'none'} />
      </span>
      <span style={{ minWidth: '1ch', display: 'inline-block', overflow: 'hidden', height: '1.4em', lineHeight: '1.4em', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ display: 'inline-block', transform: `translateY(${(1 - tick) * 70}%)`, opacity: 0.3 + 0.7 * tick }}>{star.count > 0 ? star.count : ''}</span>
      </span>
    </span>
  );
}

const btn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' };

/** commit-thread.tsx ThreadActions: star, Quote, Reply, replies toggle | bookmark, link, report. */
export function ActionRow({ P, star, replies, quote = true, linkCopied, bookmark = true, flag = true }: { P: Palette; star?: StarState; replies?: { count: number; open: number }; quote?: boolean; linkCopied?: boolean; bookmark?: boolean; flag?: boolean }) {
  const open = replies?.open ?? 0;
  return (
    <div style={{ marginTop: 4, marginLeft: -8, display: 'flex', alignItems: 'center', fontFamily: SANS, fontSize: 13, color: P.muted, lineHeight: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {star ? <StarButton P={P} star={star} /> : null}
        {quote ? (
          <span style={btn}>
            <Glyph name="quote" size={16} color={P.muted} />
            Quote
          </span>
        ) : null}
        <span style={btn}>
          <Glyph name="messageReply" size={16} color={P.muted} />
          Reply
        </span>
        {replies && replies.count > 0 ? (
          <span style={{ ...btn, gap: 4, color: P.primary, fontWeight: 500, background: open > 0 && open < 1 ? P.primarySoft : 'transparent' }}>
            <Glyph name="chevronDown" size={16} color={P.primary} style={{ transform: `rotate(${-90 * (1 - open)}deg)` }} />
            {open >= 0.5 ? 'Hide replies' : `${replies.count} ${replies.count === 1 ? 'reply' : 'replies'}`}
          </span>
        ) : null}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
        {bookmark ? <span style={{ padding: 6, display: 'inline-flex' }}><Glyph name="bookmark" size={16} color={P.muted} /></span> : null}
        <span style={{ padding: 6, display: 'inline-flex' }}><Glyph name={linkCopied ? 'check' : 'link'} size={16} color={P.muted} /></span>
        {flag ? <span style={{ padding: 6, display: 'inline-flex' }}><Glyph name="flag" size={16} color={P.muted} /></span> : null}
      </div>
    </div>
  );
}

export type FeedCommitProps = {
  P: Palette;
  person: Person;
  body: ReactNode;
  time: string;
  hash: string;
  width?: number;
  /** Segment above the node (previous author's lane), and the tail below it. */
  above?: string | null;
  tail?: string | null;
  nodeScale?: number;
  pulse?: { scale: number; opacity: number };
  star?: StarState;
  replies?: { count: number; open: number };
  quote?: ReactNode;
  /** Thread content and its current (animated) height; when given it renders in a second row. */
  thread?: ReactNode;
  threadHeight?: number;
  tint?: string;
  bodySize?: number;
  linkCopied?: boolean;
  /** The surface behind the node gap. */
  surface?: string;
  actions?: boolean;
  quoteButton?: boolean;
  /** Show the bookmark and report icons on the right of the action row. */
  icons?: boolean;
};

/** commit-card.tsx, top-level commit on the graph rail. */
export function FeedCommit({ P, person, body, time, hash: h, width = 600, above, tail, nodeScale = 1, pulse, star, replies, quote, thread, threadHeight = 0, tint, bodySize = 15, linkCopied, surface, actions = true, quoteButton = true, icons = true }: FeedCommitProps) {
  const lc = P.lanes[person.lane]!;
  const bg = tint ?? 'transparent';
  const hasThread = thread !== undefined;
  return (
    <div style={{ position: 'relative', width, background: bg, fontFamily: SANS, color: P.ink }}>
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: FEED_RAIL, minHeight: 64, flex: 'none' }}>
          {above ? <div style={{ position: 'absolute', left: FEED_RAIL / 2 - 1, top: 0, height: NODE_Y, width: 2, background: above }} /> : null}
          {tail ? <div style={{ position: 'absolute', left: FEED_RAIL / 2 - 1, top: NODE_Y, bottom: 0, width: 2, background: tail }} /> : null}
          <div style={{ position: 'absolute', left: FEED_RAIL / 2 - NODE / 2, top: NODE_Y - NODE / 2, width: NODE, height: NODE, transform: `scale(${nodeScale})` }}>
            {pulse && pulse.opacity > 0 ? <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: lc, opacity: pulse.opacity, transform: `scale(${pulse.scale})` }} /> : null}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: surface ?? P.surface }} />
            <div style={{ position: 'relative' }}>
              <Avatar person={person} size={40} P={P} ring ringColor={lc} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: hasThread ? '12px 16px 0 0' : '12px 16px 12px 0', borderBottom: hasThread ? 'none' : `1px solid ${P.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 15, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600 }}>{person.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: P.muted }}>@{person.handle}</span>
            <span style={{ color: P.muted }}>·</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: P.muted }}>{time}</span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13, color: P.muted }}>{h}</span>
          </div>
          <div style={{ marginTop: 2, fontSize: bodySize, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{body}</div>
          {quote}
          {actions ? <ActionRow P={P} star={star} replies={replies} linkCopied={linkCopied} quote={quoteButton} bookmark={icons} flag={icons} /> : <div style={{ height: 4 }} />}
        </div>
      </div>
      {hasThread ? (
        <div style={{ display: 'flex' }}>
          <div style={{ position: 'relative', width: FEED_RAIL, flex: 'none' }}>{tail ? <div style={{ position: 'absolute', left: FEED_RAIL / 2 - 1, top: 0, bottom: 0, width: 2, background: tail }} /> : null}</div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 16, borderBottom: `1px solid ${P.hairline}` }}>
            <div style={{ height: threadHeight, overflow: 'visible', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', marginLeft: -40, paddingLeft: 40 }}>{thread}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type Reply = { person: Person; body: string; time: string; stars?: number };

/** commit-thread.tsx root replies: 28px avatars, dashed lane elbow off the rail, dashed links between replies. */
export function Thread({ P, parentLane, replies, reveal }: { P: Palette; parentLane: string; replies: Reply[]; reveal?: (i: number) => number }) {
  return (
    <div style={{ position: 'relative', paddingBottom: 12 }}>
      {replies.map((r, i) => {
        const lane = P.lanes[r.person.lane]!;
        const prev = i > 0 ? P.lanes[replies[i - 1]!.person.lane]! : null;
        const hasNext = i < replies.length - 1;
        const k = reveal ? reveal(i) : 1;
        return (
          <div key={i} style={{ position: 'relative', paddingTop: 10, opacity: k, transform: `translateY(${(1 - k) * -10}px)` }}>
            {prev === null ? (
              <span style={{ position: 'absolute', top: 0, left: -36.5, height: 24, width: 33, borderLeft: `1px dashed ${parentLane}`, borderBottom: `1px dashed ${parentLane}`, borderBottomLeftRadius: 12 }} />
            ) : (
              <span style={{ position: 'absolute', left: 14, top: 0, height: 6, borderLeft: `1px dashed ${prev}` }} />
            )}
            {hasNext ? <span style={{ position: 'absolute', left: 14, top: 42, bottom: 0, borderLeft: `1px dashed ${lane}` }} /> : null}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 'none', width: 28 }}>
                <Avatar person={r.person} size={28} P={P} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 14, lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 600 }}>{r.person.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>@{r.person.handle}</span>
                  <span style={{ color: P.muted }}>·</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>{r.time}</span>
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES, whiteSpace: 'pre-wrap' }}>{r.body}</div>
                <ActionRow P={P} star={{ starred: false, count: r.stars ?? 0 }} quote={false} bookmark={false} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** quoted-commit.tsx: hairline-bordered 8px block, 20px avatar, no lane colour. */
export function QuoteEmbed({ P, person, time, body, style }: { P: Palette; person: Person; time: string; body: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ marginTop: 8, border: `1px solid ${P.hairline}`, borderRadius: 8, padding: '8px 12px', background: P.surface, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, whiteSpace: 'nowrap' }}>
        <Avatar person={person} size={20} P={P} />
        <span style={{ fontWeight: 600 }}>{person.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>@{person.handle}</span>
        <span style={{ color: P.muted }}>·</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>{time}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.625, fontFeatureSettings: BODY_FEATURES, whiteSpace: 'pre-wrap' }}>{body}</div>
    </div>
  );
}

/** The white feed column with hairline sides, drawn behind rows (product px, very tall). */
export function FeedColumn({ P, width = 600, top = -3000, height = 8000 }: { P: Palette; width?: number; top?: number; height?: number }) {
  return <div style={{ position: 'absolute', left: 0, top, width, height, background: P.surface, borderLeft: `1px solid ${P.hairline}`, borderRight: `1px solid ${P.hairline}`, boxSizing: 'border-box' }} />;
}
