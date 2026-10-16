// S13 montage: the twelve vignettes, each drawn at product scale (the scene scales them up).
// Every vignette is a pure function of `t`, the frame inside its 30-frame cut (0 on the cut).
// Copy and layout come from ../dev-null.sh/resources/js (commit-card, commit-composer,
// secret-warning, commit-poll, code-block, user-search-dialog, link-embed,
// notification/index, error, commit-feed).
import type { CSSProperties, ReactNode } from 'react';
import { clamp01, easeInOut, easeOut, expoOut, nodeIn, pulse, ramp, spring } from '../lib/motion';
import { typedCount } from '../lib/rand';
import { CAST, TYPING, type Person, type TypeRun } from '../storyboard';
import { BODY_FEATURES, MONO, SANS, type Palette } from '../theme';
import { Avatar, Button, CommitRow, Icon, Identicon, Node } from './kit';

export type VProps = { t: number; P: Palette; F: number };

// ── small helpers ──────────────────────────────────────────────────────────────────────────

/** #rrggbb + alpha → rgba(). */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
/** Mix two #rrggbb colours (k=0 → a). */
const mix = (a: string, b: string, k: number) => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const c = (s: number) => Math.round(((x >> s) & 255) * (1 - k) + ((y >> s) & 255) * k);
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
};

/** Primary button label colour: dark mode's primary-foreground is graphite, light's is white. */
const onPrimary = (P: Palette) => (P.shell === '#111112' ? '#111112' : '#ffffff');

/** Lucide paths not in the kit. */
const PATHS = {
  undo: 'M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11',
  shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z M12 8v4 M12 16h.01',
  replyMsg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z m10 7-3 3 3 3 M17 13v-1a2 2 0 0 0-2-2H7',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
  check: 'M20 6 9 17l-5-5',
  eye: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0 M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
} as const;
function Glyph({ d, size = 16, color, fill = 'none', stroke = 2 }: { d: string; size?: number; color: string; fill?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }}>
      <path d={d} />
    </svg>
  );
}

