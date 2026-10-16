# /dev/null: the launch film

A 72.8-second launch film for [devnull](https://dev-null.sh), the social network for developers that draws its timeline as a `git log --graph`. Every frame is built from devnull's own design system in [Remotion](https://remotion.dev), and the cuts are synced to the beat grid of "Deviation" by Helge Sverre.

**The film is a log.** Each scene is a commit on a lane-coloured rail. The cold open is a `hello world` sent from the terminal, which the `@world` bot answers. The outro scrolls through the film's own `git log`, and the final frame is the root commit.

## Run

Requires [Bun](https://bun.sh), [just](https://just.systems), ffmpeg and, for the music analysis only, [uv](https://docs.astral.sh/uv/).

```bash
just setup     # bun install + copy fonts into public/
just studio    # Remotion Studio: "Full", "Preview" (with audio), one composition per scene
just audio     # Deviation + UI sound effects -> public/audio/mix.wav
just draft     # half-size render -> out/draft.mp4
just render    # master -> out/dev-null-launch.mp4 (+ -web.mp4, poster.jpg)
just verify    # frame count, A/V sync, music section edges on the film's downbeats
just contact   # one frame per scene -> out/contact.jpg
```

To re-measure the music: `cd analysis && uv run analyze.py` writes `src/data/track.json`.

## How it is made

```
assets/music/deviation.mp3 ──analysis/analyze.py──▶ src/data/track.json   (144.23 BPM, bar 1 at 0.722 s)
                                                          │
src/storyboard.ts  scenes in bars · cues in [bar, beat] ──┤
                                                          ▼
                        src/lib/clock.ts  frameAt([bar, beat])  ◀── one clock for picture and sound
                           │                         │
                 src/scenes/*.tsx (Remotion)   scripts/audio.ts (track + UI effects)
                           │                         │
                  scripts/render.ts: chunked render, ffmpeg concat, mux mix.wav once
                           │
                  scripts/verify.ts: the acceptance gate
```

## Layout

| Path | What |
|---|---|
| `docs/treatment.md` | the spec: concept, visual bible, beat sheet, the source for every on-screen claim |
| `docs/decisions.md` | defaults taken without asking, and the pass-2 re-timing to Deviation |
| `docs/scene-brief.md` | the brief the parallel scene builders worked from |
| `src/storyboard.ts` | the film as data: scenes, cast, typing runs, sound cues |
| `src/ui/kit.tsx` | devnull's UI rebuilt for film: commit row, rail, nodes, buttons, wordmark |
| `src/scenes/` | one file per scene |
| `scripts/audio.ts` | the mix; `--synth` restores pass 1's synthesized 120 BPM score |

Built with Claude Code.
