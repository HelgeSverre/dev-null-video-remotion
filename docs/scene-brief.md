# Scene brief: for the agents building scenes in parallel

You own one group of scenes in an 80-second launch film for devnull (https://dev-null.sh), a social network for developers that draws its timeline as a `git log --graph`. Several agents work in this directory at once, so stay inside your own files.

## Read first

1. `docs/treatment.md`: the whole film, your rows in the beat sheet (§5), and the claims you may make (§6).
2. `../dev-null.sh/DESIGN.md`: the product's design system. The film draws the product **as it is**, so copy its layout, tokens, copy and motion.
3. `src/storyboard.ts`: scenes in bars, typing runs, sound cues, cast.
4. `src/lib/clock.ts`, `src/lib/scene.tsx`, `src/lib/motion.ts`, `src/lib/rand.ts`: the clock and the helpers.
5. `src/ui/kit.tsx`: shared UI. It includes `CommitRow`, `Avatar`, `Identicon`, `Node`, `Segment`, `Mark`, `Wordmark`, `Button`, `Kbd`, `Toast`, `Pill`, `Icon`, `TerminalWindow`, `Cursor` and `Words`.
6. `src/scenes/title.tsx`: **the reference scene.** Match its quality and idiom.
7. For screens you recreate, read the real component in `../dev-null.sh/resources/js/` (pages/ and components/). Take labels and layout from it.

## Ownership

You may create or edit only these:
- `src/scenes/<id>.tsx` for each scene id in your group. The file and export already exist as a placeholder; keep the export name.
- New files `src/ui/<id>-*.tsx` for components only your scenes use.

**Do not edit** `src/ui/kit.tsx`, `src/storyboard.ts`, `src/theme.ts`, `src/lib/*`, `src/scenes/index.tsx`, `src/Video.tsx`, `src/Root.tsx`, scripts, or any other agent's scene. If you need a kit change, copy the component into your own `src/ui/<id>-*.tsx`. If you need a storyboard or sound-cue change, list it in your report and the integrator applies it.

## Contract

- A scene is a component with no props. `useScene()` gives you:
  - `f`: the local frame, 0 at the scene's first downbeat.
  - `P`: the palette for the scene's theme.
  - `at([bar, beat])`: the local frame of an absolute musical position.
  - `after(pos, dur)` and `pop(pos)`.
- **Time is musical.** Write every cue as `at([bar, beat])`, using the same numbers as the storyboard. One beat is 15 frames and one bar is 60. Big moves land on downbeats. Things that should hit with a sound must use the exact `SFX` position in `src/storyboard.ts`.
- Typing must use `typedCount(TYPING.x, F)`, where `F` is the absolute frame from `useScene().F`. The score's key clicks come from the same schedule.
- The canvas is 1920×1080. UI is drawn at **1.5–2.2× product scale** so it reads on a phone screen; scale with a wrapper `transform: scale()`, not by changing every size. Keep text ≥ 26 px effective unless it's deliberately tiny chrome.
- Every frame of your scene must be on-model. The scene renders from `f = 0` to `len - 1`. Cuts are hard: the first frame must already look composed (no fade from blank unless the treatment says so), and the last frame is held until the cut.

## Hard rules (learned the hard way)

- **Determinism:**
  - No `Math.random`, `Date.now`, `performance.now`, timers, CSS `@keyframes`, `animation:` or `transition:`.
  - Every value is a pure function of the frame; use `rng(seed)`, `noise()` and `hash()` from `src/lib/rand.ts`.
  - `just check` greps for these.
- **No CSS `filter: blur()`** (it renders differently across tabs). Fake depth with opacity, scale and haze layers. `backdrop-filter` is also out.
- **No images from the network, no new npm packages.** Draw everything with DOM, SVG and the fonts already loaded: `Geist` 400/500/600/700 via `SANS`, and `Geist Mono` 400/500/600 via `MONO`.
- **Brand rules from DESIGN.md:**
  - Lane colours only on nodes, rails, avatar rings and handle dots; never on text or fills behind text.
  - Blue (`P.primary`) only for buttons, links, the cursor, active tabs and the focus ring.
  - Commits are rows with hairlines, not cards, and have no drop shadows.
  - Mono only for machine output: hashes, handles, counts, times, `fatal:` lines and commands.
  - "devnull" is always lowercase. A post is a **commit**, a timeline is a **log**, and the engagement verb is **star**.
- **Truth:**
  - No user counts, testimonials or metrics presented as real. Star and reply counts on mock commits are fine.
  - Don't claim "no algorithm".
  - Use only the cast in `CAST` (`src/storyboard.ts`), plus extra fictional people you invent in the same style. No real people.
- **Owner taste:**
  - Medium framing, not too tight.
  - Secondary motion so that no frame is static: a slow 1–3 % camera drift during holds.
  - Eased camera moves, deliberate first and last frames.
  - No rounded bubbles with side accent stripes ("AI-UI tell").
  - Don't fill the frame with UI chrome; one idea per moment, big and legible.
- A rendered file is not evidence of quality. Render stills at every cue and **look at them**.

## Quality bar

The film should look like the best launch videos from Linear, Vercel or Raycast, but in devnull's own "well-lit terminal" look. The test is that every frame could be a screenshot of the product or a poster for it. Use bold type at display size (Geist 600, −0.04em tracking) for the one headline per scene; the UI is the proof underneath it. Motion should feel physical: springs on arrivals, expo-out on slides, pops on node-in.

## Verify (your gate)

```bash
cd /Users/helge/code/dev-null-video-remotion
bunx tsc --noEmit 2>&1 | grep 'src/scenes/<id>\|src/ui/<id>' || echo "no type errors in my files"
just check   # lint; other agents' in-progress files may fail tsc. Only your files matter.
bun scripts/stills.ts S01-boot:0 S01-boot:75 S01-boot:200   # composition ids: S<nn>-<id>; frames are local
```

Composition ids and local frame ranges:

| Comp | Bars | Local frames |
|---|---|---|
| S01-boot | 1–4 | 0–239 |
| S02-rm | 5–7 | 0–179 |
| S03-left | 8 | 0–59 |
| S04-title | 9–10 | 0–119 |
| S05-commit | 11–12 | 0–119 |
| S06-log | 13–14 | 0–119 |
| S07-identity | 15–16 | 0–119 |
| S08-lanes | 17–18 | 0–119 |
| S09-star | 19–20 | 0–119 |
| S10-terminal | 21–24 | 0–239 |
| S11-profile | 25–26 | 0–119 |
| S12-keys | 27–28 | 0–119 |
| S13-montage | 29–34 | 0–359 |
| S14-outro | 35–38 | 0–239 |
| S15-root | 39–40 | 0–119 |

Render stills at the first frame, every cue, and the last frame. Open them with the Read tool and fix what you see. Iterate at least twice per scene. Stills land in `out/stills/<comp>-<frame>.jpg`.

## Report

When done, reply with:
- the files you wrote;
- for each scene, one line on what it shows;
- the still paths you'd show the director, 2–3 per scene;
- requested changes to `storyboard.ts` or SFX, if any, with exact positions;
- anything you could not make true to the product.