/** Height collapse/expand without measuring: a one-row grid whose track is `k`fr of its content. */
function Collapse({ k, children, style }: { k: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: `${Math.max(0.0001, k)}fr`, ...style }}>
      <div style={{ minHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

/** The caret: Commit Blue, blinking on the beat. */
const Caret = ({ t, P, h = '1.15em' }: { t: number; P: Palette; h?: string }) => (
  <span style={{ display: 'inline-block', width: 2, height: h, background: P.primary, verticalAlign: 'text-bottom', marginLeft: 1, opacity: Math.floor((t + 3) / 7.5) % 2 === 0 ? 1 : 0 }} />
);

const mono = (size = 13, color?: string): CSSProperties => ({ fontFamily: MONO, fontSize: size, color, fontVariantNumeric: 'tabular-nums' });

const ada: Person = CAST.ada;
const grace: Person = CAST.grace;
const ken: Person = CAST.ken;
const margaret: Person = CAST.margaret;
const dennis: Person = CAST.dennis;
const barbara: Person = CAST.barbara;

const ROW_W = 540;

// ── 1 · undo ───────────────────────────────────────────────────────────────────────────────

export function UndoV({ t, P }: VProps) {
  const pressed = t >= 3 && t < 6 ? 1 : 0;
  const deleting = t >= 6;
  const collapse = ramp(t, 11, 8, easeInOut);
  const toast = spring(t, 15, 14, 0.3);
  const strip: CSSProperties = { marginTop: 12, minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 6, background: alpha(P.destructive, 0.08), padding: '8px 12px', fontSize: 14, lineHeight: 1.45 };
  return (
    <div style={{ position: 'relative', width: ROW_W, height: 330 }}>
      <div style={{ borderTop: `1px solid ${P.hairline}` }}>
        <CommitRow P={P} person={grace} width={ROW_W} time="4m" hash="b41c0de" body="Reading the diff before approving it. Novel." above={P.rail} below={P.lanes[1]} bare />
        <Collapse k={1 - collapse} style={{ opacity: 1 - collapse }}>
          <CommitRow
            P={P}
            person={ada}
            width={ROW_W}
            time="1m"
            hash="3f2a91c"
            body="Deploying on a Friday. What could go wrong?"
            above={P.lanes[1]}
            below={P.lanes[3]}
            bare
            extra={
              deleting ? (
                <div style={{ ...strip, ...mono(14, P.muted) }}>rm 3f2a91c → /dev/null</div>
              ) : (
                <div style={strip}>
                  <span style={{ marginRight: 'auto' }}>Delete this commit? You can undo for 30 seconds.</span>
                  <Button P={P} variant="ghost" height={32} fontSize={14}>
                    Cancel
                  </Button>
                  <Button P={P} variant="destructive" height={32} fontSize={14} pressed={pressed}>
                    Delete
                  </Button>
                </div>
              )
            }
          />
        </Collapse>
        <CommitRow P={P} person={ken} width={ROW_W} time="9m" hash="e19a7b2" body="Rewrote the tokenizer. Again." above={collapse > 0.5 ? P.lanes[1] : P.lanes[3]} below={P.lanes[2]} bare />
      </div>
      {/* sonner toast, bottom of the viewport */}
      <div
        style={{
          position: 'absolute',
          left: (ROW_W - 380) / 2,
          top: 200,
          width: 380,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 16px',
          borderRadius: 8,
          background: P.popover,
          border: `1px solid ${P.hairline}`,
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
          fontFamily: SANS,
          color: P.ink,
          opacity: clamp01(toast * 3),
          transform: `translateY(${(1 - toast) * 40}px) scale(${0.96 + 0.04 * toast})`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Commit deleted.</div>
          <div style={{ ...mono(12, P.muted), marginTop: 2 }}>3f2a91c · 30s to undo</div>
        </div>
        <Button P={P} variant="outline" height={32} fontSize={14} pressed={t >= 25 && t < 28 ? 1 : 0}>
          <Glyph d={PATHS.undo} size={14} color={P.ink} />
          Undo
        </Button>
      </div>
    </div>
  );
}

// ── shared: the composer ──────────────────────────────────────────────────────────────────

function Composer({ P, person, body, filled, footerLeft, caret, width = ROW_W, bodyNode, warning, pressed = 0 }: { P: Palette; person: Person; body: string; filled: boolean; footerLeft?: ReactNode; caret?: ReactNode; width?: number; bodyNode?: ReactNode; warning?: ReactNode; pressed?: number }) {
  const lc = P.lanes[person.lane]!;
  const remaining = 280 - [...body].length;
  return (
    <div style={{ display: 'flex', width, background: P.surface, fontFamily: SANS, color: P.ink, borderBottom: `1px solid ${P.hairline}` }}>
      <div style={{ position: 'relative', width: 72, flex: 'none' }}>
        <div style={{ position: 'absolute', left: 35, top: 64, bottom: 0, borderLeft: `2px dashed ${P.rail}` }} />
        <div style={{ position: 'absolute', left: 36 - 24, top: 10 }}>
          <Avatar person={person} size={40} P={P} ring dashed={!filled} ringColor={lc} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 12px 0' }}>
        <div style={{ minHeight: warning ? 0 : 92, fontSize: 17, lineHeight: 1.375, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFeatureSettings: BODY_FEATURES, paddingTop: 8 }}>
          {bodyNode ?? (body ? body : <span style={{ color: P.muted }}>What did you ship?</span>)}
          {caret}
        </div>
        {warning}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="image" size={20} color={P.muted} />
            <Icon name="chart" size={20} color={P.muted} />
            <Glyph d={PATHS.eye} size={20} color={P.muted} />
            {footerLeft}
          </div>
          <span style={mono(13, P.muted)}>{remaining}</span>
          <Button P={P} height={36} fontSize={14} pressed={pressed} style={{ minWidth: 120, color: onPrimary(P), opacity: filled ? 1 : 0.5 }}>
            Commit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── 2 · stash ──────────────────────────────────────────────────────────────────────────────

const STASH = 'Half-written thought: our monorepo builds take eleven minutes because';
export function StashV({ t, P }: VProps) {
  const restored = t >= 4;
  const k = spring(t, 4, 12, 0.2);
  const label = spring(t, 8, 14, 0.4);
  return (
    <div style={{ width: ROW_W, borderTop: `1px solid ${P.hairline}` }}>
      <Composer
        P={P}
        person={ada}
        body={restored ? STASH : ''}
        filled={restored}
        bodyNode={restored ? <span style={{ opacity: clamp01(k * 2), display: 'inline' }}>{STASH}</span> : undefined}
        caret={<Caret t={t} P={P} />}
        footerLeft={
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...mono(13, P.muted), opacity: clamp01(label * 2), transform: `translateX(${(1 - label) * -14}px)`, marginLeft: 4 }}>
            <span>{'stash@{0}'}</span>
            <span style={{ padding: '0 4px', textDecoration: 'underline', textDecorationColor: P.rail, textUnderlineOffset: 3 }}>drop</span>
          </span>
        }
      />
      <CommitRow P={P} person={grace} width={ROW_W} time="6m" hash="4d1e2aa" body="Turned off the flaky test. It was flaky about being turned off." above={P.rail} below={P.lanes[1]} bare />
    </div>
  );
}

// ── 3 · secrets ────────────────────────────────────────────────────────────────────────────

const AMBER = { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' };
export function SecretsV({ t, P }: VProps) {
  const detect = ramp(t, 1, 6);
  const dlg = spring(t, 5, 14, 0.3);
  const focus = t >= 17;
  const remove = t >= 22 && t < 25 ? 1 : 0;
  const key = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
  return (
    <div style={{ position: 'relative', width: 620, height: 440 }}>
      <div style={{ borderTop: `1px solid ${P.hairline}`, opacity: 1 - 0.6 * clamp01(dlg * 2) }}>
        <Composer
          P={P}
          person={ada}
          width={620}
          body={`Finally fixed the deploy script.\n${key}`}
          filled
          bodyNode={
            <>
              Finally fixed the deploy script.{'\n'}
              <span style={{ background: alpha(AMBER[500], 0.22 * detect), borderRadius: 3, boxShadow: `0 0 0 2px ${alpha(AMBER[500], 0.22 * detect)}` }}>{key}</span>
            </>
          }
          footerLeft={null}
          pressed={t >= 3 && t < 6 ? 1 : 0}
          warning={
            <div style={{ margin: '8px 0', borderRadius: 6, border: `1px solid ${alpha(AMBER[600], 0.3)}`, background: alpha(AMBER[500], 0.08), padding: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <Glyph d={PATHS.shield} size={16} color={AMBER[400]} />
                Possible secret detected
              </div>
              <div style={{ marginTop: 4, color: P.muted, lineHeight: 1.45 }}>Checked on your device. This draft won't be saved while it contains a detected secret.</div>
            </div>
          }
        />
      </div>
      {/* the confirm dialog */}
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 212,
          width: 560,
          padding: 24,
          borderRadius: 10,
          background: P.popover,
          border: `1px solid ${P.hairline}`,
          boxShadow: '0 24px 48px -16px rgba(0,0,0,0.6)',
          fontFamily: SANS,
          color: P.ink,
          opacity: clamp01(dlg * 4),
          transform: `scale(${0.95 + 0.05 * dlg})`,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Publish possible secrets?</div>
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: P.muted }}>This text may contain credentials. Remove them before publishing, or continue only if these are safe examples.</div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button P={P} variant="ghost" height={36} fontSize={14}>
            Keep editing
          </Button>
          <Button P={P} variant="outline" height={36} fontSize={14} pressed={remove} style={{ boxShadow: focus ? `0 0 0 3px ${alpha(P.primary, 0.5)}` : 'none', background: focus ? P.wash : P.shell }}>
            Remove secrets
          </Button>
          <Button P={P} variant="destructive" height={36} fontSize={14}>
            Publish anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── 4 · poll ───────────────────────────────────────────────────────────────────────────────

const POLL = [
  { label: 'Spaces', share: 46, voted: true },
  { label: 'Tabs', share: 31 },
  { label: 'Vim', share: 15 },
  { label: 'Emacs', share: 8 },
];
export function PollV({ t, P }: VProps) {
  const k = (i: number) => expoOut(clamp01((t - 2 - i * 1.5) / 16));
  const votes = Math.round(812 * easeOut(clamp01((t - 2) / 18)));
  return (
    <div style={{ width: ROW_W, borderTop: `1px solid ${P.hairline}` }}>
      <CommitRow
        P={P}
        person={margaret}
        width={ROW_W}
        time="1d"
        hash="5e771ed"
        body="Settle it. One answer, no essays."
        above={P.rail}
        below={P.lanes[0]}
        stars={64}
        extra={
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POLL.map((o, i) => {
                const share = Math.round(o.share * k(i));
                return (
                  <div key={o.label} style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, border: `1px solid ${P.hairline}`, padding: '8px 12px', fontSize: 15 }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${o.share * k(i)}%`, background: o.voted ? P.primarySoft : P.wash }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1, fontWeight: o.voted ? 500 : 400, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {o.label}
                        {o.voted ? <Glyph d={PATHS.check} size={16} color={P.primary} /> : null}
                      </span>
                      <span style={mono(13, P.ink)}>{share}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, ...mono(13, P.muted) }}>{votes} votes · 2d left</div>
          </div>
        }
      />
    </div>
  );
}

// ── 5 · code ───────────────────────────────────────────────────────────────────────────────

type Tok = { s: string; c?: 'kw' | 'prop' | 'num' };
const CODE: Tok[] = [
  { s: 'git', c: 'kw' }, { s: ' rebase ' }, { s: '-i', c: 'prop' }, { s: ' HEAD~' }, { s: '3', c: 'num' }, { s: ' ' }, { s: '&&', c: 'kw' },
  { s: ' git', c: 'kw' }, { s: ' push ' }, { s: '--force-with-lease', c: 'prop' },
];
export function CodeV({ t, P }: VProps) {
  // tempest/highlight colours from app.css: keyword → primary, property → lane-3, number → lane-0.
  const col = { kw: P.primary, prop: P.lanes[3]!, num: P.lanes[0]! };
  let x = 0;
  const hover = t >= 14;
  const copied = t >= 20;
  const pop = spring(t, 20, 12, 0.5);
  return (
    <div style={{ width: 600, borderTop: `1px solid ${P.hairline}` }}>
      <CommitRow
        P={P}
        person={ken}
        width={600}
        time="12m"
        hash="a17c9f0"
        body="Before you push on a Friday:"
        above={P.rail}
        below={P.lanes[2]}
        stars={23}
        extra={
          <div style={{ position: 'relative', margin: '8px 0', borderRadius: 6, border: `1px solid ${P.hairline}`, background: alpha(P.wash, 0.6) }}>
            <pre style={{ margin: 0, padding: '10px 12px', fontFamily: MONO, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre', color: P.ink }}>
              {CODE.map((tok, i) => {
                const start = x;
                x += tok.s.length;
                const lit = tok.c ? clamp01((t - 1 - start * 0.22) / 3) : 0;
                return (
                  <span key={i} style={{ color: tok.c ? mix(P.ink, col[tok.c], lit) : P.ink }}>
                    {tok.s}
                  </span>
                );
              })}
            </pre>
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'grid', placeItems: 'center' }}>
              <span style={{ gridArea: '1/1', borderRadius: 3, background: P.wash, padding: '0 6px', ...mono(11, P.muted), opacity: hover ? 0 : 1 }}>bash</span>
              <span style={{ gridArea: '1/1', width: 28, height: 28, borderRadius: 6, background: P.wash, display: 'grid', placeItems: 'center', opacity: hover ? 1 : 0 }}>
                <span style={{ transform: `scale(${copied ? 0.6 + 0.4 * pop : 1})` }}>
                  <Glyph d={copied ? PATHS.check : PATHS.copy} size={14} color={copied ? P.ink : P.muted} />
                </span>
              </span>
            </div>
          </div>
        }
      />
    </div>
  );
}

// ── 6 · series ─────────────────────────────────────────────────────────────────────────────

const SERIES = ['A thread on how we cut our build in half (1/3)', 'First, we cached the dependencies between runs (2/3)', 'Then we split the slowest suite across four workers (3/3)'];
export function SeriesV({ t, P }: VProps) {
  const lc = P.lanes[0]!;
  return (
    <div style={{ width: ROW_W, height: 300, borderTop: `1px solid ${P.hairline}` }}>
      {SERIES.map((body, i) => {
        const at = i * 5;
        const k = i === 0 ? 1 : expoOut(clamp01((t - at + 1) / 8));
        return (
          <Collapse key={i} k={k}>
            <div style={{ transform: `translateY(${(1 - k) * -20}px)`, opacity: clamp01(k * 1.6) }}>
              <CommitRow
                P={P}
                person={margaret}
                width={ROW_W}
                time="3h"
                hash={['c4b1e07', '8d02f3a', '19ae6c4'][i]!}
                body={body}
                above={i === 0 ? P.rail : lc}
                below={lc}
                nodeScale={i === 0 ? 1 : nodeIn(t, at)}
                pill={
                  <span style={{ alignSelf: 'center', borderRadius: 999, background: P.primarySoft, padding: '1px 8px', ...mono(12, P.primary) }}>
                    {i + 1}/3
                  </span>
                }
                bare
              />
            </div>
          </Collapse>
        );
      })}
    </div>
  );
}

// ── 7 · search (⌘K) ────────────────────────────────────────────────────────────────────────

/** Typing run for "gra". Uses the storyboard's run when the integrator adds it (so the score clicks). */
const SEARCH_RUN: TypeRun = (TYPING as unknown as Record<string, TypeRun>).montageSearch ?? { from: [36, 1.25], to: [36, 1.75], text: 'gra', seed: 6 };
const graham: Person = { handle: 'gstroustrup', name: 'Graham Stroustrup', lane: 5, bio: 'Undefined behaviour enthusiast.' };
export function SearchV({ t, P, F }: VProps) {
  const n = typedCount(SEARCH_RUN, F);
  const q = SEARCH_RUN.text.slice(0, n);
  const results = t >= 13;
  const r = (i: number) => expoOut(clamp01((t - 13 - i * 2) / 8));
  const open = spring(t, -3, 12, 0.2);
  const users = [grace, graham];
  const enter = t >= 24 && t < 27;
  return (
    <div
      style={{
        width: 576,
        borderRadius: 12,
        overflow: 'hidden',
        background: P.popover,
        border: `1px solid ${P.hairline}`,
        boxShadow: '0 24px 48px -16px rgba(0,0,0,0.6)',
        fontFamily: SANS,
        color: P.ink,
        transform: `scale(${0.95 + 0.05 * open})`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 56, borderBottom: `1px solid ${P.hairline}` }}>
        <Icon name="search" size={20} color={P.muted} />
        <div style={{ flex: 1, fontSize: 17 }}>
          {q ? q : null}
          <Caret t={t} P={P} h="1.2em" />
          {!q ? <span style={{ color: P.muted, marginLeft: -2 }}>Search by name or @handle</span> : null}
        </div>
        <span style={{ borderRadius: 4, border: `1px solid ${P.hairline}`, borderBottomWidth: 2, background: P.wash, padding: '1px 6px', ...mono(12, P.muted) }}>esc</span>
      </div>
      {results ? (
        <div style={{ padding: 8 }}>
          {users.map((u, i) => (
            <div key={u.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: i === 0 ? P.wash : 'transparent', opacity: clamp01(r(i) * 2), transform: `translateY(${(1 - r(i)) * 10}px)` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flex: 'none' }}>
                <Identicon handle={u.handle} size={36} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...mono(13, P.muted) }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.lanes[u.lane], alignSelf: 'center' }} />@{u.handle}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: P.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bio}</div>
              </div>
              <span style={{ ...mono(12, i === 0 && enter ? P.ink : P.muted), opacity: i === 0 ? 1 : 0 }}>↵</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 14, color: P.muted }}>{q ? 'Searching…' : 'Type a name or @handle.'}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px', borderTop: `1px solid ${P.hairline}`, background: alpha(P.wash, 0.4), fontSize: 12, color: P.muted }}>
        <span>
          <span style={{ fontFamily: MONO }}>↑↓</span> to move
        </span>
        <span>
          <span style={{ fontFamily: MONO }}>↵</span> to open
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <span style={{ fontFamily: MONO }}>⌘K</span> anywhere
        </span>
      </div>
    </div>
  );
}

// ── 8 · link embeds (asciinema) ─────────────────────────────────────────────────────────────

/** lucide code-xml / play / pause. */
const EMBED_PATHS = {
  code: 'm18 16 4-4-4-4 M6 8l-4 4 4 4 M14.5 4l-5 16',
  play: 'M6 3l14 9-14 9V3z',
  pause: 'M14 4h4v16h-4z M6 4h4v16H6z',
};
/** The recording: `git bisect run`, one line every few frames once the player opens. */
const CAST_LINES: { s: string; at: number; strong?: boolean }[] = [
  { s: '$ git bisect run ./test.sh', at: 8 },
  { s: "running './test.sh'", at: 13 },
  { s: 'Bisecting: 6 revisions left to test after this (roughly 3 steps)', at: 15 },
  { s: 'Bisecting: 3 revisions left to test after this (roughly 2 steps)', at: 18 },
  { s: 'Bisecting: 1 revision left to test after this (roughly 1 step)', at: 21 },
  { s: 'b41c0de is the first bad commit', at: 24, strong: true },
  { s: 'bisect found first bad commit', at: 26 },
];
const PLAYER_H = 176;

/** components/link-embed.tsx: a code embed (asciinema, fixed height) is a card until clicked, then the player. */
export function EmbedsV({ t, P }: VProps) {
  const click = 5;
  const playing = t >= click;
  const open = expoOut(clamp01((t - click) / 7));
  const hover = t >= 1.5 && !playing;
  const pressed = t >= 3.5 && t < click ? 1 : 0;
  const card = 96; // my-2 + size-20 thumbnail
  const cmd = CAST_LINES[0]!.s;
  const typed = Math.round(clamp01((t - 8) / 4) * (cmd.length - 2)) + 2;
  const progress = clamp01((t - click) / 26);
  const termBg = '#121314';
  return (
    <div style={{ width: ROW_W, borderTop: `1px solid ${P.hairline}` }}>
      <CommitRow
        P={P}
        person={dennis}
        width={ROW_W}
        time="8m"
        hash="5e0f1a7"
        body={
          <>
            Found it in four steps. Recording:{' '}
            <span style={{ color: P.primary }}>asciinema.org/a/649218</span>
          </>
        }
        above={P.rail}
        below={P.lanes[4]}
        stars={37}
        extra={
          <div style={{ position: 'relative', marginTop: 12, borderRadius: 8, border: `1px solid ${P.hairline}`, overflow: 'hidden', height: card + (PLAYER_H - card) * open }}>
            {/* the card: thumbnail with the code icon, provider and title */}
            <div style={{ position: 'absolute', inset: 0, height: card, display: 'flex', alignItems: 'center', background: hover ? P.wash : 'transparent', opacity: 1 - clamp01(open * 2.5), transform: `scale(${1 - 0.015 * pressed})` }}>
              <div style={{ position: 'relative', margin: '8px 0 8px 8px', width: 80, height: 80, borderRadius: 6, overflow: 'hidden', background: termBg, flex: 'none' }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ position: 'absolute', left: 8, top: 10 + i * 12, height: 4, width: [44, 30, 58, 52, 22][i], borderRadius: 1, background: i === 0 ? '#ececec' : '#55565a', opacity: 0.8 }} />
                ))}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center' }}>
                  <Glyph d={EMBED_PATHS.code} size={28} color="#ffffff" />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1, padding: '8px 12px' }}>
                <div style={mono(13, P.muted)}>asciinema</div>
                <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.375 }}>git bisect, start to finish</div>
              </div>
            </div>
            {/* the player */}
            {playing ? (
              <div style={{ position: 'absolute', inset: 0, height: PLAYER_H, background: termBg, opacity: clamp01(open * 2), display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, padding: '10px 12px 0', fontFamily: MONO, fontSize: 11, lineHeight: '16px', color: '#cfcfd2', whiteSpace: 'pre', overflow: 'hidden' }}>
                  {CAST_LINES.map((l, i) =>
                    t >= l.at ? (
                      <div key={i} style={{ color: l.strong ? '#ffffff' : i === 0 ? '#ececec' : '#a1a1a6', fontWeight: l.strong ? 600 : 400 }}>
                        {i === 0 ? cmd.slice(0, typed) : l.s}
                        {i === 0 && t < 13 ? <span style={{ display: 'inline-block', width: 6, height: 12, background: '#cfcfd2', verticalAlign: 'text-bottom', marginLeft: 1 }} /> : null}
                      </div>
                    ) : null,
                  )}
                  {t >= 26 ? <span style={{ display: 'inline-block', width: 6, height: 12, background: '#cfcfd2', opacity: Math.floor(t / 3) % 2 ? 0 : 1 }} /> : null}
                </div>
                {/* control bar */}
                <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', background: 'rgba(255,255,255,0.04)', borderTop: '1px solid #2a2a2d' }}>
                  <Glyph d={t < 27 ? EMBED_PATHS.pause : EMBED_PATHS.play} size={12} color="#ececec" fill="#ececec" stroke={1} />
                  <span style={mono(11, '#a1a1a6')}>00:{String(Math.min(40, Math.floor(progress * 40))).padStart(2, '0')}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#36363a', overflow: 'hidden' }}>
                    <div style={{ width: `${100 * progress}%`, height: '100%', background: '#ececec' }} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

// ── 9 · notifications ──────────────────────────────────────────────────────────────────────

function NotifRow({ P, icon, iconColor, isNew, actors, time, sentence, below, scale = 1, pulseRing, avatarK = () => 1 }: { P: Palette; icon: ReactNode; iconColor: string; isNew?: boolean; actors: Person[]; time: string; sentence: ReactNode; below?: ReactNode; scale?: number; pulseRing?: { scale: number; opacity: number }; avatarK?: (i: number) => number }) {
  void iconColor;
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ position: 'relative', width: 64, flex: 'none' }}>
        <div style={{ position: 'absolute', left: 31, top: 0, bottom: 0, width: 2, background: P.rail }} />
        <div style={{ position: 'absolute', left: 32 - 18, top: 14, width: 36, height: 36, transform: `scale(${scale})` }}>
          {pulseRing && pulseRing.opacity > 0 ? <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${P.primary}`, opacity: pulseRing.opacity * 1.6, transform: `scale(${1 + (pulseRing.scale - 1) * 0.45})` }} /> : null}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${isNew ? P.primary : P.rail}`, background: P.surface, display: 'grid', placeItems: 'center' }}>{icon}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, borderBottom: `1px solid ${P.hairline}`, padding: '12px 16px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 40, gap: 8 }}>
          <span style={{ display: 'flex' }}>
            {actors.map((a, i) => (
              <span key={a.handle} style={{ position: 'relative', zIndex: actors.length - i, marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: `0 0 0 2px ${P.surface}`, overflow: 'hidden', width: 32, height: 32, transform: `scale(${avatarK(i)})` }}>
                <Identicon handle={a.handle} size={32} />
              </span>
            ))}
          </span>
          <span style={{ marginLeft: 'auto', ...mono(13, P.muted) }}>{time}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.5 }}>{sentence}</div>
        {below}
      </div>
    </div>
  );
}
export function NotificationsV({ t, P }: VProps) {
  const k = expoOut(clamp01((t - 3) / 9));
  const node = nodeIn(t, 5);
  const star = spring(t, 9, 12, 0.6);
  const tabs = ['All', 'Replies', 'Quotes', 'Stars', 'Mentions'];
  return (
    <div style={{ width: ROW_W, height: 430, fontFamily: SANS, color: P.ink }}>
     <div style={{ background: P.surface, borderTop: `1px solid ${P.hairline}` }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', fontWeight: 600, fontSize: 16 }}>Notifications</div>
      <div style={{ display: 'flex', padding: '0 12px', borderBottom: `1px solid ${P.hairline}` }}>
        {tabs.map((tab, i) => (
          <span key={tab} style={{ position: 'relative', padding: '12px 12px', fontSize: 15, fontWeight: 500, color: i === 0 ? P.ink : P.muted }}>
            {tab}
            {i === 0 ? <span style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 3, background: P.primary }} /> : null}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: 64 }}>
          <div style={{ position: 'absolute', left: 31, top: 16, bottom: 0, width: 2, background: P.rail }} />
        </div>
        <div style={{ flex: 1, borderBottom: `1px solid ${P.hairline}`, padding: '8px 0', ...mono(12, P.muted) }}>Today</div>
      </div>
      <Collapse k={k}>
        <div style={{ opacity: clamp01(k * 1.5) }}>
          <NotifRow
            P={P}
            isNew
            scale={node}
            pulseRing={pulse(t, 5)}
            icon={
              <span style={{ transform: `scale(${1 + 0.35 * Math.sin(Math.PI * clamp01((t - 9) / 8))}) rotate(${-12 * Math.sin(Math.PI * clamp01((t - 9) / 8))}deg)`, display: 'block' }}>
                <Icon name="star" size={16} color={P.lanes[1]!} fill={star > 0.1 ? P.lanes[1]! : 'none'} />
              </span>
            }
            iconColor={P.lanes[1]!}
            actors={[grace, barbara, dennis]}
            avatarK={(i) => spring(t, 6 + i * 2, 12, 0.4)}
            time="2m"
            sentence={
              <>
                <b style={{ fontWeight: 600 }}>Grace Ritchie</b> and 2 others starred your commit
              </>
            }
            below={<div style={{ marginTop: 8, borderRadius: 8, border: `1px solid ${P.hairline}`, padding: '8px 12px', color: P.muted, fontSize: 15 }}>Shipped the parser benchmark. 3.2× faster.</div>}
          />
        </div>
      </Collapse>
      <NotifRow
        P={P}
        icon={<Glyph d={PATHS.replyMsg} size={16} color={P.lanes[2]!} />}
        iconColor={P.lanes[2]!}
        actors={[ken]}
        time="14m"
        sentence={
          <>
            <b style={{ fontWeight: 600 }}>Ken Lovelace</b> <span style={mono(13, P.muted)}>@kenl</span> replied to your commit
          </>
        }
        below={<div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.625 }}>Nice. What changed in the tokenizer?</div>}
      />
     </div>
    </div>
  );
}

// ── 10 · 429 error page ────────────────────────────────────────────────────────────────────

export function RateLimitV({ t, P }: VProps) {
  const lane = P.lanes[3]!;
  const drop = spring(t, 2, 16, 0.55);
  const words = 'Slow down.'.split(' ');
  const btn = spring(t, -2, 14, 0.3);
  return (
    <div style={{ width: 640, fontFamily: SANS, color: P.ink }}>
      {/* node + wordmark */}
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: 64, flex: 'none' }}>
          <div style={{ position: 'absolute', left: 31, top: 14, height: 70 * clamp01(t / 8 + 0.4), width: 2, background: `linear-gradient(${lane} 40%, transparent)` }} />
          <div style={{ position: 'absolute', left: 32 - 9, top: 14 - 9 }}>
            <Node size={18} color={lane} P={P} ring={2} gapColor={P.shell} />
          </div>
        </div>
        <div style={{ paddingBottom: 56, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>
          <svg width={22} height={22} viewBox="1.6 1.5 45 45" style={{ display: 'block' }}>
            <path d="M2 42h10L26 6H16Z" fill={P.ink} />
            <path fillRule="evenodd" clipRule="evenodd" d="M17.81 43.5h13.22L46.19 4.5H32.97ZM22.19 40.5l12.84-33h6.78l-12.84 33Z" fill={P.lanes[0]} />
          </svg>
          <span>
            /dev<span style={{ color: 'transparent', WebkitTextStroke: `1px ${P.lanes[0]}` }}>/</span>null
          </span>
        </div>
      </div>
      {/* dangling hollow node + copy */}
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: 64, flex: 'none' }}>
          <div style={{ position: 'absolute', left: 32 - 9, top: 10 - 9, transform: `translateY(${(1 - drop) * -26}px) rotate(${(1 - drop) * 40}deg)` }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${P.muted}`, background: P.shell }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={mono(13, P.muted)}>error: RPC failed; HTTP 429 Too Many Requests</div>
          <div style={{ marginTop: 16, display: 'flex', gap: '0.26em', fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {words.map((w, i) => {
              const p = easeOut((t + 5 - i * 2) / 7);
              return (
                <span key={w} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em' }}>
                  <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{w}</span>
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 12, maxWidth: '42ch', fontSize: 18, lineHeight: 1.5, color: P.muted }}>You've sent too many requests in a short time. Wait a little while, then try again.</div>
          <div style={{ marginTop: 32, opacity: clamp01(btn * 2), transform: `translateY(${(1 - btn) * 10}px)` }}>
            <Button P={P} height={40} fontSize={14} style={{ color: onPrimary(P) }}>
              Back to your log
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 11 · HEAD@{last visit} ─────────────────────────────────────────────────────────────────

export function LastVisitV({ t, P }: VProps) {
  const open = expoOut(clamp01((t - 2) / 10));
  const slide = expoOut(clamp01((t - 5) / 10));
  const line = easeInOut(clamp01((t - 8) / 12));
  const markerLane = P.lanes[5]!; // Barbara's segment runs through the marker
  return (
    <div style={{ width: ROW_W, borderTop: `1px solid ${P.hairline}` }}>
      <CommitRow P={P} person={dennis} width={ROW_W} time="3m" hash="a5d9e03" body="It was DNS." above={P.rail} below={P.lanes[4]} bare />
      <CommitRow P={P} person={barbara} width={ROW_W} time="20m" hash="62b0f1e" body="Types are documentation the compiler checks." above={P.lanes[4]} below={P.lanes[5]} bare />
      <Collapse k={open}>
        <div style={{ display: 'flex', background: P.surface }}>
          <div style={{ position: 'relative', width: 72, flex: 'none' }}>
            <div style={{ position: 'absolute', left: 35, top: 0, bottom: 0, width: 2, background: markerLane }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 10px 0', borderBottom: `1px solid ${P.hairline}` }}>
            <span style={{ ...mono(13, P.muted), transform: `translateX(${(1 - slide) * -60}px)`, opacity: clamp01(slide * 2) }}>{'HEAD@{last visit}'}</span>
            <span style={{ flex: 1, height: 0, borderTop: `1px dashed ${P.rail}`, transform: `scaleX(${line})`, transformOrigin: 'left' }} />
          </div>
        </div>
      </Collapse>
      <CommitRow P={P} person={grace} width={ROW_W} time="5h" hash="0d7e5b3" body="Read the RFC so you don't have to. You still have to." above={P.lanes[5]} below={P.lanes[1]} bare />
      <CommitRow P={P} person={ken} width={ROW_W} time="7h" hash="e19a7b2" body="Rewrote the tokenizer. Again." above={P.lanes[1]} below={P.lanes[2]} bare />
    </div>
  );
}

// ── 12 · /api/v1 + jq ──────────────────────────────────────────────────────────────────────

const JSON_OUT: [string, string?][] = [
  ['{'],
  ['  "short_hash": ', '"7f3a9c1",'],
  ['  "body": ', '"Shipped the parser benchmark. 3.2× faster."'],
  ['}'],
  ['{'],
  ['  "short_hash": ', '"0be0130",'],
  ['  "body": ', '"hello world"'],
  ['}'],
];
export function ApiV({ t, P }: VProps) {
  const lines = Math.floor(clamp01((t - 1) / 12) * JSON_OUT.length + 0.001);
  const done = lines >= JSON_OUT.length;
  return (
    <div style={{ width: 1180, borderRadius: 14, overflow: 'hidden', background: P.surface, border: `1px solid ${P.hairline}`, boxShadow: '0 30px 80px -30px rgba(0,0,0,0.6)' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: `1px solid ${P.hairline}`, background: P.popover }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ flex: 1, textAlign: 'center', marginRight: 52, ...mono(14, P.muted) }}>zsh</span>
      </div>
      <div style={{ padding: '22px 28px', fontFamily: MONO, fontSize: 26, lineHeight: 1.55, color: P.ink, whiteSpace: 'pre', minHeight: 480 }}>
        <div>
          <span style={{ color: P.muted }}>$ </span>curl -s https://dev-null.sh/api/v1/users/{ada.handle}/commits \
        </div>
        <div>{"    | jq '.data[] | {short_hash, body}'"}</div>
        {JSON_OUT.slice(0, lines).map(([k, v], i) => (
          <div key={i}>
            <span style={{ color: v ? P.muted : P.ink, fontWeight: v ? 400 : 500 }}>{k}</span>
            {v ? <span>{v}</span> : null}
          </div>
        ))}
        {done ? (
          <div>
            <span style={{ color: P.muted }}>$ </span>
            <span style={{ display: 'inline-block', width: '0.55em', height: '1.1em', verticalAlign: 'text-bottom', background: P.primary, opacity: Math.floor(t / 7.5) % 2 === 0 ? 1 : 0 }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
