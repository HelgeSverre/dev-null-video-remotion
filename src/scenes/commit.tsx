// S05 commit (bars 11–12): "A post is a ~~post~~ commit." Left: the headline; "post" is struck on
// 11.2 and "commit." rises on 11.3. Right: the log's composer at 1.8× (the protagonist staged, dashed lane ring).
// TYPING.composer types 11.1.5→11.4.5, the mono countdown runs from 280 and the ring goes solid at
// 3 characters. Commit is pressed on 12.1 (thock): the textarea clears and the new commit is inserted
// above the log with node-in on 12.1.25 (pop). The `[log 7f3a9c1] …` toast lands on 12.2 (blip).
import { BEAT } from '../lib/clock';
import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeInOut, easeOut, expoOut, nodeIn, punch, ramp, spring } from '../lib/motion';
import { typedCount } from '../lib/rand';
import { CAST, TYPING } from '../storyboard';
import { CommitRow } from '../ui/kit';
import { Composer, COMPOSER_H } from '../ui/commit-composer';
import { PageTabs, Pointer, PulseRing, SonnerToast } from '../ui/commit-parts';
import { SANS } from '../theme';

const K = 1.78; // product → film scale
const COL_X = 965; // feed column left edge on screen
const COL_W = 500; // feed column width at product scale
const COMPOSER_Y = 236; // composer top on screen
const TABS_H = 51;
const HEAD_X = 120;
const HEAD_SIZE = 118;
const BODY = TYPING.composer.text;

