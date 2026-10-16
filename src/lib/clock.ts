// The film's clock, locked to the music. Pass 2 runs on Helge's track "Deviation"
// (assets/music/deviation.mp3): a fixed 144.23 BPM grid measured by analysis/analyze.py into
// src/data/track.json. Bar 1 starts 1.138 s in; the first 34 frames are pre-roll.
//
// A beat is 12.48 frames, so cue frames are fractional. Ramps and springs take fractional
// starts as-is; Sequence starts are rounded (worst case ½ frame = 17 ms). Every cue in
// src/storyboard.ts is [bar, beat] on this grid, and scripts/audio.ts places sound effects from
// the same numbers, so picture, effects and music share one clock.
import track from '../data/track.json';

export const FPS = 30;
export const BEAT_SEC: number = track.beat; // 0.416 s
export const BAR1_SEC: number = track.bar1; // 1.138 s
export const BPM = 60 / BEAT_SEC;
export const BEAT = BEAT_SEC * FPS; // 12.48 frames
export const BAR = BEAT * 4; // 49.92 frames
export const DURATION = Math.round(track.duration * FPS); // 2184 frames = 72.8 s
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** A musical position: [bar, beat], both 1-indexed; beat may be fractional (2.5 = the "and" of 2). */
export type Pos = readonly [bar: number, beat?: number];

/** Absolute time in seconds of a musical position. */
export const secAt = ([bar, beat = 1]: Pos): number => BAR1_SEC + ((bar - 1) * 4 + (beat - 1)) * BEAT_SEC;
/** Absolute film frame (fractional) of a musical position. */
export const frameAt = (p: Pos): number => secAt(p) * FPS;
/** Beats → frames. */
export const beats = (n: number): number => n * BEAT;
