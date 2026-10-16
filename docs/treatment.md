# /dev/null — launch film treatment

> **Pass 2 (current):** the film runs on Helge's track "Deviation" at 144.23 BPM, 72.8 s, with two scenes added (follows, readme) and later scenes moved onto the track's sections. `docs/decisions.md` → "Pass 2" has the bar map. The beat sheet below is pass 1 (120 BPM, 40 bars, synthesized score). Pass 1 still describes each scene's content and cue order.

80 seconds, 1920×1080, 30 fps, no voice-over. On-screen type carries the words; a synthesized 120 BPM score carries the energy. Every visual is drawn in code from devnull's own design system (`../dev-null.sh/DESIGN.md`), so the film looks like the product, not like a render of it.

## 1. Logline and central conceit

**Logline:** A social network for developers that throws out everything except the writing: commits, a log, and the people you follow.

**Conceit: the film is a log.** devnull draws its timeline as a literal `git log --graph`. The film works the same way:

- Each scene is a commit on a lane-coloured rail.
- Scene changes are rail segments drawing downward.
- The last frame is the hollow root node: "That's the root commit. There's nothing before it."

The cold open is the first commit, `hello world`, and the world answers it.

**Tone:** dry, terminal-literate, understated (`PRODUCT.md` → Brand Commitments). The wit lives in `fatal:` lines, `rm … → /dev/null` and `stash@{0}`. Labels and the call to action stay literal.

## 2. Cast

The protagonist is Helge Sverre (`@helgesverre`), shown with his real GitHub profile and avatar at his request. Everyone else is fictional: first/last mash-ups from the StressSeeder's name pools, with invented handles and GitHub-style 5×5 identicons generated from the handle.

| Handle | Name | Lane | Role |
|---|---|---|---|
| `@helgesverre` | Helge Sverre | 3 teal (picked live in S08) | protagonist, "you"; real avatar `public/avatars/helgesverre.png` |
| `@gritchie` | Grace Ritchie | 1 green | replies, stars |
| `@kenl` | Ken Lovelace | 2 violet | code commits |
| `@mlerdorf` | Margaret Lerdorf | 0 orange | series, polls |
| `@dham` | Dennis Hamilton | 4 rose | the DNS joke |
| `@brossum` | Barbara Rossum | 5 ochre | quotes |
| `@world` | world | 1 green | the bot that answers `hello world` |

## 3. Visual bible

**Palette.** These are the `DESIGN.md` tokens, verbatim. Light is the default ("a well-lit terminal rather than a dark hacker cosplay"). Dark appears once, as a deliberate flip (S12), then holds through the montage.

| Token | Light | Dark | Use in film |
|---|---|---|---|
| shell | `#f6f7f8` | `#111112` | frame background |
| surface | `#ffffff` | `#18181a` | feed column, terminal body |
| ink | `#121417` | `#ececec` | all type |
| ink-muted | `#5b616b` | `#a1a1a6` | mono metadata |
| hairline | `#e1e4e8` | `#2a2a2d` | rules |
| rail | `#d3d7dd` | `#36363a` | inert rail, staged tail |
| primary | `#3b6fe0` | `#7aa2f7` | action only: buttons, links, cursor |
| lanes 0–5 | `#d9480f #2f9e44 #9c36b5 #0c8599 #c2255c #b7791f` | `#ff8a4c #51cf66 #da77f2 #3bc9db #f06595 #fcc419` | authors only |

**Rules the film keeps:**
- **Lanes Are Identity.** Lane colours appear only on nodes, rails, avatar rings and handle dots, never on type.
- **One Blue.** Blue marks action only: buttons, links and the cursor.
- **No Cards.** Commits are rows separated by hairlines.
- **Machine Speaks Mono.** Hashes, handles, counts and `fatal:` lines are set in Geist Mono.

**Type.** Geist 400/500/600/700 and Geist Mono 400/500, both from `@fontsource`. Display headlines are Geist 600 at 120–160 px with −0.04 em tracking. Mono is used only for what a machine would print.

**Signature motion**, taken from the product and scaled up for film:
- **`node-in`:** scale 0 → 1.25 → 1 with a lane-coloured pulse ring, 700 ms (21 frames).
- **`rail-draw`:** segments draw downward, staggered by 140 ms (4 frames).
- **`rm`:** the body is replaced by mono `rm <hash> → /dev/null`, held 400 ms, then the row collapses in height and opacity over 300 ms.
- **`star-pop`:** scale 1.35 with a −12° turn, filling Commit Blue.
- **Theme flip:** every colour eases at once over 320 ms (10 frames).

