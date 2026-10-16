# /dev/null — launch film for dev-null.sh. See README.md and docs/treatment.md.

default:
    @just --list

# Install deps and copy fonts into public/
setup:
    bun install
    bun scripts/prepare.ts
    @command -v ffmpeg >/dev/null || (echo "missing: ffmpeg" && exit 1)

# Typecheck + determinism lint
check:
    bunx tsc --noEmit
    @if grep -rnE 'Math\.random|Date\.now|performance\.now|@keyframes|animation:|transition:|filter: *blur|setTimeout|setInterval' src | grep -v 'frame-safe'; then echo "nondeterministic API in src"; exit 1; fi
    @echo "check ok"

# Synthesized score + sfx from src/storyboard.ts -> public/audio/mix.wav
audio:
    bun scripts/audio.ts

studio:
    bunx remotion studio src/index.ts

# Stills: just stills S04-title:40 Full:1200
stills +shots:
    bun scripts/stills.ts {{shots}}

# Half-size draft -> out/draft.mp4
draft:
    bun scripts/render.ts --draft

# Master -> out/dev-null-launch.mp4 (+ -web.mp4, poster.jpg)
render:
    bun scripts/render.ts

# Acceptance gate on a render: frame count, A/V sync, cue audibility
verify video="out/dev-null-launch.mp4":
    bun scripts/verify.ts {{video}}

# One frame per scene -> out/contact.jpg
contact video="out/dev-null-launch.mp4":
    bun scripts/contact.ts {{video}}

# The whole film
all: check audio render verify contact
