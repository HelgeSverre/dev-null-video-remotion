// S10 terminal (bars 21–24): "Commit from your terminal." Dennis types the real one-liner from
// Settings → Terminal into a dark terminal on the light shell; enter on 22.3 prints the server's
// answer (Cli/CommitController: "Committed: <url>"). Two annotations explain what commit.sh does
// (ssh-keygen -Y sign with a key on your GitHub account; no token, no password). On 23.1 the frame
// pans to the GitHub Actions workflow from the same settings page, and on 24.1 the release commit
// it makes lands on the rail above the DNS commit.
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, lerp, nodeIn, pulse, ramp } from '../lib/motion';
import { noise, typedCount } from '../lib/rand';
import { CAST, TYPING } from '../storyboard';
import { Cursor, TerminalWindow, Words } from '../ui/kit';
import { FeedColumn, FeedCommit, Glyph } from '../ui/star-feed';
import { MONO, SANS, type Palette } from '../theme';

// ── terminal geometry (product px inside a 1.4× wrapper) ──
const T_SCALE = 1.4;
const T_X = 110;
const T_Y = 330;
const T_W = 1000;
const T_H = 236;
const FS = 22; // TerminalWindow body font size
const CH = FS * 0.6; // Geist Mono advance
const LH = FS * 1.6;
const PAD_X = 26;
const BODY_Y = 44 + 22; // title bar + body padding
const OUTPUT = 'Committed: https://dev-null.sh/@dham/commits/9c1e2d4';

/** Screen rect of columns [c0, c1) on terminal line `line` (0-based), for underlines/anchors. */
function cols(c0: number, c1: number, line: number) {
  return {
    x0: T_X + T_SCALE * (PAD_X + c0 * CH),
    x1: T_X + T_SCALE * (PAD_X + c1 * CH),
    y: T_Y + T_SCALE * (BODY_Y + (line + 1) * LH - 3),
  };
}
const T_BOTTOM = T_Y + T_SCALE * T_H;

// ── workflow (resources/js/pages/terminal/show.tsx, body kept to one line) ──
const YAML = [
  'name: devnull',
  '',
  'on:',
  '  release:',
  '    types: [published]',
  '',
  'jobs:',
  '  commit:',
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      - uses: nunomaduro/dev-null.sh/.github/actions/commit@production',
  '        with:',
  '          body: Released ${{ github.event.release.name }}.',
  '          ssh-key: ${{ secrets.DEVNULL_SSH_KEY }}',
];
const E_FS = 17;
const E_LH = 26;
const E_TITLE = 44;
const E_PAD = 20;
const E_GUTTER = 44;
const E_W = 820;

function YamlLine({ text, P }: { text: string; P: Palette }) {
  // key: value, with `- ` list markers and ${{ … }} expressions in muted delimiters.
  const m = /^(\s*)(- )?([\w-]+)(:)(.*)$/.exec(text);
  if (!m) return <span>{text || ' '}</span>;
  const [, indent, dash, key, colon, rest] = m;
  const parts = rest!.split(/(\$\{\{|\}\}|\[|\])/);
  return (
    <span>
      {indent}
      {dash ? <span style={{ color: P.muted }}>{dash}</span> : null}
      <span style={{ color: P.ink, fontWeight: 500 }}>{key}</span>
      <span style={{ color: P.muted }}>{colon}</span>
      {parts.map((p, i) => (/^(\$\{\{|\}\}|\[|\])$/.test(p) ? <span key={i} style={{ color: P.muted }}>{p}</span> : <span key={i} style={{ color: '#3d434c' }}>{p}</span>))}
    </span>
  );
}