**Camera.** A virtual 2D camera: eased pan and zoom, plus a CSS-3D tilt (perspective 2400 px) for the "whole app" shots. Never static: every hold has a slow drift of 1–2 % scale. Cuts land on downbeats.

**Texture.** Light film grain (seeded and deterministic) at about 4 % so the flat greys don't band in H.264. There is no vignette in light mode.

## 4. Music and sync

The score is synthesized in `scripts/audio.ts` with no samples.

| Setting | Value |
|---|---|
| Tempo | 120 BPM, 4/4 |
| Key | D minor |
| Loop | `Dm – B♭ – F – C`, one chord per bar |
| 1 beat | 15 frames = 500 ms |
| 1 bar | 60 frames = 2 s |
| Song length | 40 bars = 2400 frames |

Every cue is written as `bar.beat` in `src/storyboard.ts`. Both the React scenes and the audio script read that file, so sync holds by construction; no beat tracking is involved. SFX are placed from the same cues: typing clicks, enter, node pop, rm zap, star ding, whoosh, riser, impact.

| Bars | Section | Arrangement |
|---|---|---|
| 1–4 | cold open | pad fades in; typing clicks; 16th ticks from bar 3 |
| 5–7 | build | four-on-the-floor kick, offbeat bass, a zap on every `rm` |
| 8 | break | all stop on 8.1; snare roll + riser; "What's left?" |
| 9–24 | groove | drop on 9.1 with impact, clap on 2 and 4, hats, pluck arp, pad |
| 25–28 | breakdown | kick out, filtered arp; build from 27; one beat of silence on 28.4 |
| 29–34 | drive | full groove + stabs; whoosh on every montage cut (every 2 beats) |
| 35–38 | outro | groove thins to pad + arp |
| 39–40 | end | final chord + impact on 39.1, rings out |

## 5. Beat sheet

`bar.beat` is 1-indexed. The "Commit" column is the scene's own commit message, which shows on the rail in S14.