export function Commit() {
  const { f, F, P, at } = useScene();
  const press = at([12, 1]);
  const node = at([12, 1.25]);
  const toastAt = at([12, 2]);

  // ── composer state ──
  const n = typedCount(TYPING.composer, F);
  const committed = f >= press;
  const body = committed ? '' : [...BODY].slice(0, n).join('');
  const len = [...body].length;
  const staged = len < 3;
  const typing = !committed && f >= at([11, 1.5]) - 1 && f <= at([11, 4.5]) + 2;
  const caretOn = typing || Math.floor(f / (BEAT / 2)) % 2 === 0;
  const hover = f >= press - 4 ? 1 : 0;
  const pressed = f >= press - 2 && f < press ? (f - (press - 2)) / 2 : punch(f, press, 7);
  // the ring flips to solid (and pops a hair) when the third character lands
  const third = (() => {
    for (let i = Math.round(at([11, 1.5])); i <= Math.round(at([11, 4.5])); i++) if (typedCount(TYPING.composer, F - f + i) >= 3) return i;
    return 0;
  })();
  const ringScale = committed ? 1 : 1 + 0.12 * punch(f, third, 8);

  // ── insertion: the new commit opens above the log on 12.1, node-in on 12.1.25 ──
  const open = ramp(f, press, 6, expoOut);

  // ── headline ──
  const strike = ramp(f, at([11, 2]), 7, easeOut);
  const commitWord = spring(f, at([11, 3]), 16, 0.3);

  // ── pointer: glides in during the last word, clicks on 12.1, drifts off ──
  const btnX = COL_W - 16 - 120 + 78; // inside the scaled column (product px)
  const btnY = COMPOSER_H - 12 - 18 + 6;
  const glide = ramp(f, at([11, 3.5]), 22, easeInOut);
  const leave = ramp(f, press + 8, 30, easeInOut);
  const pX = btnX + (1 - glide) * 120 + leave * 40;
  const pY = btnY + (1 - glide) * 190 + leave * 60;
  const pointerDown = f >= press - 2 && f < press + 5 ? 1 : 0;

  // ── toast ──
  const tIn = spring(f, toastAt, 16, 0.25);

  // ── camera: slow 2.5 % push with a tick on the press ──
  const cam = 1 + 0.025 * ramp(f, 0, 119, (x) => x) + 0.006 * punch(f, press, 10);

  const head: CSSProperties = { fontFamily: SANS, fontWeight: 600, fontSize: HEAD_SIZE, letterSpacing: '-0.04em', lineHeight: 1.08, color: P.ink, whiteSpace: 'nowrap' };

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '50% 48%' }}>
        {/* headline */}
        <div style={{ position: 'absolute', left: HEAD_X, top: 392, ...head }}>
          <div>A post is a</div>
          <div style={{ display: 'flex', alignItems: 'baseline', columnGap: '0.26em' }}>
            <span style={{ position: 'relative', display: 'inline-block', color: strike > 0.6 ? P.muted : P.ink }}>
              post
              <span style={{ position: 'absolute', left: '-0.03em', top: '0.56em', height: '0.075em', width: `${strike * 106}%`, background: P.ink, borderRadius: 2 }} />
            </span>
            <span style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
              <span style={{ display: 'inline-block', transform: `translateY(${(1 - clamp01(commitWord)) * 100 + (clamp01(commitWord) - commitWord) * 30}%)`, opacity: commitWord > 0 ? 1 : 0 }}>commit.</span>
            </span>
          </div>
        </div>

        {/* feed column at 1.8× */}
        <div style={{ position: 'absolute', left: COL_X, top: COMPOSER_Y, width: COL_W, transform: `scale(${K})`, transformOrigin: '0 0' }}>
          <div style={{ position: 'absolute', left: 0, top: -400, width: COL_W, height: 1400, background: P.surface }} />
          <div style={{ position: 'absolute', left: 0, top: -TABS_H }}>
            <PageTabs P={P} tabs={['Following', 'Latest', 'Trending']} active={0} width={COL_W} />
          </div>
          <div style={{ position: 'relative' }}>
            <Composer
              P={P}
              person={CAST.ada}
              body={body}
              width={COL_W}
              staged={staged}
              caret={!committed && f >= at([11, 1.25]) && caretOn}
              remaining={280 - len}
              buttonOpacity={staged ? 0.5 : 1}
              pressed={pressed}
              hover={hover && !committed ? 1 : 0}
              ringScale={ringScale}
            />
            <div style={{ display: 'grid', gridTemplateRows: `${open}fr`, opacity: clamp01(open * 3) }}>
              <div style={{ minHeight: 0, overflow: open < 1 ? 'hidden' : 'visible' }}>
                <CommitRow P={P} person={CAST.ada} body={BODY} time="now" hash="7f3a9c1" above={P.rail} below={P.lanes[CAST.ada.lane]} nodeScale={nodeIn(f, node)} width={COL_W} />
              </div>
            </div>
            <CommitRow
              P={P}
              person={CAST.grace}
              body="Rewrote the lexer over the weekend. The tests are the slow part now."
              time="12m"
              hash="a41c0e7"
              stars={9}
              above={open > 0.5 ? P.lanes[CAST.ada.lane] : P.rail}
              below={P.lanes[1]}
              width={COL_W}
            />
            <CommitRow P={P} person={CAST.ken} body="Wrote a code generator for the code generator. It generates fine." time="38m" hash="3b9f2d1" stars={14} above={P.lanes[1]} below={P.lanes[2]} width={COL_W} />
            <PulseRing x={36} y={COMPOSER_H + 36} size={48} color={P.lanes[CAST.ada.lane]!} scale={1 + 0.75 * easeOut(clamp01((f - node) / 20))} opacity={f < node ? 0 : 0.6 * (1 - clamp01((f - node) / 20))} />
          </div>
          {/* column hairlines on top, so rows never hide them */}
          <div style={{ position: 'absolute', left: 0, top: -400, width: COL_W, height: 1400, borderLeft: `1px solid ${P.hairline}`, borderRight: `1px solid ${P.hairline}`, boxSizing: 'border-box', pointerEvents: 'none' }} />
          <Pointer x={pX} y={pY} size={17} down={pointerDown} opacity={ramp(f, at([11, 3.5]), 6) * (1 - ramp(f, press + 26, 8))} />
        </div>
      </AbsoluteFill>

      {/* toast (screen space, bottom-right like sonner) */}
      <div style={{ position: 'absolute', right: 56, bottom: 56, transform: `translateY(${(1 - tIn) * 90}px) scale(${K})`, transformOrigin: '100% 100%', opacity: clamp01(tIn * 2.5) }}>
        <SonnerToast P={P}>
          [log 7f3a9c1] {BODY}
        </SonnerToast>
      </div>
    </AbsoluteFill>
  );
}
