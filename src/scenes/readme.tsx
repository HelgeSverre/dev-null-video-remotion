// S12 readme (bars 27–28): "Your streak, in your README." A plain markdown file view of
// helgesverre/README.md at 1.8×: the source on top, the rendered preview under it. The caret waits
// on an empty line; on 27.2 the embed snippet from Settings → "Copy Markdown" is pasted
// (`![devnull](https://dev-null.sh/@helgesverre/graph.svg)`); on 27.3 the preview renders it into the
// real graph.svg (ui/readme-graph.tsx, drawn like CreateUserActivityGraph), whose year grid fills
// in the protagonist's lane on 16ths until 28.2, when the streak line lands and the 12-day streak
// flashes. On 28.3 `?theme=dark` is added to the URL and the embed flips to its dark palette.
import { AbsoluteFill } from 'remotion';
import { BEAT } from '../lib/clock';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, expoOut, lerp, punch, ramp, spring } from '../lib/motion';
import { CAST } from '../storyboard';
import { ActivityGraphSvg, COLUMNS, GRAPH_H, GRAPH_W } from '../ui/readme-graph';
import { mono, sans } from '../ui/commit-parts';
import { BODY_FEATURES, SANS, type Palette } from '../theme';

const K = 1.8;
const PAD = 20; // preview padding (product px)
const PW = GRAPH_W + PAD * 2 + 2; // panel width (product px), with its 1px borders
const PANEL_X = (1920 - PW * K) / 2;
const ada = CAST.ada;
const URL = `https://dev-null.sh/@${ada.handle}/graph.svg`;
const DARK_Q = '?theme=dark';
/** Fill steps: one per 16th from just after 27.3 to 28.2. */
const STEPS = 12;

const BOOK = 'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z';

function Caret({ f, P, on }: { f: number; P: Palette; on: boolean }) {
  if (!on) return null;
  const blink = Math.floor(f / (BEAT / 2)) % 2 === 0;
  return <span style={{ display: 'inline-block', width: 2, height: 17, background: P.primary, verticalAlign: 'text-bottom', marginLeft: 1, opacity: blink ? 1 : 0 }} />;
}

export function Readme() {
  const { f, P, at, len } = useScene();

  const paste = at([27, 2]);
  const render = at([27, 3]);
  const streakAt = at([28, 2]);
  const flipAt = at([28, 3]);

  const pasted = f >= paste;
  const pasteHi = pasted ? 1 - ramp(f, paste + 2, 10) : 0;
  const pasteIn = spring(f, paste, 10, 0.3);

  // the ?theme=dark insert: a short paste too
  const darkChars = f < flipAt - 2 ? 0 : Math.min(DARK_Q.length, Math.round(((f - (flipAt - 2)) / 3) * DARK_Q.length));
  const darkHi = darkChars > 0 ? 1 - ramp(f, flipAt + 2, 10) : 0;
  const dark = ramp(f, flipAt, 10, easeInOut);

  // the preview grows open for the image, the panel re-centres as it does
  const grow = ramp(f, render - 2, 12, expoOut);
  const imgIn = ramp(f, render, 5);
  const panelTop = lerp(436, 238, grow);

  const stepAt = (s: number) => render + ((s + 1) * BEAT) / 4;
  const column = (c: number) => ramp(f, stepAt(Math.floor((c * STEPS) / COLUMNS)) - 1, 5, (x) => x);
  const streak = ramp(f, streakAt, 8);
  const streakFlash = (d: number) => punch(f, streakAt + d * 0.9, 10);

  // camera: slow drift, and a slight push toward the graph once it is filling
  const cam = 1 + 0.02 * (f / len) + 0.03 * ramp(f, render, 3 * BEAT, easeInOut);

  const lineNo = (n: number) => <span style={{ display: 'inline-block', width: 34, textAlign: 'right', marginRight: 18, color: P.muted, opacity: 0.6 }}>{n}</span>;
  const hi = (k: number) => (k > 0 ? { background: `rgba(59, 111, 224, ${0.16 * k})`, borderRadius: 2 } : {});

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '50% 62%' }}>
        {/* headline */}
        <div style={{ position: 'absolute', left: PANEL_X - 6, top: 74, fontFamily: SANS, fontWeight: 600, fontSize: 112, letterSpacing: '-0.04em', lineHeight: 1, color: P.ink, whiteSpace: 'nowrap' }}>Your streak, in your README.</div>

        {/* the file view at 1.8× */}
        <div style={{ position: 'absolute', left: PANEL_X, top: panelTop, width: PW, transform: `scale(${K})`, transformOrigin: '0 0', borderRadius: 8, border: `1px solid ${P.hairline}`, background: P.surface, overflow: 'hidden', fontFamily: SANS, color: P.ink }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderBottom: `1px solid ${P.hairline}`, background: P.shell }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={P.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
              <path d={BOOK} />
            </svg>
            <span style={{ ...mono(13), color: P.ink }}>{ada.handle}</span>
            <span style={{ ...mono(13), color: P.muted }}>/</span>
            <span style={{ ...mono(13, 500), color: P.ink }}>README.md</span>
          </div>

          {/* source */}
          <div style={{ padding: '9px 0', background: P.wash, ...mono(13), lineHeight: '22px', whiteSpace: 'pre', color: P.ink, borderBottom: `1px solid ${P.hairline}` }}>
            <div>
              {lineNo(1)}
              <span style={{ color: P.muted }}># </span>Hi, I'm {ada.name.split(' ')[0]}.
            </div>
            <div>{lineNo(2)}</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {lineNo(3)}
              {pasted ? (
                <span style={{ display: 'inline-block', transform: `translateY(${(1 - pasteIn) * 4}px)`, opacity: clamp01(pasteIn * 3) }}>
                  <span style={hi(pasteHi)}>
                    <span style={{ color: P.muted }}>![</span>devnull<span style={{ color: P.muted }}>](</span>
                    <span style={{ color: P.primary }}>{URL}</span>
                  </span>
                  {darkChars > 0 ? <span style={{ color: P.primary, ...hi(darkHi) }}>{DARK_Q.slice(0, darkChars)}</span> : null}
                  {darkChars > 0 ? <Caret f={f - flipAt} P={P} on={f < flipAt + 1.5 * BEAT} /> : null}
                  <span style={{ color: P.muted, ...hi(pasteHi) }}>)</span>
                </span>
              ) : null}
              <Caret f={f} P={P} on={!pasted || f < render} />
            </div>
          </div>

          {/* preview */}
          <div style={{ padding: `16px ${PAD}px ${lerp(14, PAD, grow)}px` }}>
            <div style={{ ...sans(22, 600), letterSpacing: '-0.02em', lineHeight: '30px', fontFeatureSettings: BODY_FEATURES }}>Hi, I'm {ada.name.split(' ')[0]}.</div>
            <div style={{ height: (GRAPH_H + 14) * grow, overflow: 'hidden' }}>
              <div style={{ paddingTop: 14, opacity: imgIn, transform: `translateY(${(1 - grow) * -12}px)` }}>
                <ActivityGraphSvg lane={ada.lane} dark={dark} column={column} streak={streak} streakFlash={streakFlash} />
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
