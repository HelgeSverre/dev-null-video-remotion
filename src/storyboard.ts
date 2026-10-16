// The film as data: scenes in bars, typing runs and sound cues in [bar, beat]. Imported by the
// React scenes (src/scenes/*) and by the score (scripts/audio.ts), so picture and sound share one
// source of truth. No JSX here: bun runs this file directly.
import { type Pos } from './lib/clock';

export type Lane = 0 | 1 | 2 | 3 | 4 | 5;
export type Theme = 'light' | 'dark';

export type SceneDef = {
  id: string;
  /** First bar (1-indexed) and number of bars. */
  bar: number;
  bars: number;
  /** The scene's own commit on the film's log (shown in S14). */
  commit: string;
  hash: string;
  lane: Lane;
  theme: Theme;
};

export const SCENES: SceneDef[] = [
  { id: 'boot', bar: 1, bars: 4, commit: 'hello world', hash: '0be0130', lane: 3, theme: 'light' },
  { id: 'rm', bar: 5, bars: 3, commit: 'rm everything else', hash: 'd3c2fde', lane: 0, theme: 'light' },
  { id: 'left', bar: 8, bars: 1, commit: 'cat /dev/null', hash: '000000a', lane: 0, theme: 'light' },
  { id: 'title', bar: 9, bars: 2, commit: 'init', hash: '5300c05', lane: 0, theme: 'light' },
  { id: 'commit', bar: 11, bars: 2, commit: 'a post is a commit', hash: '7f3a9c1', lane: 3, theme: 'light' },
  { id: 'log', bar: 13, bars: 2, commit: 'a timeline is a log', hash: 'eabd62b', lane: 1, theme: 'light' },
  { id: 'identity', bar: 15, bars: 2, commit: 'whoami', hash: '419d302', lane: 2, theme: 'light' },
  { id: 'lanes', bar: 17, bars: 2, commit: 'export LANE=teal', hash: 'f878ad4', lane: 3, theme: 'light' },
  { id: 'star', bar: 19, bars: 2, commit: 'star, reply, quote', hash: '745cf8e', lane: 1, theme: 'light' },
  { id: 'terminal', bar: 21, bars: 4, commit: 'commit from anywhere', hash: '9c1e2d4', lane: 4, theme: 'light' },
  { id: 'follows', bar: 25, bars: 2, commit: 'import following', hash: '6d1e9b2', lane: 1, theme: 'light' },
  { id: 'readme', bar: 27, bars: 2, commit: 'graph.svg', hash: '3e7a0c5', lane: 0, theme: 'light' },
  { id: 'profile', bar: 29, bars: 2, commit: 'git log --author=helgesverre', hash: 'b88deec', lane: 3, theme: 'light' },
  { id: 'keys', bar: 31, bars: 2, commit: 'man devnull', hash: 'f5793f9', lane: 5, theme: 'light' },
  { id: 'montage', bar: 33, bars: 6, commit: 'and the rest', hash: '1a2b3c4', lane: 2, theme: 'dark' },
  { id: 'outro', bar: 39, bars: 3, commit: 'your turn', hash: 'c0ffee1', lane: 3, theme: 'light' },
  { id: 'root', bar: 42, bars: 2, commit: 'root', hash: '0000000', lane: 3, theme: 'light' },
];

// ── cast ───────────────────────────────────────────────────────────────────────────────────
/** `avatar` is a file under public/ (real GitHub avatar); without it the avatar is an identicon. */
export type Person = { handle: string; name: string; lane: Lane; bio?: string; avatar?: string };
export const CAST = {
  // The protagonist is Helge himself (his request, 2026-10-16): real GitHub profile, real avatar.
  ada: { handle: 'helgesverre', name: 'Helge Sverre', lane: 3, bio: 'All-stack Developer, Workaholic, Compulsive side-hustler.', avatar: 'avatars/helgesverre.png' },
  grace: { handle: 'gritchie', name: 'Grace Ritchie', lane: 1, bio: 'Compilers, coffee, and the occasional segfault.' },
  ken: { handle: 'kenl', name: 'Ken Lovelace', lane: 2, bio: 'Writes the code that writes the code.' },
  margaret: { handle: 'mlerdorf', name: 'Margaret Lerdorf', lane: 0, bio: 'Shipping on Fridays since 2009.' },
  dennis: { handle: 'dham', name: 'Dennis Hamilton', lane: 4, bio: 'On call. Always on call.' },
  barbara: { handle: 'brossum', name: 'Barbara Rossum', lane: 5, bio: 'Type systems and long walks.' },
  world: { handle: 'world', name: 'world', lane: 1, bio: 'I answer to hello world.' },
} as const satisfies Record<string, Person>;

// ── typing runs (characters spread from `from` to `to`, seeded jitter) ─────────────────────
export type TypeRun = { from: Pos; to: Pos; text: string; seed: number };
export const TYPING = {
  bootCmd: { from: [1, 2], to: [3, 2], text: "curl -fsSL https://dev-null.sh/commit | bash -s -- 'hello world'", seed: 1 },
  leftLs: { from: [8, 1], to: [8, 1.75], text: 'cat /dev/null', seed: 2 },
  leftQ: { from: [8, 3], to: [8, 3.75], text: "What's left?", seed: 3 },
  composer: { from: [11, 1.5], to: [11, 4.5], text: 'Shipped the parser benchmark. 3.2× faster.', seed: 4 },
  termCmd: { from: [21, 2], to: [22, 2], text: "curl -fsSL https://dev-null.sh/commit | bash -s -- 'It was DNS.'", seed: 5 },
  montageSearch: { from: [36, 1.25], to: [36, 1.75], text: 'gra', seed: 6 },
} as const satisfies Record<string, TypeRun>;