| # | id | Bars | Commit | What we see | Sync hooks |
|---|---|---|---|---|---|
| S01 | `boot` | 1–4 | `hello world` | Light shell. A light terminal window types `$ curl -fsSL https://dev-null.sh/commit \| bash -s -- 'hello world'`. Enter, then `Committed: https://dev-null.sh/@helgesverre/commits/0be0130`. The terminal slides up and a commit row from Helge pops onto a rail. `@world` replies "Hello, Helge Sverre." beneath it. | type 1.1–3.2, enter 3.3, node 4.1, reply 4.3 |
| S02 | `rm` | 5–7 | `rm everything else` | One huge word at a time in Geist 600: likes, reposts, hashtags, DMs, passwords, profile forms, banner images, ads. Each is replaced by mono `rm likes → /dev/null`, then collapses. Two beats each for the first four, one beat each for the next four. | each word lands on its beat; zap sfx |
| S03 | `left` | 8 | `cat /dev/null` | Empty shell. `$ cat /dev/null` prints nothing. A hollow node pulses. "What's left?" types on 8.3. | stop on 8.1; riser |
| S04 | `title` | 9–10 | `init` | DROP. The mark slams in on 9.1 and the `/dev/null` wordmark builds. The rail draws down through orange → green → hollow blue nodes, as on the OG card. "A social network for developers." on 9.3; "Sign in with GitHub. Commit plain text to a shared log." on 10.1. | impact 9.1 |
| S05 | `commit` | 11–12 | `a post is a commit` | Left: "A post is a ~~post~~ commit." Right: the composer ("What did you ship?") types "Shipped the parser benchmark. 3.2× faster." The counter counts down and the staged node fills at 3 characters. Commit is pressed on 12.1: `node-in`, then toast `[log 7f3a9c1] Shipped the parser benchmark…` | press 12.1, toast 12.2 |
| S06 | `log` | 13–14 | `a timeline is a log` | Pull-back plus a 3D tilt onto the whole three-column app. The feed scrolls on a multi-lane rail with day markers and `HEAD@{last visit}`. The "↑ 3 new commits" pill drops on 14.1. Headline: "A timeline is a log." | pill 14.1 |
| S07 | `identity` | 15–16 | `whoami` | "Sign in with GitHub" is pressed on 15.1. Profile fields fly into a mono key/value list (`name`, `login`, `bio`, `company`, `location`; a missing `blog` prints `null`). "Nothing to fill in." "Edit on GitHub ↗". | one field per beat |
| S08 | `lanes` | 17–18 | `export LANE=teal` | "Pick your lane." Seven swatches; the selection ring hops one per beat, and the rail, avatar ring and handle dot recolour live, finally landing on teal. `$ export LANE=teal`. | hop each beat |
| S09 | `star` | 19–20 | `star` | Helge's commit. The star pops on 19.1 and the mono count ticks up on the 8ths. "▾ 3 replies" expands on 20.1 and a quote card slides in on 20.3. Headline: "Star. Reply. Quote. That's it." | pop 19.1 |
| S10 | `terminal` | 21–24 | `commit from anywhere` | Terminal (dark window on light shell). "Commit from your terminal." `curl … 'It was DNS.'` then `Committed: …`. Callouts: "Signed with the SSH key already on your GitHub." "No token. No password." Bars 23–24: a GitHub Actions YAML (`uses: nunomaduro/dev-null.sh/.github/actions/commit@production`, `body: Released ${{ github.event.release.name }}.`), and the commit "Released v2.0.0." lands on the rail. | enter 21.4, commit 24.1 |
| S11 | `profile` | 25–26 | `git log --author=helgesverre` | Breakdown. Profile header: identicon with lane ring, name, `@helgesverre`, `Lv. 4 · maintainer`. The year activity grid sweeps in, column by column, then `longest streak 12 days · current 3`. Achievement pills pop: `init`, `uptime`, `max payload`, `authorized_keys`. | sweep on 16ths |
| S12 | `keys` | 27–28 | `man devnull` | Keyboard-first. `j` `k` `j` `s` key caps press on beats and the focus highlight steps through commits. The theme flips to dark on 28.1. Hold on 28.4 (silence). | caps on beats; flip 28.1 |
| S13 | `montage` | 29–34 | `and the rest` | 12 cuts, 2 beats each, dark theme: undo delete · `stash@{0}` · secret warning · poll · code block · series 1/3 · ⌘K search · README graph embed · notifications · 429 "Slow down." · `HEAD@{last visit}` · `/api/v1` + jq | cut every 2 beats; whoosh |
| S14 | `log-of-film` | 35–38 | `HEAD` | Back to light. A huge `git log --graph --oneline` of the film itself scrolls up past the camera, one row per scene and coloured by lane. It settles on a hollow blue staged node with "Your first commit is 280 characters away.", a [Sign in with GitHub] button and mono `dev-null.sh`. | rows on 8ths |
| S15 | `root` | 39–40 | (root) | Mark + wordmark. "Everything else goes to /dev/null." on 39.1. Then a hollow root node and mono "That's the root commit. There's nothing before it." Fade on the reverb tail. | final chord 39.1 |

## 6. Claims on screen, and their sources

Every product claim must be true in `../dev-null.sh` as of 2026-10-16.

| Claim | Source |
|---|---|
| GitHub-only sign-in; profile mirrored, not editable | `PRODUCT.md` Positioning |
| commits 3–280 chars, plain text | `PRODUCT.md` Capabilities |
| terminal commit via `curl … \| bash`, SSH-signed, no token | `resources/scripts/commit.sh`, `routes/web.php:59` |
| GitHub Action `nunomaduro/dev-null.sh/.github/actions/commit@production` | `.github/actions/commit/action.yml` |
| `@world` replies "Hello, {name}." | `app/Actions/CreateWorldReply.php` |
| stars, replies, quotes, polls, series, secret warning, undo delete, stash | `DESIGN.md`, `resources/js/components/*` |
| ranks user → daemon → operator → maintainer → wheel → root; achievements | `app/Enums/UnixRank.php`, `app/Enums/Achievement.php` |
| no hashtags, no DMs, no likes, no reposts-without-comment | `PRODUCT.md` "Deliberately excluded"; no code for hashtags/DMs |
| `graph.svg` embeddable, `/api/v1` read API | `PRODUCT.md` Operating Context |

**Not claimed:** "No algorithm" (a Trending log exists), user counts, testimonials, or any metric.

## 7. Deliverables

| File | What |
|---|---|
| `out/dev-null-launch.mp4` | master, H.264 CRF 16, AAC 256k |
| `out/dev-null-launch-web.mp4` | web copy, CRF 22 |
| `out/poster.jpg` | title frame (S04) |
| `out/contact.jpg` | one frame per scene |

Later, if wanted: a 9:16 cut-down (S01 + S05 + S10 + S14, 30 s).