function Editor({ P, hl }: { P: Palette; hl: { y: number; h: number; o: number } }) {
  return (
    <div style={{ width: E_W, borderRadius: 14, overflow: 'hidden', background: P.surface, border: `1px solid ${P.hairline}`, boxShadow: '0 30px 80px -30px rgba(18,20,23,0.28)' }}>
      <div style={{ height: E_TITLE, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: `1px solid ${P.hairline}`, background: P.shell }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ marginLeft: 14, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 13, color: P.muted }}>
          <Glyph name="fileCode" size={15} color={P.muted} />
          .github/workflows/devnull.yml
        </span>
      </div>
      <div style={{ position: 'relative', padding: `${E_PAD}px 0`, fontFamily: MONO, fontSize: E_FS, lineHeight: `${E_LH}px`, whiteSpace: 'pre', color: P.ink }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: E_PAD + hl.y, height: hl.h, background: P.wash, opacity: hl.o }} />
        {YAML.map((line, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex' }}>
            <span style={{ width: E_GUTTER, textAlign: 'right', paddingRight: 16, color: P.rail, flex: 'none', boxSizing: 'content-box' }}>{i + 1}</span>
            <YamlLine text={line} P={P} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A clean annotation: a dot on the terminal's edge, a hairline leader, sans text. */
function Callout({ P, x, y0, y1, text, k, side }: { P: Palette; x: number; y0: number; y1: number; text: string; k: number; side: 'left' | 'right' }) {
  const lead = clamp01(k * 1.6);
  const txt = easeOut((k - 0.35) / 0.65);
  return (
    <>
      <div style={{ position: 'absolute', left: x - 4, top: y0 - 4, width: 8, height: 8, borderRadius: '50%', background: P.ink, opacity: lead > 0 ? 1 : 0, transform: `scale(${lead})` }} />
      <div style={{ position: 'absolute', left: x - 0.75, top: y0, width: 1.5, height: (y1 - y0) * lead, background: P.muted }} />
      <div
        style={{
          position: 'absolute',
          top: y1 + 18,
          ...(side === 'right' ? { left: x - 2 } : { right: 1920 - x - 2 }),
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 38,
          letterSpacing: '-0.02em',
          color: P.ink,
          whiteSpace: 'nowrap',
          opacity: txt,
          transform: `translateY(${(1 - txt) * 14}px)`,
        }}
      >
        {text}
      </div>
    </>
  );
}

export function Terminal() {
  const { f, F, P, at } = useScene();
  const enter = at([22, 3]);
  const shift = at([23, 1]);
  const land = at([24, 1]);

  // ── A: the terminal ──
  const typed = typedCount(TYPING.termCmd, F);
  const cmd = TYPING.termCmd.text.slice(0, typed);
  const out = f >= enter + 2;
  const c1 = ramp(f, at([22, 1]), 16, (x) => x);
  const c2 = ramp(f, at([22, 3.5]), 16, (x) => x);
  const u1 = cols(42, 49, 0); // "bash -s"
  const u2 = cols(0, 10, 1); // "Committed:"

  // ── the pan on 23.1 ──
  const pan = ramp(f, shift, 22, expoOut);
  const drift = noise(f / 50, 4) * 5;

  // ── B: workflow + rail ──
  const hlStops = [
    { at: at([23, 2]), y: 2 * E_LH, h: 3 * E_LH },
    { at: at([23, 3]), y: 10 * E_LH, h: E_LH },
    { at: at([23, 4]), y: 12 * E_LH, h: 2 * E_LH },
  ];
  let hy = hlStops[0]!.y;
  let hh = hlStops[0]!.h;
  for (let i = 1; i < hlStops.length; i++) {
    const k = ramp(f, hlStops[i]!.at, 9, expoOut);
    hy = lerp(hy, hlStops[i]!.y, k);
    hh = lerp(hh, hlStops[i]!.h, k);
  }
  const hlO = ramp(f, hlStops[0]!.at, 6) * (1 - 0.35 * ramp(f, land + 6, 20));
  const squeeze = ramp(f, at([23, 4]), 18, easeInOut);
  const eS = lerp(1.5, 1.24, squeeze) + 0.01 * (f / 239);
  const railIn = ramp(f, at([23, 4.25]), 20, expoOut);
  const kNew = ramp(f, land, 12, expoOut);
  const ciLine = ramp(f, land + 8, 12);

  // headline: rises a little on the pan to make room for the sub-caption
  const hY = lerp(150 + 10 * (1 - ramp(f, 0, 20, expoOut)), 92, ramp(f, shift, 20, easeInOut));
  const hS = lerp(1, 0.78, ramp(f, shift, 20, easeInOut));
  const head = 'Commit from your terminal.'.split(' ');
  const R_S = 1.72;
  const R_W = 384;
  const R_X = 1920 - 70 - R_W * R_S + (1 - railIn) * 760;

  return (
    <AbsoluteFill style={{ background: P.shell, overflow: 'hidden' }}>
      {/* ── A ── */}
      <AbsoluteFill style={{ transform: `translateX(${-pan * 1920 * 1.02 + drift * (1 - pan)}px) translateY(${24 * (1 - ramp(f, 0, 24, expoOut))}px) scale(${1 + 0.018 * (f / 120)})`, transformOrigin: '40% 40%' }}>
        <div style={{ position: 'absolute', left: T_X, top: T_Y, transform: `scale(${T_SCALE})`, transformOrigin: '0 0' }}>
          <TerminalWindow P={P} dark width={T_W} height={T_H} title="dham — zsh">
            <span style={{ color: '#a1a1a6' }}>$ </span>
            {cmd}
            {!out ? <Cursor f={f} color="#ececec" solid={f > at([21, 2]) && f < at([22, 2])} /> : null}
            {out ? (
              <>
                {'\n'}
                {OUTPUT}
                {'\n'}
                <span style={{ color: '#a1a1a6' }}>$ </span>
                <Cursor f={f} color="#ececec" />
              </>
            ) : null}
          </TerminalWindow>
        </div>
        {/* underlines on the referenced tokens */}
        <div style={{ position: 'absolute', left: u1.x0, top: u1.y, width: (u1.x1 - u1.x0) * clamp01(c1 * 2), height: 2, background: '#a1a1a6' }} />
        <div style={{ position: 'absolute', left: u2.x0, top: u2.y, width: (u2.x1 - u2.x0) * clamp01(c2 * 2), height: 2, background: '#a1a1a6' }} />
        <Callout P={P} x={(u1.x0 + u1.x1) / 2} y0={T_BOTTOM + 14} y1={T_BOTTOM + 92} text="Signed with the SSH key already on your GitHub." k={c1} side="right" />
        <Callout P={P} x={(u2.x0 + u2.x1) / 2 + 40} y0={T_BOTTOM + 14} y1={T_BOTTOM + 92} text="No token. No password." k={c2} side="right" />
      </AbsoluteFill>

      {/* ── B ── */}
      <AbsoluteFill style={{ transform: `translateX(${(1 - pan) * 1920}px)` }}>
        <div style={{ position: 'absolute', left: 110, top: 300 + drift, transform: `scale(${eS})`, transformOrigin: '0 0' }}>
          <Editor P={P} hl={{ y: hy, h: hh, o: hlO }} />
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 17, color: P.ink, opacity: ciLine, transform: `translateY(${(1 - ciLine) * 8}px)` }}>
            <Glyph name="circleCheck" size={18} color={P.ink} />
            <span>{'Committed: https://dev-null.sh/@dham/commits/a41f0c7'}</span>
          </div>
        </div>

        {/* the rail beside it */}
        <div style={{ position: 'absolute', left: R_X, top: 0, width: R_W, transform: `scale(${R_S})`, transformOrigin: '0 0' }}>
          <FeedColumn P={P} width={R_W} top={-200} height={1200} />
          <div style={{ position: 'absolute', left: FEED_RAIL_HALF - 1, top: 0, width: 2, height: 150, background: P.rail }} />
          <div style={{ position: 'absolute', left: 0, top: 150, width: R_W }}>
            <div style={{ height: 112 * kNew, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: R_W, opacity: clamp01(kNew * 2.5), transform: `translateY(${(1 - kNew) * -24}px)` }}>
                <FeedCommit P={P} person={CAST.dennis} width={R_W} time="now" hash="a41f0c7" above={P.rail} tail={P.lanes[4]} nodeScale={nodeIn(f, land)} pulse={pulse(f, land)} body="Released v2.0.0." bodySize={17} star={{ starred: false, count: 0 }} icons={false} quoteButton={false} />
              </div>
            </div>
            <FeedCommit P={P} person={CAST.dennis} width={R_W} time="2m" hash="9c1e2d4" above={kNew > 0.02 ? P.lanes[4] : P.rail} tail={P.lanes[4]} body="It was DNS." bodySize={17} star={{ starred: false, count: 3 }} icons={false} quoteButton={false} />
            <FeedCommit P={P} person={CAST.grace} width={R_W} time="6m" hash="e7a10b3" above={P.lanes[4]} tail={P.lanes[1]} body="It's always DNS." bodySize={17} star={{ starred: false, count: 9 }} icons={false} quoteButton={false} />
          </div>
        </div>
      </AbsoluteFill>

      {/* headline (screen space, stays through the pan) */}
      <div style={{ position: 'absolute', left: 110, top: hY, transform: `scale(${hS})`, transformOrigin: '0 0' }}>
        <Words words={head} progress={() => 1} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 104, letterSpacing: '-0.04em', lineHeight: 1.05, color: P.ink }} />
      </div>
      <Words
        words={['Or', 'from', 'CI.']}
        progress={(i) => easeOut((f - shift - 6 - i * 2) / 10)}
        style={{ position: 'absolute', left: 112, top: 196, fontFamily: SANS, fontWeight: 600, fontSize: 60, letterSpacing: '-0.035em', lineHeight: 1.1, color: P.muted }}
      />
    </AbsoluteFill>
  );
}

const FEED_RAIL_HALF = 36;
