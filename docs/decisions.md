# Decisions

Defaults taken without asking. Each can be overturned.

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Voice-over? | None. On-screen type carries the words. | devnull's voice is typographic: mono `fatal:` lines and git idioms. TTS would cost money and fight the dry tone. |
| 2 | Real people on screen? | Only Helge (the protagonist, `@helgesverre`, real GitHub profile and avatar, his request). The rest of the cast is fictional mash-ups from the StressSeeder name pools, with identicon avatars. | No consent from other real users; `PRODUCT.md` forbids fabricated endorsements. |
| 3 | Metrics and testimonials | None claimed. Star and reply counts appear only on mock commits. | `PRODUCT.md` → Evidence on Hand: "Do not fabricate user counts". |
| 4 | "No algorithm" | Not used. | The product now ships a ranked Trending log (`App\Services\TheAlgorithm`). |
| 5 | Light or dark? | Light by default; a single flip to dark (keys → montage), then back to light for the CTA. | `DESIGN.md`: "a well-lit terminal rather than a dark hacker cosplay". The flip shows off the faithful dark mode and gives the drop a colour change. |
| 6 | 3D? | No three.js. CSS 3D transforms for the "whole app" shot only. | The UI is DOM by nature; three.js adds render cost and GL gotchas for no gain. |
| 7 | Logo asset | `public/favicon.svg` paths (the null-sign mark), plus the wordmark rebuilt in Geist with a hollow lane-0 slash. | `public/logo.svg` is an unused starter-kit leftover. |
| 8 | Fonts | `@fontsource/geist-sans` and `geist-mono` 5.3.0, latin subset. `→` and `↳` fall back to the system font. | Same subsets the product serves; fallback glyphs match what users see. |
| 9 | Pass 1 music | A score synthesized in `scripts/audio.ts` at 120 BPM, so one beat is exactly 15 frames. | Sync by construction while scenes are being built. |
| 10 | Pass 2 music | Helge's track "Deviation" (Suno), `assets/music/deviation.mp3`, re-timed to its grid (see below). | Requested by Helge on 2026-10-16. |
| 11 | GitHub Action reference | `nunomaduro/dev-null.sh/.github/actions/commit@production`, the real path. | It is the documented way to use the action (README). |
| 12 | Pass 1 deliverable | `out/dev-null-launch-v1-synth.mp4` (80 s, 120 BPM synthesized score) is kept as v1. | It is the first pass Helge asked for. |

## Pass 2: re-timing to "Deviation"

`analysis/analyze.py` (librosa) measured the track into `src/data/track.json`:
- **Tempo: 144.23 BPM.** A beat is 0.416 s and a bar 1.664 s. The grid is fixed. Folding the onsets over the beat puts them 0–9 ms after the grid; the low band peaks at +26 ms, which is the kick's rise time.
- **Bar 1 starts at 0.722 s.** The first try used the kick band and picked beat 2 as the downbeat. That doesn't work because the kick hits every beat.
  - The phase is now anchored on structure: the breakdown starts on a downbeat, at the biggest beat-to-beat fall in low-band energy between 45 and 56 s, which is 50.64 s.
  - With that phase, the groove entry (bar 5), breakdown (31) and drop (33) all land on beat 1. The swells before them become one-beat pickups.
  - `scripts/verify.ts` checks these three edges on every render.
- **Length: 72.80 s,** which is 2184 frames at 30 fps.

| Track bars | Time (s) | Music | Film |
|---|---|---|---|
| pre-roll | 0–0.72 | silence | boot holds its first frame (cursor) |
| 1–4 | 0.72–7.38 | intro; the kick pickup on 4.4 | boot: typing, then the commit pops onto the rail and @world replies |
| 5–7 | 7.38–12.37 | groove comes in | rm |
| 8 | 12.37 | lift | left: "What's left?" |
| 9 | 14.03 | section lift | title |
| 10–24 | 15.70–40.66 | groove | commit through terminal (1:1 with pass 1) |
| 25–28 | 40.66–47.31 | groove | **new:** follows (25–26), readme (27–28) |
| 29–30 | 47.31–50.64 | groove | profile |
| 31–32 | 50.64–53.97 | breakdown, then the build | keys; flips to dark on 32.1 |
| 33–38 | 53.97–63.95 | drop, then the peak | montage (12 cuts, one every 2 beats) |
| 39–41 | 63.95–68.95 | peak and the end of the song | outro: the film's log and the CTA (trimmed from 4 bars to 3) |
| 42–43+ | 68.95–72.80 | decay | root |

At 144 BPM a beat is 12.48 frames, so cue frames are fractional. Sequence starts are rounded, so the worst-case error is ½ frame (17 ms).

Over Deviation the track handles the builds and drops, so the film's risers, impacts and theme-flip sweep are switched off. The UI sound effects (typing, pops, clicks, star, whooshes) sit under the music. Each kind has its own gain, and the `rm` zaps are cut to 0.3 so the build stays the track's.

