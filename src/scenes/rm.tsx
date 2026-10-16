// S02 rm (bars 5–7): everything else goes to /dev/null. One huge word per slot, landing on its
// RM_AT beat with the zap (a horizontal slice glitch), readable for half the slot, then deleted
// the way devnull deletes a commit: the word is swapped for a mono `rm likes → /dev/null` status
// strip, which collapses in height and opacity. The status lines pile up as scrollback top-left;
// on the last beat the scrollback drains too, leaving the shell nearly empty for S03.
import { BEAT } from '../lib/clock';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { useScene } from '../lib/scene';
import { clamp01, easeIn, easeOut, expoOut, punch, ramp, spring } from '../lib/motion';
import { hash, rng } from '../lib/rand';
import { RM_AT, RM_WORDS } from '../storyboard';
import { MONO, SANS, type Palette } from '../theme';

const WORD_Y = 590; // centre line of the big word
const LOG_X = 120;
const LOG_Y = 92;
const LOG_LH = 46;

type Slot = { word: string; s: number; len: number; swap: number; fold: number; foldLen: number; logAt: number };

export function Rm() {
  const { f, P, at, len } = useScene();

  const slots: Slot[] = RM_WORDS.map((word, i) => {
    const s = at(RM_AT[i]!);
    const next = i + 1 < RM_AT.length ? at(RM_AT[i + 1]!) : len;
    const L = next - s;
    const long = L >= 30;
    const swap = s + (long ? 16 : 9);
    const foldLen = long ? 8 : 4;
    const fold = next - foldLen;
    return { word, s, len: L, swap, fold, foldLen, logAt: fold };
  });

  // ── camera: slow 3 % push across the scene, a kick punch on every beat, a sideways jolt per zap.
  const beat = Math.floor(f / BEAT) * BEAT;
  const kick = punch(f, beat, 8);
  const zap = slots.reduce((m, sl) => Math.max(m, punch(f, sl.s, 6)), 0);
  const cam = 1 + 0.03 * (f / len) + 0.012 * kick;
  const jolt = zap * 10 * (Math.floor(f / 2) % 2 === 0 ? 1 : -1);

  const cur = [...slots].reverse().find((sl) => f >= sl.s) ?? slots[0]!;
  const drainAt = slots[slots.length - 1]!.s + 1;

  return (
    <AbsoluteFill style={{ background: P.shell }}>
      <AbsoluteFill style={{ transform: `scale(${cam}) translateX(${jolt}px)`, transformOrigin: '50% 55%' }}>
        {/* scrollback: one status line per deleted thing */}
        <div style={{ position: 'absolute', left: LOG_X, top: LOG_Y }}>
          {slots.slice(0, -1).map((sl, i) => {
            if (f < sl.logAt) return null;
            const inn = ramp(f, sl.logAt, 6, expoOut);
            const drain = ramp(f, drainAt + i * 1.5, 5, easeIn);
            const age = slots.filter((o) => o.logAt <= f && o.logAt > sl.logAt).length;
            return (
              <div
                key={sl.word}
                style={{
                  height: LOG_LH * (1 - drain),
                  overflow: 'hidden',
                  opacity: inn * (1 - drain) * (1 - Math.min(0.45, age * 0.08)),
                  transform: `translateY(${(1 - inn) * 14}px)`,
                  fontFamily: MONO,
                  fontSize: 28,
                  lineHeight: `${LOG_LH}px`,
                  color: P.muted,
                  whiteSpace: 'pre',
                }}
              >
                <StatusText P={P} word={sl.word} />
              </div>
            );
          })}
        </div>

        {/* the word, then its rm status strip */}
        <Stage P={P} f={f} sl={cur} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function StatusText({ P, word }: { P: Palette; word: string }) {
  return (
    <span>
      <span style={{ color: P.ink }}>rm</span> {word} → /dev/null
    </span>
  );
}

function Stage({ P, f, sl }: { P: Palette; f: number; sl: Slot }) {
  if (f < sl.swap) {
    // Land: a slam (slight overshoot) under a slice glitch that decays over 5 frames.
    const land = spring(f, sl.s - 1, 10, 0.4);
    const g = glitchAmp(f, sl.s, sl.len >= 30 ? 5 : 3) + glitchAmp(f, sl.swap - 1, 1) * 0.6;
    return (
      <Center>
        <div style={{ transform: `scale(${1.06 - 0.06 * land})` }}>
          <Sliced f={f} seed={hash(sl.word)} amp={g * 54}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 220, letterSpacing: '-0.04em', lineHeight: 1, color: P.ink, whiteSpace: 'pre', padding: '0 0.04em 0.12em' }}>{sl.word}</div>
          </Sliced>
        </div>
      </Center>
    );
  }
  // Delete: the mono status strip (commit-card.tsx: destructive/8 strip, muted mono), held, then
  // the row collapses in height and opacity.
  const pop = ramp(f, sl.swap, 4, easeOut);
  const fold = ramp(f, sl.fold, sl.foldLen, easeIn);
  const g = glitchAmp(f, sl.swap, 3);
  const H = 132;
  return (
    <Center>
      <div style={{ height: H * (1 - fold) * (0.7 + 0.3 * pop), opacity: (1 - fold) * clamp01(0.55 + pop), overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <Sliced f={f} seed={hash(sl.word) + 7} amp={g * 40}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: H,
              padding: '0 44px',
              borderRadius: 18,
              background: 'rgba(201, 42, 42, 0.08)',
              fontFamily: MONO,
              fontSize: 64,
              color: P.muted,
              whiteSpace: 'pre',
            }}
          >
            <StatusText P={P} word={sl.word} />
          </div>
        </Sliced>
      </div>
    </Center>
  );
}

function Center({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: WORD_Y, height: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
  );
}

/** 1 at `at`, decaying to 0 over `dur` frames; 0 outside. */
function glitchAmp(f: number, at: number, dur: number) {
  const t = (f - at) / dur;
  return t < 0 || t >= 1 ? 0 : Math.pow(1 - t, 1.5);
}

/**
 * Horizontal slice glitch without filters: the content drawn several times, each copy clipped to
 * a band and shifted sideways. Bands and offsets are seeded by the frame (deterministic flicker).
 */
function Sliced({ f, seed, amp, children }: { f: number; seed: number; amp: number; children: ReactNode }) {
  if (amp < 0.5) return <div>{children}</div>;
  const r = rng(seed * 31 + Math.floor(f));
  const cuts = [0];
  while (cuts[cuts.length - 1]! < 100) cuts.push(Math.min(100, cuts[cuts.length - 1]! + 8 + r() * 22));
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ visibility: 'hidden' }}>{children}</div>
      {cuts.slice(0, -1).map((top, i) => {
        const bottom = cuts[i + 1]!;
        const dx = (r() * 2 - 1) * amp * (r() < 0.35 ? 0.15 : 1);
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${top}% -20% ${100 - bottom}% -20%)`, transform: `translateX(${dx}px)` }}>
            {children}
          </div>
        );
      })}
    </div>
  );
}