// ── one-shot sound cues ─────────────────────────────────────────────────────────────────────
export type SfxKind = 'enter' | 'pop' | 'zap' | 'star' | 'whoosh' | 'riser' | 'impact' | 'blip' | 'click' | 'thock' | 'flip';
export type Sfx = { at: Pos; kind: SfxKind; /** lane for pitched pops */ lane?: Lane; /** riser length in beats */ len?: number };

export const RM_WORDS = ['likes', 'reposts', 'hashtags', 'DMs', 'passwords', 'profile forms', 'banner images', 'ads'] as const;
/** Beat at which each rm word lands (bars 5–7): two beats each for the first four, then one each. */
export const RM_AT: Pos[] = [
  [5, 1], [5, 3], [6, 1], [6, 3],
  [7, 1], [7, 2], [7, 3], [7, 4],
];
/** Lane hops in S08: auto, then lanes 0..5 ... landing on teal (3) on 18.4. */
export const LANE_HOPS: { at: Pos; lane: Lane | 'auto' }[] = [
  { at: [17, 1], lane: 'auto' }, { at: [17, 2], lane: 0 }, { at: [17, 3], lane: 1 }, { at: [17, 4], lane: 2 },
  { at: [18, 1], lane: 3 }, { at: [18, 2], lane: 4 }, { at: [18, 3], lane: 5 }, { at: [18, 4], lane: 3 },
];
/** Montage cuts: every two beats from 33.1 (the track's drop). */
export const MONTAGE = [
  'undo', 'stash', 'secrets', 'poll', 'code', 'series',
  'search', 'embeds', 'notifications', 'ratelimit', 'lastvisit', 'api',
] as const;
export const montageAt = (i: number): Pos => [33 + Math.floor(i / 2), (i % 2) * 2 + 1];
/** Keys: j/j/k move focus, y yanks the link (toast); the theme flips on 32.1. */
export const KEYS: { at: Pos; key: string }[] = [
  { at: [31, 1], key: 'j' }, { at: [31, 2], key: 'j' }, { at: [31, 3], key: 'k' }, { at: [31, 4], key: 'y' },
];

export const SFX: Sfx[] = [
  // S01 boot
  { at: [3, 3], kind: 'enter' },
  { at: [4, 1], kind: 'pop', lane: 3 },
  { at: [4, 3], kind: 'pop', lane: 1 },
  // S02 rm
  ...RM_AT.map((at): Sfx => ({ at, kind: 'zap' })),
  // S03 left
  { at: [8, 2], kind: 'enter' },
  { at: [8, 1], kind: 'riser', len: 4 },
  // S04 title
  { at: [9, 1], kind: 'impact' },
  { at: [9, 3], kind: 'pop', lane: 0 },
  { at: [10, 1], kind: 'pop', lane: 1 },
  // S05 commit
  { at: [12, 1], kind: 'thock' },
  { at: [12, 1.25], kind: 'pop', lane: 3 },
  { at: [12, 2], kind: 'blip' },
  // S06 log
  { at: [13, 1], kind: 'whoosh' },
  { at: [14, 1], kind: 'blip' },
  // S07 identity
  { at: [15, 1], kind: 'thock' },
  ...[2, 3, 4].map((b): Sfx => ({ at: [15, b], kind: 'click' })),
  ...[1, 2, 2.5].map((b): Sfx => ({ at: [16, b], kind: 'click' })),
  // S08 lanes
  ...LANE_HOPS.map(({ at, lane }): Sfx => ({ at, kind: 'pop', lane: lane === 'auto' ? 3 : lane })),
  // S09 star
  { at: [19, 1], kind: 'star' },
  { at: [20, 1], kind: 'click' },
  { at: [20, 3], kind: 'whoosh' },
  // S10 terminal
  { at: [22, 3], kind: 'enter' },
  { at: [23, 1], kind: 'whoosh' },
  { at: [24, 1], kind: 'pop', lane: 4 },
  // follows + readme: cues added with the scenes
  // follows: a pop per imported person in their lane (25.2–26.3), the last Follow → Following on 26.4
  { at: [25, 2], kind: 'pop', lane: 1 },
  { at: [25, 3], kind: 'pop', lane: 2 },
  { at: [25, 4], kind: 'pop', lane: 0 },
  { at: [26, 1], kind: 'pop', lane: 4 },
  { at: [26, 2], kind: 'pop', lane: 5 },
  { at: [26, 3], kind: 'pop', lane: 1 },
  { at: [26, 4], kind: 'click' },
  // readme: paste the snippet, the preview renders it, the streak lands, ?theme=dark flips it
  { at: [27, 2], kind: 'click' },
  { at: [27, 3], kind: 'blip' },
  { at: [28, 2], kind: 'pop', lane: 3 },
  { at: [28, 3], kind: 'flip' },
  // profile
  { at: [29, 1], kind: 'whoosh' },
  ...[1, 2, 3, 4].map((b): Sfx => ({ at: [30, b], kind: 'pop', lane: 3 })),
  // keys (the track's breakdown)
  ...KEYS.map(({ at }): Sfx => ({ at, kind: 'click' })),
  { at: [31, 1], kind: 'riser', len: 7 },
  { at: [32, 1], kind: 'flip' },
  // montage (the drop)
  { at: [33, 1], kind: 'impact' },
  ...MONTAGE.slice(1).map((_, i): Sfx => ({ at: montageAt(i + 1), kind: 'whoosh' })),
  // outro
  { at: [39, 1], kind: 'impact' },
  { at: [41, 1], kind: 'pop', lane: 3 },
  // root
  { at: [42, 1], kind: 'impact' },
  { at: [43, 1], kind: 'pop', lane: 3 },
];
