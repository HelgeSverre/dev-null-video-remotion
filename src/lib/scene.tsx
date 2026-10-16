// Per-scene context: which scene we are in, local frame, palette, and cue helpers in [bar, beat].
import { createContext, useContext } from 'react';
import { useCurrentFrame } from 'remotion';
import { DURATION, frameAt, type Pos } from './clock';
import { ramp, spring } from './motion';
import { SCENES, type SceneDef } from '../storyboard';
import { palette, type Palette } from '../theme';

export type SceneCtx = { def: SceneDef; from: number; len: number };
export const SceneContext = createContext<SceneCtx | null>(null);

/** First frame of a scene: its first downbeat, rounded; the first scene also owns the pre-roll. */
export const sceneFrom = (def: SceneDef) => (def.bar === 1 ? 0 : Math.round(frameAt([def.bar, 1])));
/** Frames until the next scene's first downbeat; the last scene runs to the end of the music. */
export const sceneLen = (def: SceneDef) => {
  const next = SCENES.find((s) => s.bar === def.bar + def.bars);
  return (next ? sceneFrom(next) : DURATION) - sceneFrom(def);
};

/**
 * Inside a scene: `f` is the local frame (0 at the scene's first downbeat), `F` the absolute film
 * frame. `at([bar, beat])` converts an absolute musical position to a local frame, so scenes write
 * cues in the same numbers as the storyboard and the score.
 */
export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene outside a scene');
  const f = useCurrentFrame();
  const at = (p: Pos) => frameAt(p) - ctx.from;
  return {
    f,
    F: f + ctx.from,
    len: ctx.len,
    p: f / ctx.len,
    def: ctx.def,
    P: palette(ctx.def.theme) as Palette,
    at,
    /** Eased 0→1 from a musical position over `dur` frames. */
    after: (p: Pos, dur = 12, ease?: (x: number) => number) => ramp(f, at(p), dur, ease),
    /** House spring from a musical position. */
    pop: (p: Pos, frames = 18, bounce = 0.35) => spring(f, at(p), frames, bounce),
  };
}
